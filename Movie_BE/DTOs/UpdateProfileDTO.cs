using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class UpdateProfileDTO
    {
        [Required]
        public string DisplayName { get; set; } = string.Empty;
        
        [Required]
        public string Gender { get; set; } = string.Empty;
    }

    public class UpdateProfileResponseDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
