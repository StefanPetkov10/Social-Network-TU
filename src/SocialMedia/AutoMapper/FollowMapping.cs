using AutoMapper;
using SocialMedia.DTOs.Follow;

namespace SocialMedia.AutoMapper
{
    public class FollowMapping : Profile
    {
        public FollowMapping()
        {
            CreateMap<Database.Models.Profile, FollowDto>()
                .ForMember(dest => dest.ProfileId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.DisplayFullName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Photo));
        }
    }
}
