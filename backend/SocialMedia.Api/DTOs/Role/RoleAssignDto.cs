namespace SocialMedia.DTOs.Role
{
    public class RoleAssignDto
    {
        public Guid UserId { get; set; }
        public string Role { get; set; } = null!;
    }
}
