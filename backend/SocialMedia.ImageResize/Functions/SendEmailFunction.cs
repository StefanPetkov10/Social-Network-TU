using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SocialMedia.ImageResize.Models;

namespace SocialMedia.ImageResize.Functions
{
    public class SendEmailFunction
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SendEmailFunction> _logger;

        public SendEmailFunction(IConfiguration configuration, ILogger<SendEmailFunction> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        [Function(nameof(SendEmailFunction))]
        public async Task Run(
            [QueueTrigger("email-queue", Connection = "BlobStorageConnection")]
            string messageJson)
        {
            EmailMessage? message;
            try
            {
                message = JsonSerializer.Deserialize<EmailMessage>(messageJson);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Invalid JSON: {Raw}", messageJson);
                throw;
            }

            if (message == null || string.IsNullOrWhiteSpace(message.To))
            {
                _logger.LogWarning("Empty message, skipping");
                return;
            }

            var smtp = _configuration.GetSection("Email:Smtp");

            using var client = new SmtpClient(smtp["Host"], int.Parse(smtp["Port"]!))
            {
                Credentials = new NetworkCredential(smtp["User"], smtp["Password"]),
                EnableSsl = true
            };

            using var mail = new MailMessage
            {
                From = new MailAddress(smtp["Sender"]!),
                Subject = message.Subject,
                Body = message.Body,
                IsBodyHtml = true
            };
            mail.To.Add(message.To);

            await client.SendMailAsync(mail);

            _logger.LogInformation("Email sent to {To} (subject: {Subject})", message.To, message.Subject);
        }
    }
}