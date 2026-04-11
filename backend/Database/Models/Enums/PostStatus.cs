namespace SocialMedia.Database.Models.Enums
{
    public enum PostStatus
    {
        Draft = 0,
        Published = 1,
        Pending = 2,
        Approved = 3,
        Rejected = 4
    } // this is used to manage the state of a post in the system but
      // it is not used in the current implementation. It is reserved for future use.
}
