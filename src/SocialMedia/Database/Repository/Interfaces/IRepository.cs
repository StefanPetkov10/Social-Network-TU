using System.Linq.Expressions;

namespace SocialMedia.Data.Repository.Interfaces
{
    public interface IRepository<TType, TId>
    {
        IQueryable<TType> Query();
        TType GetById(TId id);
        Task<TType> GetByIdAsync(TId id);
        Task<TType> GetByApplicationIdAsync(TId id);
        Task<TType> GetByIdAsync(params TId[] id);
        IEnumerable<TType> GetAll();
        Task<IEnumerable<TType>> GetAllAsync();
        TType FirstOrDefault(Func<TType, bool> predicate);
        Task<TType> FirstOrDefaultAsync(Expression<Func<TType, bool>> predicate);
        Task<bool> AnyAsync(Expression<Func<TType, bool>> predicate);
        Task<int> CountAsync(Expression<Func<TType, bool>> predicate);
        IQueryable<TType> GetAllAttached();

        void Add(TType entity);
        Task AddAsync(TType entity);

        void AddRange(TType[] entities);
        Task AddRangeAsync(TType[] entities);

        void Delete(TType entity);
        Task DeleteAsync(TType entity);

        void Update(TType entity);
        Task UpdateAsync(TType entity);

        void SaveChanges();
        Task SaveChangesAsync();

        TType? FindByKeys(params object[] keyValues);
        Task<TType?> FindByKeysAsync(params object[] keyValues);
        Task DeleteByKeysAsync(params object[] keyValues);
        Task<bool> ExistsByKeysAsync(params object[] keyValues);

        Task<bool> IsMemberAsync(TId groupId, TId profileId);
    }
}
