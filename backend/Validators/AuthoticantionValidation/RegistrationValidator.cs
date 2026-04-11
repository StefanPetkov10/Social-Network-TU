using FluentValidation;
using SocialMedia.Database;
using SocialMedia.DTOs.Authentication;

namespace SocialMedia.Validators
{
    public class RegistrationValidator : AbstractValidator<RegisterDto>
    {
        public RegistrationValidator(SocialMediaDbContext db)
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required.")
                .Length(2, 10).WithMessage("First name must be between 2 and 10 characters.");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required.");

            RuleFor(x => x.BirthDay)
                .InclusiveBetween(1, 31).WithMessage("Birth day must be between 1 and 31");
            RuleFor(x => x.BirthMonth)
                .InclusiveBetween(1, 12).WithMessage("Month month must be between 1 and 12");
            RuleFor(x => x.BirthYear)
                .InclusiveBetween(1930, DateTime.UtcNow.Year - 14).WithMessage("Your birth year must be later than 1930 and you must be 14 years old or older");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Invalid email format.")
                .Must(email => !db.Users.Any(u => u.Email == email))
                    .WithMessage("Email already exists.");

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("Username is required.")
                .Must(username => !db.Users.Any(u => u.UserName == username))
                    .WithMessage("Username already exists.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required.")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters long.")
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

            RuleFor(x => x.Sex)
                .IsInEnum().WithMessage("Invalid gender selected.");
        }
    }
}
