using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Hosting;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly UserManager<CustomUser> _userManager;
        private readonly SignInManager<CustomUser> _signInManager;
        private readonly IWebHostEnvironment _env;
        private readonly S3Service _s3Service;
        private readonly IConfiguration _configuration;

        public AuthController(
            AuthService authService, 
            UserManager<CustomUser> userManager, 
            SignInManager<CustomUser> signInManager, 
            IWebHostEnvironment env, 
            S3Service s3Service,
            IConfiguration configuration)
        {
            _signInManager = signInManager;
            _authService = authService;
            _userManager = userManager;
            _env = env;
            _s3Service = s3Service;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _authService.ValidateUser(request.Email, request.Password);
            if (user == null)
                return Unauthorized("Invalid credentials");

            var accessToken = await _authService.GenerateJwtToken(user); // Sử dụng await
            var refreshToken = await _authService.GenerateRefreshToken(user); // Sử dụng await

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Domain = null,
                Path = "/"
            };
            Response.Cookies.Append("RefreshToken", refreshToken, cookieOptions);

            return Ok(new { accessToken = accessToken });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Append("RefreshToken", "", new CookieOptions
            {
                Expires = DateTime.UtcNow.AddDays(-1),
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Path = "/"
            });

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("email-exists")]
        public async Task<bool> EmailExists(string email)
        {
            return await _userManager.Users.AnyAsync(u => u.Email == email);
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
                return BadRequest("Invalid email format");

            var exists = await _authService.EmailExists(request.Email);
            if (exists)
                return BadRequest("Email already registered");

            var otpSent = await _authService.SendOtp(request.Email);
            if (!otpSent)
                return BadRequest("Failed to send OTP");

            return Ok("OTP sent to your email. Please verify to complete registration.");
        }


        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            var success = await _authService.SendOtp(request.Email);
            if (!success)
                return BadRequest("Failed to send OTP");

            return Ok("OTP sent successfully");
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var isValid = _authService.VerifyOtp(request.Email, request.Otp);
            if (!isValid)
                return BadRequest("Invalid OTP");

            var success = await _authService.RegisterUser(request.Email, request.Password);
            if (!success)
                return BadRequest("Email already exists");

            return Ok("User registered successfully");
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            if (!Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                return Unauthorized("Refresh token not found");

            var user = await _authService.ValidateRefreshToken(refreshToken);
            if (user == null)
                return Unauthorized("Invalid or expired refresh token");

            var newAccessToken = await _authService.GenerateJwtToken(user);
            var newRefreshToken = await _authService.GenerateRefreshToken(user);


            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Domain = null,
                Path = "/"
            };

            Response.Cookies.Append("RefreshToken", newRefreshToken, cookieOptions);

            return Ok(new { accessToken = newAccessToken });
        }

        // API để yêu cầu đặt lại mật khẩu
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            var emailExists = await _authService.EmailExists(request.Email);
            if (!emailExists)
                return BadRequest("Email does not exist");

            var success = await _authService.SendOtp(request.Email);
            if (!success)
                return BadRequest("Failed to send OTP");

            return Ok("OTP sent to your email. Please verify to reset your password.");
        }

        // API để xác minh OTP và đặt lại mật khẩu
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var isValid = _authService.VerifyOtp(request.Email, request.Otp);
            if (!isValid)
                return BadRequest("Invalid OTP");

            var success = await _authService.ResetPassword(request.Email, request.Password);
            if (!success)
                return BadRequest("Failed to reset password");

            return Ok("Password reset successfully");
        }

        // Khởi động đăng nhập Google
        [HttpGet("login/google")]
        public IActionResult LoginWithGoogle(string returnUrl = null)
        {
            var redirectUrl = Url.Action("GoogleCallback", "Auth", new { returnUrl = returnUrl }, Request.Scheme);
            var properties = _signInManager.ConfigureExternalAuthenticationProperties("Google", redirectUrl);
            return Challenge(properties, "Google");
        }

        // Khởi động đăng nhập GitHub
        [HttpGet("login/github")]
        public IActionResult LoginWithGitHub(string returnUrl = null)
        {
            var redirectUrl = Url.Action("GitHubCallback", "Auth", new { returnUrl = returnUrl }, Request.Scheme);
            var properties = _signInManager.ConfigureExternalAuthenticationProperties("GitHub", redirectUrl);
            return Challenge(properties, "GitHub");
        }

        // Xử lý callback từ Google
        [HttpGet("google-callback")]
        public async Task<IActionResult> GoogleCallback(string returnUrl = null)
        {
            return await HandleExternalLoginCallback("Google", returnUrl);
        }

        // Xử lý callback từ GitHub
        [HttpGet("github-callback")]
        public async Task<IActionResult> GitHubCallback(string returnUrl = null)
        {
            return await HandleExternalLoginCallback("GitHub", returnUrl);
        }

        // Logic xử lý chung cho external login
        private async Task<IActionResult> HandleExternalLoginCallback(string provider, string returnUrl = null)
        {
            var info = await _signInManager.GetExternalLoginInfoAsync();
            if (info == null)
                return Unauthorized("External login information not found.");

            var user = await _authService.HandleExternalLogin(provider, info);
            if (user == null)
                return Unauthorized("External login failed.");

            var accessToken = await _authService.GenerateJwtToken(user);
            var refreshToken = await _authService.GenerateRefreshToken(user);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None,
                Domain = null,
                Path = "/"
            };
            Response.Cookies.Append("RefreshToken", refreshToken, cookieOptions);

            // Chuyển hướng về frontend với token và returnUrl
            string frontendUrl = _configuration["Frontend:Url"] ?? "http://localhost";
            var redirectUrl = $"{frontendUrl}/auth?token={Uri.EscapeDataString(accessToken)}";

            if (!string.IsNullOrEmpty(returnUrl))
            {
                redirectUrl += $"&returnUrl={Uri.EscapeDataString(returnUrl)}";
            }

            return Redirect(redirectUrl);
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Invalid user");

            var profile = await _authService.GetUserProfile(userId);
            if (profile == null)
                return NotFound("User not found");

            return Ok(profile);
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDTO updateProfileDto, IFormFile? avatar)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Invalid user");

            string? avatarUrl = null;

            // Upload avatar nếu có
            if (avatar != null && avatar.Length > 0)
            {
                try
                {
                    avatarUrl = await _s3Service.UploadFileAsync(avatar, "avatars");
                }
                catch (Exception ex)
                {
                    return BadRequest($"Failed to upload avatar: {ex.Message}");
                }
            }

            var result = await _authService.UpdateUserProfile(userId, updateProfileDto, avatarUrl);
            if (result == null)
                return BadRequest("Failed to update profile");

            return Ok(result);
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class SendOtpRequest
    {
        public string Email { get; set; }
    }

    public class VerifyOtpRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string Otp { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; }
    }

    // Thêm DTO cho quên mật khẩu
    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string Email { get; set; }
        public string Otp { get; set; }
        public string Password { get; set; }
    }
}