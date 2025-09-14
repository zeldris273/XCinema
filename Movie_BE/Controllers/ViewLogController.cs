using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ViewLogController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public ViewLogController(MovieDbContext context)
        {
            _context = context;
        }

        [HttpPost("log")]
        public async Task<IActionResult> LogView([FromBody] LogViewRequest request)
        {
            try
            {
                var viewLog = new ViewLog
                {
                    ContentId = request.ContentId,
                    ContentType = request.ContentType,
                    ViewedAt = DateTime.UtcNow
                };

                _context.ViewLogs.Add(viewLog);
                await _context.SaveChangesAsync();

                return Ok(new { message = "View logged successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to log view", details = ex.Message });
            }
        }

        [HttpGet("stats/{contentId}")]
        public async Task<IActionResult> GetViewStats(int contentId, [FromQuery] string contentType)
        {
            try
            {
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

                var stats = new
                {
                    totalViews = await _context.ViewLogs
                        .CountAsync(v => v.ContentId == contentId && v.ContentType == contentType),
                    views7Days = await _context.ViewLogs
                        .CountAsync(v => v.ContentId == contentId && v.ContentType == contentType && v.ViewedAt >= sevenDaysAgo),
                    views30Days = await _context.ViewLogs
                        .CountAsync(v => v.ContentId == contentId && v.ContentType == contentType && v.ViewedAt >= thirtyDaysAgo)
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to get view stats", details = ex.Message });
            }
        }
    }

    public class LogViewRequest
    {
        public int ContentId { get; set; }
        public string ContentType { get; set; } // "movie" or "tvseries"
    }
}
