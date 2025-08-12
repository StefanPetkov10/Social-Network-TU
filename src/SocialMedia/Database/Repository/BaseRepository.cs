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

        public TType GetById(TId id)
        {
            TType entity = this.dbSet
                .Find(id);

            return entity;
        }

        public async Task<TType> GetByIdAsync(TId id)
        {
            TType entity = await this.dbSet
                .FindAsync(id);
            return entity;
        }

        public async Task<TType> GetByApplicationIdAsync(TId id)
        {
            TType user = await this.dbSet
                .FirstOrDefaultAsync(u => EF.Property<TId>(u, "ApplicationId").Equals(id));
            return user;
        }

        public async Task<TType> GetByIdAsync(params TId[] id)
        {
            //Temp patch... Fix ASAP
            TType entity = await this.dbSet
                .FindAsync(id[0], id[1]);

            return entity;
        }

        public IEnumerable<TType> GetAll() => this.dbSet.ToArray();

        public async Task<IEnumerable<TType>> GetAllAsync() =>
            await this.dbSet.ToArrayAsync();

        public TType FirstOrDefault(Func<TType, bool> predicate)
        {
            TType entity = this.dbSet
                .FirstOrDefault(predicate);

            return entity;
        }

        public async Task<TType> FirstOrDefaultAsync(Expression<Func<TType, bool>> predicate)
        {
            TType entity = await this.dbSet
                .FirstOrDefaultAsync(predicate);

            return entity;
        }

        public IQueryable<TType> GetAllAttached() => this.dbSet.AsQueryable();

        public void Add(TType entity)
        {
            this.dbSet.Add(entity);
            this.dbContext.SaveChanges();
        }

        public async Task AddAsync(TType entity)
        {
            await this.dbSet.AddAsync(entity);
            await this.dbContext.SaveChangesAsync();
        }

        public void AddRange(TType[] items)
        {
            this.dbSet.AddRange(items);
            this.dbContext.SaveChanges();
        }

        public async Task AddRangeAsync(TType[] items)
        {
            await this.dbSet.AddRangeAsync(items);
            await this.dbContext.SaveChangesAsync();
        }

        public bool Delete(TType entity)
        {
            this.dbSet.Remove(entity);
            this.dbContext.SaveChanges();

            return true;
        }

        public async Task<bool> DeleteAsync(TType entity)
        {
            this.dbSet.Remove(entity);
            await this.dbContext.SaveChangesAsync();

            return true;
        }

        public bool Update(TType entity)
        {
            try
            {
                this.dbSet.Attach(entity);
                this.dbContext.Entry(entity).State = EntityState.Modified;
                this.dbContext.SaveChanges();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> UpdateAsync(TType entity)
        {
            try
            {
                this.dbSet.Attach(entity);
                this.dbContext.Entry(entity).State = EntityState.Modified;
                await this.dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public void SaveChanges()
        {
            dbContext.SaveChanges();
        }

        public async Task SaveChangesAsync()
        {
            await dbContext.SaveChangesAsync();
        }
    }
}