using FluentValidation;
using SocialMedia.DTOs.Group;

namespace SocialMedia.Validators.GroupValidation
{
    public class CreateGroupValidator : AbstractValidator<CreateGroupDto>
    {
        public CreateGroupValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Group name is required.")
                .MaximumLength(100).WithMessage("Group name must not exceed 100 characters.");
            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
        }
    }
}
