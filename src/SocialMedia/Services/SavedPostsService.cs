using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Post;
using SocialMedia.DTOs.SavedPosts;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class SavedPostsService : BaseService, ISavedPostsService
    {
        private const string SystemDefaultCollection = "SYSTEM_DEFAULT_GENERAL";

        private readonly IRepository<SavedPosts, Guid> _savedPostsRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public SavedPostsService(
            UserManager<ApplicationUser> userManager,
            IRepository<SavedPosts, Guid> savedPostsRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper)
            : base(userManager)
        {
            _savedPostsRepository = savedPostsRepository;
            _profileRepository = profileRepository;
            _httpContextAccessor = httpContextAccessor;
            _mapper = mapper;
        }

        public async Task<ApiResponse<IEnumerable<SavedCollectionDto>>> GetMyCollectionsAsync(ClaimsPrincipal userClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<SavedCollectionDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);

            var collectionsData = await _savedPostsRepository.QueryNoTracking()
                .Where(sp => sp.ProfileId == profile.Id)
                .GroupBy(sp => sp.CollectionName)
                .Select(g => new
                {
                    Name = g.Key ?? SystemDefaultCollection,
                    Count = g.Count(),
                    LatestMedia = g.OrderByDescending(sp => sp.SavedAt)
                                   .SelectMany(sp => sp.Post.Media)
                                   .Where(m => m.MediaType == MediaType.Image || m.MediaType == MediaType.Video)
                                   .FirstOrDefault()
                })
                .ToListAsync();

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";

            var result = collectionsData.Select(c => new SavedCollectionDto
            {
                Name = c.Name,
                Count = c.Count,
                CoverImageUrl = c.LatestMedia != null ? $"{baseUrl}/{c.LatestMedia.FilePath}" : null
            })
            .OrderByDescending(x => x.Name == SystemDefaultCollection)
            .ThenByDescending(x => x.Count)
            .ToList();

            return ApiResponse<IEnumerable<SavedCollectionDto>>.SuccessResponse(result, "Collections retrieved.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetSavedPostsAsync(ClaimsPrincipal userClaims,
            string? collectionName = null,
            int skip = 0,
            int take = 20)
        {
            if (take > 50 || take < 0) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);

            string targetCollection = string.IsNullOrWhiteSpace(collectionName) || collectionName == "General"
                ? SystemDefaultCollection
                : collectionName;

            var query = _savedPostsRepository.QueryNoTracking()
                .Include(sp => sp.Post).ThenInclude(p => p.Profile).ThenInclude(pr => pr.User)
                .Include(sp => sp.Post).ThenInclude(p => p.Media)
                .Include(sp => sp.Post).ThenInclude(p => p.Reactions)
                .Include(sp => sp.Post).ThenInclude(p => p.Group)
                .Where(sp => sp.ProfileId == profile.Id && !sp.Post.IsDeleted);

            query = query.Where(sp => sp.CollectionName == targetCollection ||
                                     (targetCollection == SystemDefaultCollection && (sp.CollectionName == null || sp.CollectionName == "")));

            var savedPosts = await query
                .OrderByDescending(sp => sp.SavedAt)
                .Skip(skip)
                .Take(take)
                .Select(sp => sp.Post)
                .ToListAsync();

            var postDtos = new List<PostDto>();
            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";

            foreach (var p in savedPosts)
            {
                var dto = _mapper.Map<PostDto>(p);

                dto.AuthorName = p.Profile.FullName;
                dto.AuthorAvatar = p.Profile.Photo;
                dto.Username = p.Profile.User.UserName;

                dto.Media = p.Media.Select(m => new PostMediaDto
                {
                    Id = m.Id,
                    Url = $"{baseUrl}/{m.FilePath}",
                    MediaType = m.MediaType,
                    FileName = m.FileName,
                    Order = m.Order
                }).ToList();

                postDtos.Add(dto);
            }

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(postDtos, "Saved posts retrieved.");
        }

        public async Task<ApiResponse<string>> ToggleSavePostAsync(ClaimsPrincipal userClaims, SavePostRequestDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            if (dto.CollectionName != null && dto.CollectionName.Trim().Equals(SystemDefaultCollection, StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<string>.ErrorResponse("Invalid collection name.");
            }

            string targetCollection = string.IsNullOrWhiteSpace(dto.CollectionName) ? SystemDefaultCollection : dto.CollectionName.Trim();

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return ApiResponse<string>.ErrorResponse("Profile not found.");

            var existingSave = await _savedPostsRepository.Query()
                .FirstOrDefaultAsync(x => x.ProfileId == profile.Id && x.PostId == dto.PostId);

            if (existingSave != null)
            {
                if (existingSave.CollectionName != targetCollection)
                {
                    existingSave.CollectionName = targetCollection;
                    existingSave.SavedAt = DateTime.UtcNow;
                    await _savedPostsRepository.SaveChangesAsync();
                    return ApiResponse<string>.SuccessResponse(targetCollection, "Post moved to collection.");
                }
                return ApiResponse<string>.SuccessResponse(existingSave.CollectionName, "Post is already saved.");
            }

            var newSave = new SavedPosts
            {
                Id = Guid.NewGuid(),
                ProfileId = profile.Id,
                PostId = dto.PostId,
                CollectionName = targetCollection,
                SavedAt = DateTime.UtcNow
            };

            await _savedPostsRepository.AddAsync(newSave);
            await _savedPostsRepository.SaveChangesAsync();

            return ApiResponse<string>.SuccessResponse(targetCollection, "Post saved successfully.");
        }

        public async Task<ApiResponse<object>> RemoveFromSavedAsync(ClaimsPrincipal userClaims, Guid postId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);

            var savedEntry = await _savedPostsRepository.Query()
                .FirstOrDefaultAsync(sp => sp.PostId == postId && sp.ProfileId == profile.Id);

            if (savedEntry == null)
            {
                return ApiResponse<object>.SuccessResponse(true, "Saved post not found");
            }

            await _savedPostsRepository.DeleteAsync(savedEntry);
            await _savedPostsRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(true, "Removed from saved.");
        }
    }
}