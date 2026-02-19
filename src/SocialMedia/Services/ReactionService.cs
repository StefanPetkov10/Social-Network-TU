using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Reaction;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class ReactionService : BaseService, IReactionService
    {
        private readonly IRepository<Reaction, Guid> _reactionRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Comment, Guid> _commentRepository;
        private readonly IRepository<Message, Guid> _messageRepository;
        private readonly IRepository<Friendship, Guid> _friendshipRepository;

        public ReactionService(IRepository<Reaction, Guid> reactionRepository,
            IRepository<Profile, Guid> profileRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Comment, Guid> commentRepository,
            IRepository<Message, Guid> messageRepository,
            UserManager<ApplicationUser> userManager,
            IRepository<Friendship, Guid> friendshipRepository) : base(userManager)
        {
            _reactionRepository = reactionRepository;
            _profileRepository = profileRepository;
            _postRepository = postRepository;
            _commentRepository = commentRepository;
            _messageRepository = messageRepository;
            _friendshipRepository = friendshipRepository;
        }

        public async Task<ApiResponse<string>> ReactToPostAsync(ClaimsPrincipal userClaim, Guid postId, ReactionType type)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaim, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<string>("Profile");

            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<string>("Post");

            var existingReaction = await _reactionRepository
                .FirstOrDefaultAsync(r => r.PostId == postId && r.ProfileId == profile.Id);

            string message = "";

            if (existingReaction == null)
            {
                var newReaction = new Reaction
                {
                    Id = Guid.NewGuid(),
                    Type = type,
                    ProfileId = profile.Id,
                    PostId = postId,
                    CreatedAt = DateTime.UtcNow
                };

                post.LikesCount++;
                await _reactionRepository.AddAsync(newReaction);
                message = "Reaction added successfully.";
            }
            else
            {
                if (existingReaction.Type == type)
                {
                    post.LikesCount = Math.Max(0, post.LikesCount - 1);
                    await _reactionRepository.DeleteAsync(existingReaction);
                    message = "Reaction removed successfully.";
                }
                else
                {
                    existingReaction.Type = type;
                    await _reactionRepository.UpdateAsync(existingReaction);
                    message = "Reaction updated successfully.";
                }
            }

            await _postRepository.UpdateAsync(post);
            await _postRepository.SaveChangesAsync();

            return ApiResponse<string>.SuccessResponse(message);
        }

        public async Task<ApiResponse<string>> ReactToCommentAsync(ClaimsPrincipal userClaim, Guid commentId, ReactionType type)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaim, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<string>("Profile");

            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
                return NotFoundResponse<string>("Comment");

            var existingReaction = await _reactionRepository
                .FirstOrDefaultAsync(r => r.CommentId == commentId && r.ProfileId == profile.Id);

            string message = "";

            if (existingReaction == null)
            {
                var newReaction = new Reaction
                {
                    Id = Guid.NewGuid(),
                    Type = type,
                    ProfileId = profile.Id,
                    CommentId = commentId,
                    CreatedAt = DateTime.UtcNow
                };

                comment.LikesCount++;
                await _reactionRepository.AddAsync(newReaction);
                message = "Reaction added successfully.";
            }
            else
            {
                if (existingReaction.Type == type)
                {
                    comment.LikesCount = Math.Max(0, comment.LikesCount - 1);
                    await _reactionRepository.DeleteAsync(existingReaction);
                    message = "Reaction removed successfully.";
                }
                else
                {
                    existingReaction.Type = type;
                    await _reactionRepository.UpdateAsync(existingReaction);
                    message = "Reaction updated successfully.";
                }
            }

            await _commentRepository.UpdateAsync(comment);
            await _commentRepository.SaveChangesAsync();

            return ApiResponse<string>.SuccessResponse(message);
        }

        public async Task<ApiResponse<string>> ReactToMessageAsync(ClaimsPrincipal userClaim, Guid messageId, ReactionType type)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaim, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<string>("Profile");

            var message = await _messageRepository.GetByIdAsync(messageId);
            if (message == null) return NotFoundResponse<string>("Message");

            var existingReaction = await _reactionRepository
                .FirstOrDefaultAsync(r => r.MessageId == messageId && r.ProfileId == profile.Id);

            string responseMessage = "";
            if (existingReaction == null)
            {
                var newReaction = new Reaction
                {
                    Id = Guid.NewGuid(),
                    Type = type,
                    ProfileId = profile.Id,
                    MessageId = messageId,
                    CreatedAt = DateTime.UtcNow
                };

                _reactionRepository.AddAsync(newReaction);
                responseMessage = "Reaction added successfully.";
            }
            else
            {
                if (existingReaction.Type == type)
                {
                    await _reactionRepository.DeleteAsync(existingReaction);
                    responseMessage = "Reaction removed successfully.";
                }
                else
                {
                    existingReaction.Type = type;
                    await _reactionRepository.UpdateAsync(existingReaction);
                    responseMessage = "Reaction updated successfully.";
                }
            }

            await _reactionRepository.SaveChangesAsync();
            return ApiResponse<string>.SuccessResponse(responseMessage);
        }

        public async Task<ApiResponse<ReactorListResponse>> GetReactorsAsync(
            ClaimsPrincipal userClaims,
            Guid entityId,
            string entityType,
            ReactionType? typeFilter = null,
            Guid? lastReactionId = null,
            int take = 20)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<ReactorListResponse>(userClaims, out var currentUserId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var currentProfile = await _profileRepository.GetByApplicationIdAsync(currentUserId);
            if (currentProfile == null) return NotFoundResponse<ReactorListResponse>("Profile");

            string eType = entityType.ToLower();

            var query = _reactionRepository.QueryNoTracking()
                .Include(r => r.Profile).ThenInclude(p => p.User)
                .Where(r =>
                    (eType == "comment" && r.CommentId == entityId) ||
                    (eType == "post" && r.PostId == entityId) ||
                    (eType == "message" && r.MessageId == entityId));

            Dictionary<ReactionType, int> counts = new();
            if (lastReactionId == null)
            {
                counts = await _reactionRepository.QueryNoTracking()
                    .Where(r =>
                        (eType == "comment" && r.CommentId == entityId) ||
                        (eType == "post" && r.PostId == entityId) ||
                        (eType == "message" && r.MessageId == entityId))
                    .GroupBy(r => r.Type)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Type, x => x.Count);
            }

            if (typeFilter.HasValue)
            {
                query = query.Where(r => r.Type == typeFilter.Value);
            }

            query = query.OrderByDescending(r => r.CreatedAt);

            if (lastReactionId.HasValue)
            {
                var lastReaction = await _reactionRepository.GetByIdAsync(lastReactionId.Value);
                if (lastReaction != null) query = query.Where(r => r.CreatedAt < lastReaction.CreatedAt);
            }

            var reactions = await query.Take(take).ToListAsync();

            var reactorProfileIds = reactions.Select(r => r.ProfileId).ToList();
            var friendships = await _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == currentProfile.Id && reactorProfileIds.Contains(f.AddresseeId)) ||
                            (f.AddresseeId == currentProfile.Id && reactorProfileIds.Contains(f.RequesterId)))
                .ToListAsync();

            var dtos = reactions.Select(r =>
            {
                var friendship = friendships.FirstOrDefault(f => f.RequesterId == r.ProfileId || f.AddresseeId == r.ProfileId);

                return new ReactionDto
                {
                    ProfileId = r.ProfileId,
                    Username = r.Profile.User.UserName,
                    FullName = r.Profile.FullName ?? "Unknown",
                    AuthorAvatar = r.Profile.Photo,
                    Type = r.Type,
                    ReactedDate = r.CreatedAt,
                    IsMe = r.ProfileId == currentProfile.Id,
                    IsFriend = friendship?.Status == FriendshipStatus.Accepted,
                    HasSentRequest = friendship?.Status == FriendshipStatus.Pending && friendship.RequesterId == currentProfile.Id,
                    HasReceivedRequest = friendship?.Status == FriendshipStatus.Pending && friendship.AddresseeId == currentProfile.Id,
                    PendingRequestId = friendship != null && friendship.Status == FriendshipStatus.Pending ? friendship.Id : null
                };
            }).ToList();

            return ApiResponse<ReactorListResponse>.SuccessResponse(new ReactorListResponse { Reactors = dtos, ReactionCounts = counts });
        }
    }
}