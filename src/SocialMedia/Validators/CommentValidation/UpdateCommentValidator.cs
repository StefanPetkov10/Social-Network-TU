using FluentValidation;
using SocialMedia.DTOs.Comment;

namespace SocialMedia.Validators.CommentValidation
{
    public class UpdateCommentValidator : AbstractValidator<UpdateCommentDto>
    {
        public UpdateCommentValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Content is required.")
                .MaximumLength(300).WithMessage("Content must not exceed 300 characters.");
        }
    }
}
