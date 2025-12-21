using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Dtos;
using System.Net.Http.Json;
using Movie_BE.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly MovieDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly string _mlServiceUrl;
        private readonly IRedisCacheService _cache;
        private readonly ILogger<RecommendationController> _logger;

        public RecommendationController(
            MovieDbContext context,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IRedisCacheService cache,
            ILogger<RecommendationController> logger)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _mlServiceUrl = configuration["MLService:BaseUrl"] ?? "http://localhost:8001";
            _cache = cache;
            _logger = logger;
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetRecommendations(int userId, int top_n = 10)
        {
            var cacheKey = $"recommendations:user:{userId}:top:{top_n}";
            
            // Try cache first
            try
            {
                var cachedResult = await _cache.GetAsync<List<object>>(cacheKey);
                if (cachedResult != null && cachedResult.Count > 0)
                {
                    _logger.LogInformation("Recommendations for user {UserId} served from cache", userId);
                    return Ok(cachedResult);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get recommendations from cache for user {UserId}", userId);
            }

            try
            {
                // 🧠 Gọi FastAPI và deserialize thẳng vào model
                var response = await _httpClient.GetFromJsonAsync<RecommendationResponseDto>(
                    $"{_mlServiceUrl}/recommend/{userId}?top_n={top_n}"
                );

                if (response == null || response.Recommendations.Count == 0)
                    return NotFound("Không có gợi ý nào từ hệ thống AI.");

                var result = new List<object>();

                foreach (var item in response.Recommendations)
                {
                    int id = item.Id;

                    // Tìm trong Movies hoặc TvSeries
                    var movie = _context.Movies.FirstOrDefault(m => m.Id == id);
                    var tv = _context.TvSeries.FirstOrDefault(t => t.Id == id);

                    if (movie != null)
                    {
                        result.Add(new
                        {
                            id = movie.Id,
                            title = movie.Title,
                            poster = movie.PosterUrl,
                            backdrop = movie.BackdropUrl,
                            releaseDate = movie.ReleaseDate,
                            rating = movie.Rating,
                            type = "movie"
                        });
                    }
                    else if (tv != null)
                    {
                        result.Add(new
                        {
                            id = tv.Id,
                            title = tv.Title,
                            poster = tv.PosterUrl,
                            backdrop = tv.BackdropUrl,
                            releaseDate = tv.ReleaseDate,
                            rating = tv.Rating,
                            type = "tvseries"
                        });
                    }
                }

                // Cache recommendations for 30 minutes
                try
                {
                    await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
                    _logger.LogInformation("Recommendations for user {UserId} cached successfully", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cache recommendations for user {UserId}", userId);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Lỗi khi lấy danh sách gợi ý.",
                    details = ex.Message
                });
            }
        }

        [HttpGet("similar/{movieId}")]
        public async Task<IActionResult> GetSimilarMovies(int movieId, [FromQuery] int top_n = 10)
        {
            var cacheKey = $"recommendations:similar:{movieId}:top:{top_n}";
            
            // Try cache first
            try
            {
                var cachedResult = await _cache.GetAsync<List<object>>(cacheKey);
                if (cachedResult != null && cachedResult.Count > 0)
                {
                    _logger.LogInformation("Similar movies for movie {MovieId} served from cache", movieId);
                    return Ok(cachedResult);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get similar movies from cache for movie {MovieId}", movieId);
            }

            try
            {
                var response = await _httpClient.GetFromJsonAsync<SimilarResponseDto>(
                    $"{_mlServiceUrl}/similar/{movieId}?top_n={top_n}");

                if (response == null || response.Recommendations.Count == 0)
                    return NotFound("Không có phim tương tự nào.");

                var result = new List<object>();

                foreach (var item in response.Recommendations)
                {
                    int id = item.Id;
                    var movie = _context.Movies.FirstOrDefault(m => m.Id == id);
                    var tv = _context.TvSeries.FirstOrDefault(t => t.Id == id);

                    if (movie != null)
                    {
                        result.Add(new
                        {
                            id = movie.Id,
                            title = movie.Title,
                            poster = movie.PosterUrl,
                            backdrop = movie.BackdropUrl,
                            overview = movie.Overview,
                            releaseDate = movie.ReleaseDate,
                            studio = movie.Studio,
                            status = movie.Status,
                            rating = movie.Rating,
                            similarity = item.Similarity,
                            type = "movie"
                        });
                    }
                    else if (tv != null)
                    {
                        result.Add(new
                        {
                            id = tv.Id,
                            title = tv.Title,
                            poster = tv.PosterUrl,
                            backdrop = tv.BackdropUrl,
                            overview = tv.Overview,
                            releaseDate = tv.ReleaseDate,
                            studio = tv.Studio,
                            status = tv.Status,
                            rating = tv.Rating,
                            similarity = item.Similarity,
                            type = "tvseries"
                        });
                    }
                }

                // Cache similar movies for 30 minutes
                try
                {
                    await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
                    _logger.LogInformation("Similar movies for movie {MovieId} cached successfully", movieId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to cache similar movies for movie {MovieId}", movieId);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Không thể lấy phim tương tự.", details = ex.Message });
            }
        }


    }
}
