using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Movie_BE.Controllers
{
    [Route("api/new-releases")]
    [ApiController]
    public class NewReleasesController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public NewReleasesController(MovieDbContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<IActionResult> GetNewReleases(
            [FromQuery] int limit = 10,
            [FromQuery] int offset = 0,
            [FromQuery] string? mediaType = null)
        {
            try
            {
                // Lấy danh sách phim lẻ (Released)
                var movieList = await _context.Movies
                    .Where(m => m.Status.ToLower() == "released")
                    .Select(m => new
                    {
                        Id = m.Id,
                        Title = m.Title,
                        Overview = m.Overview,
                        ViewCount = (int?)m.ViewCount,
                        Rating = (double?)m.Rating,
                        ReleaseDate = m.ReleaseDate,
                        BackdropUrl = m.BackdropUrl,
                        MediaType = "movie"
                    })
                    .ToListAsync();

                // Lấy danh sách phim bộ (Ongoing hoặc Completed)
                var tvList = await _context.TvSeries
                    .Where(t => t.Status.ToLower() == "ongoing" || t.Status.ToLower() == "completed")
                    .Select(t => new
                    {
                        Id = t.Id,
                        Title = t.Title,
                        Overview = t.Overview,
                        ViewCount = (int?)t.ViewCount,
                        Rating = (double?)t.Rating,
                        ReleaseDate = t.ReleaseDate,
                        BackdropUrl = t.BackdropUrl,
                        MediaType = "tvseries"
                    })
                    .ToListAsync();

                // Gộp dữ liệu movie + tv
                var combined = movieList.Concat(tvList);

                // Nếu có filter mediaType
                if (!string.IsNullOrEmpty(mediaType))
                {
                    var normalized = mediaType.ToLower();
                    if (normalized != "movie" && normalized != "tvseries")
                        return BadRequest(new { error = "Invalid mediaType. Use 'movie' or 'tvseries'." });

                    combined = combined.Where(r => r.MediaType == normalized);
                }

                // Tổng số lượng
                var total = combined.Count();

                // Sắp xếp: theo ngày phát hành mới nhất + rating cao
                var releases = combined
                    .OrderByDescending(r => r.ReleaseDate)
                    .ThenByDescending(r => r.Rating)
                    .Skip(offset)
                    .Take(limit)
                    .ToList();

                // ✅ Logging để debug (tùy chọn)
                Console.WriteLine($"Movies found: {movieList.Count}, TV Series found: {tvList.Count}");
                Console.WriteLine($"Returning {releases.Count} items (limit={limit}, offset={offset})");

                return Ok(new
                {
                    Data = releases,
                    Total = total,
                    Limit = limit,
                    Offset = offset
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Internal server error", Details = ex.Message });
            }
        }
    }
}
