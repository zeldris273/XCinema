using System.Collections.Concurrent;
using backend.Hubs;
using Movie_BE.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace backend.Services
{
    public class RoomService
    {
        public ConcurrentDictionary<string, RoomState> ActiveRooms => WatchPartyHub.ActiveRooms;
    }

    public class WatchPartySchedulerService : BackgroundService
    {
        private readonly IHubContext<WatchPartyHub> _hubContext;
        private readonly ILogger<WatchPartySchedulerService> _logger;

        public WatchPartySchedulerService(IHubContext<WatchPartyHub> hubContext, ILogger<WatchPartySchedulerService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("WatchPartySchedulerService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckScheduledRooms();
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in WatchPartySchedulerService");
                }
            }

            _logger.LogInformation("WatchPartySchedulerService is stopping.");
        }

        private async Task CheckScheduledRooms()
        {
            var now = DateTime.UtcNow;
            var roomsToRemove = new List<string>();

            foreach (var kvp in WatchPartyHub.ActiveRooms)
            {
                var room = kvp.Value;
                
                // Check for scheduled auto-start
                if (room.AutoStart &&
                    room.ScheduledStartTime.HasValue &&
                    !room.IsStarted &&
                    room.ScheduledStartTime.Value <= now)
                {
                    room.IsStarted = true;
                    room.StartedAt = DateTime.UtcNow;
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveStartSession");
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveSystemMessage",
                        " The scheduled session has started automatically!");
                    _logger.LogInformation($" Auto-started room {room.RoomId} at scheduled time {room.ScheduledStartTime}");
                }

                // Check for auto-end after 5 hours from start
                if (room.IsStarted && 
                    room.StartedAt.HasValue &&
                    (now - room.StartedAt.Value).TotalHours >= 5)
                {
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveSystemMessage",
                        "This watch party has automatically ended after 5 hours. Redirecting...");
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveEndSession");
                    
                    roomsToRemove.Add(room.RoomId);
                    _logger.LogInformation($"Auto-ended room {room.RoomId} after 5 hours of playtime");
                }
            }

            // Remove ended rooms
            foreach (var roomId in roomsToRemove)
            {
                WatchPartyHub.ActiveRooms.TryRemove(roomId, out _);
            }
        }
    }
}
