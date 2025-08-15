using FluentValidation;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Validators.PostValidation
{
    public class UpdatePostValidator : AbstractValidator<UpdatePostDto>
    {
        public UpdatePostValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("Content cannot be empty.")
                .MaximumLength(500)
                .WithMessage("Content cannot exceed 500 characters.");

            RuleFor(p => p.MediaUrl)
                .MaximumLength(2000)
                .WithMessage("MediaUrl is too long.")
                .Must(url => string.IsNullOrEmpty(url) || Uri.IsWellFormedUriString(url, UriKind.Absolute))
                .WithMessage("MediaUrl must be a valid URL.");
        }
    }
}
