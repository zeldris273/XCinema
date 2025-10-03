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
