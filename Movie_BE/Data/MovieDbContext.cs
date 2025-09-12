using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using Movie_BE.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Data
{
    public class MovieDbContext : IdentityDbContext<CustomUser, IdentityRole<int>, int>
    {
        public MovieDbContext(DbContextOptions<MovieDbContext> options)
            : base(options) { }

        public DbSet<Movie> Movies { get; set; }
        public DbSet<TvSeries> TvSeries { get; set; }
        public DbSet<Season> Seasons { get; set; }
        public DbSet<Episode> Episodes { get; set; }
        public DbSet<WatchList> WatchList { get; set; }
        public DbSet<Actor> Actors { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<MovieActor> MovieActors { get; set; }
        public DbSet<TvSeriesActor> TvSeriesActors { get; set; }

        public DbSet<ViewLog> ViewLogs { get; set; }
    }
}