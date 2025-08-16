using SocialMedia.Database.Models;
using SocialMedia.DTOs.Post;

namespace AutoMapper
{
    public class PostMapping : Profile
    {
        public PostMapping()
        {
            CreateMap<CreatePostDto, Post>();

            CreateMap<Post, PostDto>()
                .ForMember(dest => dest.AuthorName, opt => opt.MapFrom(src => src.Profile.User.UserName))
                .ForMember(dest => dest.AuthorAvatar, opt => opt.MapFrom(src => src.Profile.Photo))
                .ForMember(dest => dest.LikeCount, opt => opt.MapFrom(src => src.LikesCount))
                .ForMember(dest => dest.CommentCount, opt => opt.MapFrom(src => src.CommentsCount))
                .ForMember(dest => dest.CreatedDate, opt => opt.MapFrom(src => src.CreatedDate));
        }
    }
}
