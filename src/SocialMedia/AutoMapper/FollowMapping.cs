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
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.UserName))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Photo))
                .ForMember(dest => dest.Bio, opt => opt.MapFrom(src => src.Bio))

                .ForMember(dest => dest.IsFollowing, opt => opt.Ignore())
                .ForMember(dest => dest.IsFollower, opt => opt.Ignore())
                .ForMember(dest => dest.IsFriend, opt => opt.Ignore());

            CreateMap<Database.Models.Profile, FollowSuggestionDto>()
                .IncludeBase<Database.Models.Profile, FollowDto>()
                .ForMember(dest => dest.Reason, opt => opt.Ignore())
                .ForMember(dest => dest.MutualFollowersCount, opt => opt.Ignore());
        }
    }
}