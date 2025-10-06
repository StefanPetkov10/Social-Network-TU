using FluentValidation;
using SocialMedia.DTOs.Comment;

namespace SocialMedia.Validators.CommentValidation
{
    public class CreateCommentValidator : AbstractValidator<CreateCommentDto>
    {
        public CreateCommentValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Content is required.")
                .MaximumLength(300).WithMessage("Content must not exceed 300 characters.");
            RuleFor(x => x.File)
                .Must(file => file == null || file.Length <= 10 * 1024 * 1024)
                .WithMessage("Each file must be less than 10MB.");
        }
    }
}
