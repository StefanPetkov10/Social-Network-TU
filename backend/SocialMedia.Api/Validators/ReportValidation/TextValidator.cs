using FluentValidation;
using SocialMedia.Database;
using SocialMedia.Database.Models;

namespace SocialMedia.Validators.ReportValidation
{
    public class TextValidator : AbstractValidator<ReportedPost>
    {
        public TextValidator(SocialMediaDbContext db)
        {
            RuleFor(x => x.ReasonComment)
                .NotEmpty().WithMessage("Reason is required.")
                .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");

            RuleFor(x => x.AdminComment)
               .NotEmpty().WithMessage("Comment is required.")
               .MaximumLength(500).WithMessage("Comment must not exceed 500 characters.");
        }
    }
}
