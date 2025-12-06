using backend.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Movie_BE.Models
{
    public class Like
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        public int? MovieId { get; set; }
        public int? TvSeriesId { get; set; }
        public int? CommentId { get; set; }

        [Required]
        public bool IsLike { get; set; } // true = like, false = dislike

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public CustomUser User { get; set; }
        public Movie? Movie { get; set; }
        public TvSeries? TvSeries { get; set; }
        public Comment? Comment { get; set; }
    }
}
