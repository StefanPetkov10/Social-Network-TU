using FluentValidation;
using SocialMedia.DTOs.Authentication;

namespace SocialMedia.Validators.AuthoticantionValidation
{
    public class ResetPasswordValidation : AbstractValidator<ResetPasswordWithSessionDto>
    {
        public ResetPasswordValidation()
        {
            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("New password is required.")
                .MinimumLength(8).WithMessage("New password must be at least 8 characters long.")
                .Matches("[A-Z]").WithMessage("New password must contain at least one uppercase letter.")
                .Matches("[a-z]").WithMessage("New password must contain at least one lowercase letter.")
                .Matches("[^a-zA-Z0-9]").WithMessage("New password must contain at least one special character.");
            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty().WithMessage("Please confirm your new password.")
                .Equal(x => x.NewPassword).WithMessage("Passwords do not match.");
        }
    }
}
