import { useState, useEffect } from "react";
import { AiOutlineLike, AiOutlineDislike, AiFillLike, AiFillDislike } from "react-icons/ai";
import { useSelector } from "react-redux";
import api from "../../api/api";

const CommentLikeButton = ({ commentId }) => {
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    userLikeStatus: null,
  });
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const fetchStats = async () => {
    try {
      const response = await api.get(`/api/like/stats?commentId=${commentId}`);
      setStats(response.data);
    } catch (error) {
      // Error fetching like stats
    }
  };

  const handleToggle = async (isLike) => {
    if (!user) return;

    setLoading(true);
    try {
      await api.post("/api/like/toggle", {
        commentId,
        isLike,
      });
      await fetchStats();
      
      // Trigger notification refresh if exists
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      // Error toggling like
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (commentId) {
      fetchStats();
    }
  }, [commentId, user]);

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => handleToggle(true)}
        disabled={loading || !user}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${
          stats.userLikeStatus === true
            ? "text-blue-400"
            : "text-gray-400 hover:text-blue-400"
        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {stats.userLikeStatus === true ? (
          <AiFillLike className="text-base" />
        ) : (
          <AiOutlineLike className="text-base" />
        )}
        <span className="font-medium">{formatNumber(stats.totalLikes)}</span>
      </button>

      <button
        onClick={() => handleToggle(false)}
        disabled={loading || !user}
        className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${
          stats.userLikeStatus === false
            ? "text-red-400"
            : "text-gray-400 hover:text-red-400"
        } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {stats.userLikeStatus === false ? (
          <AiFillDislike className="text-base" />
        ) : (
          <AiOutlineDislike className="text-base" />
        )}
        <span className="font-medium">{formatNumber(stats.totalDislikes)}</span>
      </button>
    </div>
  );
};

export default CommentLikeButton;
