using FluentValidation;
using SocialMedia.DTOs.Post;

namespace SocialMedia.Validators.PostValidation
{
    public class UpdatePostValidator : AbstractValidator<UpdatePostDto>
    {
        public UpdatePostValidator()
        {
            RuleFor(x => x.Visibility).IsInEnum();

            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("Content cannot be empty.")
                .MaximumLength(500)
                .WithMessage("Content cannot exceed 500 characters.");

            RuleFor(x => x.NewFiles)
                .Must(files => files == null || files.Count <= 5)
                .WithMessage("You can upload a maximum of 5 files.")
                .Must(files => files == null || files.All(file => file.Length <= 10 * 1024 * 1024))
                .WithMessage("Each file must be less than 10MB.");

        }
    }
}
