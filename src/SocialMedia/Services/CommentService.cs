using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Comment;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class CommentService : BaseService, ICommentService
    {
        private const int MaxDepth = 3;

        private readonly IRepository<Comment, Guid> _commentRepository;
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        public CommentService(UserManager<ApplicationUser> userManager,
            IRepository<Comment, Guid> commentRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IHttpContextAccessor httpContextAccessor, IMapper mapper,
            IFileService fileService) : base(userManager)
        {
            _commentRepository = commentRepository;
            _postRepository = postRepository;
            _profileRepository = profileRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
            _fileService = fileService;
        }
        public async Task<ApiResponse<CommentDto>> CreateCommentAsPost(ClaimsPrincipal userClaims, Guid postId, CreateCommentDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<CommentDto>(userClaims, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null)
                return NotFoundResponse<CommentDto>("Profile");

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<CommentDto>("Post");

            int newDepth = 0;

            if (dto.ParentCommentId.HasValue)
            {
                var parentComment = await _commentRepository.GetByIdAsync(dto.ParentCommentId.Value);
                if (parentComment == null || parentComment.PostId != postId)
                    return ApiResponse<CommentDto>.ErrorResponse("Invalid parent comment.");
                newDepth = parentComment.Depth + 1;
                if (newDepth > MaxDepth)
                    return ApiResponse<CommentDto>.ErrorResponse($"Maximum reply depth of {MaxDepth} reached.");
            }

            var comment = _mapper.Map<Comment>(dto);
            comment.Id = Guid.NewGuid();
            comment.PostId = postId;
            comment.ProfileId = profile.Id;
            comment.Depth = newDepth;

            if (dto.File != null)
            {
                var (path, mediaType) = await _fileService.SaveFileAsync(dto.File);

                comment.Media = new CommentMedia
                {
                    Id = Guid.NewGuid(),
                    FilePath = path,
                    MediaType = mediaType,
                    CommentId = comment.Id
                };
            }

            await _commentRepository.AddAsync(comment);
            await _commentRepository.SaveChangesAsync();

            post.CommentsCount += 1;
            _postRepository.Update(post);
            await _postRepository.SaveChangesAsync();

            return SuccessCommentDto(comment, profile, "Comment created successfully.");
        }
        public async Task<ApiResponse<IEnumerable<CommentDto>>> GetCommentsByPostIdAsync(ClaimsPrincipal userClaims,
            Guid postId, Guid? lastCommentId = null, int take = 20)
        {
            //In this method can add option about sorting like: newest, oldest, most liked

            if (take <= 0 || take > 50)
                take = 20;
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<CommentDto>>(userClaims, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null)
                return NotFoundResponse<IEnumerable<CommentDto>>("Profile");

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<IEnumerable<CommentDto>>("Post");

            var commentsQuery = _commentRepository
                .Query()
                .Include(c => c.Profile)
                .Include(c => c.Media)
                .Include(c => c.Replies)
                .Include(c => c.Post)
                .Where(c => c.PostId == postId && c.Depth == 0 && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate)
                .AsQueryable();

            if (lastCommentId.HasValue)
            {
                var lastComment = await _commentRepository.GetByIdAsync(lastCommentId.Value);
                if (lastComment != null)
                {
                    commentsQuery = commentsQuery.Where(c => c.CreatedDate < lastComment.CreatedDate);
                }
            }

            var comments = await commentsQuery.Take(take).ToListAsync();

            var dtos = comments.Select(c => SuccessCommentDto(c, c.Profile, "").Data).ToList();

            var last = comments.LastOrDefault();

            return ApiResponse<IEnumerable<CommentDto>>.SuccessResponse(
                dtos,
                "Comments retrieved successfully.",
                new { lastCommentId = last });
        }

        public async Task<ApiResponse<IEnumerable<CommentDto>>> GetRepliesAsync(ClaimsPrincipal userClaims,
             Guid commentId, Guid? lastCommentId = null, int take = 10)
        {
            if (take <= 0 || take > 50)
                take = 20;
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<CommentDto>>(userClaims, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null)
                return NotFoundResponse<IEnumerable<CommentDto>>("Profile");

            var parent = await _commentRepository.Query()
                .Include(c => c.Profile)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (parent == null)
                return NotFoundResponse<IEnumerable<CommentDto>>("Parent Comment");

            var query = _commentRepository.Query()
                .Include(c => c.Profile)
                .Include(c => c.Replies)
                .Where(c => c.ParentCommentId == commentId && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate)
                .AsQueryable();

            if (lastCommentId.HasValue)
            {
                var lastComment = await _commentRepository.GetByIdAsync(lastCommentId.Value);
                if (lastComment != null)
                {
                    query = query.Where(c => c.CreatedDate < lastComment.CreatedDate);
                }
            }

            var comments = await query.Take(take).ToListAsync();

            var dtoReplies = comments.Select(r => new CommentDto
            {
                Id = r.Id,
                PostId = r.PostId,
                ProfileId = r.ProfileId,
                Content = r.Content,
                AuthorName = r.Profile.FullName ?? "Unknown",
                AuthorAvatar = r.Profile.Photo,
                PostedDate = r.CreatedDate,
                RepliesCount = r.Replies.Count,
                RepliesPreview = new List<CommentDto>()
            }).ToList();

            var last = comments.LastOrDefault();
            return ApiResponse<IEnumerable<CommentDto>>.SuccessResponse(
                dtoReplies,
                "Replies retrieved successfully.",
                new { lastCommentId = last?.Id });
        }


        public async Task<ApiResponse<CommentDto?>> EditCommentAsync(ClaimsPrincipal userClaims, Guid commentId, UpdateCommentDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<CommentDto>(userClaims, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null)
                return NotFoundResponse<CommentDto>("Profile");

            var comment = await _commentRepository.Query()
                .Include(c => c.Media)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
                return NotFoundResponse<CommentDto>("Comment");

            if (comment.ProfileId != profile.Id)
                return ApiResponse<CommentDto>.ErrorResponse("Forbidden.", new[] { "You can only edit your own comments." });

            if (!string.IsNullOrWhiteSpace(dto.Content) && comment.Content != dto.Content)
            {
                comment.Content = dto.Content;
                comment.UpdatedDate = DateTime.UtcNow;
            }

            if (dto.FileToDelete != null && comment.Media != null)
            {
                var mediaToDelete = comment.Media;
                if (mediaToDelete != null)
                {
                    _commentRepository.RemoveMedia(mediaToDelete);
                }
            }

            await _commentRepository.SaveChangesAsync();
            return SuccessCommentDto(comment, profile, "Comment updated successfully.");
        }

        public async Task<ApiResponse<bool>> SoftDeleteCommentAsync(ClaimsPrincipal userClaims, Guid commentId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userIdValue);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null)
                return NotFoundResponse<bool>("Profile");

            var comment = await _commentRepository.Query()
                .Include(c => c.Post)
                .FirstOrDefaultAsync(c => c.Id == commentId);
            if (comment == null)
                return NotFoundResponse<bool>("Comment");

            if (comment.ProfileId != profile.Id)
                return ApiResponse<bool>.ErrorResponse("Forbidden.", new[] { "You can only delete your own comments." });

            if (comment.IsDeleted)
                return ApiResponse<bool>.ErrorResponse("Comment is already deleted.");

            comment.IsDeleted = true;
            comment.UpdatedDate = DateTime.UtcNow;

            _commentRepository.Update(comment);
            await _commentRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Comment deleted successfully.");
        }

        private ApiResponse<CommentDto> SuccessCommentDto(Comment comment, Database.Models.Profile profile, string message)
        {
            var dto = _mapper.Map<CommentDto>(comment);
            dto.AuthorName = profile.FullName ?? "Unknown Author";
            dto.AuthorAvatar = profile.Photo;

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";

            if (comment.Media != null)
            {
                dto.Media = new CommentMediaDto
                {
                    Id = comment.Media.Id,
                    Url = $"{baseUrl}/{comment.Media.FilePath}",
                    MediaType = comment.Media.MediaType,
                };
            }

            return ApiResponse<CommentDto>.SuccessResponse(dto, message);
        }


    }
}
