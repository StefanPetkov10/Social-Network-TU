using SocialMedia.Database.Models;
using SocialMedia.DTOs.Authentication;

namespace AutoMapper
{
    public class ProfileRegisterMapping : Profile
    {
        public ProfileRegisterMapping()
        {
            CreateMap<RegisterDto, Profile>();

            CreateMap<RegisterDto, ApplicationUser>()
                .ForMember(dest => dest.Profile, opt => opt.MapFrom(src => src));
        }
    }
}
