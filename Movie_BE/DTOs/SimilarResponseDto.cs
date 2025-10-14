namespace backend.Dtos
{
    public class SimilarItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public double Similarity { get; set; }
    }

    public class SimilarResponseDto
    {
        public int BaseMovieId { get; set; }
        public List<SimilarItemDto> Recommendations { get; set; } = new();
    }
}
