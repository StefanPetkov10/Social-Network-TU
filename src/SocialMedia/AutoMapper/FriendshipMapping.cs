using SocialMedia.DTOs.Friendship;

namespace AutoMapper
{
    public class FriendshipMapping : Profile
    {
        public FriendshipMapping()
        {
            CreateMap<SocialMedia.Database.Models.Profile, FriendDto>()
                .ForMember(dest => dest.ProfileId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.DisplayFullName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
                .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.Photo));
        }
    }
}
