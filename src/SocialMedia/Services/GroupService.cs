using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.Services.Interfaces;
using Profile = SocialMedia.Database.Models.Profile;

namespace SocialMedia.Services
{
    public class GroupService : BaseService, IGroupService
    {
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<GroupMembership, Guid> _membershipRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public GroupService(IRepository<Group, Guid> groupRepository,
            IRepository<GroupMembership, Guid> membershipRepository,
            IRepository<Profile, Guid> profileRepository,
            IMapper mapper, UserManager<ApplicationUser> userManager)
            : base(userManager)
        {
            _membershipRepository = membershipRepository;
            _profileRepository = profileRepository;
            _groupRepository = groupRepository;
            _mapper = mapper;
        }
        public async Task<ApiResponse<GroupDto>> CreateGroupAsync(ClaimsPrincipal userClaims, CreateGroupDto dto)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<GroupDto>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<GroupDto>("Profile");

            var group = _mapper.Map<Group>(dto);
            group.Id = Guid.NewGuid();
            group.OwnerId = profile.Id;

            await _groupRepository.AddAsync(group);

            var membership = new GroupMembership
            {
                GroupId = group.Id,
                ProfileId = profile.Id,
                Role = GroupRole.Owner,
                JoinedOn = DateTime.UtcNow
            };
            await _membershipRepository.AddAsync(membership);

            await _groupRepository.SaveChangesAsync();

            var resultDto = _mapper.Map<GroupDto>(group);
            resultDto.IsOwner = true;
            resultDto.IsAdmin = true;
            resultDto.IsMember = true;

            return ApiResponse<GroupDto>.SuccessResponse(resultDto, "Group created successfully.");
        }

        public Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<IEnumerable<GroupDto>>> GetAllGroupsAsync(ClaimsPrincipal userClaims, int take = 20, int skip = 0)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto)
        {
            throw new NotImplementedException();
        }

        public Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            throw new NotImplementedException();
        }
    }
}
