using SocialMedia.Database.Models;
using SocialMedia.DTOs.Post;

namespace AutoMapper
{
    public class PostMapping : Profile
    {
        public PostMapping()
        {
            CreateMap<CreatePostDto, Post>()
                .ForMember(dest => dest.Visibility, opt => opt.Ignore())
                .ForMember(dest => dest.Media, opt => opt.Ignore());

            CreateMap<UpdatePostDto, Post>()
                .ForMember(dest => dest.Visibility, opt => opt.MapFrom(src => src.PostVisibility))
                .ForMember(dest => dest.Media, opt => opt.Ignore()); ;

            CreateMap<Post, PostDto>();
            CreateMap<PostMedia, PostMediaDto>()
                .ForMember(dest => dest.Url, opt => opt.Ignore());
        }
    }
}
