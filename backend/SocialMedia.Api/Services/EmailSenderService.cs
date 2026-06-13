using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Azure.Storage.Queues;
using SocialMedia.Api.DTOs.Email;
using SocialMedia.Service.Interfaces;

namespace SocialMedia.Service
{
    public class EmailSenderService : IEmailSenderService
    {
        private readonly QueueClient _queueClient;
        private readonly ILogger<EmailSenderService> _logger;

        public EmailSenderService(QueueClient queueClient, ILogger<EmailSenderService> logger)
        {
            _queueClient = queueClient;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new EmailMessage
            {
                To = toEmail,
                Subject = subject,
                Body = body
            };

            var json = JsonSerializer.Serialize(message);

            await _queueClient.SendMessageAsync(json);

            _logger.LogInformation("Email queued for {To} (subject: {Subject})", toEmail, subject);
        }
    }
}