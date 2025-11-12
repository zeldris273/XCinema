using backend.Services;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace backend.Hubs
{
    public class WatchPartyHub : Hub

    {
        private static readonly ConcurrentDictionary<string, RoomState> ActiveRooms = new();

        private static readonly ConcurrentDictionary<string, string> ConnectionToUser = new();

        private readonly AuthService _authService;

        public WatchPartyHub(AuthService authService)
        {
            _authService = authService;
        }

        public async Task CreateRoom(string roomId, string hostUserId)
        {
            if (!ActiveRooms.ContainsKey(roomId))
            {

                var hostProfile = await _authService.GetUserProfile(int.Parse(hostUserId));
                var displayName = hostProfile?.DisplayName ?? $"User {hostUserId}";
                var avatarUrl = hostProfile?.AvatarUrl
                    ?? $"https://api.dicebear.com/7.x/bottts/svg?seed={hostUserId}";

                ActiveRooms[roomId] = new RoomState
                {
                    RoomId = roomId,
                    HostConnectionId = Context.ConnectionId,
                    HostUserId = hostUserId,
                    HostDisplayName = displayName,
                    HostAvatarUrl = avatarUrl,
                    CreatedAt = DateTime.UtcNow,
                    Viewers = new HashSet<string>()
                };

                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                ConnectionToUser[Context.ConnectionId] = hostUserId;

                ActiveRooms[roomId].Viewers.Add(hostUserId);

                await Clients.Caller.SendAsync("RoomCreated", roomId, true);
                System.Console.WriteLine($"✅ Created room {roomId} by Host {hostUserId}");
            }
            else
            {
                await Clients.Caller.SendAsync("RoomCreated", roomId, false);
            }
        }


        public async Task JoinRoom(string roomId, string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            if (ActiveRooms.TryGetValue(roomId, out var room))
            {
                bool isHost = room.HostUserId == userId;


                ConnectionToUser[Context.ConnectionId] = userId;

                bool wasAdded = room.Viewers.Add(userId);

                Console.WriteLine($"👤 {userId} joined {roomId}. Was new: {wasAdded}. Total: {room.Viewers.Count}");

                if (wasAdded)
                {
                    await Clients.Group(roomId)
                        .SendAsync("ReceiveChat", "System", $"{userId} joined the room.");
                }

                await Clients.Caller.SendAsync(
                    "JoinedRoom",
                    roomId,
                    isHost,
                    room.HostUserId,
                    room.HostDisplayName,
                    room.HostAvatarUrl,
                    room.CreatedAt,
                    room.Viewers.Count
                );

                await Clients.Group(roomId)
                    .SendAsync("ViewerCountUpdated", room.Viewers.Count);

                if (room.IsStarted)
                {
                    Console.WriteLine($"📺 Syncing started session for {userId}");
                    await Clients.Caller.SendAsync("ReceiveStartSession", room.CurrentTime);
                }
            }
            else
            {
                Console.WriteLine($"⚠ Room {roomId} not found when {userId} tried to join.");
                await Clients.Caller.SendAsync("JoinedRoom", roomId, false, null, null, 0);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (ConnectionToUser.TryRemove(Context.ConnectionId, out var userId))
            {
                foreach (var kvp in ActiveRooms)
                {
                    var room = kvp.Value;

                    // Nếu host disconnect
                    if (room.HostConnectionId == Context.ConnectionId)
                    {
                        Console.WriteLine($"⚠ Host {room.HostUserId} disconnected from {room.RoomId}");
                        continue;
                    }

                    // Nếu là viewer trong phòng
                    if (room.Viewers.Remove(userId))
                    {
                        Console.WriteLine($"👋 {userId} left {room.RoomId}. Total now: {room.Viewers.Count}");
                        await Clients.Group(room.RoomId).SendAsync("ViewerCountUpdated", room.Viewers.Count);
                        break; // vì 1 user chỉ thuộc 1 room
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }


        public async Task StartSession(string roomId)
        {
            if (ActiveRooms.TryGetValue(roomId, out var room))
            {
                // Chỉ host mới có quyền bắt đầu
                if (Context.ConnectionId != room.HostConnectionId)
                {
                    await Clients.Caller.SendAsync("Error", "Only host can start the session!");
                    return;
                }

                room.IsStarted = true;
                await Clients.Group(roomId).SendAsync("ReceiveStartSession");
                System.Console.WriteLine($"▶ Room {roomId} started by host.");
            }
        }

        public async Task EndSession(string roomId)
        {

            await Clients.Group(roomId).SendAsync("ReceiveEndSession");

            ActiveRooms.Remove(roomId, out _);

            await Task.Delay(200); // đảm bảo client nhận tín hiệu trước khi xóa
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

            Console.WriteLine($"✅ Session {roomId} ended and room cleared.");
        }


        public async Task SendChat(string roomId, string user, string message)
        {
            await Clients.Group(roomId).SendAsync("ReceiveChat", user, message);
        }

        public async Task SyncPlay(string roomId, double time)
        {
            if (ActiveRooms.TryGetValue(roomId, out var room))
                room.CurrentTime = time;

            await Clients.OthersInGroup(roomId).SendAsync("ReceivePlay", time);
        }

        public async Task SyncPause(string roomId, double time)
        {
            if (ActiveRooms.TryGetValue(roomId, out var room))
                room.CurrentTime = time;

            await Clients.OthersInGroup(roomId).SendAsync("ReceivePause", time);
        }

        public async Task SyncSeek(string roomId, double time)
        {
            if (ActiveRooms.TryGetValue(roomId, out var room))
                room.CurrentTime = time;

            await Clients.OthersInGroup(roomId).SendAsync("ReceiveSeek", time);
        }

        public async Task SyncSkipForward(string roomId)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveSkipForward");
        }

        public async Task SyncSkipBackward(string roomId)
        {
            await Clients.OthersInGroup(roomId).SendAsync("ReceiveSkipBackward");
        }
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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public HashSet<string> Viewers { get; set; } = new();
    }
}
