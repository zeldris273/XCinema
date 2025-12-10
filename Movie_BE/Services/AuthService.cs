using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Net.Mail;
using System.Net;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;

namespace backend.Services
{
    public class AuthService
    {
        private readonly IConfiguration _config;
        private readonly IMemoryCache _cache;
        private readonly UserManager<CustomUser> _userManager;
        private readonly SignInManager<CustomUser> _signInManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;

        public AuthService(
            IConfiguration config,
            IMemoryCache cache,
            UserManager<CustomUser> userManager,
            SignInManager<CustomUser> signInManager,
            RoleManager<IdentityRole<int>> roleManager)
        {
            _config = config;
            _cache = cache;
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
        }

        public async Task<bool> RegisterUser(string email, string password, string role = "User")
        {
            var existingUser = await _userManager.FindByEmailAsync(email.Trim());
            if (existingUser != null)
                return false;

            var user = new CustomUser
            {
                UserName = email.Trim(),
                Email = email.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                // Kiểm tra và tạo role nếu chưa tồn tại
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole<int> { Name = role, NormalizedName = role.ToUpper() });
                }

                // Gán role cho user
                await _userManager.AddToRoleAsync(user, role);
                return true;
            }
            return false;
        }

        public async Task<CustomUser> ValidateUser(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email.Trim());
            if (user == null)
            {
                return null;
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
            if (result.Succeeded)
            {
                return user;
            }
            return null;
        }

        public async Task<string> GenerateJwtToken(CustomUser user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = roles.Contains("User") ? "User" : roles.FirstOrDefault();

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            if (!string.IsNullOrEmpty(primaryRole))
            {
                claims.Add(new Claim("role", primaryRole));
            }

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> GenerateRefreshToken(CustomUser user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:RefreshKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = roles.Contains("User") ? "User" : roles.FirstOrDefault();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };
            if (!string.IsNullOrEmpty(primaryRole))
            {
                claims.Add(new Claim(ClaimTypes.Role, primaryRole));
            }

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<CustomUser> ValidateRefreshToken(string refreshToken)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:RefreshKey"]);

            try
            {
                var principal = tokenHandler.ValidateToken(refreshToken, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _config["Jwt:Issuer"],
                    ValidAudience = _config["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                }, out SecurityToken validatedToken);

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return null;

                var user = await _userManager.FindByIdAsync(userIdClaim);
                return user;
            }
            catch
            {
                return null;
            }
        }

        private string GenerateOtp()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        public async Task<bool> SendOtp(string email)
        {
            email = email.Trim();
            if (string.IsNullOrEmpty(email)) return false;

            var otp = GenerateOtp();
            try
            {
                var smtpHost = _config["Smtp:Host"];
                var smtpPort = _config["Smtp:Port"];
                var smtpUsername = _config["Smtp:Username"];
                var smtpPassword = _config["Smtp:Password"];

                // Log để debug (chỉ trong development)
                Console.WriteLine($"[DEBUG] SMTP Host: {smtpHost}");
                Console.WriteLine($"[DEBUG] SMTP Port: {smtpPort}");
                Console.WriteLine($"[DEBUG] SMTP Username: {smtpUsername}");
                Console.WriteLine($"[DEBUG] Sending OTP to: {email}");

                if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpPort) || 
                    string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
                {
                    Console.WriteLine("[ERROR] SMTP configuration is missing!");
                    return false;
                }

                var smtpClient = new SmtpClient(smtpHost)
                {
                    Port = int.Parse(smtpPort),
                    Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(smtpUsername),
                    Subject = "Your OTP Code",
                    Body = $"Your OTP code is: {otp}. It is valid for 5 minutes.",
                };
                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);
                _cache.Set(email, (otp, DateTime.UtcNow.AddMinutes(5)), TimeSpan.FromMinutes(5));

                Console.WriteLine($"[SUCCESS] OTP sent successfully to {email}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to send OTP: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        public bool VerifyOtp(string email, string otp)
        {
            email = email.Trim();
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(otp)) return false;

            if (_cache.TryGetValue(email, out (string storedOtp, DateTime expires) stored) && DateTime.UtcNow <= stored.expires && stored.storedOtp == otp)
            {
                _cache.Remove(email);
                return true;
            }
            return false;
        }

        public async Task<bool> EmailExists(string email)
        {
            return await _userManager.FindByEmailAsync(email.Trim()) != null;
        }

        public async Task<bool> ResetPassword(string email, string newPassword)
        {
            var user = await _userManager.FindByEmailAsync(email.Trim());
            if (user == null)
                return false;

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            return result.Succeeded;
        }

        public async Task<CustomUser> HandleExternalLogin(string provider, ExternalLoginInfo info)
        {
            if (info == null)
                return null;

            // Tìm user dựa trên login provider và key
            var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            if (user != null)
            {
                await _signInManager.SignInAsync(user, isPersistent: false);
                return user;
            }

            // Tạo user mới nếu chưa tồn tại
            var email = info.Principal.FindFirst(ClaimTypes.Email)?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                user = await _userManager.FindByEmailAsync(email);
                if (user == null)
                {
                    user = new CustomUser
                    {
                        UserName = email,
                        Email = email,
                        EmailConfirmed = true // Giả sử email từ Google/GitHub đã xác thực
                    };
                    var result = await _userManager.CreateAsync(user);
                    if (result.Succeeded)
                    {
                        await _userManager.AddToRoleAsync(user, "User"); // Gán role mặc định
                        await _userManager.AddLoginAsync(user, info); // Liên kết login
                    }
                }
                else
                {
                    await _userManager.AddLoginAsync(user, info); // Liên kết login với user hiện có
                }
                await _signInManager.SignInAsync(user, isPersistent: false);
                return user;
            }
            return null;
        }

        public async Task<UpdateProfileResponseDTO?> UpdateUserProfile(int userId, UpdateProfileDTO updateProfileDto, string? avatarUrl = null)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return null;

            user.DisplayName = updateProfileDto.DisplayName;
            user.Gender = updateProfileDto.Gender;

            if (!string.IsNullOrEmpty(avatarUrl))
            {
                user.AvatarUrl = avatarUrl;
            }

            var result = await _userManager.UpdateAsync(user);
            if (result.Succeeded)
            {
                return new UpdateProfileResponseDTO
                {
                    Id = user.Id,
                    Email = user.Email,
                    DisplayName = user.DisplayName,
                    Gender = user.Gender,
                    AvatarUrl = user.AvatarUrl,
                    CreatedAt = user.CreatedAt
                };
            }
            return null;
        }

        public async Task<UpdateProfileResponseDTO?> GetUserProfile(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return null;

            return new UpdateProfileResponseDTO
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName ?? string.Empty,
                Gender = user.Gender ?? string.Empty,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt
            };
        }
    }
}