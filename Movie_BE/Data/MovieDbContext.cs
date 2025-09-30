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
        public DbSet<Genre> Genres { get; set; }
        public DbSet<Actor> Actors { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<MovieActor> MovieActors { get; set; }
        public DbSet<TvSeriesActor> TvSeriesActors { get; set; }

        public DbSet<MovieGenre> MovieGenres { get; set; }
        public DbSet<TvSeriesGenre> TvSeriesGenres { get; set; }

        public DbSet<ViewLog> ViewLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // MovieGenre composite key
            modelBuilder.Entity<MovieGenre>()
                .HasKey(mg => new { mg.MovieId, mg.GenreId });

            modelBuilder.Entity<MovieGenre>()
                .HasOne(mg => mg.Movie)
                .WithMany(m => m.MovieGenres)
                .HasForeignKey(mg => mg.MovieId);

            modelBuilder.Entity<MovieGenre>()
                .HasOne(mg => mg.Genre)
                .WithMany()
                .HasForeignKey(mg => mg.GenreId);

            // TvSeriesGenre composite key
            modelBuilder.Entity<TvSeriesGenre>()
                .HasKey(tg => new { tg.TvSeriesId, tg.GenreId });

            modelBuilder.Entity<TvSeriesGenre>()
                .HasOne(tg => tg.TvSeries)
                .WithMany(t => t.TvSeriesGenres)
                .HasForeignKey(tg => tg.TvSeriesId);

            modelBuilder.Entity<TvSeriesGenre>()
                .HasOne(tg => tg.Genre)
                .WithMany()
                .HasForeignKey(tg => tg.GenreId);

            // Movie SearchVector
            modelBuilder.Entity<Movie>()
                .HasGeneratedTsVectorColumn(
                    p => p.SearchVector,
                    "english",            // Ngôn ngữ phân tích
                    p => new { p.Title, p.Overview }
                )
                .HasIndex(p => p.SearchVector)
                .HasMethod("GIN");

            // TvSeries SearchVector
            modelBuilder.Entity<TvSeries>()
                .HasGeneratedTsVectorColumn(
                    p => p.SearchVector,
                    "english",
                    p => new { p.Title, p.Overview }
                )
                .HasIndex(p => p.SearchVector)
                .HasMethod("GIN");
        }

    }
}