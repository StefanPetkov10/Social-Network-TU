using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocialMedia.Common;
using SocialMedia.Controllers;
using SocialMedia.DTOs.Post;
using SocialMedia.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace SocialMedia.Api.Tests.Controllers
{
    public class PostControllerTests
    {
        private readonly Mock<IPostService> _mockPostService;
        private readonly PostsController _controller;

        public PostControllerTests()
        {
            _mockPostService = new Mock<IPostService>();

            var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, "TestUser")
            }, "mock"));

            _controller = new PostsController(_mockPostService.Object)
            {
                ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = user }
                }
            };
        }

        #region CreatePost Tests

        [Fact]
        public async Task CreatePost_ReturnsBadRequest_WhenModelStateIsInvalid()
        {
            // Arrange
            var dto = new CreatePostDto();

            _controller.ModelState.AddModelError("Content", "Content is required.");

            // Act
            var result = await _controller.CreatePost(dto);

            //Assert
            Assert.IsType<BadRequestObjectResult>(result);

            _mockPostService.Verify(
                s => s.CreatePostAsPost(It.IsAny<ClaimsPrincipal>(), It.IsAny<CreatePostDto>()),
                Times.Never);
        }

        [Fact]
        public async Task CreatePost_ReturnsBadRequest_WhenServiceFails()
        {
            //Arrange
            var dto = new CreatePostDto { Content = "Hello" };

            var errorResponce = ApiResponse<PostDto>.ErrorResponse("Error");

            _mockPostService.Setup(s => s.CreatePostAsPost(It.IsAny<ClaimsPrincipal>(), It.IsAny<CreatePostDto>()))
                .ReturnsAsync(errorResponce);

            //Act
            var result = await _controller.CreatePost(dto);

            //Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            var returnedResponce = Assert.IsType<ApiResponse<PostDto>>(badRequestResult.Value);
            Assert.False(returnedResponce.Success);
            Assert.Equal("Error", returnedResponce.Message);
        }


        [Fact]
        public async Task CreatePost_ReturnsOk_WhenServiceSucceeds()
        {
            //Arrange
            var dto = new CreatePostDto { Content = "Hello" };
            var postDto = new PostDto { Id = Guid.NewGuid(), Content = "Hello" };
            
            var successResponce = ApiResponse<PostDto>.SuccessResponse(postDto);

            _mockPostService.Setup(s => s.CreatePostAsPost(It.IsAny<ClaimsPrincipal>(), It.IsAny<CreatePostDto>()))
                .ReturnsAsync(successResponce);

            //Act   
            var result = await _controller.CreatePost(dto);

            //Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedResponce = Assert.IsType<ApiResponse<PostDto>>(okResult.Value);
            Assert.True(returnedResponce.Success);
            Assert.Equal(postDto, returnedResponce.Data);
        }

        #endregion
    }
}
