using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Database.Models
{
    public class Post : BaseModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Content { get; set; }
    }
}
