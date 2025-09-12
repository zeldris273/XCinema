using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrendingController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public TrendingController(MovieDbContext context)
        {
            _context = context;
        }

        // ✅ Trending Movies
        [HttpGet("movies")]
        public async Task<IActionResult> GetTrendingMovies()
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            var trending = await _context.Movies
                .Select(m => new
                {
                    id = m.Id,
                    title = m.Title,
                    poster = m.PosterUrl,
                    backdrop = m.BackdropUrl,
                    rating = m.Rating,
                    numberOfRatings = m.NumberOfRatings,
                    type = "movie",
                    year = m.ReleaseDate.HasValue ? m.ReleaseDate.Value.Year : (int?)null, // ✅ chỉ lấy năm
                    views7Days = _context.ViewLogs
                        .Count(v => v.ContentType == "movie" && v.ContentId == m.Id && v.ViewedAt >= sevenDaysAgo)
                })
                .Select(m => new
                {
                    m.id,
                    m.title,
                    m.poster,
                    m.backdrop,
                    m.rating,
                    m.numberOfRatings,
                    m.type,
                    m.year,
                    m.views7Days,
                    trendingScore = (m.views7Days * 0.7m) + ((m.rating ?? 0) * (m.numberOfRatings ?? 0) * 0.3m)
                })
                .OrderByDescending(m => m.trendingScore)
                .Take(10)
                .ToListAsync();

            return Ok(trending);
        }

        // ✅ Trending TV Series
        [HttpGet("tvseries")]
        public async Task<IActionResult> GetTrendingTvSeries()
        {
            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

            var trending = await _context.TvSeries
                .Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    poster = t.PosterUrl,
                    backdrop = t.BackdropUrl,
                    rating = t.Rating,
                    numberOfRatings = t.NumberOfRatings,
                    type = "tvseries",
                    year = t.ReleaseDate.HasValue ? t.ReleaseDate.Value.Year : (int?)null, // ✅ chỉ lấy năm
                    views7Days = _context.ViewLogs
                        .Count(v => v.ContentType == "tvseries" && v.ContentId == t.Id && v.ViewedAt >= sevenDaysAgo)
                })
                .Select(t => new
                {
                    t.id,
                    t.title,
                    t.poster,
                    t.backdrop,
                    t.rating,
                    t.numberOfRatings,
                    t.type,
                    t.year,
                    t.views7Days,
                    trendingScore = (t.views7Days * 0.7m) + ((t.rating ?? 0) * (t.numberOfRatings ?? 0) * 0.3m)
                })
                .OrderByDescending(t => t.trendingScore)
                .Take(10)
                .ToListAsync();

            return Ok(trending);
        }

        // ✅ Trending All (Movie + TVSeries)
        [HttpGet("all")]
        public async Task<IActionResult> GetTrendingAll()
        {
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

            return Ok(combined);
        }
    }
}
