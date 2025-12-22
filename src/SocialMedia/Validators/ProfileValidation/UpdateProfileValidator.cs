using FluentValidation;
using SocialMedia.Database;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Validators.Profile_Validation
{
    public class UpdateProfileValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileValidator(SocialMediaDbContext db)
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required.")
                .Length(2, 10).WithMessage("First name must be between 2 and 10 characters.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required.")
                .Length(2, 10).WithMessage("Last name must be between 2 and 10 characters.");

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("Username is required.")
                .Length(3, 20).WithMessage("Username should be between 3 and 20.")
                .Matches("^[a-zA-Z0-9_]*$").WithMessage("Only letters, numbers, and underscore are allowed.");

            RuleFor(x => x.Sex).IsInEnum();

            RuleFor(x => x.PhotoBase64)
                .Matches("^data:image\\/(jpeg|png|jpg);base64,")
                .When(x => !string.IsNullOrEmpty(x.PhotoBase64));

            RuleFor(x => x.Bio)
                .MaximumLength(100).WithMessage("Bio cannot exceed 100 characters.");
        }
    }
}