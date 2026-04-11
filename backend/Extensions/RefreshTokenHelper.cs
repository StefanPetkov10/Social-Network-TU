using System.Security.Cryptography;
using System.Text;

namespace SocialMedia.Extensions
{
    public static class RefreshTokenHelper
    {
        private const int TokenBytes = 64;

        public static string GenerateRawToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(TokenBytes);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }

        public static string HashToken(string rawToken)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
