using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Movie_BE.Models;
using NpgsqlTypes;

namespace backend.Models
{
    public class TvSeries
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
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
        public int? ViewCount { get; set; }

        public string? TrailerUrl { get; set; }

        public NpgsqlTsVector? SearchVector { get; set; }

        public List<TvSeriesGenre> TvSeriesGenres { get; set; } = new();


        public List<Season> Seasons { get; set; } = new List<Season>();
        public List<Comment> Comments { get; set; } = new List<Comment>();
        public List<TvSeriesActor> TvSeriesActors { get; set; } = new List<TvSeriesActor>();
    }
}