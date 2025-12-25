using Microsoft.AspNetCore.Mvc;
using Movie_BE.DTOs;
using Movie_BE.Services;
using System.Threading.Tasks;
using System.Security.Claims;

namespace MovieChatbot.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IMovieChatbotService _chatbotService;
        private readonly ILogger<ChatbotController> _logger;

        public ChatbotController(IMovieChatbotService chatbotService, ILogger<ChatbotController> logger)
        {
            _chatbotService = chatbotService;
            _logger = logger;
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchMovies([FromBody] MovieDescriptionRequest request)
        {
            if (string.IsNullOrEmpty(request.Description))
            {
                return BadRequest(new { Error = "Description is required." });
            }

            if (request.Description.Length > 500)
            {
                return BadRequest(new { Error = "Description is too long. Maximum 500 characters." });
            }

            // Get user ID from JWT token or use IP address as fallback
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? HttpContext.Connection.RemoteIpAddress?.ToString() 
                ?? "anonymous";

            try
            {
                var result = await _chatbotService.GetMoviesByDescriptionAsync(request.Description, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ChatbotController for user {UserId}", userId);
                return StatusCode(500, new { Error = "An error occurred while processing your request." });
            }
        }

        [HttpGet("remaining")]
        public async Task<IActionResult> GetRemainingQueries()
        {
            // Get user ID from JWT token or use IP address as fallback
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? HttpContext.Connection.RemoteIpAddress?.ToString() 
                ?? "anonymous";

            try
            {
                var remaining = await _chatbotService.GetRemainingQueriesAsync(userId);
                return Ok(new { RemainingQueries = remaining, MaxQueries = 5 });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting remaining queries for user {UserId}", userId);
                return StatusCode(500, new { Error = "An error occurred while checking your quota." });
            }
        }
    }
}