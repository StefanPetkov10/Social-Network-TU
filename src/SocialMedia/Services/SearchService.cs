using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Database;
using SocialMedia.DTOs.Profile;
using SocialMedia.Services.Interfaces;

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

            // PostgreSQL pg_trgm Fuzzy search
            var profilesInfo = await _context.Profiles
                .AsNoTracking()
                .Include(p => p.User)
                // Filter by trigram similarity threshold (default is usually > 0.3)
                .Where(p => EF.Functions.TrigramsWordSimilarity(p.FirstName + " " + p.LastName, query) > 0.3 ||
                            EF.Functions.TrigramsWordSimilarity(p.User.UserName, query) > 0.3)
                // Order by similarity (closest match first)
                .OrderByDescending(p => Math.Max(
                    EF.Functions.TrigramsWordSimilarity(p.FirstName + " " + p.LastName, query),
                    EF.Functions.TrigramsWordSimilarity(p.User.UserName, query)
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

            if (!profilesInfo.Any())
            {
                // Fallback: If similarity is too low, we can try ILIKE just in case
                profilesInfo = await _context.Profiles
                   .AsNoTracking()
                   .Include(p => p.User)
                   .Where(p => EF.Functions.ILike(p.FirstName + " " + p.LastName, $"%{query}%") ||
                               EF.Functions.ILike(p.User.UserName, $"%{query}%"))
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
            }

            return ApiResponse<List<ProfileDto>>.SuccessResponse(profilesInfo, "Търсенето е успешно.");
        }
    }
}
