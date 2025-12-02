using backend.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

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
    }
}
