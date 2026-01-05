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

        [HttpGet("{username}")]
        public async Task<IActionResult> GetProfileByUsername([FromRoute] string username) =>
            Ok(await _profileService.GetProfileByUsernameAsync(User, username));

        [HttpGet("{profileId:guid}")]
        public async Task<IActionResult> GetProfileById([FromRoute] Guid profileId) =>
            Ok(await _profileService.GetProfileByIdAsync(User, profileId));

        [HttpPut("edit-profile")]
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

        [HttpPost("update-bio")]
        public async Task<IActionResult> UpdateBio([FromBody] string bio)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToArray();
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errors));
            }
            var response = await _profileService.UpdateBioAsync(User, bio);
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
