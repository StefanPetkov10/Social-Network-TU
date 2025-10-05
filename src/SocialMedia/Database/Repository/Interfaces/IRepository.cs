using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Database.Models;

namespace SocialMedia.Data.Repository.Interfaces
{
    public interface IRepository<TType, TId>
    {
        Task<TType> GetByIdAsync(TId id);
        Task<TType> GetByApplicationIdAsync(TId id);
        Task<IEnumerable<TType>> GetAllAsync(bool tracking);
        IQueryable<TType> Query();
        IQueryable<TType> QueryNoTracking();
        //IQueryable<TType> GetAllAttached();
        Task<TType> FirstOrDefaultAsync(Expression<Func<TType, bool>> predicate);
        Task<bool> AnyAsync(Expression<Func<TType, bool>> predicate);
        Task<int> CountAsync(Expression<Func<TType, bool>> predicate);
        Task AddAsync(TType entity);

        Task AddRangeAsync(TType[] entities);

        Task DeleteAsync(TType entity);

        bool Update(TType entity);
        Task UpdateAsync(TType entity);

        Task SaveChangesAsync();

        Task<TType?> FindByKeysAsync(params object[] keyValues);
        Task DeleteByKeysAsync(params object[] keyValues);
        Task<bool> ExistsByKeysAsync(params object[] keyValues);

        Task<bool> IsMemberAsync(TId groupId, TId profileId);
        void RemoveMedia(PostMedia media);
        EntityState GetEntityState(TType entity);
    }
}
