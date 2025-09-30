using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Data.Repository
{
    public class BaseRepository<TType, TId> : IRepository<TType, TId>
        where TType : class
    {
        private readonly SocialMediaDbContext dbContext;
        private readonly DbSet<TType> dbSet;

        public BaseRepository(SocialMediaDbContext dbContext)
        {
            this.dbContext = dbContext;
            this.dbSet = this.dbContext.Set<TType>();
        }
        public async Task<TType> GetByIdAsync(TId id) =>
            await this.dbSet.FindAsync(id);

        public async Task<TType> GetByApplicationIdAsync(TId id) =>
            await this.dbSet.FirstOrDefaultAsync(u => EF.Property<TId>(u, "ApplicationId").Equals(id));

        public IQueryable<TType> Query() => dbSet.AsQueryable();

        public IQueryable<TType> QueryNoTracking() => dbSet.AsNoTracking();

        public async Task<IEnumerable<TType>> GetAllAsync(bool tracking = false)
        {
            return tracking
                ? await dbSet.ToListAsync()
                : await dbSet.AsNoTracking().ToListAsync();
        }

        //public IQueryable<TType> GetAllAttached() => this.dbSet.AsQueryable();
        //public IQueryable<TType> Query() => dbContext.Set<TType>();

        public TType FirstOrDefault(Func<TType, bool> predicate) =>
            this.dbSet.FirstOrDefault(predicate);

        public async Task<TType> FirstOrDefaultAsync(Expression<Func<TType, bool>> predicate) =>
            await this.dbSet.FirstOrDefaultAsync(predicate);

        public async Task<bool> AnyAsync(Expression<Func<TType, bool>> predicate) =>
           await this.dbSet.AnyAsync(predicate);

        public async Task<int> CountAsync(Expression<Func<TType, bool>> predicate) =>
            await this.dbSet.CountAsync(predicate);

        public async Task AddAsync(TType entity) => await this.dbSet.AddAsync(entity);

        public async Task AddRangeAsync(TType[] entities) => await this.dbSet.AddRangeAsync(entities);

        public async Task DeleteAsync(TType entity)
        {
            this.dbSet.Remove(entity);
        }

        public async Task UpdateAsync(TType entity)
        {
            this.dbSet.Attach(entity);
            this.dbContext.Entry(entity).State = EntityState.Modified;
        }


        public async Task SaveChangesAsync() => await dbContext.SaveChangesAsync();

        public TType? FindByKeys(params object[] keyValues)
        {
            return dbSet.Find(keyValues);
        }

        public async Task<TType?> FindByKeysAsync(params object[] keyValues)
        {
            var entity = await dbSet.FindAsync(keyValues);
            return entity;
        }

        public async Task DeleteByKeysAsync(params object[] keyValues)
        {
            var entity = await FindByKeysAsync(keyValues);
            if (entity != null)
                dbSet.Remove(entity);
        }
        public async Task<bool> ExistsByKeysAsync(params object[] keyValues)
        {
            var entity = await FindByKeysAsync(keyValues);
            return entity != null;
        }

        public async Task<bool> IsMemberAsync(TId groupId, TId profileId)
        {
            if (groupId is Guid groupGuid && profileId is Guid profileGuid)
            {
                return await dbContext.GroupMemberships
                    .AnyAsync(m =>
                        m.GroupId == groupGuid &&
                        m.ProfileId == profileGuid &&
                        m.Status == MembershipStatus.Approved);
            }
            throw new InvalidOperationException("TId must be of type Guid.");
        }
    }
}