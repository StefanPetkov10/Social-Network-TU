using SocialMedia.Database.Models.Enums;

namespace SocialMedia.DTOs.Reaction
{
    public class ReactionDto
    {
        public Guid ProfileId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AuthorAvatar { get; set; }

        public ReactionType Type { get; set; }
        public DateTime ReactedDate { get; set; }

        public bool IsMe { get; set; }
        public bool IsFriend { get; set; }
        public bool HasSentRequest { get; set; }
        public bool HasReceivedRequest { get; set; }
        public Guid? PendingRequestId { get; set; }
    }

    public class ReactorListResponse
    {
        public IEnumerable<ReactionDto> Reactors { get; set; } = new List<ReactionDto>();
        public Dictionary<ReactionType, int> ReactionCounts { get; set; } = new();
    }
}
