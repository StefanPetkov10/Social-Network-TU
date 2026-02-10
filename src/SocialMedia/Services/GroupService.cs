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
        private readonly IRepository<Friendship, Guid> _friendshipRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public GroupService(IRepository<Group, Guid> groupRepository,
            IRepository<GroupMembership, Guid> membershipRepository,
            IRepository<Post, Guid> postRepository,
            IRepository<Profile, Guid> profileRepository,
            IRepository<Friendship, Guid> friendshipRepository,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper, UserManager<ApplicationUser> userManager)
            : base(userManager)
        {
            _membershipRepository = membershipRepository;
            _profileRepository = profileRepository;
            _groupRepository = groupRepository;
            _postRepository = postRepository;
            _friendshipRepository = friendshipRepository;
            _profileRepository = profileRepository;
            _httpContextAccessor = httpContextAccessor;
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
            group.Privacy = dto.GroupPrivacy;
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
            resultDto.IsPrivate = group.Privacy == GroupPrivacy.Private;
            resultDto.IsOwner = true;
            resultDto.IsAdmin = true;
            resultDto.IsMember = true;
            resultDto.CanViewPosts = true;
            resultDto.CanCreatePost = true;
            resultDto.MembersCount = 1;

            return ApiResponse<GroupDto>.SuccessResponse(resultDto, "Group created successfully.");
        }

        public async Task<ApiResponse<GroupDto>> GetGroupByNameAsync(ClaimsPrincipal userClaims, string name)
        {
            var group = _groupRepository.QueryNoTracking()
                .Include(g => g.Members)
                .FirstOrDefault(g => g.Name == name);

            if (group == null)
                return NotFoundResponse<GroupDto>("Group");

            var invalidUserResponse = GetUserIdOrUnauthorized<GroupDto>(userClaims, out var userId);

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            var membership = profile != null
                  ? group.Members.FirstOrDefault(m => m.ProfileId == profile.Id)
                  : null;

            var dto = _mapper.Map<GroupDto>(group);
            dto.IsPrivate = group.Privacy == GroupPrivacy.Private;

            dto.MembersCount = group.Members.Count(m => m.Status == MembershipStatus.Approved);

            if (membership != null && membership.Status == MembershipStatus.Approved)
            {
                dto.IsMember = true;
                dto.IsAdmin = membership.Role == GroupRole.Admin || membership.Role == GroupRole.Owner;
                dto.IsOwner = membership.Role == GroupRole.Owner;
                dto.HasRequestedJoin = false;
                dto.CanViewPosts = true;
                dto.CanCreatePost = true;
            }
            else if (membership != null && membership.Status == MembershipStatus.Pending)
            {
                dto.IsMember = false;
                dto.IsAdmin = false;
                dto.IsOwner = false;
                dto.HasRequestedJoin = true;
                dto.CanViewPosts = !dto.IsPrivate;
                dto.CanCreatePost = false;
            }
            else
            {
                dto.IsMember = false;
                dto.IsAdmin = false;
                dto.IsOwner = false;
                dto.HasRequestedJoin = false;
                dto.CanViewPosts = !dto.IsPrivate;
                dto.CanCreatePost = false;
            }

            return ApiResponse<GroupDto>.SuccessResponse(dto);
        }

        public async Task<ApiResponse<IEnumerable<GroupDto>>> GetGroupsDiscoverAsync(ClaimsPrincipal userClaims, Guid? lastGroupId = null, int take = 20)
        {
            if (take <= 0 || take > 50)
                take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<GroupDto>>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<IEnumerable<GroupDto>>("Profile");

            var myFriendIds = await _friendshipRepository.QueryNoTracking()
                .Where(f => (f.RequesterId == profile.Id || f.AddresseeId == profile.Id)
                            && f.Status == FriendshipStatus.Accepted)
                .Select(f => f.RequesterId == profile.Id ? f.AddresseeId : f.RequesterId)
                .ToListAsync();

            var friendsHashSet = myFriendIds.ToHashSet();

            var myGroupIds = await _membershipRepository.QueryNoTracking()
                .Where(m => m.ProfileId == profile.Id &&
                           (m.Status == MembershipStatus.Approved || m.Status == MembershipStatus.Pending))
                .Select(m => m.GroupId)
                .ToListAsync();

            var groupsWithFriends = await _groupRepository.QueryNoTracking()
                .Include(g => g.Members)
                .Where(g => !myGroupIds.Contains(g.Id))
                .Select(g => new
                {
                    Group = g,
                    MutualFriendsCount = g.Members.Count(m =>
                        m.Status == MembershipStatus.Approved &&
                        friendsHashSet.Contains(m.ProfileId)),
                    FriendPreviews = g.Members
                        .Where(m => m.Status == MembershipStatus.Approved && myFriendIds.Contains(m.ProfileId))
                        .OrderByDescending(m => m.JoinedOn)
                        .Take(3)
                        .Select(m => new MutualFriendDto
                        {
                            AuthorAvatar = m.Profile.Photo,
                            FullName = m.Profile.FullName
                        })
                        .ToList()
                })
                .Where(x => x.MutualFriendsCount > 0)
                .OrderByDescending(x => x.MutualFriendsCount)
                .Take(take)
                .ToListAsync();

            var finalResultList = groupsWithFriends.ToList();

            if (finalResultList.Count < take)
            {
                int needed = take - finalResultList.Count;

                var excludedGroupIds = myGroupIds.Concat(finalResultList.Select(x => x.Group.Id)).ToList();

                var otherGroups = await _groupRepository.QueryNoTracking()
                    .Include(g => g.Members)
                    .Where(g => !excludedGroupIds.Contains(g.Id))
                    .Select(g => new
                    {
                        Group = g,
                        MutualFriendsCount = 0,
                        FriendPreviews = new List<MutualFriendDto>()
                    })
                    .OrderByDescending(x => x.Group.CreatedDate)
                    .Take(needed)
                    .ToListAsync();

                finalResultList.AddRange(otherGroups);
            }


            if (lastGroupId.HasValue && lastGroupId.Value != Guid.Empty)
            {
                var index = finalResultList.FindIndex(x => x.Group.Id == lastGroupId.Value);
                if (index >= 0)
                {
                    finalResultList = finalResultList.Skip(index + 1).ToList();
                }
            }

            var dtos = finalResultList.Select(x =>
            {
                var dto = _mapper.Map<GroupDto>(x.Group);

                dto.MutualFriendsCount = x.MutualFriendsCount;
                dto.MembersCount = x.Group.Members.Count;
                dto.MutualFriends = x.FriendPreviews;
                dto.IsPrivate = x.Group.Privacy == GroupPrivacy.Private;

                dto.IsMember = false;
                dto.IsAdmin = false;
                dto.IsOwner = false;
                dto.HasRequestedJoin = false;
                dto.CanCreatePost = false;
                dto.CanViewPosts = x.Group.Privacy != GroupPrivacy.Private;

                return dto;
            }).ToList();

            if (!dtos.Any())
            {
                return ApiResponse<IEnumerable<GroupDto>>.SuccessResponse(Enumerable.Empty<GroupDto>(), "No groups found.");
            }

            return ApiResponse<IEnumerable<GroupDto>>.SuccessResponse(dtos, "Discover groups retrieved.");
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetMyGroupsFeedAsync(ClaimsPrincipal userClaims, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50) take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null) return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null) return NotFoundResponse<IEnumerable<PostDto>>("Profile not found");

            var myMembership = await _membershipRepository.QueryNoTracking()
                .Where(m => m.ProfileId == profile.Id && m.Status == MembershipStatus.Approved)
                .Select(m => m.GroupId)
                .ToListAsync();

            if (!myMembership.Any())
                return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(Enumerable.Empty<PostDto>(), "No groups found.");

            var queryPosts = _postRepository.QueryNoTracking()
                .Where(p => p.GroupId != null && !p.IsDeleted
                    && myMembership.Contains(p.GroupId.Value))
                .Include(p => p.Profile)
                    .ThenInclude(u => u.User)
                .Include(p => p.Group)
                .Include(p => p.Media)
                .Include(p => p.Reactions)
                .OrderByDescending(p => p.CreatedDate)
                .AsQueryable();

            if (lastPostId.HasValue && lastPostId.Value != Guid.Empty)
            {
                var lastPost = await _postRepository.GetByIdAsync(lastPostId.Value);
                if (lastPost != null)
                {
                    queryPosts = queryPosts.Where(p => p.CreatedDate < lastPost.CreatedDate);
                }
            }

            var posts = await queryPosts.Take(take).ToListAsync();

            var dtos = posts.Select(p => SuccessPostDto(p, p.Profile, "", profile.Id).Data).ToList();

            var lastId = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(dtos,
                "Feed retrieved successfully.",
                new { lastPostId = lastId });
        }

        public async Task<ApiResponse<IEnumerable<PostDto>>> GetGroupsPostsAsync(ClaimsPrincipal userClaims, Guid groupId, Guid? lastPostId = null, int take = 20)
        {
            if (take <= 0 || take > 50)
                take = 20;

            var invalidUserResponse = GetUserIdOrUnauthorized<IEnumerable<PostDto>>(userClaims, out var userId);
            if (invalidUserResponse != null)
                return invalidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<IEnumerable<PostDto>>("Profile");

            var group = await _groupRepository.GetByIdAsync(groupId);

            if (group == null)
                return NotFoundResponse<IEnumerable<PostDto>>("Group not found.");

            if (group.Privacy == GroupPrivacy.Private)
            {
                var isMember = await _membershipRepository.QueryNoTracking()
                    .AnyAsync(m => m.GroupId == groupId
                                   && m.ProfileId == profile.Id
                                   && m.Status == MembershipStatus.Approved);

                if (!isMember)
                {
                    return ApiResponse<IEnumerable<PostDto>>.ErrorResponse("This group is private. Join to see posts.", new[] { "Forbidden" });
                }
            }

            var queryPosts = _postRepository.QueryNoTracking()
                .Where(p => p.GroupId == groupId && !p.IsDeleted)
                .Include(p => p.Media)
                .Include(p => p.Profile)
                    .ThenInclude(p => p.User)
                .Include(p => p.Reactions)
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

            var dtos = posts.Select(p => SuccessPostDto(p, p.Profile, "", profile.Id).Data).ToList();

            var lastId = posts.LastOrDefault()?.Id;

            return ApiResponse<IEnumerable<PostDto>>.SuccessResponse(dtos,
                "Group posts retrieved successfully.",
                new { lastPostId = lastId });
        }

        public async Task<ApiResponse<IEnumerable<GroupDto>>> GetMyGroupsAsync(ClaimsPrincipal userClaims)
        {
            var invlaidUserResponse = GetUserIdOrUnauthorized<IEnumerable<GroupDto>>(userClaims, out var userId);
            if (invlaidUserResponse != null)
                return invlaidUserResponse;

            var profile = await _profileRepository.GetByApplicationIdAsync(userId);
            if (profile == null)
                return NotFoundResponse<IEnumerable<GroupDto>>("Profile");

            var myMembership = await _membershipRepository.QueryNoTracking()
                .Where(m => m.ProfileId == profile.Id && m.Status == MembershipStatus.Approved)
                .Select(m => m.GroupId)
                .ToListAsync();

            if (!myMembership.Any())
                return ApiResponse<IEnumerable<GroupDto>>.SuccessResponse(Enumerable.Empty<GroupDto>(), "No groups found.");

            var groups = await _groupRepository.QueryNoTracking()
                .Where(g => myMembership.Contains(g.Id))
                .Include(g => g.Members)
                .OrderBy(g => g.CreatedDate)
                .ToListAsync();

            var dtos = groups.Select(g =>
            {
                var membership = g.Members.FirstOrDefault(m => m.ProfileId == profile.Id);
                var dto = _mapper.Map<GroupDto>(g);
                dto.IsPrivate = g.Privacy == GroupPrivacy.Private;
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

            if (membership == null || (membership.Role != GroupRole.Admin
                && membership.Role != GroupRole.Owner))
                return ApiResponse<object>.ErrorResponse("Forbidden.", new[] { "You do not have permission to update this group." });

            if (!string.Equals(group.Name, dto.Name, StringComparison.OrdinalIgnoreCase))
            {
                var existingGroup = await _groupRepository
                    .FirstOrDefaultAsync(g => g.Name.ToUpper() == dto.Name.ToUpper() && g.Id != group.Id);
                if (existingGroup != null)
                {
                    return ApiResponse<object>.ErrorResponse("Group name already taken.", new[] { "Group name must be unique." });
                }
            }
            var updateGroup = _mapper.Map(dto, group);
            updateGroup.Privacy = dto.GroupPrivacy;

            _groupRepository.UpdateAsync(updateGroup);
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

            _groupRepository.DeleteAsync(group);
            await _groupRepository.SaveChangesAsync();

            return ApiResponse<object>.SuccessResponse(null, "Group deleted successfully.");
        }

        private ApiResponse<PostDto> SuccessPostDto(Post post, Database.Models.Profile profile, string message, Guid? currentUserId = null)
        {
            var dto = _mapper.Map<PostDto>(post);
            dto.CreatedAt = post.CreatedDate;
            dto.AuthorName = profile.FullName ?? "Unknown Author";
            dto.AuthorAvatar = profile.Photo;
            dto.Username = profile.User.UserName;
            dto.GroupId = post.GroupId;
            dto.GroupName = post.Group != null ? post.Group.Name : null;

            if (currentUserId.HasValue)
            {
                dto.IsOwner = post.ProfileId == currentUserId.Value;
            }

            if (post.Reactions != null)
            {
                dto.LikesCount = post.Reactions.Count;
            }

            if (currentUserId.HasValue && post.Reactions != null)
            {
                var myReaction = post.Reactions.FirstOrDefault(r => r.ProfileId == currentUserId.Value);
                dto.UserReaction = myReaction?.Type;
            }

            var baseUrl = $"{_httpContextAccessor.HttpContext!.Request.Scheme}://{_httpContextAccessor.HttpContext.Request.Host}";
            dto.Media = post.Media.Select(m => new PostMediaDto
            {
                Id = m.Id,
                Url = $"{baseUrl}/{m.FilePath}",
                MediaType = m.MediaType,
                FileName = m.FileName,
                Order = m.Order
            }).ToList();
            return ApiResponse<PostDto>.SuccessResponse(dto, message);
        }
    }
}