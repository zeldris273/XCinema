using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class ViewLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ContentId { get; set; }
        [Required]
        public string ContentType { get; set; }

        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
