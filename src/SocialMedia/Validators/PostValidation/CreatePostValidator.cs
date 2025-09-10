using FluentValidation;
using SocialMedia.Database;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Validators.PostValidation
{
    public class CreatePostValidator : AbstractValidator<CreatePostDto>
    {
        public CreatePostValidator(SocialMediaDbContext db)
        {
            RuleFor(x => x.Visibility).IsInEnum();

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Content is required.")
                .MaximumLength(500).WithMessage("Content must not exceed 500 characters.");

            RuleFor(p => p.MediaUrl)
                .MaximumLength(2000)
                .WithMessage("MediaUrl is too long.")
                .Must(url => string.IsNullOrEmpty(url) || Uri.IsWellFormedUriString(url, UriKind.Absolute))
                .WithMessage("MediaUrl must be a valid URL.");
        }
    }
}
