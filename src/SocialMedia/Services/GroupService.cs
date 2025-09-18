using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Common;
using SocialMedia.Data.Repository.Interfaces;
using SocialMedia.Database.Models;
using SocialMedia.Database.Models.Enums;
using SocialMedia.DTOs.Group;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;
using Profile = SocialMedia.Database.Models.Profile;

namespace SocialMedia.Services
{
    public class GroupService : BaseService, IGroupService
    {
        private readonly IRepository<Group, Guid> _groupRepository;
        private readonly IRepository<GroupMembership, Guid> _membershipRepository;
        private readonly IRepository<Post, Guid> _postRepository;
        private readonly IRepository<Profile, Guid> _profileRepository;
        private readonly IMapper _mapper;

        public GroupService(IRepository<Group, Guid> groupRepository,
            IRepository<GroupMembership, Guid> membershipRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Profile, Guid> profileRepository,
            IMapper mapper, UserManager<ApplicationUser> userManager)
            : base(userManager)
        {
            _membershipRepository = membershipRepository;
            _profileRepository = profileRepository;
            _groupRepository = groupRepository;
            _postRepository = postRepository;
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
                Status = MembershipStatus.Approved,
                RequestedOn = DateTime.UtcNow,
                JoinedOn = DateTime.UtcNow
            };
            await _membershipRepository.AddAsync(membership);

            await _groupRepository.SaveChangesAsync();

            var resultDto = _mapper.Map<GroupDto>(group);
            resultDto.IsOwner = true;
            resultDto.IsAdmin = true;
            resultDto.IsMember = true;
            resultDto.CanViewPosts = true;
            resultDto.CanCreatePost = true;
            resultDto.MembersCount = 1;

            return ApiResponse<GroupDto>.SuccessResponse(resultDto, "Group created successfully.");
        }

        public async Task<ApiResponse<GroupDto>> GetGroupByIdAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var group = _groupRepository.GetAllAttached()
                .Include(g => g.Members)
                .FirstOrDefault(g => g.Id == groupId);

            if (group == null)
                return NotFoundResponse<GroupDto>("Group");

            var invalidUserResponse = GetUserIdOrUnauthorized<GroupDto>(userClaims, out var userId);
            var dto = _mapper.Map<GroupDto>(group);

            if (invalidUserResponse != null)
            {
                dto.CanViewPosts = !group.IsPrivate;
                return ApiResponse<GroupDto>.SuccessResponse(dto);
            }


            var profile = await _profileRepository.GetByApplicationIdAsync(userId);

            var membership = profile != null
                  ? group.Members.FirstOrDefault(m => m.ProfileId == profile.Id)
                  : null;

            dto = _mapper.Map<GroupDto>(group);
            dto.MembersCount = group.Members.Count;

            if (membership != null)
            {
                dto.IsMember = true;
                dto.IsAdmin = membership.Role == GroupRole.Admin || membership.Role == GroupRole.Owner;
                dto.IsOwner = membership.Role == GroupRole.Owner;
                dto.CanViewPosts = true;
                dto.CanCreatePost = true;
            }
            else
            {
                dto.IsMember = false;
                dto.IsAdmin = false;
                dto.IsOwner = false;
                dto.CanViewPosts = !group.IsPrivate;
                dto.CanCreatePost = false;
            }

            return ApiResponse<GroupDto>.SuccessResponse(dto);
        }
        public async Task<ApiResponse<IEnumerable<PostDto>>> GetMyGroupsFeedAsync(ClaimsPrincipal userClaims, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50)
                take = 20;

            var invlaidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invlaidUserResponse != null)
                return invlaidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<IEnumerable<PostDto>>("Profile");

            var myMembership = await _membershipRepository.GetAllAttached()
                .Where(m => m.ProfileId == profile.Id && m.Status == MembershipStatus.Approved)
                .Select(m => m.GroupId)
                .ToListAsync();

            if (!myMembership.Any())
                return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(Enumerable.Empty<PostDto>(), "No groups found.");

            var queryPosts = _postRepository.GetAllAttached()
                .Where(p => p.GroupId != null && !p.IsDeleted
                    && myMembership.Contains(p.GroupId.Value))
                .Include(p => p.Profile)
                .OrderByDescending(p => p.CreatedDate)
                .AsQueryable();

            if (lastPostId != null && lastPostId != Guid.Empty)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null)
                {
                    queryPosts = queryPosts.Where(p => p.CreatedDate < lastPost.CreatedDate);
                }
            }

            var posts = await queryPosts.Take(take).ToListAsync();
            var dtos = _mapper.Map<IEnumerable<PostDto>>(posts);

            foreach (var dto in dtos)
            {
                if (string.IsNullOrEmpty(dto.AuthorName))
                {
                    dto.AuthorName = profile?.FullName ?? "Unknown";
                    dto.AuthorAvatar = profile?.Photo;
                }
            }

            var last = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(dtos,
                "Feed retrieved successfully.",
                new { lastPostId = last });
        }

        public async Task<ApiResponse<IEnumerable<GroupDto>>> GetMyGroupsAsync(ClaimsPrincipal userClaims)
        {
            var invlaidUserResponse = GetUserIdOrUnauthorized<IEnumerable<GroupDto>>(userClaims, out var userId);
            if (invlaidUserResponse != null)
                return invlaidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<IEnumerable<GroupDto>>("Profile");

            var myMembership = await _membershipRepository.GetAllAttached()
                .Where(m => m.ProfileId == profile.Id && m.Status == MembershipStatus.Approved)
                .Select(m => m.GroupId)
                .ToListAsync();

            if (!myMembership.Any())
                return ApiResponse<IEnumerable<GroupDto>>.SuccessResponse(Enumerable.Empty<GroupDto>(), "No groups found.");

            var groups = await _groupRepository.GetAllAttached()
                .Where(g => myMembership.Contains(g.Id))
                .Include(g => g.Members)
                .ToListAsync();

            var dtos = groups.Select(g =>
            {
                var membership = g.Members.FirstOrDefault(m => m.ProfileId == profile.Id);
                var dto = _mapper.Map<GroupDto>(g);
                dto.MembersCount = g.Members.Count(m => m.Status == MembershipStatus.Approved);
                dto.IsMember = membership != null && membership.Status == MembershipStatus.Approved;
                dto.HasRequestedJoin = membership != null && membership.Status == MembershipStatus.Pending;
                dto.IsOwner = membership?.Role == GroupRole.Owner;
                dto.IsAdmin = membership?.Role == GroupRole.Admin || dto.IsOwner;
                dto.CanViewPosts = true;
                dto.CanCreatePost = dto.IsMember;
                return dto;
            }).ToList();

            return ApiResponse<IEnumerable<GroupDto>>.SuccessResponse(dtos, "My groups retrieved.");

        }

        public async Task<ApiResponse<object>> UpdateGroupAsync(ClaimsPrincipal userClaims, Guid groupId, UpdateGroupDto dto)
        {
            var invlaidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invlaidUserResponse != null)
                return invlaidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<object>("Profile");

            var group = await _groupRepository.GetByIdAsync(groupId);
            if (group == null)
                return NotFoundResponse<object>("Group");

            var membership = await _membershipRepository
                .FirstOrDefaultAsync(m => m.GroupId == group.Id && m.ProfileId == profile.Id
                && m.Status == MembershipStatus.Approved);

            if (membership == null || (membership.Role != GroupRole.Admin
                && membership.Role != GroupRole.Owner))
                return ApiResponse<object>.ErrorResponse("Forbidden.", new[] { "You do not have permission to update this group." });

            var updateGroup = _mapper.Map(dto, group);

            _groupRepository.Update(updateGroup);
            await _groupRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(null, "Group updated successfully.");
        }

        public async Task<ApiResponse<object>> DeleteGroupAsync(ClaimsPrincipal userClaims, Guid groupId)
        {
            var invalidUserResponse = GetUserIdOrUnauthorized<object>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<object>("Profile");

            var group = await _groupRepository.GetByIdAsync(groupId);
            if (group == null)
                return NotFoundResponse<object>("Group");

            var membership = await _membershipRepository
                .FirstOrDefaultAsync(m => m.GroupId == group.Id && m.ProfileId == profile.Id
                && m.Status == MembershipStatus.Approved);

            if (membership == null || membership.Role != GroupRole.Owner)
                return ApiResponse<object>.ErrorResponse("Forbidden.", new[] { "You do not have permission to delete this group." });

            _groupRepository.Delete(group);
            await _groupRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(null, "Group deleted successfully.");
        }

    }
}
