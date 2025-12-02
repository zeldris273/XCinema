using System.Collections.Concurrent;
using backend.Hubs;
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
            foreach (var kvp in WatchPartyHub.ActiveRooms)
            {
                var room = kvp.Value;
                if (room.AutoStart &&
                    room.ScheduledStartTime.HasValue &&
                    !room.IsStarted &&
                    room.ScheduledStartTime.Value <= now)
                {
                    room.IsStarted = true;
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveStartSession");
                    await _hubContext.Clients.Group(room.RoomId).SendAsync("ReceiveSystemMessage",
                        " The scheduled session has started automatically!");
                    _logger.LogInformation($" Auto-started room {room.RoomId} at scheduled time {room.ScheduledStartTime}");
                }
            }
        }
    }
}
