using SocialMedia.DTOs.Profile;

namespace AutoMapper
{
    public class ProfileMapping : Profile
    {
        public ProfileMapping()
        {
            CreateMap<SocialMedia.Database.Models.Profile, ProfileDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName))
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex.ToString()))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Photo));

            CreateMap<UpdateProfileDto, SocialMedia.Database.Models.Profile>()
                .ForMember(dest => dest.Photo, opt => opt.MapFrom(src => src.PhotoBase64))
                .ForMember(dest => dest.User, opt => opt.Ignore());
        }
    }
}
