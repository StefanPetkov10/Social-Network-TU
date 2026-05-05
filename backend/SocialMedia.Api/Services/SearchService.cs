using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Database;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Profile;
using SocialMedia.Extensions;
using SocialMedia.Services.Interfaces;
using System.Security.Claims;

namespace SocialMedia.Services
{
    public class SearchService : ISearchService
    {
        private readonly SocialMediaDbContext _context;

        public SearchService(SocialMediaDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<List<ProfileDto>>> SearchUsersAsync(ClaimsPrincipal userClaims, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<List<ProfileDto>>.SuccessResponse(new List<ProfileDto>(), "No query provided");
            }
            var cleanQuery = EscapeLikePattern.EscapeLikePatternMethod(query.Trim().ToLower());

            var profilesInfo = await _context.Profiles
                .AsNoTracking()
                .Include(p => p.User)
                .Where(p => EF.Functions.TrigramsWordSimilarity(p.FirstName + " " + p.LastName, cleanQuery) > 0.3 ||
                            EF.Functions.TrigramsWordSimilarity(p.User.UserName, cleanQuery) > 0.3 ||
                            EF.Functions.ILike(p.FirstName + " " + p.LastName, $"%{cleanQuery}%") ||
                            EF.Functions.ILike(p.User.UserName, $"%{cleanQuery}%"))
                .OrderByDescending(p => Math.Max(
                    EF.Functions.TrigramsWordSimilarity(p.FirstName + " " + p.LastName, cleanQuery),
                    EF.Functions.TrigramsWordSimilarity(p.User.UserName, cleanQuery)
                ))
                .Select(p => new ProfileDto
                {
                    Id = p.Id,
                    Username = p.User.UserName,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    AuthorAvatar = p.Photo,
                    Bio = p.Bio ?? string.Empty
                })
                .Take(20)
                .ToListAsync();

            return ApiResponse<List<ProfileDto>>.SuccessResponse(profilesInfo, "Търсенето е успешно.");
        }

        public async Task<ApiResponse<List<GroupDto>>> SearchGroupsAsync(ClaimsPrincipal userClaims, string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return ApiResponse<List<GroupDto>>.SuccessResponse(new List<GroupDto>(), "No query provided");
            }
            var cleanQuery = EscapeLikePattern.EscapeLikePatternMethod(query.Trim().ToLower());

            var groupsInfo = await _context.Groups
                .AsNoTracking()
                .Include(g => g.Members)
                .Where(g => EF.Functions.TrigramsWordSimilarity(g.Name, cleanQuery) > 0.3 ||
                            EF.Functions.ILike(g.Name, $"%{cleanQuery}%"))
                .OrderByDescending(g => EF.Functions.TrigramsWordSimilarity(g.Name, cleanQuery))
                .Select(g => new GroupDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    Description = g.Description,
                    IsPrivate = g.Privacy == SocialMedia.Database.Models.Enums.GroupPrivacy.Private,
                    MembersCount = g.Members.Count(m => m.Status == SocialMedia.Database.Models.Enums.MembershipStatus.Approved)
                })
                .Take(20)
                .ToListAsync();

            return ApiResponse<List<GroupDto>>.SuccessResponse(groupsInfo, "Търсенето на групи е успешно.");
        }
    }
}
