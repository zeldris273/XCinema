import { useState, useEffect } from "react";
import { AiOutlineLike, AiOutlineDislike, AiFillLike, AiFillDislike } from "react-icons/ai";
import { useSelector } from "react-redux";
import api from "../../api/api";
import customToast from "../../utils/customToast";

const LikeDislikeButton = ({ movieId, tvSeriesId, className = "" }) => {
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalDislikes: 0,
    userLikeStatus: null, // null = not voted, true = liked, false = disliked
  });
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.auth.user);

  // Fetch like stats
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (movieId) params.append("movieId", movieId);
      if (tvSeriesId) params.append("tvSeriesId", tvSeriesId);

      const response = await api.get(`/api/like/stats?${params.toString()}`);
      setStats(response.data);
    } catch (error) {
      // Error fetching like stats
    }
  };

  // Toggle like/dislike
  const handleToggle = async (isLike) => {
    if (!user) {
      customToast.error("Please login to like/dislike");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/like/toggle", {
        movieId,
        tvSeriesId,
        isLike,
      });

      if (response.data.removed) {
        customToast.success(isLike ? "Like removed" : "Dislike removed");
      } else {
        customToast.success(isLike ? "Liked!" : "Disliked!");
      }

      // Refresh stats
      await fetchStats();
    } catch (error) {
      customToast.error("Failed to update like status");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    if (movieId || tvSeriesId) {
      fetchStats();
    }
  }, [movieId, tvSeriesId, user]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Like Button */}
      <button
        onClick={() => handleToggle(true)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          stats.userLikeStatus === true
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        } ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
      >
        {stats.userLikeStatus === true ? (
          <AiFillLike className="text-xl" />
        ) : (
          <AiOutlineLike className="text-xl" />
        )}
        <span className="font-semibold">{formatNumber(stats.totalLikes)}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleToggle(false)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
          stats.userLikeStatus === false
            ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        } ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
      >
        {stats.userLikeStatus === false ? (
          <AiFillDislike className="text-xl" />
        ) : (
          <AiOutlineDislike className="text-xl" />
        )}
        <span className="font-semibold">{formatNumber(stats.totalDislikes)}</span>
      </button>
    </div>
  );
};

export default LikeDislikeButton;
