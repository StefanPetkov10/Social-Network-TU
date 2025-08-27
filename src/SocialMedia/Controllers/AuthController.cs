using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using AutoMapper;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
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
        private readonly IEmailSenderService _emailSender;
        private readonly ILogger<AuthController> _logger;
        private readonly IValidator<RegisterDto> _registerValidator;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SocialMediaDbContext context,
            IConfiguration config,
            IMapper mapper,
            ILogger<AuthController> logger,
            IEmailSenderService emailSender,
            IValidator<RegisterDto> registerValidator)
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
                return BadRequest(validationResult);

            var user = _mapper.Map<ApplicationUser>(model);

            var createResult = await _userManager.CreateAsync(user, model.Password);
            if (!createResult.Succeeded)
            {
                var errors = createResult.Errors
                    .Select(e => e.Description)
                    .ToArray();
                _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", errors));
                return BadRequest(ApiResponse<object>.ErrorResponse("Registration failed.", errors));
            }

            var roleResult = await _userManager.AddToRoleAsync(user, "User");
            if (!roleResult.Succeeded)
            {
                _logger.LogWarning("Failed to assign default role: {Errors}",
                    string.Join(", ", roleResult.Errors.Select(e => e.Description)));
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

            await _emailSender.SendEmailAsync(
                user.Email,
                "Confirm your registration",
                $@"<h3>Welcome!</h3>
                   <p>Click to confirm your email:</p>
                   <a href='{confirmationLink}' style='padding: 10px 20px; background-color: #4CAF50; 
                        color: white; text-decoration: none;'>Confirm email</a>
                ");

            return Ok(ApiResponse<object>.SuccessResponse(null, "Registration successful. Please check your email for confirmation."));
        }

        [HttpGet("confirmemail")]
        public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("User not found.", new[] { "No user with that ID." }));

            if (user.EmailConfirmed)
                return Ok(ApiResponse<object>.SuccessResponse(null, "Email is already confirmed."));

            var decodedToken = Uri.UnescapeDataString(token);
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
                return BadRequest(ApiResponse<object>.ErrorResponse("Email confirmation failed.", result.Errors.Select(e => e.Description).ToArray()));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Email successfully confirmed."));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            var user = await _context.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => model.Identifier.Contains("@")
                    ? u.Email == model.Identifier
                    : u.UserName == model.Identifier);

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                _logger.LogWarning("Login failed for: {Identifier}", model.Identifier);
                return Unauthorized(ApiResponse<object>.ErrorResponse("Invalid login credentials.", new[] { "Wrong username/email or password." }));
            }

            if (!user.EmailConfirmed)
            {
                return Unauthorized(ApiResponse<object>.ErrorResponse("Email not confirmed.", new[] { "You must confirm your email before logging in." }));
            }

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.GivenName, user.Profile?.FullName ?? string.Empty),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var roles = await _userManager.GetRolesAsync(user);
            foreach (var role in roles)
                claims.Add(new Claim(ClaimTypes.Role, role));

            // (Optional) include profile id claim to read later in services
            if (user.Profile != null)
                claims.Add(new Claim("profile_id", user.Profile.Id.ToString()));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:SecretKey"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds);

            return Ok(ApiResponse<string>.SuccessResponse(new JwtSecurityTokenHandler().WriteToken(token), "Login successful."));
        }

        // Handy endpoint to see your claims/roles (for debugging)
        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userName = User.Identity?.Name;
            var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
            return Ok(new { userId, userName, roles });
        }
    }
}
