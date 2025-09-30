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

    // GET: api/genres
    [HttpGet]
    public async Task<IActionResult> GetGenres()
    {
        var genres = await _context.Genres.ToListAsync();
        return Ok(genres);
    }

    // POST: api/genres
    [HttpPost]
    public async Task<IActionResult> CreateGenre([FromBody] Genre genre)
    {
        if (string.IsNullOrWhiteSpace(genre.Name))
            return BadRequest("Tên thể loại không được để trống");

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
