using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace backend.Hubs
{
    public class WatchPartyHub : Hub
    {
        private static readonly HashSet<string> ActiveRooms = new();

        public async Task JoinRoom(string roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId)
                .SendAsync("ReceiveChat", "System", $"A new user joined room {roomId}");

            if (ActiveRooms.Contains(roomId))
            {
                await Clients.Caller.SendAsync("ReceiveStartSession");
            }
        }

        public async Task StartSession(string roomId)
        {
            await Clients.Group(roomId).SendAsync("ReceiveStartSession");
        }


        public async Task SendChat(string roomId, string user, string message)
        {
            await Clients.Group(roomId)
                .SendAsync("ReceiveChat", user, message);
        }

        public async Task SyncPlay(string roomId, double time)
        {
            await Clients.OthersInGroup(roomId)
                .SendAsync("ReceivePlay", time);
        }

        public async Task SyncPause(string roomId, double time)
        {
            await Clients.OthersInGroup(roomId)
                .SendAsync("ReceivePause", time);
        }

        public async Task SyncSeek(string roomId, double time)
        {
            await Clients.OthersInGroup(roomId)
                .SendAsync("ReceiveSeek", time);
        }

        public async Task SyncSkipForward(string roomId)
        {
            await Clients.OthersInGroup(roomId)
                .SendAsync("ReceiveSkipForward");
        }

        public async Task SyncSkipBackward(string roomId)
        {
            await Clients.OthersInGroup(roomId)
                .SendAsync("ReceiveSkipBackward");
        }

        public async Task EndSession(string roomId)
        {
            await Clients.Group(roomId).SendAsync("ReceiveEndSession");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }

    }
}
