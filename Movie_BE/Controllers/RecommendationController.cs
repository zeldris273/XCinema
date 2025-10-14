using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Dtos;
using System.Net.Http.Json;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationController : ControllerBase
    {
        private readonly MovieDbContext _context;
        private readonly HttpClient _httpClient;

        public RecommendationController(MovieDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetRecommendations(int userId, int top_n = 10)
        {
            try
            {
                // 🧠 Gọi FastAPI và deserialize thẳng vào model
                var response = await _httpClient.GetFromJsonAsync<RecommendationResponseDto>(
                    $"http://localhost:8001/recommend/{userId}?top_n={top_n}"
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

        // ✅ Gợi ý phim tương tự với phim đang xem
        [HttpGet("similar/{movieId}")]
        public async Task<IActionResult> GetSimilarMovies(int movieId, [FromQuery] int top_n = 10)
        {
            try
            {
                string url = $"http://localhost:8001/similar/{movieId}?top_n={top_n}";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());

                var json = await response.Content.ReadAsStringAsync();
                return Content(json, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Không thể kết nối đến FastAPI service", details = ex.Message });
            }
        }
    }
}
