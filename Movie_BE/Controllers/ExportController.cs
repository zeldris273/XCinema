using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;

[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly MovieDbContext _context;
    public ExportController(MovieDbContext context)
    {
        _context = context;
    }

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv()
    {
        // Query Movie
        var movies = await _context.Movies
            .Include(m => m.MovieGenres)
            .Include(m => m.MovieActors)
            .Select(m => new
            {
                Id = m.Id,
                Title = m.Title,
                Overview = m.Overview,
                Genres = string.Join(", ", m.MovieGenres.Select(g => g.Genre.Name)),
                Director = m.Director,
                Studio = m.Studio,
                Actors = string.Join(", ", m.MovieActors.Select(a => a.Actor.Name)),
                Type = "movie"
            }).ToListAsync();

        // Query TvSeries
        var tvSeries = await _context.TvSeries
            .Include(t => t.TvSeriesGenres)
            .Include(t => t.TvSeriesActors)
            .Select(t => new
            {
                Id = t.Id,
                Title = t.Title,
                Overview = t.Overview,
                Genres = string.Join(", ", t.TvSeriesGenres.Select(g => g.Genre.Name)),
                Director = t.Director,
                Studio = t.Studio,
                Actors = string.Join(", ", t.TvSeriesActors.Select(a => a.Actor.Name)),
                Type = "tvseries"
            }).ToListAsync();

        // Gộp dữ liệu
        var allData = movies.Concat(tvSeries).ToList();

        // Tạo CSV
        var csv = new StringBuilder();
        csv.AppendLine("Id,Title,Overview,Genres,Director,Studio,Actors,Type");

        foreach (var item in allData)
        {
            // Escape dấu phẩy và xuống dòng bằng cách bọc trong dấu ngoặc kép
            string title = $"\"{item.Title}\"";
            string overview = $"\"{item.Overview}\"";
            string genres = $"\"{item.Genres}\"";
            string director = $"\"{item.Director}\"";
            string studio = $"\"{item.Studio}\"";
            string actors = $"\"{item.Actors}\"";

            csv.AppendLine($"{item.Id},{title},{overview},{genres},{director},{studio},{actors},{item.Type}");
        }

        var bytes = Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", "movies_tv_combined.csv");
    }
}
