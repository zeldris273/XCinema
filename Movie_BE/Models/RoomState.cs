using System;
using System.Collections.Generic;

namespace Movie_BE.Models
{
    /// <summary>
    /// Represents the state of a Watch Party room.
    /// Shared between WatchPartyHub and RedisWatchPartyService.
    /// </summary>
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
