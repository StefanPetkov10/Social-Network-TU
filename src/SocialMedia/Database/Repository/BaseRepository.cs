using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database;

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

        public TType GetById(TId id) => this.dbSet.Find(id);

        public async Task<TType> GetByIdAsync(TId id) =>
            await this.dbSet.FindAsync(id);

        public async Task<TType> GetByApplicationIdAsync(TId id) =>
            await this.dbSet.FirstOrDefaultAsync(u => EF.Property<TId>(u, "ApplicationId").Equals(id));

        public async Task<TType> GetByIdAsync(params TId[] id) =>
            await this.dbSet.FindAsync(id);

        public IEnumerable<TType> GetAll() => this.dbSet.ToArray();

        public async Task<IEnumerable<TType>> GetAllAsync() =>
            await this.dbSet.ToArrayAsync();

        public TType FirstOrDefault(Func<TType, bool> predicate) =>
            this.dbSet.FirstOrDefault(predicate);

        public async Task<TType> FirstOrDefaultAsync(Expression<Func<TType, bool>> predicate) =>
            await this.dbSet.FirstOrDefaultAsync(predicate);

        public IQueryable<TType> GetAllAttached() => this.dbSet.AsQueryable();

        public void Add(TType entity) => this.dbSet.Add(entity);

        public async Task AddAsync(TType entity) => await this.dbSet.AddAsync(entity);

        public void AddRange(TType[] entities) => this.dbSet.AddRange(entities);

        public async Task AddRangeAsync(TType[] entities) => await this.dbSet.AddRangeAsync(entities);

        public void Delete(TType entity) => this.dbSet.Remove(entity);

        public Task DeleteAsync(TType entity)
        {
            this.dbSet.Remove(entity);
            return Task.CompletedTask;
        }

        public void Update(TType entity)
        {
            this.dbSet.Attach(entity);
            this.dbContext.Entry(entity).State = EntityState.Modified;
        }

        public Task UpdateAsync(TType entity)
        {
            this.dbSet.Attach(entity);
            this.dbContext.Entry(entity).State = EntityState.Modified;
            return Task.CompletedTask;
        }

        public void SaveChanges() => dbContext.SaveChanges();

        public async Task SaveChangesAsync() => await dbContext.SaveChangesAsync();
    }
}