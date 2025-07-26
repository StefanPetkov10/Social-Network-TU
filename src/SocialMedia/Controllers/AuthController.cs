using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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
            var user = new ApplicationUser
            {
                UserName = model.UserName,
                Email = model.Email,
                FullName = model.FullName
            };

            if (await _userManager.FindByEmailAsync(model.Email) != null)
            {
                _logger.LogWarning("Attempt to register with existing email: {Email}", model.Email);
                return BadRequest(new { message = "Email already exists" });
            }

            if (await _userManager.FindByNameAsync(model.UserName) != null)
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var createResult = await _userManager.CreateAsync(user, model.Password);

            if (!createResult.Succeeded)
            {
                _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return BadRequest(createResult.Errors);
            }

            await _emailSender.SendEmailAsync(model.Email, "Welcome", "Thanks for registering!");

            _logger.LogInformation("User registered: {Email}", user.Email);
            return Ok(new { message = "Registration successful" });

        }


        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            ApplicationUser user = model.Identifier.Contains("@")
                ? await _userManager.FindByEmailAsync(model.Identifier)
                : await _userManager.FindByNameAsync(model.Identifier);

            if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
            {
                _logger.LogWarning("Login failed for: {Identifier}", model.Identifier);
                return Unauthorized();
            }

            var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
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
