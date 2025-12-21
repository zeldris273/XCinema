using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using Movie_BE.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrendingController : ControllerBase
    {
        private readonly MovieDbContext _context;
        private readonly IRedisCacheService _cache;
        private readonly ILogger<TrendingController> _logger;

        public TrendingController(
            MovieDbContext context,
            IRedisCacheService cache,
            ILogger<TrendingController> logger)
        {
            _context = context;
            _cache = cache;
            _logger = logger;
        }

        // ✅ Trending All (Movie + TVSeries)
        [HttpGet("all")]
        public async Task<IActionResult> GetTrendingAll()
        {
            const string cacheKey = "trending:all";
            
            // Try to get from cache first
            try
            {
                var cachedResult = await _cache.GetAsync<object>(cacheKey);
                if (cachedResult != null)
                {
                    _logger.LogInformation("Trending data served from cache");
                    return Ok(cachedResult);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get trending from cache, falling back to database");
            }

            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            var trendingMovies = await _context.Movies
                .Select(m => new
                {
                    id = m.Id,
                    title = m.Title,
                    poster = m.PosterUrl,
                    backdrop = m.BackdropUrl,
                    rating = m.Rating,
                    numberOfRatings = m.NumberOfRatings,
                    type = "movie",
                    year = m.ReleaseDate.HasValue ? m.ReleaseDate.Value.Year : (int?)null,
                    views7Days = _context.ViewLogs
                        .Count(v => v.ContentType == "movie" && v.ContentId == m.Id && v.ViewedAt >= sevenDaysAgo)
                })
                .ToListAsync();

            var trendingTv = await _context.TvSeries
                .Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    poster = t.PosterUrl,
                    backdrop = t.BackdropUrl,
                    rating = t.Rating,
                    numberOfRatings = t.NumberOfRatings,
                    type = "tvseries",
                    year = t.ReleaseDate.HasValue ? t.ReleaseDate.Value.Year : (int?)null,
                    views7Days = _context.ViewLogs
                        .Count(v => v.ContentType == "tvseries" && v.ContentId == t.Id && v.ViewedAt >= sevenDaysAgo)
                })
                .ToListAsync();

            var combined = trendingMovies.Concat(trendingTv)
                .Select(x => new
                {
                    x.id,
                    x.title,
                    x.poster,
                    x.backdrop,
                    x.rating,
                    x.numberOfRatings,
                    x.type,
                    x.year,
                    x.views7Days,
                    trendingScore = (x.views7Days * 0.7m) + ((x.rating ?? 0) * (x.numberOfRatings ?? 0) * 0.3m)
                })
                .OrderByDescending(x => x.trendingScore)
                .Take(10)
                .ToList();

            // Cache the result for 15 minutes
            try
            {
                await _cache.SetAsync(cacheKey, combined, TimeSpan.FromMinutes(15));
                _logger.LogInformation("Trending data cached successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cache trending data");
            }

            return Ok(combined);
        }
    }
}