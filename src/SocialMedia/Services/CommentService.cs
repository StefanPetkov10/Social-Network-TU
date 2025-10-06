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
        public async Task<ApiResponse<IEnumerable<CommentDto>>> GetCommentsByPostIdAsync(ClaimsPrincipal userClaims, Guid postId, Guid? lastCommentId = null, int take = 20)
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
                    .ThenInclude(p => p.User)
                .Include(c => c.Media)
                .Include(c => c.Replies)
                .Where(c => c.PostId == postId && c.Depth == 0)
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

        public async Task<(IEnumerable<CommentDto> Replies, int TotalCount)> GetRepliesAsync(Guid commentId, Guid? lastCommentId, int take = 20)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<CommentDto?>> EditCommentAsync(Guid commentId, Guid requesterProfileId, string newContent, IFormFileCollection? newFiles = null, IEnumerable<Guid>? removeMediaIds = null)
        {
            throw new NotImplementedException();
        }

        public async Task<ApiResponse<bool>> SoftDeleteCommentAsync(Guid commentId, Guid requesterProfileId)
        {
            throw new NotImplementedException();
        }
        public async Task<ApiResponse<int>> GetCommentCountForPostAsync(Guid postId)
        {
            throw new NotImplementedException();
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
