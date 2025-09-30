using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Movie_BE.Models
{
    public class Genre
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
        public List<TvSeriesGenre> TvSeriesGenres { get; set; } = new List<TvSeriesGenre>();
    }
}
