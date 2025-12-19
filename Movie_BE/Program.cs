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
using DotNetEnv;




var builder = WebApplication.CreateBuilder(args);

// Load .env file from the current directory (Movie_BE folder)
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

builder.Configuration.AddEnvironmentVariables();

// Manually replace environment variables in all configuration sections
// 1. Database Connection String
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(connectionString))
{
    connectionString = connectionString
        .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost")
        .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME") ?? "XCinema")
        .Replace("${DB_PORT}", Environment.GetEnvironmentVariable("DB_PORT") ?? "5432")
        .Replace("${DB_USER}", Environment.GetEnvironmentVariable("DB_USERNAME") ?? "postgres")
        .Replace("${DB_PASS}", Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "12345");

    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString;
}

// 2. JWT Configuration
var jwtKey = builder.Configuration["Jwt:Key"]?
    .Replace("${JWT_SECRET_KEY}", Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "");
var jwtRefreshKey = builder.Configuration["Jwt:RefreshKey"]?
    .Replace("${JWT_REFRESH}", Environment.GetEnvironmentVariable("JWT_REFRESH") ?? "");

if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32 || jwtKey.Contains("${"))
{
    jwtKey = "SuperSecretKey123!@#$%^&*()567890"; // 36 chars
    Console.WriteLine($"Warning: Using default JWT Key");
}
builder.Configuration["Jwt:Key"] = jwtKey;

if (string.IsNullOrEmpty(jwtRefreshKey) || jwtRefreshKey.Length < 32 || jwtRefreshKey.Contains("${"))
{
    jwtRefreshKey = "your-secret-key-for-refresh-token-12345678"; // 45 chars
    Console.WriteLine($"Warning: Using default JWT Refresh Key");
}
builder.Configuration["Jwt:RefreshKey"] = jwtRefreshKey;

// 3. AWS Configuration
builder.Configuration["AWS:Region"] = builder.Configuration["AWS:Region"]?
    .Replace("${AWS_REGION}", Environment.GetEnvironmentVariable("AWS_REGION") ?? "ap-northeast-1") ?? "ap-northeast-1";
builder.Configuration["AWS:AccessKey"] = builder.Configuration["AWS:AccessKey"]?
    .Replace("${AWS_ACCESS_KEY_ID}", Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID") ?? "") ?? "";
builder.Configuration["AWS:SecretKey"] = builder.Configuration["AWS:SecretKey"]?
    .Replace("${AWS_SECRET_KEY}", Environment.GetEnvironmentVariable("AWS_SECRET_KEY") ?? "") ?? "";
builder.Configuration["AWS:CloudFrontDomain"] = builder.Configuration["AWS:CloudFrontDomain"]?
    .Replace("${CLOUDFRONT_DOMAIN}", Environment.GetEnvironmentVariable("CLOUDFRONT_DOMAIN") ?? "") ?? "";

// 4. SMTP Configuration
builder.Configuration["Smtp:Host"] = builder.Configuration["Smtp:Host"]?
    .Replace("${SMTP_HOST}", Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com") ?? "smtp.gmail.com";
builder.Configuration["Smtp:Port"] = builder.Configuration["Smtp:Port"]?
    .Replace("${SMTP_PORT}", Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587") ?? "587";
builder.Configuration["Smtp:Username"] = builder.Configuration["Smtp:Username"]?
    .Replace("${SMTP_USERNAME}", Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? "") ?? "";
builder.Configuration["Smtp:Password"] = builder.Configuration["Smtp:Password"]?
    .Replace("${SMTP_PASSWORD}", Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "") ?? "";

// 5. Google Authentication
builder.Configuration["Authentication:Google:ClientId"] = builder.Configuration["Authentication:Google:ClientId"]?
    .Replace("${GOOGLE_CLIENT_ID}", Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? "") ?? "";
builder.Configuration["Authentication:Google:ClientSecret"] = builder.Configuration["Authentication:Google:ClientSecret"]?
    .Replace("${GOOGLE_CLIENT_SECRET}", Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET") ?? "") ?? "";

// 6. GitHub Authentication
builder.Configuration["Authentication:GitHub:ClientId"] = builder.Configuration["Authentication:GitHub:ClientId"]?
    .Replace("${GITHUB_CLIENT_ID}", Environment.GetEnvironmentVariable("GITHUB_CLIENT_ID") ?? "") ?? "";
builder.Configuration["Authentication:GitHub:ClientSecret"] = builder.Configuration["Authentication:GitHub:ClientSecret"]?
    .Replace("${GITHUB_CLIENT_SECRET}", Environment.GetEnvironmentVariable("GITHUB_CLIENT_SECRET") ?? "") ?? "";

// 7. ML Service Configuration
builder.Configuration["MLService:BaseUrl"] = builder.Configuration["MLService:BaseUrl"]?
    .Replace("${ML_SERVICE_URL}", Environment.GetEnvironmentVariable("ML_SERVICE_URL") ?? "http://localhost:8000") ?? "http://localhost:8000";

builder.Configuration["OpenAI:ApiKey"] = builder.Configuration["OpenAI:ApiKey"]?
    .Replace("${OPENAI_API_KEY}", Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? "") ?? "";

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
    options.CallbackPath = "/signin-google"; // Đường dẫn callback mặc định của Google
})
// Thêm GitHub Authentication (sử dụng OpenIdConnect hoặc phiên bản cũ tương thích)
.AddGitHub("GitHub", options =>
{
    options.ClientId = builder.Configuration["Authentication:GitHub:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:GitHub:ClientSecret"];
    options.CallbackPath = "/signin-github"; // Đường dẫn callback mặc định của GitHub
    options.Scope.Add("user:email"); // Yêu cầu email từ GitHub
    options.SignInScheme = IdentityConstants.ExternalScheme;
});

builder.Services.AddSignalR();
builder.Services.AddHostedService<WatchPartySchedulerService>();

// Thêm CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true);
    });
});


builder.Services.AddMemoryCache();

// Thêm MemoryCache
builder.Services.AddHttpClient();


var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.Headers["ngrok-skip-browser-warning"] = "true";
    await next();
});

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
app.UseCors("AllowAll");
app.MapHub<WatchPartyHub>("/watchpartyhub").RequireCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1"));
app.MapControllers();

app.Run();