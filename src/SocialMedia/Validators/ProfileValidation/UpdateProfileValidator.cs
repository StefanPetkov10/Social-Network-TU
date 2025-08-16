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

            RuleFor(x => x.Age)
                .InclusiveBetween(10, 80).WithMessage("Age must be between 10 and 80.");

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("Username is required.")
                .Must((dto, username) => !db.Users.Any(u => u.UserName == username))
                .WithMessage("Username already exists.");

            RuleFor(x => x.Sex).IsInEnum();

            RuleFor(x => x.PhotoBase64)
                .Matches("^data:image\\/(jpeg|png|jpg);base64,")
                .When(x => !string.IsNullOrEmpty(x.PhotoBase64));
        }
    }
}