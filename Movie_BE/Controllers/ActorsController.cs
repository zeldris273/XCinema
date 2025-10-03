using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Movie_BE.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActorsController : ControllerBase
    {
        private readonly MovieDbContext _context;

        public ActorsController(MovieDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/actors
        [HttpGet]
        public async Task<IActionResult> GetActors([FromQuery] string? search)
        {
            var query = _context.Actors.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim().ToLower();
                query = query.Where(a => a.Name.ToLower().Contains(search));
            }

            var actors = await query
                .OrderBy(a => a.Name)
                .Take(20) // Giới hạn tối đa 20 kết quả (tối ưu performance)
                .ToListAsync();

            return Ok(actors);
        }
        // ✅ GET: api/actors/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetActor(int id)
        {
            var actor = await _context.Actors.FindAsync(id);
            if (actor == null) return NotFound(new { message = "Actor not found" });
            return Ok(actor);
        }

        // ✅ POST: api/actors/find-or-create
        [HttpPost("find-or-create")]
        public async Task<IActionResult> FindOrCreateActor([FromBody] ActorNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Tên diễn viên không được để trống" });

            var existingActor = await _context.Actors
                .FirstOrDefaultAsync(a => a.Name.ToLower() == request.Name.ToLower());

            if (existingActor != null)
            {
                return Ok(existingActor);
            }

            var newActor = new Actor
            {
                Name = request.Name,
                CreatedAt = DateTime.UtcNow
            };

            _context.Actors.Add(newActor);
            await _context.SaveChangesAsync();

            return Ok(newActor);
        }

        // ✅ PUT: api/actors/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateActor(int id, [FromBody] ActorNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Tên diễn viên không được để trống" });

            var actor = await _context.Actors.FindAsync(id);
            if (actor == null) return NotFound(new { message = "Actor not found" });

            actor.Name = request.Name;
            await _context.SaveChangesAsync();

            return Ok(actor);
        }

        // ✅ DELETE: api/actors/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteActor(int id)
        {
            var actor = await _context.Actors.FindAsync(id);
            if (actor == null) return NotFound(new { message = "Actor not found" });

            _context.Actors.Remove(actor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class ActorNameRequest
    {
        public string Name { get; set; }
    }
}
