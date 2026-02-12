using FluentValidation;
using SocialMedia.DTOs.ChatHub;

namespace SocialMedia.Validators.ChatValidation
{
    public class UploadChatFilesValidator : AbstractValidator<UploadChatFilesDto>
    {
        public UploadChatFilesValidator()
        {
            RuleFor(x => x.Files)
                .Must(files => files == null || files.Count <= 10)
                .WithMessage("You can upload max 10 files.");

            RuleFor(x => x.Files)
                .Must(files =>
                {
                    if (files == null || !files.Any()) return true;
                    return files.Sum(f => f.Length) <= 25 * 1024 * 1024;
                })
                .WithMessage("The total size of the files must not exceed 25 MB.");
        }
    }
}
