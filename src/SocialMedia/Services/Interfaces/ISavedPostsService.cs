using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;
using SocialMedia.DTOs.SavedPosts;

namespace SocialMedia.Services.Interfaces
{
    public interface ISavedPostsService
    {
        Task<ApiResponse<string>> ToggleSavePostAsync(ClaimsPrincipal userClaims, SavePostRequestDto dto);
        Task<ApiResponse<IEnumerable<SavedCollectionDto>>> GetMyCollectionsAsync(ClaimsPrincipal userClaims);
        Task<ApiResponse<IEnumerable<PostDto>>> GetSavedPostsAsync(ClaimsPrincipal userClaims,
            string? collectionName = null,
            int skip = 0,
            int take = 20);
        Task<ApiResponse<object>> RemoveFromSavedAsync(ClaimsPrincipal userClaims, Guid savedPostId);
    }
}
