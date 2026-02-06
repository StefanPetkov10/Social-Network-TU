using FluentValidation;
using SocialMedia.DTOs.SavedPosts;

namespace SocialMedia.Validators.SavedPostsValidation
{
    public class SavePostValidation : AbstractValidator<SavePostRequestDto>
    {
        public SavePostValidation()
        {
            RuleFor(s => s.CollectionName)
                .MaximumLength(50)
                .WithMessage("Collection name must not exceed 50 characters");
        }
    }
}
