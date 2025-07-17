using System.ComponentModel.DataAnnotations.Schema;

namespace SocialMedia.Models
{
    public class BaseModel
    {
        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate
        {
            get; set;
        }

    }
}
