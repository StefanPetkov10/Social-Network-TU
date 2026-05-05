using Microsoft.EntityFrameworkCore;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Data.Repository
{
    public interface IFriendShipRepository : IRepository<Friendship, Guid>
    {
        Task<IEnumerable<Friendship>> GetFriendsAsync(Guid profileId);

        Task<IEnumerable<Friendship>> SearchFriendsAsync(Guid profileId, string cleanQuery, int take);
    }

    public class FriendShipRepository(SocialMediaDbContext dbContext)
        : BaseRepository<Friendship, Guid>(dbContext), IFriendShipRepository
    {
        public async Task<IEnumerable<Friendship>> GetFriendsAsync(Guid profileId)
        {
            return await QueryNoTracking()
                .Where(f => (f.RequesterId == profileId || f.AddresseeId == profileId)
                            && f.Status == FriendshipStatus.Accepted)
                .ToListAsync();
        }

        public async Task<IEnumerable<Friendship>> SearchFriendsAsync(
            Guid profileId, string cleanQuery, int take)
        {
            var query = QueryNoTracking()
                .Where(f => (f.RequesterId == profileId || f.AddresseeId == profileId)
                            && f.Status == FriendshipStatus.Accepted);

            query = query.Where(f =>
                (f.RequesterId == profileId && (
                    EF.Functions.ILike(f.Addressee.FirstName + " " + f.Addressee.LastName, $"%{cleanQuery}%") ||
                    EF.Functions.ILike(f.Addressee.User.UserName, $"%{cleanQuery}%") ||
                    EF.Functions.TrigramsWordSimilarity(f.Addressee.FirstName + " " + f.Addressee.LastName, cleanQuery) > 0.3 ||
                    EF.Functions.TrigramsWordSimilarity(f.Addressee.User.UserName, cleanQuery) > 0.3
                )) ||
                (f.AddresseeId == profileId && (
                    EF.Functions.ILike(f.Requester.FirstName + " " + f.Requester.LastName, $"%{cleanQuery}%") ||
                    EF.Functions.ILike(f.Requester.User.UserName, $"%{cleanQuery}%") ||
                    EF.Functions.TrigramsWordSimilarity(f.Requester.FirstName + " " + f.Requester.LastName, cleanQuery) > 0.3 ||
                    EF.Functions.TrigramsWordSimilarity(f.Requester.User.UserName, cleanQuery) > 0.3
                ))
            );

            query = query.OrderByDescending(f => f.RequesterId == profileId
                    ? Math.Max(
                        EF.Functions.TrigramsWordSimilarity(f.Addressee.FirstName + " " + f.Addressee.LastName, cleanQuery),
                        EF.Functions.TrigramsWordSimilarity(f.Addressee.User.UserName, cleanQuery))
                    : Math.Max(
                        EF.Functions.TrigramsWordSimilarity(f.Requester.FirstName + " " + f.Requester.LastName, cleanQuery),
                        EF.Functions.TrigramsWordSimilarity(f.Requester.User.UserName, cleanQuery))
                )
                .ThenByDescending(f => f.AcceptedAt)
                .ThenByDescending(f => f.Id);

            return await query
                .Take(take)
                .Include(f => f.Requester).ThenInclude(p => p.User)
                .Include(f => f.Addressee).ThenInclude(p => p.User)
                .ToListAsync();
        }
    }
}
