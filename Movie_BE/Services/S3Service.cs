using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace backend.Services
{
    public class S3Service
    {
        private readonly IAmazonS3 _s3Client;
        private const string BucketName = "my-movie-app";
        private readonly string _cloudFrontDomain;

        public S3Service(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _cloudFrontDomain = configuration["AWS:CloudFrontDomain"]?.Trim().TrimEnd('/') ?? string.Empty;
        }

        private string BuildPublicUrl(string key)
        {
            if (!string.IsNullOrWhiteSpace(_cloudFrontDomain))
            {
                var domain = _cloudFrontDomain.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? _cloudFrontDomain
                    : $"https://{_cloudFrontDomain}";
                return $"{domain}/{key}";
            }
            return $"https://{BucketName}.s3.amazonaws.com/{key}";
        }

        public string RewriteToCdnUrl(string? existingUrl)
        {
            if (string.IsNullOrWhiteSpace(existingUrl)) return existingUrl ?? string.Empty;
            if (string.IsNullOrWhiteSpace(_cloudFrontDomain)) return existingUrl;

            try
            {
                // Normalize domain value
                var domain = _cloudFrontDomain.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? _cloudFrontDomain
                    : $"https://{_cloudFrontDomain}";

                // If already pointing to CloudFront, return as is
                if (existingUrl.Contains(new Uri(domain).Host, StringComparison.OrdinalIgnoreCase))
                {
                    return existingUrl;
                }

                // Handle common S3 URL formats
                // 1) https://{bucket}.s3.amazonaws.com/key
                // 2) https://s3.amazonaws.com/{bucket}/key
                // 3) https://{bucket}.s3.<region>.amazonaws.com/key

                var uri = new Uri(existingUrl);
                var host = uri.Host; // e.g., my-bucket.s3.amazonaws.com or s3.amazonaws.com

                string key;
                if (host.StartsWith($"{BucketName}.s3", StringComparison.OrdinalIgnoreCase))
                {
                    // Virtual-hosted–style URL
                    key = uri.AbsolutePath.TrimStart('/');
                }
                else if (host.StartsWith("s3", StringComparison.OrdinalIgnoreCase))
                {
                    // Path-style URL: first path segment is bucket
                    var path = uri.AbsolutePath.TrimStart('/');
                    if (path.StartsWith($"{BucketName}/", StringComparison.OrdinalIgnoreCase))
                    {
                        key = path.Substring(BucketName.Length + 1);
                    }
                    else
                    {
                        // Different bucket; best effort: keep original
                        return existingUrl;
                    }
                }
                else
                {
                    // Not an S3 URL; leave unchanged
                    return existingUrl;
                }

                return $"{domain}/{key}";
            }
            catch
            {
                return existingUrl;
            }
        }

        // Sửa đổi S3Service để tự động trả về CloudFront URL

        public async Task<string> UploadFileAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File không hợp lệ.");

            var fileName = file.FileName;
            var key = $"{folder}/{fileName}";
            var contentType = file.ContentType;

            using var stream = file.OpenReadStream();
            var request = new PutObjectRequest
            {
                BucketName = BucketName,
                Key = key,
                InputStream = stream,
                ContentType = contentType,
                //CannedACL = S3CannedACL.PublicRead
            };

            await _s3Client.PutObjectAsync(request);

            // Tự động trả về CloudFront URL thay vì S3 URL
            var s3Url = BuildPublicUrl(key);
            return RewriteToCdnUrl(s3Url);
        }

        public async Task<string> UploadHlsFolderAsync(string localFolderPath, string s3Folder)
        {
            if (string.IsNullOrEmpty(localFolderPath) || !Directory.Exists(localFolderPath))
                throw new ArgumentException("Thư mục nguồn không tồn tại.");

            s3Folder = s3Folder.TrimEnd('/');

            try
            {
                var files = Directory.GetFiles(localFolderPath, "*.*", SearchOption.TopDirectoryOnly);

                if (files.Length == 0)
                    throw new ArgumentException("Thư mục không chứa file nào.");

                foreach (var filePath in files)
                {
                    var fileName = Path.GetFileName(filePath);
                    var key = $"{s3Folder}/{fileName}";

                    using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                    var contentType = filePath.EndsWith(".m3u8") ? "application/x-mpegURL" : "video/mp2t";

                    var request = new PutObjectRequest
                    {
                        BucketName = BucketName,
                        Key = key,
                        InputStream = stream,
                        ContentType = contentType,
                        //CannedACL = S3CannedACL.PublicRead
                    };

                    await _s3Client.PutObjectAsync(request);
                }

                // Tự động trả về CloudFront URL cho master.m3u8
                var s3Url = BuildPublicUrl($"{s3Folder}/master.m3u8");
                return RewriteToCdnUrl(s3Url);
            }
            catch (Exception ex)
            {
                throw new Exception($"Lỗi khi upload thư mục lên S3: {ex.Message}");
            }
        }

    }
}