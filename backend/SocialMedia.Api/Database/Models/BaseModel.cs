namespace SocialMedia.Database.Models
{
    public abstract class BaseModel
    {
        public DateTime CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; } = null;

    }
}
