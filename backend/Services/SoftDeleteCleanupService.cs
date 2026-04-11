using Microsoft.EntityFrameworkCore;
using SocialMedia.Database;

namespace SocialMedia.Services
{
    public class SoftDeleteCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SoftDeleteCleanupService> _logger;

        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        public SoftDeleteCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<SoftDeleteCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogInformation("Starting soft-delete cleanup task...");
                await PurgeOldRecordsAsync(stoppingToken);

                await Task.Delay(Interval, stoppingToken);
            }
        }

        private async Task PurgeOldRecordsAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SocialMediaDbContext>();

                var cutoffDate = DateTime.UtcNow.AddMonths(-3);

                int deletedPosts = await db.Posts
                    .IgnoreQueryFilters() 
                    .Where(p => p.IsDeleted && p.DeletedAt != null && p.DeletedAt < cutoffDate)
                    .ExecuteDeleteAsync(ct);

                int deletedComments = await db.Comments
                    .IgnoreQueryFilters()
                    .Where(c => c.IsDeleted && c.DeletedAt != null && c.DeletedAt < cutoffDate)
                    .ExecuteDeleteAsync(ct);

                int deletedMessages = await db.Messages
                    .IgnoreQueryFilters()
                    .Where(m => m.IsDeleted && m.DeletedAt != null && m.DeletedAt < cutoffDate)
                    .ExecuteDeleteAsync(ct);

                if (deletedPosts > 0 || deletedComments > 0 || deletedMessages > 0)
                {
                    _logger.LogInformation(
                        "Cleanup Complete: Permanently deleted {posts} Posts, {comments} Comments, and {msgs} Messages.",
                        deletedPosts, deletedComments, deletedMessages);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while purging old soft-deleted records.");
            }
        }
    }
}
