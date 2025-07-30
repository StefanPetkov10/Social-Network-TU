using SocialMedia.Database.Models;
using SocialMedia.DTOs;

public class MappingProfile : AutoMapper.Profile
{
    public MappingProfile()
    {
        CreateMap<RegisterDto, Profile>();

        CreateMap<RegisterDto, ApplicationUser>()
            .ForMember(dest => dest.Profile, opt => opt.MapFrom(src => src));
    }
}
