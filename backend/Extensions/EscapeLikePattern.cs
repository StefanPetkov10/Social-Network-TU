namespace SocialMedia.Extensions
{
    public class EscapeLikePattern
    {
        public static string EscapeLikePatternMethod(string input)
        {
            return input
                .Replace("\\", "\\\\")
                .Replace("%", "\\%")
                .Replace("_", "\\_");
        }
    }
}
