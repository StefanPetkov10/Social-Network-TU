using SocialMedia.DTOs.Profile;

namespace AutoMapper
{
    public class ProfileMapping : Profile
    {
        public ProfileMapping()
        {
            CreateMap<Profile, UpdateProfileDto>().ReverseMap();
        }
    }
}
