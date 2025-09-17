using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Services.Interfaces
{
    public interface IGroupPostService
    {
        Task<ApiResponse<PostDto>> CreateGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, CreatePostDto dto);
        Task<ApiResponse<IEnumerable<PostDto>>> GetGroupFeedAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20);
        Task<ApiResponse<object>> DeleteGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, Guid postId);
    }
}

