using backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WatchPartyController : ControllerBase
    {
        private readonly RoomService _roomService;

        public WatchPartyController(RoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet("my-rooms")]
        public IActionResult GetMyRooms([FromQuery] string userId)
        {
            var rooms = _roomService.ActiveRooms
                .Where(r => r.Value.HostUserId == userId)
                .Select(r => new
                {
                    r.Value.RoomId,
                    r.Value.MovieDataJson,
                    r.Value.CreatedAt,
                    r.Value.IsStarted,
                    ViewerCount = r.Value.Viewers.Count
                })
                .ToList();

            return Ok(rooms);
        }

        [HttpGet("public-rooms")]
        public IActionResult GetPublicRooms()
        {
            try
            {
                var publicRooms = _roomService.ActiveRooms
                    .Where(kvp => !kvp.Value.IsPrivate)
                    .Select(kvp => new
                    {
                        roomId = kvp.Value.RoomId,
                        hostDisplayName = kvp.Value.HostDisplayName,
                        hostAvatarUrl = kvp.Value.HostAvatarUrl,
                        viewerCount = kvp.Value.Viewers.Count,
                        isStarted = kvp.Value.IsStarted,
                        createdAt = kvp.Value.CreatedAt,
                        scheduledStartTime = kvp.Value.ScheduledStartTime,
                        autoStart = kvp.Value.AutoStart,
                        movieData = ParseMovieData(kvp.Value.MovieDataJson)
                    })
                    .OrderByDescending(r => r.createdAt)
                    .ToList();

                return Ok(publicRooms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching public rooms", error = ex.Message });
            }
        }

        private object ParseMovieData(string movieDataJson)
        {
            if (string.IsNullOrEmpty(movieDataJson))
                return null;

            try
            {
                var movieData = JsonSerializer.Deserialize<JsonElement>(movieDataJson);
                return new
                {
                    title = movieData.TryGetProperty("title", out var title) ? title.GetString() : "Unknown",
                    posterUrl = movieData.TryGetProperty("posterUrl", out var poster) ? poster.GetString() : null,
                    backdropUrl = movieData.TryGetProperty("backdropUrl", out var backdrop) ? backdrop.GetString() : null,
                    mediaType = movieData.TryGetProperty("mediaType", out var type) ? type.GetString() : "movie",
                    seasonNumber = movieData.TryGetProperty("seasonNumber", out var season) ? (int?)season.GetInt32() : null,
                    episodeNumber = movieData.TryGetProperty("episodeNumber", out var episode) ? (int?)episode.GetInt32() : null
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
