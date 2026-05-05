using SocialMedia.Database.Models;
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
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.UserName))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Photo));

            CreateMap<Friendship, PendingFriendDto>()
                .ForMember(dest => dest.PendingRequestId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.ProfileId, opt => opt.MapFrom(src => src.RequesterId))
                .ForMember(dest => dest.DisplayFullName, opt => opt.MapFrom(src => src.Requester.FullName))
                .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.Requester.User.UserName));

            CreateMap<SocialMedia.Database.Models.Profile, FriendSuggestionDto>()
                .ForMember(dest => dest.ProfileId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.DisplayFullName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Photo))
                .ForMember(dest => dest.MutualFriendsCount, opt => opt.Ignore())

                .ForMember(dest => dest.FriendshipStatus, opt => opt.MapFrom(src => -1))
                .ForMember(dest => dest.IsFriendRequestSender, opt => opt.MapFrom(src => false));
        }
    }
}