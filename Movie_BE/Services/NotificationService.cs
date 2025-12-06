using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Movie_BE.DTOs;
using Movie_BE.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Movie_BE.Services
{
    public interface INotificationService
    {
        Task CreateCommentReplyNotification(int parentCommentUserId, int repliedByUserId, int commentId, string movieTitle, string commentText);
        Task CreateNewEpisodeNotifications(int tvSeriesId, int seasonNumber, int episodeNumber);
        Task<List<NotificationDTO>> GetUserNotifications(int userId, int page = 1, int pageSize = 20);
        Task<int> GetUnreadCount(int userId);
        Task MarkAsRead(int notificationId, int userId);
        Task MarkAllAsRead(int userId);
        Task DeleteNotification(int notificationId, int userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly MovieDbContext _context;

        public NotificationService(MovieDbContext context)
        {
            _context = context;
        }

        public async Task CreateCommentReplyNotification(int parentCommentUserId, int repliedByUserId, int commentId, string movieTitle, string commentText)
        {
            // Don't notify if replying to own comment
            if (parentCommentUserId == repliedByUserId)
                return;

            var repliedByUser = await _context.Users.FindAsync(repliedByUserId);
            if (repliedByUser == null)
                return;

            var notification = new Notification
            {
                UserId = parentCommentUserId,
                Type = "CommentReply",
                Title = "New reply to your comment",
                Message = $"{repliedByUser.DisplayName ?? repliedByUser.UserName} replied to your comment on \"{movieTitle}\"",
                CommentId = commentId,
                RepliedByUserId = repliedByUserId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }

        public async Task CreateNewEpisodeNotifications(int tvSeriesId, int seasonNumber, int episodeNumber)
        {
            // Get all users who have this TV series in their watchlist
            var usersWithWatchlist = await _context.WatchList
                .Where(w => w.MediaId == tvSeriesId && w.MediaType == "TvSeries")
                .Select(w => w.UserId)
                .Distinct()
                .ToListAsync();

            if (!usersWithWatchlist.Any())
                return;

            var tvSeries = await _context.TvSeries.FindAsync(tvSeriesId);
            if (tvSeries == null)
                return;

            var notifications = usersWithWatchlist.Select(userId => new Notification
            {
                UserId = userId,
                Type = "NewEpisode",
                Title = "New episode available!",
                Message = $"Season {seasonNumber} Episode {episodeNumber} of \"{tvSeries.Title}\" is now available",
                TvSeriesId = tvSeriesId,
                SeasonNumber = seasonNumber,
                EpisodeNumber = episodeNumber,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }

        public async Task<List<NotificationDTO>> GetUserNotifications(int userId, int page = 1, int pageSize = 20)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(n => n.RepliedByUser)
                .Include(n => n.TvSeries)
                .Include(n => n.Comment)
                .ToListAsync();

            return notifications.Select(n => new NotificationDTO
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Url = n.Url,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                CommentId = n.CommentId,
                RepliedByUserName = n.RepliedByUser?.DisplayName ?? n.RepliedByUser?.UserName,
                RepliedByUserAvatar = n.RepliedByUser?.AvatarUrl,
                TvSeriesId = n.TvSeriesId,
                TvSeriesTitle = n.TvSeries?.Title,
                TvSeriesPosterUrl = n.TvSeries?.PosterUrl,
                SeasonNumber = n.SeasonNumber,
                EpisodeNumber = n.EpisodeNumber
            }).ToList();
        }

        public async Task<int> GetUnreadCount(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        public async Task MarkAsRead(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsRead(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteNotification(int notificationId, int userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
            }
        }
    }
}
