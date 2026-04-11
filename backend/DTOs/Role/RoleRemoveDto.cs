namespace SocialMedia.DTOs.Role
{
    public class RoleRemoveDto
    {
        public Guid UserId { get; set; }
        public string Role { get; set; } = null!;
    }
}
