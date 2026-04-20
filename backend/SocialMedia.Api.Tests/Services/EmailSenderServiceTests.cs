using Microsoft.Extensions.Configuration;
using SocialMedia.Service;
using System;
using System.Collections.Generic;
using System.Text;

namespace SocialMedia.Api.Tests.Services
{
    public class EmailSenderServiceTests
    {
        private IConfiguration BuildFakeConfiguration(Dictionary<string, string> configuration)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(configuration)
                .Build();

        }

        #region SendEmailAsync

        [Fact]
        public async Task SendEmailAsync_WithValidConfig_AttemptToSendAndThrowsNetworkError()
        {
            //Arrange
            var inMemorySttings = new Dictionary<string, string>
            {
                {"Email:Smtp:Host", "fake.smtp.server.com"},
                {"Email:Smtp:Port", "587"},
                {"Email:Smtp:User", "test_user@gmail.com"},
                {"Email:Smtp:Password", "fake_password"},
                {"Email:Smtp:Sender", "test_sender@gmail.com"}
            };

            var config = BuildFakeConfiguration(inMemorySttings);
            var service = new EmailSenderService(config);

            //Act and Assert
            await Assert.ThrowsAnyAsync<Exception>(() => 
                service.SendEmailAsync("target@example.com", "Test Subject", "Test Body"));
        }

        [Fact]
        public async Task SendEmailAsync_WithMissingSmtpSection_ThrowsNullReferenceException()
        {
            var inMemorySttings = new Dictionary<string, string>();
            var config = BuildFakeConfiguration(inMemorySttings);
            var service = new EmailSenderService(config);

            await Assert.ThrowsAsync<ArgumentNullException>(() =>
                service.SendEmailAsync("target@example.com", "Test Subject", "Test Body"));
        }

        [Fact]
        public async Task SendEmailAsync_WithInvalidPortFormat_ThrowsFormatException()
        {
            var inMemorySettings = new Dictionary<string, string>
            {
                {"Email:Smtp:Host", "smtp.gmail.com"},
                {"Email:Smtp:Port", "xxx"}, 
                {"Email:Smtp:User", "test_user@gmail.com"},
                {"Email:Smtp:Password", "fake_password"},
                {"Email:Smtp:Sender", "test_sender@gmail.com"}
            };

            var fakeConfig = BuildFakeConfiguration(inMemorySettings);
            var emailService = new EmailSenderService(fakeConfig);

            await Assert.ThrowsAsync<FormatException>(() =>
                emailService.SendEmailAsync("target@example.com", "Test Subject", "Test Body"));
        }

        #endregion
    }
}
