using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Movie_BE.Models;

[Route("api/[controller]")]
[ApiController]
public class GenresController : ControllerBase
{
    private readonly MovieDbContext _context;

    public GenresController(MovieDbContext context)
    {
        _context = context;
    }

    // ✅ GET: api/genres?search=keyword
    [HttpGet]
    public async Task<IActionResult> GetGenres([FromQuery] string? search)
    {
        var query = _context.Genres.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(g => g.Name.ToLower().Contains(search));
        }

        var genres = await query
            .OrderBy(g => g.Name)
            .Take(20)
            .ToListAsync();

        return Ok(genres);
    }


    // POST: api/genres
    [HttpPost]
    public async Task<IActionResult> CreateGenre([FromBody] Genre newGenre)
    {
        if (newGenre == null || string.IsNullOrWhiteSpace(newGenre.Name))
        {
            return BadRequest(new { error = "Name is required" });
        }

        var normalizedName = newGenre.Name.Trim();
        var exists = await _context.Genres
            .AnyAsync(g => g.Name.ToLower() == normalizedName.ToLower());
        if (exists)
        {
            return BadRequest(new { error = "Genre already exists" });
        }

        var genre = new Genre
        {
            Name = normalizedName,
            CreatedAt = DateTime.UtcNow
        };

        _context.Genres.Add(genre);
        await _context.SaveChangesAsync();

        return Ok(genre);
    }


    // PUT: api/genres/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGenre(int id, [FromBody] Genre updatedGenre)
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null) return NotFound("Không tìm thấy thể loại");

        if (!string.IsNullOrWhiteSpace(updatedGenre.Name))
            genre.Name = updatedGenre.Name;

        await _context.SaveChangesAsync();
        return Ok(genre);
    }

    // DELETE: api/genres/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGenre(int id)
    {
        var genre = await _context.Genres.FindAsync(id);
        if (genre == null) return NotFound("Không tìm thấy thể loại");

        _context.Genres.Remove(genre);
        await _context.SaveChangesAsync();
        return Ok();
    }
}
