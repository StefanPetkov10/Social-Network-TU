using System.Threading.Tasks;
using Azure.Storage.Queues;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SocialMedia.Service;
using Xunit;

namespace SocialMedia.Api.Tests.Services
{
    public class EmailSenderServiceTests
    {
        [Fact]
        public async Task SendEmailAsync_WithValidData_PutsMessageInQueue()
        {
            // Arrange
            var queueClientMock = new Mock<QueueClient>();

            queueClientMock
                .Setup(q => q.SendMessageAsync(It.IsAny<string>()))
                .ReturnsAsync((Azure.Response<Azure.Storage.Queues.Models.SendReceipt>)null!);

            var logger = NullLogger<EmailSenderService>.Instance;

            var service = new EmailSenderService(queueClientMock.Object, logger);

            // Act
            await service.SendEmailAsync("target@example.com", "Test Subject", "Test Body");

            // Assert
            queueClientMock.Verify(q => q.SendMessageAsync(It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task SendEmailAsync_WithEmptySubject_StillPutsMessageInQueue()
        {
            // Arrange
            var queueClientMock = new Mock<QueueClient>();
            queueClientMock
                .Setup(q => q.SendMessageAsync(It.IsAny<string>()))
                .ReturnsAsync((Azure.Response<Azure.Storage.Queues.Models.SendReceipt>)null!);

            var logger = NullLogger<EmailSenderService>.Instance;
            var service = new EmailSenderService(queueClientMock.Object, logger);

            // Act
            await service.SendEmailAsync("target@example.com", "", "Test Body");

            // Assert
            queueClientMock.Verify(q => q.SendMessageAsync(It.IsAny<string>()), Times.Once);
        }
    }
}