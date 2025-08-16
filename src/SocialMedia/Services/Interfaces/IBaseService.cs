using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;

namespace SocialMedia.Services.Interfaces
{
    public interface IBaseService
    {

        ApiResponse<T>? GetUserIdOrUnauthorized<T>(ClaimsPrincipal userClaims, out Guid userId);
        ApiResponse<T> NotFoundResponse<T>(string entityName);
        ApiResponse<T> IdentityErrorResponse<T>(IdentityResult result, string message);
    }
}
