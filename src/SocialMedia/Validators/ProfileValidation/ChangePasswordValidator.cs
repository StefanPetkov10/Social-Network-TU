using FluentValidation;
using SocialMedia.DTOs.Profile;

namespace SocialMedia.Validators.Profile_Validation
{
    public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
    {
        public ChangePasswordValidator()
        {
            RuleFor(x => x.CurrentPassword).NotEmpty();

            RuleFor(x => x.NewPassword)
                .NotEmpty()
                .MinimumLength(8)
                .Matches("[A-Z]").WithMessage("Must contain uppercase")
                .Matches("[a-z]").WithMessage("Must contain lowercase")
                .Matches("[^a-zA-Z0-9]").WithMessage("Must contain special char")
                .NotEqual(x => x.CurrentPassword).WithMessage("New password must be different from current password");

            RuleFor(x => x.ConfirmNewPassword)
                .NotEmpty()
                .MinimumLength(8)
                .Matches("[A-Z]").WithMessage("Must contain uppercase")
                .Matches("[a-z]").WithMessage("Must contain lowercase")
                .Matches("[^a-zA-Z0-9]").WithMessage("Must contain special char")
                .Equal(x => x.NewPassword).WithMessage("New password and confirmation must match");
        }
    }
}
