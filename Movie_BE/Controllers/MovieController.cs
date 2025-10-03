using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Data;
using backend.Services;
using System.Text.RegularExpressions;
using Movie_BE.Models;
using Movie_BE.DTOs;
using Microsoft.EntityFrameworkCore.Storage;

namespace backend.Controllers
{
    [Route("api/movies")]
    [ApiController]
    public class MovieController : ControllerBase
    {
        private readonly MovieDbContext _context;
        private readonly S3Service _s3Service;

        public MovieController(MovieDbContext context, S3Service s3Service)
        {
            _context = context;
            _s3Service = s3Service;
        }

        private async Task<Actor> GetOrCreateActorAsync(string rawName, CancellationToken cancellationToken = default)
        {
            var normalized = (rawName ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                throw new ArgumentException("Actor name is empty");
            }

            var existing = await _context.Actors
                .FirstOrDefaultAsync(a => a.Name.ToLower() == normalized.ToLower(), cancellationToken);
            if (existing != null)
            {
                return existing;
            }

            // Try create, guard against race conditions
            var actor = new Actor
            {
                Name = normalized,
                CreatedAt = DateTime.UtcNow
            };
            _context.Actors.Add(actor);
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return actor;
            }
            catch (DbUpdateException)
            {
                // Another request may have inserted the same actor concurrently
                var fallback = await _context.Actors
                    .FirstOrDefaultAsync(a => a.Name.ToLower() == normalized.ToLower(), cancellationToken);
                if (fallback != null)
                {
                    // Discard the tracked failed insert entity
                    _context.Entry(actor).State = EntityState.Detached;
                    return fallback;
                }
                throw;
            }
        }

        [HttpPost("create")]
        [Authorize(Roles = "Admin")]

        public async Task<IActionResult> Create([FromForm] MovieUploadDTO model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Title))
                    return BadRequest(new { error = "Title is required" });
                if (string.IsNullOrEmpty(model.Status))
                    return BadRequest(new { error = "Status is required" });
                if (string.IsNullOrEmpty(model.Type))
                    return BadRequest(new { error = "Type is required" });
                if (model.VideoFile == null)
                    return BadRequest(new { error = "VideoFile is required" });

                if (model.Type != "single_movie")
                    return BadRequest(new { error = "This endpoint only supports uploading single movies" });

                var validStatuses = new[] { "Upcoming", "Released", "Canceled" };
                if (!validStatuses.Contains(model.Status))
                    return BadRequest(new { error = "Invalid Status. Must be 'Upcoming', 'Released', or 'Canceled'." });

                if (model.BackdropFile == null || model.PosterFile == null)
                    return BadRequest(new { error = "Backdrop and Poster images are required for single movies" });

                var validVideoExtensions = new[] { ".mp4", ".avi", ".mov", ".ts" };
                var validImageExtensions = new[] { ".jpg", ".jpeg", ".png" };

                if (!validVideoExtensions.Contains(Path.GetExtension(model.VideoFile.FileName).ToLower()))
                    return BadRequest(new { error = "VideoFile must be .mp4, .avi, .mov, or .ts" });

                if (!validImageExtensions.Contains(Path.GetExtension(model.BackdropFile.FileName).ToLower()))
                    return BadRequest(new { error = "BackdropFile must be .jpg, .jpeg, or .png" });

                if (!validImageExtensions.Contains(Path.GetExtension(model.PosterFile.FileName).ToLower()))
                    return BadRequest(new { error = "PosterFile must be .jpg, .jpeg, or .png" });

                string videoFolder = $"movies/{model.Title}";
                string videoUrl = await _s3Service.UploadFileAsync(model.VideoFile, videoFolder);

                List<string> imageUrls = new List<string>();
                string backdropUrl = await _s3Service.UploadFileAsync(model.BackdropFile, videoFolder);
                string posterUrl = await _s3Service.UploadFileAsync(model.PosterFile, videoFolder);
                imageUrls.Add(backdropUrl);
                imageUrls.Add(posterUrl);

                var normalizedMovieReleaseDate = model.ReleaseDate.HasValue
                    ? (model.ReleaseDate.Value.Kind == DateTimeKind.Utc
                        ? model.ReleaseDate.Value
                        : DateTime.SpecifyKind(model.ReleaseDate.Value, DateTimeKind.Utc))
                    : (DateTime?)null;

                var movie = new Movie
                {
                    Title = model.Title,
                    Overview = model.Overview,
                    Status = model.Status,
                    ReleaseDate = normalizedMovieReleaseDate,
                    Studio = model.Studio,
                    Director = model.Director,
                    PosterUrl = posterUrl,
                    BackdropUrl = backdropUrl,
                    VideoUrl = videoUrl,
                    NumberOfRatings = 0,
                    ViewCount = 0
                };

                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();

                // Xử lý Genres
                if (model.GenreIds != null && model.GenreIds.Any())
                {
                    foreach (var genreId in model.GenreIds)
                    {
                        if (await _context.Genres.AnyAsync(g => g.Id == genreId))
                        {
                            _context.MovieGenres.Add(new MovieGenre
                            {
                                MovieId = movie.Id,
                                GenreId = genreId
                            });
                        }
                    }
                }

                // Xử lý diễn viên
                List<string> actors = string.IsNullOrEmpty(model.Actors)
                    ? new List<string>()
                    : model.Actors.Split(',').Select(actor => actor.Trim()).ToList();

                foreach (var actorName in actors)
                {
                    if (string.IsNullOrWhiteSpace(actorName)) continue;
                    var actor = await GetOrCreateActorAsync(actorName);
                    var movieActor = new MovieActor
                    {
                        MovieId = movie.Id,
                        ActorId = actor.Id,
                        CharacterName = ""
                    };
                    _context.Set<MovieActor>().Add(movieActor);
                }

                await _context.SaveChangesAsync();

                return Ok(new { videoUrl, imageUrls });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Upload failed", details = ex.Message });
            }
        }


        [HttpGet]
        public IActionResult GetAllMovies()
        {
            var movies = _context.Movies
                .Include(m => m.MovieActors) // Tải MovieActors
                .ThenInclude(ma => ma.Actor) // Tải Actor liên quan
                .ToList();
            var result = movies.Select(m => new MovieResponseDTO
            {
                Id = m.Id,
                Title = m.Title,
                Overview = m.Overview,
                Genres = m.MovieGenres.Select(mg => mg.Genre.Name).ToList(),
                Status = m.Status,
                ReleaseDate = m.ReleaseDate,
                Studio = m.Studio,
                Director = m.Director,
                PosterUrl = m.PosterUrl,
                BackdropUrl = m.BackdropUrl,
                VideoUrl = m.VideoUrl,
                TrailerUrl = m.TrailerUrl,
                Actors = m.MovieActors.Select(ma => new ActorDTO
                {
                    Id = ma.Actor.Id,
                    Name = ma.Actor.Name,
                }).ToList()
            });
            return Ok(result);
        }


        // Endpoint cho URL xem chi tiết: /api/movies/{id}/{title}
        [HttpGet("{id}/{title}")]
        public IActionResult GetMovie(int id, string title)
        {
            var movie = _context.Movies
                .Include(m => m.MovieActors) // Tải MovieActors
                .ThenInclude(ma => ma.Actor) // Tải Actor liên quan
                .FirstOrDefault(m => m.Id == id);

            if (movie == null) return NotFound(new { error = "Movie not found" });

            string expectedSlug = movie.Title.ToLower()
                .Replace(" ", "-")
                .Trim();
            expectedSlug = Regex.Replace(expectedSlug, "[^a-z0-9-]", "");
            expectedSlug = Regex.Replace(expectedSlug, "-+", "-");

            if (title != expectedSlug)
            {
                return NotFound(new { error = "Movie not found" });
            }

            var result = new MovieResponseDTO
            {
                Id = movie.Id,
                Title = movie.Title,
                Overview = movie.Overview,
                Status = movie.Status,
                Rating = (double?)movie.Rating,
                NumberOfRatings = movie.NumberOfRatings,
                ReleaseDate = movie.ReleaseDate,
                Studio = movie.Studio,
                Director = movie.Director,
                PosterUrl = movie.PosterUrl,
                BackdropUrl = movie.BackdropUrl,
                VideoUrl = movie.VideoUrl,
                TrailerUrl = movie.TrailerUrl,
                Actors = movie.MovieActors.Select(ma => new ActorDTO
                {
                    Id = ma.Actor.Id,
                    Name = ma.Actor.Name,
                }).ToList()
            };
            return Ok(result);
        }

        [HttpGet("{id}/{title}/watch")]
        public async Task<IActionResult> WatchMovie(int id, string title)
        {
            var movie = _context.Movies.Find(id);
            if (movie == null) return NotFound(new { error = "Movie not found" });

            // Kiểm tra slug của title
            string expectedSlug = movie.Title.ToLower()
                .Replace(" ", "-")
                .Trim();
            expectedSlug = Regex.Replace(expectedSlug, "[^a-z0-9-]", "");
            expectedSlug = Regex.Replace(expectedSlug, "-+", "-");

            if (title != expectedSlug)
            {
                return NotFound(new { error = "Movie not found" });
            }

            if (string.IsNullOrEmpty(movie.VideoUrl))
                return BadRequest(new { error = "Video URL not available for this movie" });

            movie.ViewCount += 1;
            await _context.SaveChangesAsync();

            return Ok(new { videoUrl = movie.VideoUrl });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]

        public async Task<IActionResult> UpdateMovie(int id, [FromBody] MovieResponseDTO updatedMovie)
        {
            var movie = await _context.Movies
                .Include(m => m.MovieActors)
                .ThenInclude(ma => ma.Actor)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (movie == null) return NotFound();

            movie.Title = updatedMovie.Title;
            movie.Overview = updatedMovie.Overview;
            movie.Status = updatedMovie.Status;
            if (updatedMovie.ReleaseDate.HasValue)
            {
                movie.ReleaseDate = updatedMovie.ReleaseDate.Value.Kind == DateTimeKind.Utc
                    ? updatedMovie.ReleaseDate
                    : DateTime.SpecifyKind(updatedMovie.ReleaseDate.Value, DateTimeKind.Utc);
            }
            movie.Studio = updatedMovie.Studio;
            movie.Director = updatedMovie.Director;
            movie.PosterUrl = updatedMovie.PosterUrl;
            movie.BackdropUrl = updatedMovie.BackdropUrl;
            movie.VideoUrl = updatedMovie.VideoUrl;
            movie.TrailerUrl = updatedMovie.TrailerUrl;

            // Xóa genres cũ
            var existingGenres = _context.MovieGenres.Where(mg => mg.MovieId == movie.Id);
            _context.MovieGenres.RemoveRange(existingGenres);

            // Thêm genres mới
            if (updatedMovie.GenreIds != null && updatedMovie.GenreIds.Any())
            {
                foreach (var genreId in updatedMovie.GenreIds)
                {
                    if (await _context.Genres.AnyAsync(g => g.Id == genreId))
                    {
                        _context.MovieGenres.Add(new MovieGenre
                        {
                            MovieId = movie.Id,
                            GenreId = genreId
                        });
                    }
                }
            }


            if (updatedMovie.Actors != null && updatedMovie.Actors.Any())
            {
                // Xóa các diễn viên cũ
                _context.MovieActors.RemoveRange(movie.MovieActors);

                // Thêm các diễn viên mới
                foreach (var actorDto in updatedMovie.Actors)
                {
                    var actor = actorDto.Id > 0
                        ? await _context.Actors.FirstOrDefaultAsync(a => a.Id == actorDto.Id)
                        : null;

                    if (actor == null)
                    {
                        actor = await GetOrCreateActorAsync(actorDto.Name ?? string.Empty);
                    }

                    var movieActor = new MovieActor
                    {
                        MovieId = movie.Id,
                        ActorId = actor.Id,
                        CharacterName = ""
                    };
                    _context.MovieActors.Add(movieActor);
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMovie(int id)
        {
            try
            {
                var movie = await _context.Movies
                    .Include(m => m.MovieActors)
                    .Include(m => m.MovieGenres)
                    .Include(m => m.Comments)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (movie == null) return NotFound();

                // Remove dependent entities to satisfy FK constraints
                if (movie.MovieActors != null && movie.MovieActors.Count > 0)
                {
                    _context.MovieActors.RemoveRange(movie.MovieActors);
                }

                if (movie.MovieGenres != null && movie.MovieGenres.Count > 0)
                {
                    _context.MovieGenres.RemoveRange(movie.MovieGenres);
                }

                if (movie.Comments != null && movie.Comments.Count > 0)
                {
                    _context.Comments.RemoveRange(movie.Comments);
                }

                // Remove other dependents by query if they exist in the model
                var ratings = _context.Ratings.Where(r => r.MediaType == "movie" && r.MediaId == id);
                if (await ratings.AnyAsync())
                {
                    _context.Ratings.RemoveRange(ratings);
                }



                var watchListItems = _context.WatchList.Where(w => w.MediaType == "movie" && w.MediaId == id);
                if (await watchListItems.AnyAsync())
                {
                    _context.WatchList.RemoveRange(watchListItems);
                }

                _context.Movies.Remove(movie);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Delete failed", details = ex.Message });
            }
        }

        [HttpGet("top-rated-by-votes")]
        public async Task<IActionResult> GetTopRatedMoviesByVotes()
        {
            var topMovies = await _context.Movies
                .Select(m => new
                {
                    m.Id,
                    m.Title,
                    m.PosterUrl,
                    m.BackdropUrl,
                    Rating = (double?)m.Rating,
                    NumberOfRatings = m.NumberOfRatings ?? 0,
                    ViewCount = (int?)(m.ViewCount) ?? 0,
                    ReleaseDate = m.ReleaseDate
                })
                .OrderByDescending(m => m.NumberOfRatings)
                .Take(20)
                .ToListAsync();

            return Ok(topMovies);
        }
    }
}