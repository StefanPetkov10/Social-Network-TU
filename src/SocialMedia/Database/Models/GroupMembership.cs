using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Database.Models.Enums;

namespace SocialMedia.Database.Models
{
    [PrimaryKey(nameof(ProfileId), nameof(GroupId))]
    public class GroupMembership
    {
        [ForeignKey(nameof(Profile))]
        public Guid ProfileId { get; set; }
        public Profile profile { get; set; } = null!;

        [ForeignKey(nameof(Group))]
        public Guid GroupId { get; set; }
        public Group Group { get; set; } = null!;

        [Required]
        public GroupRole Role { get; set; }

        [Required]
        public MembershipStatus Status { get; set; }

        [Required]
        public DateTime RequestedOn { get; set; }

        [Required]
        public DateTime JoinedOn { get; set; }

        //Mapping table for many to many relationship between Profile and Group
    }
}
