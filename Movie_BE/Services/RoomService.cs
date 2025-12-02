using System.Collections.Concurrent;
using backend.Hubs;

namespace backend.Services
{
    public class RoomService
    {
        public ConcurrentDictionary<string, RoomState> ActiveRooms => WatchPartyHub.ActiveRooms;
    }
}
