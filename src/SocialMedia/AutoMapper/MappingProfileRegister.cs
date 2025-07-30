using SocialMedia.Database.Models;
using SocialMedia.DTOs.Authentication;

public class MappingProfileRegister : AutoMapper.Profile
{
    public MappingProfileRegister()
    {
        CreateMap<RegisterDto, Profile>();

        CreateMap<RegisterDto, ApplicationUser>()
            .ForMember(dest => dest.Profile, opt => opt.MapFrom(src => src));
    }
}
