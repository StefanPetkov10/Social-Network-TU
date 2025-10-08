using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class ReactionService : BaseService, IReactionService
    {
        private readonly IRepository<Reaction, Guid> _reactionRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Comment, Guid> _commentRepository;

        public ReactionService(IRepository<Reaction, Guid> reactionRepository,
            IRepository<Profile, Guid> profileRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Comment, Guid> commentRepository,
            UserManager<ApplicationUser> userManager) : base(userManager)
        {
            _reactionRepository = reactionRepository;
            _profileRepository = profileRepository;
            _postRepository = postRepository;
            _commentRepository = commentRepository;
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
                await _reactionRepository.SaveChangesAsync();

                await _postRepository.UpdateAsync(post);
                await _postRepository.SaveChangesAsync();

                return ApiResponse<string>.SuccessResponse("Reaction added successfully.");
            }
            else
            {
                if (existingReaction.Type == type)
                {
                    post.LikesCount--;
                    await _postRepository.UpdateAsync(post);
                    await _postRepository.SaveChangesAsync();

                    await _reactionRepository.DeleteAsync(existingReaction);
                    await _reactionRepository.SaveChangesAsync();

                    return ApiResponse<string>.SuccessResponse("Reaction removed successfully.");
                }
                else
                {
                    existingReaction.Type = type;

                    await _reactionRepository.UpdateAsync(existingReaction);
                    await _reactionRepository.SaveChangesAsync();

                    return ApiResponse<string>.SuccessResponse("Reaction updated successfully.");
                }
            }
        }

        public async Task<ApiResponse<string>> ReactToCommentAsync(ClaimsPrincipal userClaim, Guid commentId, ReactionType type)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<string>(userClaim, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<string>("Profile");

            var existingReaction = await _reactionRepository
                .FirstOrDefaultAsync(r => r.CommentId == commentId && r.ProfileId == profile.Id);
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
                await _reactionRepository.AddAsync(newReaction);
                await _reactionRepository.SaveChangesAsync();
                return ApiResponse<string>.SuccessResponse("Reaction added successfully.");
            }
            else
            {
                if (existingReaction.Type == type)
                {
                    await _reactionRepository.DeleteAsync(existingReaction);
                    await _reactionRepository.SaveChangesAsync();

                    return ApiResponse<string>.SuccessResponse("Reaction removed successfully.");
                }
                else
                {
                    existingReaction.Type = type;
                    await _reactionRepository.UpdateAsync(existingReaction);
                    await _reactionRepository.SaveChangesAsync();

                    return ApiResponse<string>.SuccessResponse("Reaction updated successfully.");
                }
            }
        }

        public async Task<ApiResponse<Dictionary<ReactionType, int>>> GetPostReactionsCountAsync(Guid postId)
        {
            var post = await _postRepository.GetByIdAsync(postId);
            if (post == null)
                return NotFoundResponse<Dictionary<ReactionType, int>>("Post");

            var reactions = _reactionRepository.Query().Where(r => r.PostId == post.Id);

            var groupedReactions = reactions
                .GroupBy(r => r.Type)
                .ToDictionary(g => g.Key, g => g.Count());

            return ApiResponse<Dictionary<ReactionType, int>>.SuccessResponse(groupedReactions);
        }

        public async Task<ApiResponse<Dictionary<ReactionType, int>>> GetCommentReactionsCountAsync(Guid commentId)
        {
            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
                return NotFoundResponse<Dictionary<ReactionType, int>>("Comment");

            var reactions = _reactionRepository.Query().Where(r => r.CommentId == comment.Id);
            var groupedReactions = reactions
                .GroupBy(r => r.Type)
                .ToDictionary(g => g.Key, g => g.Count());

            return ApiResponse<Dictionary<ReactionType, int>>.SuccessResponse(groupedReactions);
        }


    }
}
