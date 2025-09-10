using SocialMedia.Database.Models;
using SocialMedia.DTOs.Post;

namespace AutoMapper
{
    public class PostMapping : Profile
    {
        public PostMapping()
        {
            CreateMap<CreatePostDto, Post>();

            CreateMap<UpdatePostDto, Post>();

            CreateMap<Post, PostDto>();

        }
    }
}
