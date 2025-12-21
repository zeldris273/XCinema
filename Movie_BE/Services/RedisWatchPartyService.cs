using System.Text.Json;

namespace Movie_BE.Services
{
    public interface IRedisWatchPartyService
    {
        Task<RoomState?> GetRoomAsync(string roomId);
        Task<bool> CreateRoomAsync(RoomState room);
        Task<bool> UpdateRoomAsync(RoomState room);
        Task<bool> DeleteRoomAsync(string roomId);
        Task<bool> RoomExistsAsync(string roomId);
        Task<List<RoomState>> GetAllActiveRoomsAsync();
        Task<RoomState?> GetRoomByHostUserIdAsync(string hostUserId);
        Task<bool> AddViewerAsync(string roomId, string userId);
        Task<bool> RemoveViewerAsync(string roomId, string userId);
        Task<int> GetViewerCountAsync(string roomId);
        Task<bool> UpdateRoomTimeAsync(string roomId, double currentTime);
    }

    public class RedisWatchPartyService : IRedisWatchPartyService
    {
        private readonly IRedisCacheService _cache;
        private readonly ILogger<RedisWatchPartyService> _logger;
        private const string ROOM_KEY_PREFIX = "watchparty:room:";
        private const string ROOM_INDEX_KEY = "watchparty:rooms:active";
        private const string HOST_INDEX_PREFIX = "watchparty:host:";
        private readonly TimeSpan _roomExpiry = TimeSpan.FromHours(24);

        public RedisWatchPartyService(
            IRedisCacheService cache,
            ILogger<RedisWatchPartyService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<RoomState?> GetRoomAsync(string roomId)
        {
            try
            {
                var key = GetRoomKey(roomId);
                return await _cache.GetAsync<RoomState>(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get room {RoomId} from Redis", roomId);
                return null;
            }
        }

        public async Task<bool> CreateRoomAsync(RoomState room)
        {
            try
            {
                var roomKey = GetRoomKey(room.RoomId);
                var hostKey = GetHostKey(room.HostUserId);

                // Save room data
                await _cache.SetAsync(roomKey, room, _roomExpiry);
                
                // Index by host
                await _cache.SetStringAsync(hostKey, room.RoomId, _roomExpiry);
                
                // Add to active rooms set
                await _cache.HashSetAsync(ROOM_INDEX_KEY, room.RoomId, room.HostUserId);
                
                _logger.LogInformation("Room {RoomId} created in Redis by host {HostUserId}", room.RoomId, room.HostUserId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create room {RoomId} in Redis", room.RoomId);
                return false;
            }
        }

        public async Task<bool> UpdateRoomAsync(RoomState room)
        {
            try
            {
                var key = GetRoomKey(room.RoomId);
                await _cache.SetAsync(key, room, _roomExpiry);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update room {RoomId} in Redis", room.RoomId);
                return false;
            }
        }

        public async Task<bool> DeleteRoomAsync(string roomId)
        {
            try
            {
                var room = await GetRoomAsync(roomId);
                if (room != null)
                {
                    var roomKey = GetRoomKey(roomId);
                    var hostKey = GetHostKey(room.HostUserId);

                    await _cache.DeleteAsync(roomKey);
                    await _cache.DeleteAsync(hostKey);
                    await _cache.HashDeleteAsync(ROOM_INDEX_KEY, roomId);
                    
                    _logger.LogInformation("Room {RoomId} deleted from Redis", roomId);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete room {RoomId} from Redis", roomId);
                return false;
            }
        }

        public async Task<bool> RoomExistsAsync(string roomId)
        {
            try
            {
                var key = GetRoomKey(roomId);
                return await _cache.ExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check if room {RoomId} exists", roomId);
                return false;
            }
        }

        public async Task<List<RoomState>> GetAllActiveRoomsAsync()
        {
            try
            {
                var roomIds = await _cache.HashGetAllAsync(ROOM_INDEX_KEY);
                var rooms = new List<RoomState>();

                foreach (var roomId in roomIds.Keys)
                {
                    var room = await GetRoomAsync(roomId);
                    if (room != null)
                    {
                        rooms.Add(room);
                    }
                }

                return rooms;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get all active rooms from Redis");
                return new List<RoomState>();
            }
        }

        public async Task<RoomState?> GetRoomByHostUserIdAsync(string hostUserId)
        {
            try
            {
                var hostKey = GetHostKey(hostUserId);
                var roomId = await _cache.GetStringAsync(hostKey);
                
                if (!string.IsNullOrEmpty(roomId))
                {
                    return await GetRoomAsync(roomId);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get room by host {HostUserId}", hostUserId);
                return null;
            }
        }

        public async Task<bool> AddViewerAsync(string roomId, string userId)
        {
            try
            {
                var room = await GetRoomAsync(roomId);
                if (room != null)
                {
                    if (!room.Viewers.Contains(userId))
                    {
                        room.Viewers.Add(userId);
                        await UpdateRoomAsync(room);
                    }
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to add viewer {UserId} to room {RoomId}", userId, roomId);
                return false;
            }
        }

        public async Task<bool> RemoveViewerAsync(string roomId, string userId)
        {
            try
            {
                var room = await GetRoomAsync(roomId);
                if (room != null)
                {
                    room.Viewers.Remove(userId);
                    await UpdateRoomAsync(room);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove viewer {UserId} from room {RoomId}", userId, roomId);
                return false;
            }
        }

        public async Task<int> GetViewerCountAsync(string roomId)
        {
            try
            {
                var room = await GetRoomAsync(roomId);
                return room?.Viewers.Count ?? 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get viewer count for room {RoomId}", roomId);
                return 0;
            }
        }

        public async Task<bool> UpdateRoomTimeAsync(string roomId, double currentTime)
        {
            try
            {
                var room = await GetRoomAsync(roomId);
                if (room != null)
                {
                    room.CurrentTime = currentTime;
                    await UpdateRoomAsync(room);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update time for room {RoomId}", roomId);
                return false;
            }
        }

        private string GetRoomKey(string roomId) => $"{ROOM_KEY_PREFIX}{roomId}";
        private string GetHostKey(string hostUserId) => $"{HOST_INDEX_PREFIX}{hostUserId}";
    }

    public class RoomState
    {
        public string RoomId { get; set; } = "";
        public string HostConnectionId { get; set; } = "";
        public string HostUserId { get; set; } = "";
        public string HostDisplayName { get; set; } = "";
        public string HostAvatarUrl { get; set; } = "";
        public bool IsStarted { get; set; } = false;
        public double CurrentTime { get; set; } = 0;
        public string MovieDataJson { get; set; } = "";
        public bool IsPrivate { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ScheduledStartTime { get; set; } = null;
        public DateTime? StartedAt { get; set; } = null;
        public bool AutoStart { get; set; } = false;
        public HashSet<string> Viewers { get; set; } = new();
    }
}
