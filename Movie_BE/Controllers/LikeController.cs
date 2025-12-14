using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Movie_BE.DTOs;
using Movie_BE.Services;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Movie_BE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LikeController : ControllerBase
    {
        private readonly ILikeService _likeService;

        public LikeController(ILikeService likeService)
        {
            _likeService = likeService;
        }

        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleLike([FromBody] LikeRequestDTO request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            if (!request.MovieId.HasValue && !request.TvSeriesId.HasValue && !request.CommentId.HasValue)
            {
                return BadRequest(new { message = "Either MovieId, TvSeriesId, or CommentId must be provided" });
            }

            var result = await _likeService.ToggleLike(userId, request);
            
            if (result == null)
            {
                return Ok(new { message = "Like removed", removed = true });
            }

            return Ok(result);
        }

        [HttpGet("stats")]
        [AllowAnonymous] // Allow unauthenticated users to view like stats
        public async Task<IActionResult> GetLikeStats([FromQuery] int? movieId, [FromQuery] int? tvSeriesId, [FromQuery] int? commentId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
            {
                userId = uid;
            }

            if (!movieId.HasValue && !tvSeriesId.HasValue && !commentId.HasValue)
            {
                return BadRequest(new { message = "Either movieId, tvSeriesId, or commentId must be provided" });
            }

            var stats = await _likeService.GetLikeStats(movieId, tvSeriesId, commentId, userId);
            return Ok(stats);
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveLike([FromQuery] int? movieId, [FromQuery] int? tvSeriesId, [FromQuery] int? commentId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            if (!movieId.HasValue && !tvSeriesId.HasValue && !commentId.HasValue)
            {
                return BadRequest(new { message = "Either movieId, tvSeriesId, or commentId must be provided" });
            }

            var removed = await _likeService.RemoveLike(userId, movieId, tvSeriesId, commentId);
            
            if (removed)
            {
                return Ok(new { message = "Like removed successfully" });
            }

            return NotFound(new { message = "Like not found" });
        }
    }
}
