using FluentValidation;
using SocialMedia.Database;
using SocialMedia.DTOs;

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

            RuleFor(x => x.Age)
                .InclusiveBetween(10, 80).WithMessage("Age must be between 10 and 80.");

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
