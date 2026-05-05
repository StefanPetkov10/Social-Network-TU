using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace SocialMedia.Extensions
{
    public static class TokenHelper
    {
        public static string EncodeToken(string token)
        {
            var bytes = Encoding.UTF8.GetBytes(token);
            return WebEncoders.Base64UrlEncode(bytes);
        }

        public static string DecodeToken(string encodedToken)
        {
            var bytes = WebEncoders.Base64UrlDecode(encodedToken);
            return Encoding.UTF8.GetString(bytes);
        }
    }
}
