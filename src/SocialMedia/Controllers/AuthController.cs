using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using AutoMapper;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialMedia.Common;
using SocialMedia.Database;
using SocialMedia.Database.Models;
using SocialMedia.DTOs.Authentication;
using SocialMedia.Service.Interfaces;

namespace SocialMedia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SocialMediaDbContext _context;
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthController> _logger;
        private readonly IValidator<RegisterDto> _registerValidator;
        //private readonly IValidator<RegisterDto> login
        public AuthController(UserManager<ApplicationUser> userManager, SocialMediaDbContext context,
            IConfiguration config, IMapper mapper, ILogger<AuthController> logger,
            IEmailSender emailSender, IValidator<RegisterDto> registerValidator)
        {
            _userManager = userManager;
            _context = context;
            _config = config;
            _mapper = mapper;
            _logger = logger;
            _emailSender = emailSender;
            _registerValidator = registerValidator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            var validationResult = await _registerValidator.ValidateAsync(model);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult);
            }

            var user = _mapper.Map<ApplicationUser>(model);


            var createResult = await _userManager.CreateAsync(user, model.Password);

            if (!createResult.Succeeded)
            {
                var errors = createResult.Errors.Select(e => e.Description).ToArray();

                _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", errors));

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Registration failed.",
                    Errors = errors
                });
            }

            user = await _userManager.FindByEmailAsync(user.Email);
            var rawToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = UrlEncoder.Default.Encode(rawToken);

            var confirmationLink = Url.Action(nameof(ConfirmEmail), "Auth", new
            {
                userId = user.Id,
                token = encodedToken
            }, Request.Scheme);

            _logger.LogInformation("Confirmation link generated: {Link}", confirmationLink);

            await _emailSender.SendEmailAsync(user.Email, "Confirm your registration", $@"
                <h3>Welcome to our social network!</h3>
                <p>To complete your registration, please click the button below:</p>
                <a href='{confirmationLink}' style='padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none;'>Confirm email</a>
            ");

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Registration successful. Please check your email for confirmation."
            });
        }

        [HttpGet("confirmemail")]
        public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found.",
                    Errors = new[] { "No user with that ID." }
                });
            }

            if (user.EmailConfirmed)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Email is already confirmed."
                });
            }

            var decodedToken = Uri.UnescapeDataString(token);
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToArray();

                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email confirmation failed.",
                    Errors = errors
                });
            }

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Email successfully confirmed."
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            /* ApplicationUser user = model.Identifier.Contains("@")
                 ? await _userManager.FindByEmailAsync(model.Identifier)
                 : await _userManager.FindByNameAsync(model.Identifier);*/

            ApplicationUser user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u =>
                    model.Identifier.Contains("@")
                        ? u.Email == model.Identifier
                        : u.UserName == model.Identifier);


            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                _logger.LogWarning("Login failed for: {Identifier}", model.Identifier);
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid login credentials.",
                    Errors = new[] { "Wrong username/email or password." }
                });
            }

            if (!user.EmailConfirmed)
            {
                return Unauthorized(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Email not confirmed.",
                    Errors = new[] { "You must confirm your email before logging in." }
                });
            }


            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Profile.FirstName),
                new Claim(ClaimTypes.GivenName, user.Profile.FullName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Login successful.",
                Data = new JwtSecurityTokenHandler().WriteToken(token)
            });
        }
    }
}
