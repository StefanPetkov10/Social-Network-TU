using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Common;
using SocialMedia.DTOs.Reports;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost("posts/{postId}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ReportPost(Guid postId, [FromBody] ReportPostRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<bool>.ErrorResponse("Invalid payload data."));

            var response = await _reportService.ReportPostAsync(User, postId, request);
            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpGet("posts")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ReportedPostDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetReportedPosts()
        {
            var response = await _reportService.GetReportedPostsAsync(User);
            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpPost("{reportId}/resolve")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ResolveReport(Guid reportId, [FromBody] ResolveReportRequest request)
        {
            var response = await _reportService.ResolveReportAsync(User, reportId, request);
            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }

        [HttpPost("{reportId}/dismiss")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        public async Task<IActionResult> DismissReport(Guid reportId)
        {
            var response = await _reportService.DismissReportAsync(User, reportId);
            if (!response.Success)
                return BadRequest(response);

            return Ok(response);
        }
    }
}
