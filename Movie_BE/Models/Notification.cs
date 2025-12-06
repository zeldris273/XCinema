using backend.Models;
using System;

namespace Movie_BE.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } // "CommentReply", "NewEpisode"
        public string Title { get; set; }
        public string Message { get; set; }
        public string? Url { get; set; } // Link đến chi tiết
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // For CommentReply notifications
        public int? CommentId { get; set; }
        public int? RepliedByUserId { get; set; }
        
        // For NewEpisode notifications
        public int? TvSeriesId { get; set; }
        public int? SeasonNumber { get; set; }
        public int? EpisodeNumber { get; set; }
        
        // Navigation properties
        public CustomUser User { get; set; }
        public CustomUser? RepliedByUser { get; set; }
        public Comment? Comment { get; set; }
        public TvSeries? TvSeries { get; set; }
    }
}
