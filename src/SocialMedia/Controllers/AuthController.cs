using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SocialMedia.Database.Models;
using SocialMedia.DTOs;
using SocialMedia.Service.Interfaces;

namespace SocialMedia.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _config;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthController> _logger;

        public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config, ILogger<AuthController> logger, IEmailSender emailSender)
        {
            _userManager = userManager;
            _config = config;
            _logger = logger;
            _emailSender = emailSender;
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            if (await _userManager.FindByEmailAsync(model.Email) != null)
            {
                _logger.LogWarning("Attempt to register with existing email: {Email}", model.Email);
                return BadRequest(new { message = "Email already exists" });
            }

            if (await _userManager.FindByNameAsync(model.UserName) != null)
            {
                _logger.LogWarning("Attempt to register with existing username: {UserName}", model.UserName);
                return BadRequest(new { message = "Username already exists" });
            }

            if (string.IsNullOrWhiteSpace(model.Email))
            {
                return StatusCode(500, "Email is required for confirmation.");
            }

            var user = new ApplicationUser
            {
                UserName = model.UserName,
                Email = model.Email,
            };

            user.Profile = new Profile
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                Age = model.Age,
                Sex = model.Sex
            };

            var createResult = await _userManager.CreateAsync(user, model.Password);

            if (!createResult.Succeeded)
            {
                _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return BadRequest(createResult.Errors);
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

            return Ok("Registration was successful. Please check your email for confirmation.");
        }


        [HttpGet("confirmemail")]
        public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return BadRequest("User does not exist.");

            if (user.EmailConfirmed)
            {
                _logger.LogInformation("Email already confirmed for user {Email}", user.Email);
                return Ok("Email is already confirmed.");
            }

            var decodedToken = Uri.UnescapeDataString(token);

            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);
            if (!result.Succeeded)
            {
                _logger.LogWarning("Email confirmation failed for user {Email}: {Errors}",
                    user.Email, string.Join(", ", result.Errors.Select(e => e.Description)));

                return BadRequest("The verification link is invalid or has expired.");
            }

            _logger.LogInformation("Email confirmed for user {Email}", user.Email);
            return Ok("Email was successfully verified. You can log in.");
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            ApplicationUser user = model.Identifier.Contains("@")
                ? await _userManager.FindByEmailAsync(model.Identifier)
                : await _userManager.FindByNameAsync(model.Identifier);

            if (!user.EmailConfirmed)
            {
                return Unauthorized("Email address not confirmed. Please check your email.");
            }

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                _logger.LogWarning("Login failed for: {Identifier}", model.Identifier);
                return Unauthorized();
            }

            var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Profile.FirstName),
            new Claim(ClaimTypes.GivenName, user.Profile.FullName),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
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

            _logger.LogInformation("Login successful for: {Email}", user.Email);
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }
    }
}
