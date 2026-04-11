using SocialMedia.Database.Models;
using SocialMedia.DTOs.Comment;

namespace AutoMapper
{
    public class CommentMapping : Profile
    {
        public CommentMapping()
        {
            CreateMap<CreateCommentDto, Comment>()
                .ForMember(dest => dest.Media, opt => opt.Ignore());

            CreateMap<UpdateCommentDto, Comment>()
                .ForMember(dest => dest.Media, opt => opt.Ignore());

            CreateMap<Comment, CommentDto>()
                .ForMember(dest => dest.RepliesCount, opt => opt.MapFrom(src => src.Replies.Count))
                .ForMember(dest => dest.RepliesPreview, opt => opt.MapFrom(src => src.Replies
                .OrderBy(r => r.CreatedDate)));

            CreateMap<CommentMedia, CommentMediaDto>()
                .ForMember(dest => dest.Url, opt => opt.Ignore());
        }
    }
}
