using backend.Services;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace backend.Hubs
{
    public class WatchPartyHub : Hub

    {
        public static readonly ConcurrentDictionary<string, RoomState> ActiveRooms = new();

        private static readonly ConcurrentDictionary<string, string> ConnectionToUser = new();

        private readonly AuthService _authService;

        public WatchPartyHub(AuthService authService)
        {
            _authService = authService;
        }

        public async Task CreateRoom(string roomId, string hostUserId, string movieDataJson, bool autoStart = false, DateTime? scheduledStartTime = null, bool isPrivate = false)
        {
            // Check if user already has an active room
            var existingRoom = ActiveRooms.Values.FirstOrDefault(r => r.HostUserId == hostUserId);
            if (existingRoom != null)
            {
                await Clients.Caller.SendAsync("RoomCreated", roomId, false, $"You already have an active room ({existingRoom.RoomId}). Please end it before creating a new one.");
                return;
            }

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
                    Viewers = new HashSet<string>(),
                    MovieDataJson = movieDataJson,
                    AutoStart = autoStart,
                    ScheduledStartTime = scheduledStartTime,
                    IsPrivate = isPrivate
                };


                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                ConnectionToUser[Context.ConnectionId] = hostUserId;

                ActiveRooms[roomId].Viewers.Add(hostUserId);

                await Clients.Caller.SendAsync("RoomCreated", roomId, true, null);
            }
            else
            {
                await Clients.Caller.SendAsync("RoomCreated", roomId, false, "Room ID already exists. Please try another one.");
            }
        }


        public async Task JoinRoom(string roomId, string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            if (ActiveRooms.TryGetValue(roomId, out var room))
            {
                bool isHost = room.HostUserId == userId;
                if (isHost)
                {
                    room.HostConnectionId = Context.ConnectionId;
                }

                ConnectionToUser[Context.ConnectionId] = userId;
                bool wasAdded = room.Viewers.Add(userId);

                string displayName;
                string avatarUrl = null;

                if (int.TryParse(userId, out int parsedUserId))
                {
                    var profile = await _authService.GetUserProfile(parsedUserId);
                    displayName = profile?.DisplayName ?? profile?.Email ?? $"User {userId}";
                    avatarUrl = profile?.AvatarUrl
                        ?? $"https://api.dicebear.com/7.x/bottts/svg?seed={userId}";
                }
                else
                {
                    displayName = "1 khách";
                }


                if (wasAdded)
                {
                    await Clients.Group(roomId)
                        .SendAsync("ReceiveSystemMessage", $"{displayName} vừa tham gia phòng");
                }


                await Clients.Caller.SendAsync(
                    "JoinedRoom",
                    roomId,
                    isHost,
                    room.HostUserId,
                    room.HostDisplayName,
                    room.HostAvatarUrl,
                    room.CreatedAt,
                    room.Viewers.Count,
                    room.MovieDataJson,
                    room.AutoStart,
                    room.ScheduledStartTime
                );

                if (avatarUrl != null)
                {
                    await Clients.Caller.SendAsync("ReceiveUserProfile", displayName, avatarUrl);
                }

                await Clients.Group(roomId)
                    .SendAsync("ViewerCountUpdated", room.Viewers.Count);

                if (room.IsStarted)
                {
                    await Clients.Caller.SendAsync("ReceiveStartSession", room.CurrentTime);
                }
            }
            else
            {
                await Clients.Caller.SendAsync("JoinedRoom", roomId, false, null, null, null, DateTime.UtcNow, 0, null, false, null);
            }
        }



        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (ConnectionToUser.TryRemove(Context.ConnectionId, out var userId))
            {
                foreach (var kvp in ActiveRooms)
                {
                    var room = kvp.Value;

                    if (room.HostConnectionId == Context.ConnectionId)
                    {
                        continue;
                    }

                    if (room.Viewers.Remove(userId))
                    {
                        string displayName = int.TryParse(userId, out int parsedId)
                            ? (await _authService.GetUserProfile(parsedId))?.DisplayName ?? $"User {userId}"
                            : "1 khách";


                        await Clients.Group(room.RoomId)
                            .SendAsync("ReceiveSystemMessage", $"{displayName} vừa rời phòng");

                        await Clients.Group(room.RoomId)
                            .SendAsync("ViewerCountUpdated", room.Viewers.Count);
                        break;
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }


        public async Task StartSession(string roomId)
        {

            if (ActiveRooms.TryGetValue(roomId, out var room))
            {

                if (Context.ConnectionId != room.HostConnectionId)
                {
                    await Clients.Caller.SendAsync("Error", "Only host can start the session!");
                    return;
                }

                room.IsStarted = true;
                room.StartedAt = DateTime.UtcNow;
                await Clients.Group(roomId).SendAsync("ReceiveStartSession");
            }
            else
            {
            }
        }

        public async Task EndSession(string roomId)
        {
            if (!ActiveRooms.TryGetValue(roomId, out var room))
            {
                await Clients.Caller.SendAsync("Error", "Room not found.");
                return;
            }

            await Clients.Group(roomId).SendAsync("ReceiveSystemMessage", "The host has ended this watch party. Redirecting...");
            await Clients.Group(roomId).SendAsync("ReceiveEndSession");

            ActiveRooms.Remove(roomId, out _);


            await Task.Delay(1000); // Give clients time to process
        }


        public async Task SendChat(string roomId, string user, string message, string avatarUrl)
        {
            if (!ActiveRooms.TryGetValue(roomId, out var room))
            {
                await Clients.Caller.SendAsync("Error", "Room not found.");
                return;
            }

            await Clients.Group(roomId).SendAsync("ReceiveChat", user, message, avatarUrl);

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
        public string MovieDataJson { get; set; } = "";
        public bool IsPrivate { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ScheduledStartTime { get; set; } = null;
        public DateTime? StartedAt { get; set; } = null;
        public bool AutoStart { get; set; } = false;
        public HashSet<string> Viewers { get; set; } = new();
    }
}
