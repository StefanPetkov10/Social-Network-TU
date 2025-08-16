using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Common;
using SocialMedia.DTOs.Profile;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile() =>
            Ok(await _profileService.GetProfileAsync(User));

        [HttpPut]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }

            var response = await _profileService.UpdateProfileAsync(User, dto);
            return Ok(response);
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();

                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _profileService.ChangePasswordAsync(User, dto);
            return Ok(response);
        }

    }
}
