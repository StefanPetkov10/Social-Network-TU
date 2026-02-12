using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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
using SocialMedia.Extensions;
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
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            var validationResult = await _registerValidator.ValidateAsync(model);
            if (!validationResult.IsValid)
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed.", validationResult.Errors.Select(e => e.ErrorMessage).ToArray()));

            model.Email = model.Email.Trim().ToLowerInvariant();
            model.UserName = model.UserName.Trim();

            if (await _userManager.FindByNameAsync(model.UserName) != null)
                return BadRequest(ApiResponse<object>.ErrorResponse("Username taken.", new[] { "Username is already in use." }));

            if (await _userManager.FindByEmailAsync(model.Email) != null)
                return BadRequest(ApiResponse<object>.ErrorResponse("Email taken.", new[] { "Email is already in use." }));

            var user = _mapper.Map<ApplicationUser>(model);

            try
            {
                var dob = new DateTime(model.BirthYear, model.BirthMonth, model.BirthDay);
                user.Profile.DateOfBirth = DateTime.SpecifyKind(dob, DateTimeKind.Utc);
            }
            catch
            {
                return BadRequest(ApiResponse<object>.ErrorResponse("Date of birth invalid.", new[] { "Provide a valid date." }));
            }

            var createResult = await _userManager.CreateAsync(user, model.Password);
            if (!createResult.Succeeded)
            {
                var errors = createResult.Errors.Select(e => e.Description).ToArray();
                _logger.LogWarning("Registration failed: {Errors}", string.Join(", ", errors));
                return BadRequest(ApiResponse<object>.ErrorResponse("Registration failed.", errors));
            }

            var roleResult = await _userManager.AddToRoleAsync(user, "User");
            if (!roleResult.Succeeded)
                _logger.LogWarning("Failed to add default role: {Errors}", string.Join(", ", roleResult.Errors.Select(e => e.Description)));

            await SendConfirmationEmail(user);

            return Ok(ApiResponse<object>.SuccessResponse(null, "Registration successful. Please check your email to confirm your address."));
        }


        [HttpGet("confirmemail")]
        public async Task<IActionResult> ConfirmEmail(Guid userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("User not found.", new[] { "No user with that ID." }));

            if (user.EmailConfirmed)
                return Ok(ApiResponse<object>.SuccessResponse(null, "Email is already confirmed."));

            var decodedToken = TokenHelper.DecodeToken(token);
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded)
                return BadRequest(ApiResponse<object>.ErrorResponse("Confirmation failed.", result.Errors.Select(e => e.Description).ToArray()));

            return Ok(ApiResponse<object>.SuccessResponse(null, "Email confirmed successfully."));
        }

        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation([FromBody] RequestOtpDto model)
        {
            if (string.IsNullOrWhiteSpace(model?.Email))
                return BadRequest(ApiResponse<object>.ErrorResponse("Email is required."));

            var normalizedEmail = model.Email.Trim().ToLowerInvariant();

            var user = await _userManager.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("If this email is registered and not confirmed, you will receive a confirmation link."));

            if (user.EmailConfirmed)
                return BadRequest(ApiResponse<object>.ErrorResponse("If this email is registered and not confirmed, you will receive a confirmation link."));

            var timeSinceRegistration = DateTime.UtcNow - user.Profile.CreatedDate;
            if (timeSinceRegistration.TotalHours > 24)
            {
                _logger.LogWarning("Resend confirmation attempted for old registration: {Email}, registered at {CreatedAt}",
                    user.Email, user.Profile.CreatedDate);
                return BadRequest(ApiResponse<object>.ErrorResponse("Confirmation link expired. Please register again."));
            }

            // Rate limiting: todo
            var resendCount = await _userManager.GetAccessFailedCountAsync(user);
            if (resendCount > 5)
            {
                _logger.LogWarning("Too many resend attempts for email: {Email}", user.Email);
                return BadRequest(ApiResponse<object>.ErrorResponse("Too many resend attempts. Please try again later."));
            }

            try
            {
                await SendConfirmationEmail(user);

                await _userManager.AccessFailedAsync(user);

                _logger.LogInformation("Confirmation email resent for user: {Email}", user.Email);
                return Ok(ApiResponse<object>.SuccessResponse(null, "Confirmation email resent."));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resend confirmation email for user: {Email}", user.Email);
                return BadRequest(ApiResponse<object>.ErrorResponse("Failed to resend confirmation email. Please try again."));
            }
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

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            _logger.LogInformation("User {UserName} logged in successfully.", user.UserName);

            return Ok(ApiResponse<string>.SuccessResponse(jwt, "Login successful."));
        }

        [HttpPost("request-otp")]
        public async Task<IActionResult> RequestOtp([FromBody] RequestOtpDto model)
        {
            if (string.IsNullOrWhiteSpace(model?.Email))
                return Ok(ApiResponse<object>.SuccessResponse(null, "If this email is registered, you will receive a code."));

            var email = model.Email.Trim().ToLowerInvariant();
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Ok(ApiResponse<object>.SuccessResponse(null, "If this email is registered, you will receive a code."));

            var oneHourAgo = DateTime.UtcNow.AddHours(-1);
            var recent = await _context.EmailOtpCodes
                .Where(x => x.UserId == user.Id && x.CreatedAt >= oneHourAgo)
                .CountAsync();
            if (recent >= 5)
                return BadRequest(ApiResponse<object>.ErrorResponse("Too many requests. Try later."));

            var old = _context.EmailOtpCodes.Where(x => x.UserId == user.Id && x.CreatedAt < DateTime.UtcNow.AddMinutes(-30));
            _context.EmailOtpCodes.RemoveRange(old);

            var code = OtpHelper.GenerateOtp();
            var secret = _config["Otp:Secret"] ?? throw new InvalidOperationException("Otp secret missing");
            var codeHash = OtpHelper.HmacHash(code, secret);

            var otp = new EmailOtpCode
            {
                UserId = user.Id,
                CodeHash = codeHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow
            };
            await _context.EmailOtpCodes.AddAsync(otp);

            var rawIdentityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedIdentity = TokenHelper.EncodeToken(rawIdentityToken);

            var rawSessionToken = OtpHelper.GenerateSessionToken();
            var sessionHash = OtpHelper.HmacHash(rawSessionToken, secret);

            var session = new PasswordResetSession
            {
                UserId = user.Id,
                SessionTokenHash = sessionHash,
                EncodedIdentityToken = encodedIdentity,
                IsVerified = false,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            };
            await _context.PasswordResetSessions.AddAsync(session);
            await _context.SaveChangesAsync();

            var frontendUrl = _config["FrontendUrl"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";
            var link = $"{frontendUrl}/auth/forgot-password-otp?sessionToken={Uri.EscapeDataString(rawSessionToken)}";

            var html = $@"<p>Your password reset code: <strong>{code}</strong></p>
                  <p>Or open this page: <a href='{link}'>Reset password</a></p>
                  <p>Valid for 10 minutes.</p>";
            await _emailSender.SendEmailAsync(user.Email, "Your password reset code", html);


            var responseData = new
            {
                sessionToken = rawSessionToken
            };

            return Ok(ApiResponse<object>.SuccessResponse(responseData, "If this email is registered, you will receive a code."));
        }


        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto model)
        {
            if (string.IsNullOrWhiteSpace(model?.SessionToken))
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid session"));

            var secret = _config["Otp:Secret"] ?? throw new InvalidOperationException("Otp secret missing");
            var sessionHash = OtpHelper.HmacHash(model.SessionToken, secret);

            var session = await _context.PasswordResetSessions
                .FirstOrDefaultAsync(x => x.SessionTokenHash == sessionHash);

            if (session == null || session.IsUsed || session.IsVerified || session.ExpiresAt < DateTime.UtcNow)
                return BadRequest(ApiResponse<object>.ErrorResponse("Session expired. Please request a new reset link."));

            if ((DateTime.UtcNow - session.CreatedAt).TotalSeconds < 30)
                return BadRequest(ApiResponse<object>.ErrorResponse("Please wait before requesting a new code."));

            var user = await _userManager.FindByIdAsync(session.UserId.ToString());
            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("User not found"));

            var oldOtps = _context.EmailOtpCodes.Where(x => x.UserId == user.Id && x.CreatedAt < DateTime.UtcNow.AddMinutes(-30));
            _context.EmailOtpCodes.RemoveRange(oldOtps);

            var code = OtpHelper.GenerateOtp();
            var codeHash = OtpHelper.HmacHash(code, secret);

            var otp = new EmailOtpCode
            {
                UserId = user.Id,
                CodeHash = codeHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                CreatedAt = DateTime.UtcNow
            };
            await _context.EmailOtpCodes.AddAsync(otp);

            await _context.SaveChangesAsync();

            var html = @$"<p>Your new password reset code: <strong>{code}</strong></p>
                  <p>Valid for 10 minutes.</p>";
            await _emailSender.SendEmailAsync(user.Email, "Your new password reset code", html);

            return Ok(ApiResponse<object>.SuccessResponse(null, "New code sent."));
        }


        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto model)
        {
            if (string.IsNullOrWhiteSpace(model?.SessionToken) || string.IsNullOrWhiteSpace(model?.Code))
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid request"));

            var secret = _config["Otp:Secret"]!;
            var sessionHash = OtpHelper.HmacHash(model.SessionToken, secret);

            var session = await _context.PasswordResetSessions
                .Where(s => s.SessionTokenHash == sessionHash)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (session == null || session.IsUsed || session.IsVerified || session.ExpiresAt < DateTime.UtcNow)
                return BadRequest(ApiResponse<object>.ErrorResponse("Session expired. Please request a new reset link."));

            var user = await _userManager.FindByIdAsync(session.UserId.ToString());
            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("User not found"));

            var otp = await _context.EmailOtpCodes
                .Where(x => x.UserId == user.Id && !x.IsUsed)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (otp == null) return Unauthorized(ApiResponse<object>.ErrorResponse("No active OTP"));

            if (otp.FailedAttempts >= 5)
                return Unauthorized(ApiResponse<object>.ErrorResponse("OTP blocked"));

            if (DateTime.UtcNow > otp.ExpiresAt)
                return Unauthorized(ApiResponse<object>.ErrorResponse("OTP expired"));

            if (OtpHelper.HmacHash(model.Code, secret) != otp.CodeHash)
            {
                otp.FailedAttempts++;
                await _context.SaveChangesAsync();
                return Unauthorized(ApiResponse<object>.ErrorResponse("Incorrect code"));
            }

            otp.IsUsed = true;
            session.IsVerified = true;
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null, "OTP verified"));
        }


        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordWithSessionDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid request."));
            if (string.IsNullOrWhiteSpace(dto.SessionToken) ||
                string.IsNullOrWhiteSpace(dto.NewPassword) ||
                dto.NewPassword != dto.ConfirmNewPassword)
                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed.", new[] { "Invalid data or passwords do not match." }));

            var secret = _config["Otp:Secret"]!;
            var sessionHash = OtpHelper.HmacHash(dto.SessionToken, secret);

            var session = await _context.PasswordResetSessions
                .Where(s => s.SessionTokenHash == sessionHash)
                .FirstOrDefaultAsync();

            if (session == null || !session.IsVerified || session.IsUsed || DateTime.UtcNow > session.ExpiresAt)
                return BadRequest(ApiResponse<object>.ErrorResponse("Invalid or expired session."));

            var user = await _userManager.FindByIdAsync(session.UserId.ToString());
            if (user == null)
                return BadRequest(ApiResponse<object>.ErrorResponse("User not found."));

            var decodedIdentityToken = TokenHelper.DecodeToken(session.EncodedIdentityToken);
            var result = await _userManager.ResetPasswordAsync(user, decodedIdentityToken, dto.NewPassword);

            if (!result.Succeeded)
            {
                var errorMessages = result.Errors.Select(e => e.Description).ToList();

                return BadRequest(ApiResponse<object>.ErrorResponse("Validation failed", errorMessages.ToArray()));
            }

            session.IsUsed = true;
            await _context.SaveChangesAsync();

            var otherOtps = _context.EmailOtpCodes.Where(x => x.UserId == session.UserId);
            _context.EmailOtpCodes.RemoveRange(otherOtps);
            var otherSessions = _context.PasswordResetSessions.Where(s => s.UserId == session.UserId && !s.IsUsed);
            _context.PasswordResetSessions.RemoveRange(otherSessions);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null, "Password reset successfully."));
        }


        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userName = User.Identity?.Name;
            var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();
            return Ok(new { userId, userName, roles });
        }

        private async Task SendConfirmationEmail(ApplicationUser user)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user));

            if (user.Profile == null)
            {
                _logger.LogError("User profile is null for user {UserId}", user.Id);
                throw new InvalidOperationException("User profile is not available.");
            }

            var rawToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encoded = TokenHelper.EncodeToken(rawToken);

            var frontendUrl = _config["FrontendUrl"]?.TrimEnd('/');
            if (string.IsNullOrEmpty(frontendUrl))
            {
                _logger.LogError("FrontendUrl configuration is missing");
                throw new InvalidOperationException("FrontendUrl is not configured.");
            }

            var confirmationLink = $"{frontendUrl}/auth/email-confirmed?userId={Uri.EscapeDataString(user.Id.ToString())}&token={Uri.EscapeDataString(encoded)}";

            _logger.LogInformation("Confirmation link generated for user {User}: {Link}", user.Email, confirmationLink);

            var firstName = user.Profile.FirstName ?? "User";

            var html = $@"<p>Hello {firstName},</p>
              <p>Confirm your email by clicking the button below:</p>
              <a href='{confirmationLink}' style='display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;'>Confirm email</a>
              <p>If you didn't request this, please ignore this email.</p>
              <p><small>This link will expire in 24 hours.</small></p>";

            await _emailSender.SendEmailAsync(user.Email, "Confirm your account", html);
        }

    }
}
