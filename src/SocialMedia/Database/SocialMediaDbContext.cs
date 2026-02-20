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

        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<Follow> Follows { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMembership> GroupMemberships { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostMedia> PostMedias { get; set; }
        public DbSet<SavedPosts> SavedPosts { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<CommentMedia> CommentMedias { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageMedia> MessageMedias { get; set; }
        public DbSet<MessageReadReceipt> MessageReadReceipts { get; set; }
        public DbSet<EmailOtpCode> EmailOtpCodes { get; set; }
        public DbSet<PasswordResetSession> PasswordResetSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany(p => p.MessagesSent)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(p => p.MessagesReceived)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.Group)
                .WithMany(g => g.Messages)
                .HasForeignKey(m => m.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Reaction>()
                .HasOne(r => r.Message)
                .WithMany(m => m.Reactions)
                .HasForeignKey(r => r.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            // builder.Entity<MessageReadReceipt>()
            //.HasKey(r => new { r.MessageId, r.ProfileId });

            builder.Entity<MessageReadReceipt>()
                .HasOne(r => r.Message)
                .WithMany(m => m.ReadReceipts)
                .HasForeignKey(r => r.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<MessageReadReceipt>()
                .HasOne(r => r.Profile)
                .WithMany() // <-- Тук казваме на EF, че няма колекция в Profile!
                .HasForeignKey(r => r.ProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        }

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
