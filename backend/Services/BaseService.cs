using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Database.Models;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class BaseService : IBaseService
    {
        protected readonly UserManager<ApplicationUser> _userManager;

        public BaseService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public ApiResponse<T>? GetUserIdOrUnauthorized<T>(ClaimsPrincipal userClaims, out Guid userId)
        {
            var userIdStr = _userManager.GetUserId(userClaims);
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out userId) || userId == Guid.Empty)
            {
                userId = Guid.Empty;
                return ApiResponse<T>.ErrorResponse("Unauthorized.", new[] { "Invalid user claim." });
            }

            return null;
        }

        public ApiResponse<T> NotFoundResponse<T>(string entityName)
        {
            return ApiResponse<T>.ErrorResponse($"{entityName} not found.", new[] { $"{entityName} does not exist." });
        }

        public ApiResponse<T> IdentityErrorResponse<T>(IdentityResult result, string message)
        {
            return ApiResponse<T>.ErrorResponse(message, result.Errors.Select(e => e.Description).ToArray());
        }
    }
}
