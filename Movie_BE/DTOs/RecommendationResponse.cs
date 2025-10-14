namespace backend.Dtos
{
    public class RecommendationItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public double PredictedScore { get; set; }
    }

    public class RecommendationResponseDto
    {
        public int UserId { get; set; }
        public List<RecommendationItemDto> Recommendations { get; set; } = new();
    }
}
