using SocialMedia.Database.Models;
using SocialMedia.DTOs.Authentication;
using DbProfile = SocialMedia.Database.Models.Profile;

namespace AutoMapper
{
    public class ProfileRegisterMapping : Profile
    {
        public ProfileRegisterMapping()
        {
            CreateMap<RegisterDto, DbProfile>();

            CreateMap<RegisterDto, ApplicationUser>()
                .ForMember(dest => dest.Profile, opt => opt.MapFrom(src => src));

        }
    }
}
