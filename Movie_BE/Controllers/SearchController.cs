using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public SearchController(MovieDbContext context)
        {
            _context = context;
        }

        [HttpGet("all")]
        public async Task<IActionResult> SearchAll(
     [FromQuery] string? query,
     [FromQuery] string? genre,
     [FromQuery] int? year,
     [FromQuery] double? minRating)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) && genre == null && year == null && minRating == null)
                {
                    return BadRequest(new { message = "Vui lòng nhập từ khóa hoặc chọn bộ lọc." });
                }

                // Movies
                var movies = _context.Movies.AsQueryable();
                if (!string.IsNullOrEmpty(query))
                {
                    var normalized = query.Trim();
                    // Build prefix tsquery (e.g., "sol:* & level:*"), enabling partial term matches
                    var terms = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                          .Select(t => t + ":*");
                    var tsQueryString = string.Join(" & ", terms);

                    movies = movies.Where(m =>
                        EF.Functions.ToTsVector("english", (m.Title ?? string.Empty) + " " + (m.Overview ?? string.Empty))
                            .Matches(EF.Functions.ToTsQuery("english", tsQueryString)));
                }
                if (!string.IsNullOrEmpty(genre))
                {
                    movies = movies
                        .Include(m => m.MovieGenres)
                        .ThenInclude(mg => mg.Genre)
                        .Where(m => m.MovieGenres.Any(mg => mg.Genre.Name.ToLower().Contains(genre.ToLower())));
                }

                if (year.HasValue)
                    movies = movies.Where(m => m.ReleaseDate.HasValue && m.ReleaseDate.Value.Year == year.Value);
                if (minRating.HasValue)
                    movies = movies.Where(m => m.Rating >= (decimal)minRating.Value);

                var moviesQuery = movies.Select(m => new SearchResultDTO
                {
                    Id = m.Id,
                    Type = "Movie",
                    Title = m.Title,
                    ReleaseDate = m.ReleaseDate,
                    Rating = (double?)m.Rating,
                    PosterUrl = m.PosterUrl,
                    BackdropUrl = m.BackdropUrl
                });

                // TV Series
                var tv = _context.TvSeries.AsQueryable();
                if (!string.IsNullOrEmpty(query))
                {
                    var normalized = query.Trim();
                    var terms = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                          .Select(t => t + ":*");
                    var tsQueryString = string.Join(" & ", terms);

                    tv = tv.Where(t =>
                        EF.Functions.ToTsVector("english", (t.Title ?? string.Empty) + " " + (t.Overview ?? string.Empty))
                            .Matches(EF.Functions.ToTsQuery("english", tsQueryString)));
                }
                if (!string.IsNullOrEmpty(genre))
                {
                    tv = tv
                        .Include(t => t.TvSeriesGenres)
                        .ThenInclude(tg => tg.Genre)
                        .Where(t => t.TvSeriesGenres.Any(tg => tg.Genre.Name.ToLower().Contains(genre.ToLower())));
                }

                if (year.HasValue)
                    tv = tv.Where(t => t.ReleaseDate.HasValue && t.ReleaseDate.Value.Year == year.Value);
                if (minRating.HasValue)
                    tv = tv.Where(t => t.Rating >= (decimal)minRating.Value);

                var tvSeriesQuery = tv.Select(t => new SearchResultDTO
                {
                    Id = t.Id,
                    Type = "TvSeries",
                    Title = t.Title,
                    ReleaseDate = t.ReleaseDate,
                    Rating = (double?)t.Rating,
                    PosterUrl = t.PosterUrl,
                    BackdropUrl = t.BackdropUrl
                });

                // Gộp lại
                var results = await moviesQuery.Concat(tvSeriesQuery)
                    .OrderByDescending(r => r.Rating)
                    .ToListAsync();

                if (!results.Any())
                    return NotFound(new { message = "Không tìm thấy kết quả phù hợp." });

                return Ok(new { count = results.Count, results });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Lỗi khi tìm kiếm.", details = ex.Message });
            }
        }

    }
}