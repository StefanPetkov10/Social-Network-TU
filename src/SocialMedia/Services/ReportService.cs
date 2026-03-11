using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Reports;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class ReportService : BaseService, IReportService
    {
        private readonly IRepository<ReportedPost, Guid> _reportedPostRepository;
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;

        public ReportService(
            UserManager<ApplicationUser> userManager,
            IRepository<ReportedPost, Guid> reportedPostRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Profile, Guid> profileRepository) : base(userManager)
        {
            _reportedPostRepository = reportedPostRepository;
            _postRepository = postRepository;
            _profileRepository = profileRepository;
        }

        public async Task<ApiResponse<bool>> ReportPostAsync(ClaimsPrincipal userClaims, Guid postId, ReportPostRequest request)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return ApiResponse<bool>.ErrorResponse("User profile not found.");

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null) return ApiResponse<bool>.ErrorResponse("Post not found.");

            if (post.ProfileId == profile.Id)
            {
                return ApiResponse<bool>.ErrorResponse("You cannot report your own post.");
            }

            var existingReport = await _reportedPostRepository.QueryNoTracking()
                .FirstOrDefaultAsync(r => r.PostId == postId && r.ReporterId == profile.Id);

            if (existingReport != null)
            {
                return ApiResponse<bool>.ErrorResponse("You have already reported this post.");
            }

            var report = new ReportedPost
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                ReporterId = profile.Id,
                ReasonType = request.ReasonType,
                ReasonComment = request.ReasonComment,
                CreatedAt = DateTime.UtcNow,
                IsResolved = false
            };

            await _reportedPostRepository.AddAsync(report);
            await _reportedPostRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Post reported successfully.");
        }

        public async Task<ApiResponse<IEnumerable<ReportedPostDto>>> GetReportedPostsAsync(ClaimsPrincipal adminClaims)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<ReportedPostDto>>(adminClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var reports = await _reportedPostRepository.QueryNoTracking()
                .Include(r => r.Post)
                    .ThenInclude(p => p.Profile)
                .Include(r => r.Reporter)
                .Include(r => r.ResolvedBy)
                .OrderBy(r => r.IsResolved) 
                .ThenByDescending(r => r.CreatedAt) 
                .ToListAsync();

            var dtos = reports.Select(r => new ReportedPostDto
            {
                Id = r.Id,
                PostId = r.PostId,
                PostContent = r.Post.Content,
                PostAuthorName = $"{r.Post.Profile.FirstName} {r.Post.Profile.LastName}",
                ReporterId = r.ReporterId,
                ReporterName = $"{r.Reporter.FirstName} {r.Reporter.LastName}",
                ReasonType = r.ReasonType,
                ReasonComment = r.ReasonComment,
                CreatedAt = r.CreatedAt,
                IsResolved = r.IsResolved,
                AdminComment = r.AdminComment,
                ResolvedByName = r.ResolvedBy != null ? $"{r.ResolvedBy.FirstName} {r.ResolvedBy.LastName}" : null,
                ResolvedAt = r.ResolvedAt
            });

            return ApiResponse<IEnumerable<ReportedPostDto>>.SuccessResponse(dtos);
        }

        public async Task<ApiResponse<bool>> ResolveReportAsync(ClaimsPrincipal adminClaims, Guid reportId, ResolveReportRequest request)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(adminClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var adminProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (adminProfile == null) return ApiResponse<bool>.ErrorResponse("Admin profile not found.");

            var report = await _reportedPostRepository.Query()
                .Include(r => r.Post)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            if (report == null) return ApiResponse<bool>.ErrorResponse("Report not found.");
            if (report.IsResolved) return ApiResponse<bool>.ErrorResponse("Report is already resolved.");

            report.IsResolved = true;
            report.ResolvedById = adminProfile.Id;
            report.ResolvedAt = DateTime.UtcNow;
            report.AdminComment = request.AdminComment;

            if (request.DeletePost && report.Post != null)
            {
                report.Post.IsDeleted = true;
                report.Post.UpdatedDate = DateTime.UtcNow;
                _postRepository.Update(report.Post);
                
                // TODO: Notifications implementation will be added here
            }

            await _reportedPostRepository.UpdateAsync(report);
            await _reportedPostRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Report resolved successfully.");
        }

        public async Task<ApiResponse<bool>> DismissReportAsync(ClaimsPrincipal adminClaims, Guid reportId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<bool>(adminClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var adminProfile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (adminProfile == null) return ApiResponse<bool>.ErrorResponse("Admin profile not found.");

            var report = await _reportedPostRepository.GetByIdAsync(reportId);
            if (report == null) return ApiResponse<bool>.ErrorResponse("Report not found.");
            if (report.IsResolved) return ApiResponse<bool>.ErrorResponse("Report is already resolved.");

            report.IsResolved = true;
            report.ResolvedById = adminProfile.Id;
            report.ResolvedAt = DateTime.UtcNow;
            report.AdminComment = "Report dismissed.";

            await _reportedPostRepository.UpdateAsync(report);
            await _reportedPostRepository.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Report dismissed successfully.");
        }
    }
}
