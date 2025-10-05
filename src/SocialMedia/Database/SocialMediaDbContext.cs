using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Database.Models;

namespace SocialMedia.Database
{
    public class SocialMediaDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {

        public SocialMediaDbContext(DbContextOptions<SocialMediaDbContext> options)
            : base(options) { }


        public DbSet<Post> Posts { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<Follow> Follows { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMembership> GroupMemberships { get; set; }
        public DbSet<PostMedia> PostMedias { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<CommentMedia> CommentMedias { get; set; }
        public DbSet<Reaction> Reactions { get; set; }


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
                .Where(x => x.Entity is BaseModel &&
                            (x.State == EntityState.Added || x.State == EntityState.Modified));

            foreach (var entity in entities)
            {
                var now = DateTime.UtcNow;

                if (entity.State == EntityState.Added)
                {
                    ((BaseModel)entity.Entity).CreatedDate = now;
                    ((BaseModel)entity.Entity).UpdatedDate = null;
                }
                else if (entity.State == EntityState.Modified)
                {
                    entity.Property("CreatedDate").IsModified = false;
                    ((BaseModel)entity.Entity).UpdatedDate = now;
                }
            }
        }
    }
}
