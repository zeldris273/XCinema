using Amazon.S3;
using backend.Data;
using backend.Hubs;
using backend.Services;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.AspNetCore.Server.IISIntegration;
using Microsoft.AspNetCore.Http.Features;
using Movie_BE.Services;
using Microsoft.AspNetCore.Identity;
using backend.Models;
using System.IdentityModel.Tokens.Jwt;



var builder = WebApplication.CreateBuilder(args);

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
JwtSecurityTokenHandler.DefaultOutboundClaimTypeMap.Clear();

// Tăng giới hạn kích thước request body (2GB)
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 1024L * 1024 * 2048; // 2GB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 1024L * 1024 * 2048; // 2GB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(15);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(15);
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 1024L * 1024 * 2048; // 2GB
});

// Thêm dịch vụ controllers
builder.Services.AddControllers();

// Thêm Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Movie API", Version = "v1" });
    c.OperationFilter<SwaggerFileUploadOperationFilter>();
});

// Add DbContext with PostgreSQL
builder.Services.AddDbContext<MovieDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Thêm Identity
builder.Services.AddIdentity<CustomUser, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<MovieDbContext>()
.AddDefaultTokenProviders();

// Đăng ký AuthService
builder.Services.AddScoped<AuthService>();

// Đăng ký S3Service và IAmazonS3
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var s3Config = new AmazonS3Config
    {
        RegionEndpoint = Amazon.RegionEndpoint.APNortheast1 // ap-northeast-1 (Tokyo)
    };
    return new AmazonS3Client(
        builder.Configuration["AWS:AccessKey"],
        builder.Configuration["AWS:SecretKey"],
        s3Config);
});

builder.Services.AddScoped<S3Service>();

// Đăng ký MovieChatbotSearchService
builder.Services.AddSingleton<MovieChatbotSearchService>();
builder.Services.AddSingleton<RoomService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ILikeService, LikeService>();


// Thêm cấu hình xác thực JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = IdentityConstants.ExternalScheme; // Hỗ trợ external login
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
})
// Thêm Google Authentication (sử dụng phiên bản tương thích với .NET 8.0, ví dụ 8.0.10)
.AddGoogle("Google", options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    options.SignInScheme = IdentityConstants.ExternalScheme;
    options.CallbackPath = "/signin-google"; // Đường dẫn callback
})
// Thêm GitHub Authentication (sử dụng OpenIdConnect hoặc phiên bản cũ tương thích)
.AddGitHub("GitHub", options =>
{
    options.ClientId = builder.Configuration["Authentication:GitHub:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:GitHub:ClientSecret"];
    options.CallbackPath = "/signin-github"; // Đường dẫn callback
    options.Scope.Add("user:email"); // Yêu cầu email từ GitHub
    options.SignInScheme = IdentityConstants.ExternalScheme;
});

builder.Services.AddSignalR();
builder.Services.AddHostedService<WatchPartySchedulerService>();

// Thêm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://localhost:5116")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

builder.Services.AddMemoryCache();

// Thêm MemoryCache
builder.Services.AddHttpClient();


var app = builder.Build();

// 1. Thêm vào Program.cs để debug roles
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();
    var userManager = services.GetRequiredService<UserManager<CustomUser>>();

    // Tạo roles
    var roles = new[] { "Admin", "User" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            var result = await roleManager.CreateAsync(new IdentityRole<int> { Name = role, NormalizedName = role.ToUpper() });
        }
    }
}

// Middleware pipeline
app.UseRouting();
// CORS must be placed after UseRouting and before auth
app.UseCors("AllowFrontend");
app.MapHub<WatchPartyHub>("/watchpartyhub").RequireCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1"));
app.MapControllers();

app.Run();