using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;

namespace SocialMedia.Services
{
    public class GroupPostService : BaseService, IGroupPostService
    {
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<Database.Models.Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public GroupPostService(UserManager<ApplicationUser> userManager,
            IRepository<Post, Guid> postRepository,
            IRepository<Group, Guid> groupRepository,
            IRepository<Database.Models.Profile, Guid> profileRepository,
            IMapper mapper
        ) : base(userManager)
        {
            _postRepository = postRepository;
            _groupRepository = groupRepository;
            _profileRepository = profileRepository;
            _mapper = mapper;
        }

        public Task<ApiResponse<PostDto>> CreateGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, CreatePostDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> DeleteGroupPostAsync(ClaimsPrincipal userClaims, Guid groupId, Guid postId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<PostDto>>> GetGroupFeedAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20)
        {
            throw new NotImplementedException();
        }
    }
}
