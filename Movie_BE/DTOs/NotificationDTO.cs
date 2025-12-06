using System;

namespace Movie_BE.DTOs
{
    public class NotificationDTO
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string? Url { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Additional info for CommentReply
        public int? CommentId { get; set; }
        public string? RepliedByUserName { get; set; }
        public string? RepliedByUserAvatar { get; set; }
        
        // Additional info for NewEpisode
        public int? TvSeriesId { get; set; }
        public string? TvSeriesTitle { get; set; }
        public string? TvSeriesPosterUrl { get; set; }
        public int? SeasonNumber { get; set; }
        public int? EpisodeNumber { get; set; }
    }
}
