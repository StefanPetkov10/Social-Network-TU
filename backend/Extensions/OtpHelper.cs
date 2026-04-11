using System.Security.Cryptography;
using System.Text;

namespace SocialMedia.Extensions
{
    public class OtpHelper
    {
        public static string GenerateOtp()
        {
            var num = RandomNumberGenerator.GetInt32(100000, 1000000);
            return num.ToString("D6");
        }

        public static string HmacHash(string input, string secret)
        {
            var key = Encoding.UTF8.GetBytes(secret);
            using var hmac = new HMACSHA256(key);
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = hmac.ComputeHash(bytes);
            return Convert.ToHexString(hash);
        }

        public static string GenerateSessionToken() => Guid.NewGuid().ToString("N");
    }
}
