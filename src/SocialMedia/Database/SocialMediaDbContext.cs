using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Database.Models;
using SocialMedia.Models;

namespace SocialMedia.Database
{
    public class SocialMediaDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {

        public SocialMediaDbContext(DbContextOptions<SocialMediaDbContext> options)
            : base(options) { }


        public DbSet<Post> Posts { get; set; }



        public override int SaveChanges()
        {
            AddTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            AddTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void AddTimestamps()
        {
            var entities = ChangeTracker.Entries()
                .Where(x => x.Entity is BaseModel && (x.State == EntityState.Added || x.State == EntityState.Modified));

            foreach (var entity in entities)
            {
                var now = DateTime.UtcNow; // current datetime

                if (entity.State == EntityState.Added)
                {
                    ((BaseModel)entity.Entity).CreatedDate = now;
                }
                else
                {
                    entity.Property("CreatedDate").IsModified = false;
                }
                ((BaseModel)entity.Entity).UpdatedDate = now;
            }
        }
    }
}
