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

            RuleFor(x => x.Files)
                .Must(files => files == null || files.Count <= 5)
                .WithMessage("You can upload a maximum of 5 files.")
                .Must(files => files == null || files.All(file => file.Length <= 10 * 1024 * 1024))
                .WithMessage("Each file must be less than 10MB.");

            When(x => x.GroupId.HasValue, () =>
            {
                RuleFor(x => x.Visibility)
                    .Null()
                    .WithMessage("Group posts cannot have visibility setting.");
            });
        }
    }
}
