using System.Security.Claims;
using SocialMedia.Common;
using SocialMedia.DTOs.Reports;

namespace SocialMedia.Services.Interfaces
{
    public interface IReportService
    {
        Task<ApiResponse<bool>> ReportPostAsync(ClaimsPrincipal userClaims, Guid postId, ReportPostRequest request);
        Task<ApiResponse<IEnumerable<ReportedPostDto>>> GetReportedPostsAsync(ClaimsPrincipal adminClaims);
        Task<ApiResponse<bool>> ResolveReportAsync(ClaimsPrincipal adminClaims, Guid reportId, ResolveReportRequest request);
        Task<ApiResponse<bool>> DismissReportAsync(ClaimsPrincipal adminClaims, Guid reportId);
    }
}
