namespace Movie_BE.DTOs
{
    public class LikeRequestDTO
    {
        public int? MovieId { get; set; }
        public int? TvSeriesId { get; set; }
        public int? CommentId { get; set; }
        public bool IsLike { get; set; }
    }

    public class LikeResponseDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? MovieId { get; set; }
        public int? TvSeriesId { get; set; }
        public int? CommentId { get; set; }
        public bool IsLike { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LikeStatsDTO
    {
        public int TotalLikes { get; set; }
        public int TotalDislikes { get; set; }
        public bool? UserLikeStatus { get; set; } // null = not voted, true = liked, false = disliked
    }
}
