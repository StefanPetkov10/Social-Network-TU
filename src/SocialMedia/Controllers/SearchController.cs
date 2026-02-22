using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet("users")]
        public async Task<IActionResult> SearchUsers([FromQuery] string search)
        {
            var result = await _searchService.SearchUsersAsync(User, search);
            return Ok(result);
        }
    }
}
