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
                var file = dto.File;
                var (path, mediaType) = await _fileService.SaveFileAsync(file);
                if (string.IsNullOrEmpty(path))
                {
                    return ApiResponse<CommentDto>.ErrorResponse($"File '{file.FileName}' is not supported type.");
                }

                comment.Media = new CommentMedia
                {
                    Id = Guid.NewGuid(),
                    FilePath = path,
                    MediaType = mediaType,
                    FileName = file.FileName,
                    CommentId = comment.Id
                };
            }

            await _commentRepository.AddAsync(comment);
            await _commentRepository.SaveChangesAsync();

            post.CommentsCount += 1;
            _postRepository.Update(post);
            await _postRepository.SaveChangesAsync();

            return ApiResponse<CommentDto>.SuccessResponse(SuccessCommentDto(comment), "Comment created successfully.");
        }

        //In this method can add option about sorting like: newest, oldest, most liked
        public async Task<ApiResponse<IEnumerable<CommentDto>>> GetCommentsByPostIdAsync(ClaimsPrincipal userClaims,
            Guid postId, Guid? lastCommentId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<CommentDto>>(userClaims, out var userIdValue);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null) return NotFoundResponse<IEnumerable<CommentDto>>("Profile");

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null) return NotFoundResponse<IEnumerable<CommentDto>>("Post");

            var commentsQuery = _commentRepository
                .Query()
                .Include(c => c.Profile)
                    .ThenInclude(p => p.User)
                .Include(c => c.Media)
                .Include(c => c.Replies).ThenInclude(r => r.Profile)
                .Include(c => c.Replies).ThenInclude(r => r.Media)
                .Include(c => c.Post)
                .Where(c => c.PostId == postId && c.Depth == 0 && !c.IsDeleted)
                .OrderByDescending(c => c.CreatedDate) // Главните коментари: Newest First
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
            var dtos = comments.Select(c => SuccessCommentDto(c)).ToList();
            var lastId = comments.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<CommentDto>>.SuccessResponse(dtos, "Comments retrieved successfully.", new { lastCommentId = lastId });
        }

        public async Task<ApiResponse<IEnumerable<CommentDto>>> GetRepliesAsync(ClaimsPrincipal userClaims,
             Guid commentId, Guid? lastCommentId = null, int take = 10)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<CommentDto>>(userClaims, out var userIdValue);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null) return NotFoundResponse<IEnumerable<CommentDto>>("Profile");

            var parent = await _commentRepository.Query()
                .Include(c => c.Profile)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (parent == null) return NotFoundResponse<IEnumerable<CommentDto>>("Parent Comment");

            var query = _commentRepository.Query()
                .Include(c => c.Profile)
                    .ThenInclude(p => p.User)
                .Include(c => c.Media)
                .Include(c => c.Replies)
                .Where(c => c.ParentCommentId == commentId && !c.IsDeleted)
                .OrderBy(c => c.CreatedDate)
                .AsQueryable();

            if (lastCommentId.HasValue)
            {
                var lastComment = await _commentRepository.GetByIdAsync(lastCommentId.Value);
                if (lastComment != null)
                {
                    query = query.Where(c => c.CreatedDate > lastComment.CreatedDate);
                }
            }

            var comments = await query.Take(take).ToListAsync();
            var dtoReplies = comments.Select(c => SuccessCommentDto(c)).ToList();
            var lastId = comments.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<CommentDto>>.SuccessResponse(dtoReplies, "Replies retrieved successfully.", new { lastCommentId = lastId });
        }

        public async Task<ApiResponse<CommentDto?>> EditCommentAsync(ClaimsPrincipal userClaims, Guid commentId, UpdateCommentDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<CommentDto>(userClaims, out var userIdValue);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null) return NotFoundResponse<CommentDto>("Profile");

            var comment = await _commentRepository.Query()
                .Include(c => c.Media)
                .Include(c => c.Profile)
                    .ThenInclude(p => p.User)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null) return NotFoundResponse<CommentDto>("Comment");

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
            return ApiResponse<CommentDto>.SuccessResponse(SuccessCommentDto(comment), "Comment updated successfully.");
        }

        public async Task<ApiResponse<bool>> SoftDeleteCommentAsync(ClaimsPrincipal userClaims, Guid commentId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userIdValue);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userIdValue);
            if (profile == null) return NotFoundResponse<bool>("Profile");

            var comment = await _commentRepository.Query()
                .Include(c => c.Post)
                .Include(c => c.Replies)
                    .ThenInclude(r => r.Replies)
                    .ThenInclude(rr => rr.Replies)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null) return NotFoundResponse<bool>("Comment");

            if (comment.ProfileId != profile.Id)
                return ApiResponse<bool>.ErrorResponse("Forbidden.", new[] { "You can only delete your own comments." });

            if (comment.IsDeleted)
                return ApiResponse<bool>.ErrorResponse("Comment is already deleted.");

            var allCommentsToDelete = new List<Comment>();
            CollectCommentsRecursive(comment, allCommentsToDelete);

            var countToRemove = allCommentsToDelete.Count(c => !c.IsDeleted);

            var now = DateTime.UtcNow;
            foreach (var c in allCommentsToDelete)
            {
                if (!c.IsDeleted)
                {
                    c.IsDeleted = true;
                    c.UpdatedDate = now;
                    _commentRepository.Update(c);
                }
            }

            if (comment.Post != null)
            {
                comment.Post.CommentsCount -= countToRemove;

                if (comment.Post.CommentsCount < 0)
                {
                    comment.Post.CommentsCount = 0;
                }
                _postRepository.Update(comment.Post);
            }

            await _commentRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Comment and replies deleted successfully.");
        }

        //Рекурсия
        private void CollectCommentsRecursive(Comment current, List<Comment> accumulator)
        {
            accumulator.Add(current);
            if (current.Replies != null && current.Replies.Any())
            {
                foreach (var reply in current.Replies)
                {
                    CollectCommentsRecursive(reply, accumulator);
                }
            }
        }

        private CommentDto SuccessCommentDto(Comment comment)
        {
            var dto = _mapper.Map<CommentDto>(comment);

            if (comment.Profile != null)
            {
                dto.AuthorName = comment.Profile.FullName ?? "Unknown";
                dto.AuthorAvatar = comment.Profile.Photo;
                dto.AuthorUsername = comment.Profile.User.UserName!;
            }

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";

            if (comment.Media != null)
            {
                dto.Media = new CommentMediaDto
                {
                    Id = comment.Media.Id,
                    Url = $"{baseUrl}/{comment.Media.FilePath}",
                    FileName = comment.Media.FileName,
                    MediaType = comment.Media.MediaType,
                };
            }

            // ВАЖНО: Обработка на RepliesPreview, за да се спре рекурсията.
            // Взимаме отговорите, но за тях НЕ зареждаме техните отговори (RepliesPreview = null)
            if (comment.Replies != null && comment.Replies.Any())
            {
                var activeReplies = comment.Replies.Where(r => !r.IsDeleted).OrderBy(r => r.CreatedDate).Take(3);

                dto.RepliesPreview = activeReplies.Select(reply =>
                {
                    var replyDto = _mapper.Map<CommentDto>(reply);

                    if (reply.Profile != null)
                    {
                        replyDto.AuthorName = reply.Profile.FullName ?? "Unknown";
                        replyDto.AuthorAvatar = reply.Profile.Photo;
                        replyDto.AuthorUsername = reply.Profile.User.UserName!;
                    }

                    if (reply.Media != null)
                    {
                        replyDto.Media = new CommentMediaDto
                        {
                            Id = reply.Media.Id,
                            Url = $"{baseUrl}/{reply.Media.FilePath}",
                            FileName = reply.Media.FileName,
                            MediaType = reply.Media.MediaType
                        };
                    }

                    // СПИРАЧКА НА ЦИКЪЛА: Зануляваме вложените отговори на отговорите
                    replyDto.RepliesPreview = null;

                    return replyDto;
                }).ToList();
            }
            else
            {
                dto.RepliesPreview = new List<CommentDto>();
            }

            return dto;
        }
    }
}
