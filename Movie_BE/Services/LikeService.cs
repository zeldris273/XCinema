using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Movie_BE.DTOs;
using Movie_BE.Models;
using System.Linq;
using System.Threading.Tasks;

namespace Movie_BE.Services
{
    public interface ILikeService
    {
        Task<LikeResponseDTO> ToggleLike(int userId, LikeRequestDTO request);
        Task<LikeStatsDTO> GetLikeStats(int? movieId, int? tvSeriesId, int? commentId, int? userId);
        Task<bool> RemoveLike(int userId, int? movieId, int? tvSeriesId, int? commentId);
    }

    public class LikeService : ILikeService
    {
        private readonly MovieDbContext _context;
        private readonly INotificationService _notificationService;

        public LikeService(MovieDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<LikeResponseDTO> ToggleLike(int userId, LikeRequestDTO request)
        {
            // Find existing like
            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l =>
                    l.UserId == userId &&
                    l.MovieId == request.MovieId &&
                    l.TvSeriesId == request.TvSeriesId &&
                    l.CommentId == request.CommentId);

            if (existingLike != null)
            {
                // If clicking the same button, remove the like
                if (existingLike.IsLike == request.IsLike)
                {
                    _context.Likes.Remove(existingLike);
                    await _context.SaveChangesAsync();
                    return null;
                }
                else
                {
                    // Toggle between like and dislike
                    existingLike.IsLike = request.IsLike;
                    existingLike.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    // Create notification if it's a like on comment
                    if (request.IsLike && request.CommentId.HasValue)
                    {
                        await CreateCommentLikeNotification(userId, request.CommentId.Value);
                    }

                    return new LikeResponseDTO
                    {
                        Id = existingLike.Id,
                        UserId = existingLike.UserId,
                        MovieId = existingLike.MovieId,
                        TvSeriesId = existingLike.TvSeriesId,
                        CommentId = existingLike.CommentId,
                        IsLike = existingLike.IsLike,
                        CreatedAt = existingLike.CreatedAt
                    };
                }
            }
            else
            {
                // Create new like
                var newLike = new Like
                {
                    UserId = userId,
                    MovieId = request.MovieId,
                    TvSeriesId = request.TvSeriesId,
                    CommentId = request.CommentId,
                    IsLike = request.IsLike,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Likes.Add(newLike);
                await _context.SaveChangesAsync();

                // Create notification if it's a like on comment
                if (request.IsLike && request.CommentId.HasValue)
                {
                    await CreateCommentLikeNotification(userId, request.CommentId.Value);
                }

                return new LikeResponseDTO
                {
                    Id = newLike.Id,
                    UserId = newLike.UserId,
                    MovieId = newLike.MovieId,
                    TvSeriesId = newLike.TvSeriesId,
                    CommentId = newLike.CommentId,
                    IsLike = newLike.IsLike,
                    CreatedAt = newLike.CreatedAt
                };
            }
        }

        public async Task<LikeStatsDTO> GetLikeStats(int? movieId, int? tvSeriesId, int? commentId, int? userId)
        {
            var query = _context.Likes.AsQueryable();

            if (movieId.HasValue)
                query = query.Where(l => l.MovieId == movieId);

            if (tvSeriesId.HasValue)
                query = query.Where(l => l.TvSeriesId == tvSeriesId);

            if (commentId.HasValue)
                query = query.Where(l => l.CommentId == commentId);

            var likes = await query.ToListAsync();

            var stats = new LikeStatsDTO
            {
                TotalLikes = likes.Count(l => l.IsLike),
                TotalDislikes = likes.Count(l => !l.IsLike),
                UserLikeStatus = null
            };

            if (userId.HasValue)
            {
                var userLike = likes.FirstOrDefault(l => l.UserId == userId.Value);
                if (userLike != null)
                {
                    stats.UserLikeStatus = userLike.IsLike;
                }
            }

            return stats;
        }

        public async Task<bool> RemoveLike(int userId, int? movieId, int? tvSeriesId, int? commentId)
        {
            var like = await _context.Likes
                .FirstOrDefaultAsync(l =>
                    l.UserId == userId &&
                    l.MovieId == movieId &&
                    l.TvSeriesId == tvSeriesId &&
                    l.CommentId == commentId);

            if (like != null)
            {
                _context.Likes.Remove(like);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        private async Task CreateCommentLikeNotification(int likerId, int commentId)
        {
            var comment = await _context.Comments
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null || comment.UserId == likerId) return; // Don't notify if liking own comment

            var liker = await _context.Users.FindAsync(likerId);
            if (liker == null) return;

            var notification = new Notification
            {
                UserId = comment.UserId,
                Type = "CommentLike",
                Title = "Someone liked your comment!",
                Message = $"{liker.DisplayName ?? liker.UserName} liked your comment: \"{comment.CommentText.Substring(0, Math.Min(50, comment.CommentText.Length))}...\"",
                CommentId = commentId,
                RepliedByUserId = likerId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }
}
