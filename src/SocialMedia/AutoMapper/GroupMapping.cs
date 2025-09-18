using SocialMedia.Database.Models;
using SocialMedia.DTOs.Group;

namespace AutoMapper
{
    public class GroupMapping : Profile
    {
        public GroupMapping()
        {
            CreateMap<Group, GroupDto>();

            CreateMap<CreateGroupDto, Group>();

            CreateMap<UpdateGroupDto, Group>();
        }
    }
}
