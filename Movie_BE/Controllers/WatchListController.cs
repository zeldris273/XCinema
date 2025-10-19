using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Movie_BE.Models;
using System.Linq;
using Movie_BE.DTOs;

namespace backend.Controllers
{
    [Route("api/watchlist")]
    [ApiController]
    public class WatchListController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public WatchListController(MovieDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public IActionResult GetWatchList()
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "User not authenticated or invalid user ID" });
            }

            var watchList = _context.WatchList
                .Where(w => w.UserId == userId)
                .Select(w => new
                {
                    mediaId = w.MediaId,
                    mediaType = w.MediaType,
                    title = w.MediaType == "movie"
                        ? _context.Movies.FirstOrDefault(m => m.Id == w.MediaId).Title
                        : _context.TvSeries.FirstOrDefault(t => t.Id == w.MediaId).Title,
                    posterUrl = w.MediaType == "movie"
                        ? _context.Movies.FirstOrDefault(m => m.Id == w.MediaId).PosterUrl
                        : _context.TvSeries.FirstOrDefault(t => t.Id == w.MediaId).BackdropUrl
                })
                .ToList();

            return Ok(watchList);
        }

        [HttpPost("add")]
        [Authorize]
        public async Task<IActionResult> AddToWatchList([FromBody] WatchListDTO watchListDto)
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "User not authenticated or invalid user ID" });
            }

            if (watchListDto.MediaId <= 0)
            {
                return BadRequest(new { error = "Invalid Media ID" });
            }

            if (watchListDto.MediaType != "movie" && watchListDto.MediaType != "tv")
            {
                return BadRequest(new { error = "Invalid Media Type. Must be 'movie' or 'tv'." });
            }

            var existingItem = _context.WatchList
                .FirstOrDefault(w => w.UserId == userId && w.MediaId == watchListDto.MediaId && w.MediaType == watchListDto.MediaType);

            if (existingItem != null)
            {
                return BadRequest(new { error = "This item is already in your watch list." });
            }

            var watchListItem = new WatchList
            {
                UserId = userId,
                MediaId = watchListDto.MediaId,
                MediaType = watchListDto.MediaType,
                AddedDate = DateTime.UtcNow
            };

            _context.WatchList.Add(watchListItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Added to watch list successfully." });
        }

        [HttpDelete("remove")]
        [Authorize]
        public async Task<IActionResult> RemoveFromWatchList([FromBody] WatchListDTO watchListDto)
        {
            var userIdClaim = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "User not authenticated or invalid user ID" });
            }

            var watchListItem = _context.WatchList
                .FirstOrDefault(w => w.UserId == userId && w.MediaId == watchListDto.MediaId && w.MediaType == watchListDto.MediaType);

            if (watchListItem == null)
            {
                return NotFound(new { error = "Item not found in watch list." });
            }

            _context.WatchList.Remove(watchListItem);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Removed from watch list successfully." });
        }

        [HttpGet("most-favorited")]
        [AllowAnonymous]
        public IActionResult GetMostFavoritedMedia()
        {
            // 🔹 Nhóm theo MediaId + MediaType để đếm số lượng yêu thích
            var favoriteGroups = _context.WatchList
                .GroupBy(w => new { w.MediaId, w.MediaType })
                .Select(g => new
                {
                    MediaId = g.Key.MediaId,
                    MediaType = g.Key.MediaType,
                    Count = g.Count()
                })
                .OrderByDescending(g => g.Count)
                .Take(20) // top 20 phim/series được yêu thích nhất
                .ToList();

            // 🔹 Lấy thông tin chi tiết (Movie + TV)
            var result = favoriteGroups.Select(f =>
            {
                if (f.MediaType == "movie")
                {
                    var movie = _context.Movies.FirstOrDefault(m => m.Id == f.MediaId);
                    if (movie != null)
                    {
                        return new
                        {
                            Id = movie.Id,
                            Title = movie.Title,
                            PosterUrl = movie.PosterUrl,
                            Rating = movie.Rating,
                            ReleaseDate = movie.ReleaseDate,
                            Type = "movie",
                            FavoriteCount = f.Count
                        };
                    }
                }
                else if (f.MediaType == "tv")
                {
                    var tv = _context.TvSeries.FirstOrDefault(t => t.Id == f.MediaId);
                    if (tv != null)
                    {
                        return new
                        {
                            Id = tv.Id,
                            Title = tv.Title,
                            PosterUrl = tv.PosterUrl,
                            Rating = tv.Rating,
                            ReleaseDate = tv.ReleaseDate,
                            Type = "tv",
                            FavoriteCount = f.Count
                        };
                    }
                }
                return null;
            })
            .Where(x => x != null)
            .OrderByDescending(x => x.FavoriteCount)
            .ToList();

            return Ok(result);
        }

    }
}