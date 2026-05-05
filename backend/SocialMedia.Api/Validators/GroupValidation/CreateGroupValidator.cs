using FluentValidation;
using SocialMedia.Database;
using SocialMedia.DTOs.Group;

namespace SocialMedia.Validators.GroupValidation
{
    public class CreateGroupValidator : AbstractValidator<CreateGroupDto>
    {
        public CreateGroupValidator(SocialMediaDbContext db)
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Group name is required.")
                .MinimumLength(3).WithMessage("Group name must contain 3 characters.")
                .MaximumLength(100).WithMessage("Group name must not exceed 100 characters.")
                .Must(name => !db.Groups.Any(u => u.Name == name))
                    .WithMessage("Name already exists. Try with another name");
            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
        }
    }
}
