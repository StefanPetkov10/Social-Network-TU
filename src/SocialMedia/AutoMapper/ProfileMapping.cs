using SocialMedia.DTOs.Profile;

namespace AutoMapper
{
    public class ProfileMapping : Profile
    {
        public ProfileMapping()
        {
            CreateMap<SocialMedia.Database.Models.Profile, ProfileDto>()
                .ForMember(dest => dest.Username, opt => opt.Ignore())
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex.ToString()))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Photo))

                .ForMember(dest => dest.IsFollowed, opt => opt.Ignore())
                .ForMember(dest => dest.FriendshipStatus, opt => opt.Ignore())
                .ForMember(dest => dest.IsFriendRequestSender, opt => opt.Ignore())
                .ForMember(dest => dest.FriendshipRequestId, opt => opt.Ignore());

            CreateMap<UpdateProfileDto, SocialMedia.Database.Models.Profile>()
                .ForMember(dest => dest.Photo, opt => opt.MapFrom(src => src.PhotoBase64))
                .ForMember(dest => dest.Sex, opt => opt.MapFrom(src => src.Sex.ToString()));
        }
    }
}