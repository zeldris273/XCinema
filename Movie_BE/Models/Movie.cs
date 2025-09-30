using System;
using System.ComponentModel.DataAnnotations;
using Movie_BE.Models;
using NpgsqlTypes;

namespace backend.Models
{
    public class Movie
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public string Overview { get; set; }


        [Required]
        public string Status { get; set; }

        public DateTime? ReleaseDate { get; set; }

        public string Studio { get; set; }

        public string Director { get; set; }

        public string PosterUrl { get; set; }
        public string BackdropUrl { get; set; }
        public decimal? Rating { get; set; }
        public int? NumberOfRatings { get; set; }

        public string VideoUrl { get; set; }
        public string? TrailerUrl { get; set; }
        public int ViewCount { get; set; }

        public NpgsqlTsVector? SearchVector { get; set; }
        public List<MovieGenre> MovieGenres { get; set; } = new();
        public List<Comment> Comments { get; set; } = new List<Comment>();
        public List<MovieActor> MovieActors { get; set; } = new List<MovieActor>();
    }
}
