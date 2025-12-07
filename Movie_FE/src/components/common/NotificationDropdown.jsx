import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck, FaTrash, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import Slug from "../../utils/Slug";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/api/notification");

      // Ensure we have an array
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await api.get("/api/notification/unread-count");
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      // Error fetching unread count
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notification/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      // Error marking notification as read
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put("/api/notification/read-all");
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      // Error marking all as read
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notification/${notificationId}`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      // Error deleting notification
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (notification.type === "CommentReply") {
      // Navigate to movie/series details page
      // For now, just close the dropdown - you can enhance this later
      setIsOpen(false);
    } else if (notification.type === "NewEpisode") {
      const slug = Slug(notification.tvSeriesTitle);
      navigate(`/tvseries/${notification.tvSeriesId}/${slug}`);
      setIsOpen(false);
    }
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return Math.floor(seconds) + " seconds ago";
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 5 seconds for faster updates
      const interval = setInterval(fetchUnreadCount, 5000);

      // Listen for manual refresh events
      const handleRefresh = () => {
        fetchUnreadCount();
      };
      window.addEventListener("refreshNotifications", handleRefresh);

      return () => {
        clearInterval(interval);
        window.removeEventListener("refreshNotifications", handleRefresh);
      };
    }
  }, [user]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold text-lg">Notifications</h3>
            <div className="flex gap-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  title="Mark all as read"
                >
                  <FaCheck /> All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {loading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700 hover:bg-gray-750 transition cursor-pointer ${
                    !notification.isRead ? "bg-gray-750" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon based on type */}
                    <div className="flex-shrink-0 mt-1">
                      {notification.type === "CommentReply" ? (
                        notification.repliedByUserAvatar ? (
                          <img
                            src={notification.repliedByUserAvatar}
                            alt={notification.repliedByUserName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {notification.repliedByUserName?.charAt(0) || "U"}
                          </div>
                        )
                      ) : (
                        notification.tvSeriesPosterUrl && (
                          <img
                            src={notification.tvSeriesPosterUrl}
                            alt={notification.tvSeriesTitle}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">
                        {notification.title}
                      </p>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
