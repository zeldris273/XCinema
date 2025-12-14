import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import VideoFrame from "../components/frame/VideoFrame";
import RecommendedMovies from "../components/common/RecommendedMovies";
import LikeDislikeButton from "../components/common/LikeDislikeButton";
import CommentLikeButton from "../components/common/CommentLikeButton";
import AuthModal from "../components/common/AuthModal";
import customToast from "../utils/customToast";

const MoviePlayer = () => {
  const { id, title, episodeNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [settingsTab, setSettingsTab] = useState("quality");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const settingsMenuTimeoutRef = useRef(null);

  const mediaType = location.pathname.includes("movies") ? "movie" : "tv";

  const getStorageKey = () => {
    return mediaType === "movie"
      ? `watchTime_${id}`
      : `watchTime_${id}_episode_${episodeNumber}`;
  };

  useEffect(() => {
    const savedTime = localStorage.getItem(getStorageKey());
    if (savedTime) {
      setSavedTime(parseFloat(savedTime));
      setShowResumePrompt(true);
    }
  }, [id, episodeNumber, mediaType]);

  const handleResume = () => {
    const video = videoRef.current;
    if (video && savedTime) {
      video.currentTime = savedTime;
      setCurrentTime(savedTime);
      video.play().catch((err) => {
        setError("Failed to play video. Please click play manually.");
      });
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  const handleStartOver = () => {
    localStorage.removeItem(getStorageKey());
    setCurrentTime(0);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch((err) => {
        setError("Failed to play video. Please click play manually.");
      });
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  // Check if user is logged in without redirecting
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userId = decoded["sub"];
        setCurrentUserId(parseInt(userId, 10));
      } catch (err) {
        // Invalid token, just clear it
        localStorage.removeItem("accessToken");
        setCurrentUserId(null);
      }
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const fetchComments = async () => {
    try {
      const episodeId = mediaType === "tv" ? getEpisodeId() : null;
      const response = await api.get("/api/comments", {
        params: {
          tvSeriesId: mediaType === "tv" ? id : null,
          movieId: mediaType === "movie" ? id : null,
          episodeId: episodeId,
        },
      });
      setComments(response.data);
    } catch (err) {
      setError(
        "Failed to load comments: " + (err.response?.data?.error || err.message)
      );
    }
  };

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const endpoint =
          mediaType === "movie"
            ? `/api/movies/${id}/${title}/watch`
            : `/api/tvseries/${id}/${title}/episode/${episodeNumber}/watch`;
        const response = await api.get(endpoint);
        setVideoUrl(response.data.videoUrl);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            "Failed to load video: " +
              (err.response?.data?.error || err.message)
          );
        }
      }
    };

    const fetchEpisodes = async () => {
      if (mediaType !== "tv") return;

      try {
        const seasonResponse = await api.get(`/api/tvseries/${id}/seasons`);
        const seasonData = seasonResponse.data;
        setSeasons(seasonData);

        if (seasonData.length > 0) {
          const episodesResponse = await api.get(
            `/api/tvseries/seasons/${seasonData[0].id}/episodes`
          );
          setEpisodes(episodesResponse.data);
        } else {
          setError("No seasons found for this series.");
        }
      } catch (err) {
        setError(
          "Failed to load episodes: " +
            (err.response?.data?.error || err.message)
        );
      }
    };

    fetchVideoUrl();
    fetchEpisodes();
    fetchComments();
  }, [id, title, episodeNumber, mediaType]);

  const getEpisodeId = () => {
    if (mediaType !== "tv" || !episodeNumber || episodes.length === 0)
      return null;
    const epNum = parseInt(episodeNumber.replace("episode-", "") || "0", 10);
    const episode = episodes.find(
      (ep) => (ep.episode_number || ep.episodeNumber) === epNum
    );
    return episode ? episode.id : null;
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        setError("Failed to play video. Please click play manually.");
      });
      logView();
    }
    setIsPlaying(!isPlaying);
  };

  const logView = async () => {
    try {
      await api.post("/api/viewlog/log", {
        contentId: parseInt(id),
        contentType: mediaType === "movie" ? "movie" : "tvseries",
      });
    } catch (error) {
      // Failed to log view
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const seekTime = (e.target.value / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    localStorage.setItem(getStorageKey(), seekTime.toString());
  };

  const handleQualityChange = (level) => {
    const hls = videoRef.current?.hls;
    if (hls) {
      hls.currentLevel = level;
      setSelectedQuality(level);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
  };

  const handleEpisodeChange = (episode) => {
    const slug = title;
    const newEpisodeNumber =
      episode.episode_number || episode.episodeNumber || 1;
    navigate(`/tvseries/${id}/${slug}/episode/${newEpisodeNumber}/watch`, {
      state: { videoUrl: episode.videoUrl },
    });
    setVideoUrl(episode.videoUrl);
  };

  const toggleSettingsMenu = () => {
    setShowSettingsMenu(!showSettingsMenu);
    if (settingsMenuTimeoutRef.current) {
      clearTimeout(settingsMenuTimeoutRef.current);
    }
  };

  const switchSettingsTab = (tab) => {
    setSettingsTab(tab);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .catch((err) => {
          setError("Full-screen mode is not supported or blocked.");
        })
        .then(() => {
          setIsFullScreen(true);
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };

  const handleSkipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(video.currentTime + 5, duration);
      setCurrentTime(video.currentTime);
      localStorage.setItem(getStorageKey(), video.currentTime.toString());
    }
  };

  const handleSkipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(video.currentTime - 5, 0);
      setCurrentTime(video.currentTime);
      localStorage.setItem(getStorageKey(), video.currentTime.toString());
    }
  };

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Check if user is logged in
    if (!currentUserId) {
      customToast("Please log in to comment", "warning");
      setShowAuthModal(true);
      return;
    }

    const episodeId = mediaType === "tv" ? getEpisodeId() : null;

    try {
      const response = await api.post("/api/comments", {
        userId: currentUserId,
        tvSeriesId: mediaType === "tv" ? parseInt(id) : null,
        movieId: mediaType === "movie" ? parseInt(id) : null,
        episodeId: episodeId,
        commentText: newComment,
      });
      setComments((prevComments) => [
        ...prevComments,
        { ...response.data, replies: [] },
      ]);
      setNewComment("");
      await fetchComments();

      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent("refreshNotifications"));
    } catch (err) {
      setError(
        `Failed to add comment: ${
          err.response?.data?.error || err.response?.statusText || err.message
        }`
      );
    }
  };

  const handleReplyComment = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    // Check if user is logged in
    if (!currentUserId) {
      customToast("Please log in to reply comment", "warning");
      setShowAuthModal(true);
      return;
    }

    const episodeId = mediaType === "tv" ? getEpisodeId() : null;

    try {
      const response = await api.post("/api/comments", {
        userId: currentUserId,
        tvSeriesId: mediaType === "tv" ? parseInt(id) : null,
        movieId: mediaType === "movie" ? parseInt(id) : null,
        episodeId: episodeId,
        parentCommentId: parentCommentId,
        commentText: replyText,
      });

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === parentCommentId
            ? { ...comment, replies: [...comment.replies, response.data] }
            : comment
        )
      );
      setReplyText("");
      setReplyCommentId(null);
      await fetchComments();

      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent("refreshNotifications"));
    } catch (err) {
      setError(
        "Failed to reply to comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const handleEditComment = (comment) => {
    setEditCommentId(comment.id);
    setEditCommentText(comment.commentText);
    setMenuOpen(null);
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    if (!editCommentText.trim()) return;

    try {
      const response = await api.put(`/api/comments/${commentId}`, {
        userId: currentUserId,
        commentText: editCommentText,
      });

      const updateComments = (commentsList) =>
        commentsList.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, commentText: response.data.commentText };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateComments(comment.replies),
            };
          }
          return comment;
        });

      setComments(updateComments(comments));
      setEditCommentId(null);
      setEditCommentText("");
    } catch (err) {
      setError(
        "Failed to update comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/comments/${commentId}`, {
        params: { userId: currentUserId },
      });

      const removeComment = (commentsList) =>
        commentsList
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies ? removeComment(comment.replies) : [],
          }));

      setComments(removeComment(comments));
      setMenuOpen(null);
    } catch (err) {
      setError(
        "Failed to delete comment: " +
          (err.response?.data?.error || err.response?.statusText || err.message)
      );
    }
  };

  const toggleMenu = (commentId) => {
    setMenuOpen(menuOpen === commentId ? null : commentId);
  };

  const renderComments = (commentsList, level = 0) => {
    return commentsList.map((comment) => (
      <div
        key={comment.id}
        className={`relative p-4 sm:p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 ${
          level > 0 ? "ml-6 sm:ml-12 mt-3" : ""
        }`}
      >
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-l-2xl" />
        )}

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 ring-yellow-400/50 bg-gradient-to-br from-yellow-400 to-yellow-600 flex-shrink-0">
                <img
                  src={comment.avatarUrl || "/src/assets/user.png"}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/src/assets/user.png";
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                {comment.displayName || comment.username}
              </span>
              <span className="text-gray-400 text-xs sm:text-sm flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          {comment.userId === currentUserId && (
            <div className="relative">
              <button
                onClick={() => toggleMenu(comment.id)}
                className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v.01M12 12v.01M12 18v.01"
                  />
                </svg>
              </button>
              {menuOpen === comment.id && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-20 animate-fadeIn">
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-yellow-400/10 hover:text-yellow-400 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors duration-200"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editCommentId === comment.id ? (
          <form
            onSubmit={(e) => handleUpdateComment(e, comment.id)}
            className="space-y-3"
          >
            <textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-900/50 text-white text-sm sm:text-base border border-gray-700 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 resize-none"
              rows="3"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-yellow-400/50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditCommentId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-3">
            {comment.commentText}
          </p>
        )}

        <div className="flex items-center gap-4 mb-3">
          <CommentLikeButton commentId={comment.id} />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              setReplyCommentId(
                replyCommentId === comment.id ? null : comment.id
              )
            }
            className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm font-medium transition-colors duration-200 group"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            {replyCommentId === comment.id ? "Cancel" : "Reply"}
          </button>

          {comment.replies && comment.replies.length > 0 && (
            <span className="flex items-center gap-1 text-gray-400 text-xs sm:text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              {comment.replies.length}{" "}
              {comment.replies.length === 1 ? "reply" : "replies"}
            </span>
          )}
        </div>

        {replyCommentId === comment.id && (
          <form
            onSubmit={(e) => handleReplyComment(e, comment.id)}
            className="mt-4 space-y-3 animate-slideDown"
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReplyComment(e, comment.id);
                }
              }}
              placeholder="Write a reply... (Press Enter to post)"
              className="w-full p-3 rounded-xl bg-gray-900/50 text-white text-sm border border-gray-700 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all duration-200 resize-none"
              rows="2"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-yellow-400/50"
            >
              Post Reply
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-3">
            {renderComments(comment.replies, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-2">
            Oops!
          </h3>
          <p className="text-gray-300 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                setVideoUrl(null);
              }}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-yellow-400 mb-4"></div>
          <p className="text-white text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen text-white">
      {showResumePrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-400/10 rounded-full mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Resume Playback?
            </h3>
            <p className="text-sm sm:text-base mb-6 text-center text-gray-300">
              You previously watched up to{" "}
              <span className="font-semibold text-yellow-400">
                {formatTime(savedTime)}
              </span>
              . Would you like to continue from where you left off?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResume}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-400/50 transform hover:scale-105"
              >
                Resume
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      <VideoFrame
        videoUrl={videoUrl}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        duration={duration}
        setDuration={setDuration}
        showControls={showControls}
        setShowControls={setShowControls}
        showSettingsMenu={showSettingsMenu}
        setShowSettingsMenu={setShowSettingsMenu}
        qualityLevels={qualityLevels}
        setQualityLevels={setQualityLevels}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        playbackRate={playbackRate}
        setPlaybackRate={setPlaybackRate}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
        onSeek={handleSeek}
        onQualityChange={handleQualityChange}
        onPlaybackRateChange={handlePlaybackRateChange}
        onToggleMute={toggleMute}
        onSkipForward={handleSkipForward}
        onSkipBackward={handleSkipBackward}
        onToggleFullScreen={toggleFullScreen}
        onPlayPause={handlePlayPause}
        formatTime={formatTime}
        containerRef={containerRef}
        videoRef={videoRef}
        handleMouseMove={handleMouseMove}
        posterUrl={seasons.length > 0 ? seasons[0].backdropUrl : null}
      />

      <div className="flex justify-center mt-8 px-4">
        <button
          onClick={() => {
            const movieData = {
              id,
              title,
              videoUrl,
              posterUrl: seasons.length > 0 ? seasons[0].backdropUrl : null,
              overview: "Episode " + episodeNumber,
              genres: ["TV Series"],
            };

            localStorage.setItem("selectedMovie", JSON.stringify(movieData));
            navigate("/watch-party/create", { state: { movie: movieData } });
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-yellow-400/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <svg
            className="w-6 h-6 relative z-10"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          <span className="relative z-10 text-lg">Watch Party</span>
        </button>
      </div>

      {mediaType === "tv" && (
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Episodes
            </h2>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-yellow-500/50 scrollbar-track-gray-800/50 hover:scrollbar-thumb-yellow-400/70">
            {episodes.length > 0 ? (
              episodes.map((episode) => {
                const currentEpisodeNumber =
                  episode.episode_number || episode.episodeNumber || 1;
                const isActive =
                  episodeNumber &&
                  currentEpisodeNumber.toString() ===
                    episodeNumber.replace("episode-", "");
                return (
                  <div
                    key={episode.id}
                    onClick={() => handleEpisodeChange(episode)}
                    className={`group relative flex-shrink-0 w-32 sm:w-40 h-20 sm:h-24 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 overflow-hidden ${
                      isActive
                        ? "ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/50"
                        : "hover:ring-2 hover:ring-yellow-400/50"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 ${
                        isActive
                          ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600"
                          : "bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700"
                      } transition-all duration-300`}
                    ></div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 ${
                          isActive
                            ? "bg-black/20"
                            : "bg-white/10 group-hover:bg-white/20"
                        } transition-all duration-300`}
                      >
                        <svg
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            isActive ? "text-black" : "text-white"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <h3
                        className={`text-sm sm:text-base font-bold text-center ${
                          isActive ? "text-black" : "text-white"
                        }`}
                      >
                        EP {currentEpisodeNumber}
                      </h3>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center py-12">
                <p className="text-gray-400 text-lg">No episodes available.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Comments
          </h2>
          <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-300">
              {comments.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleAddComment} className="mb-8">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment(e);
                }
              }}
              placeholder="Share your thoughts..."
              className="w-full p-4 pr-24 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm text-white text-sm sm:text-base border border-gray-700 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 transition-all duration-200 resize-none placeholder-gray-500"
              rows="3"
            />
            <button
              type="submit"
              className="absolute right-3 bottom-3 px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-yellow-400/50 transform hover:scale-105 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Post
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/50 rounded-full mb-4">
                <svg
                  className="w-10 h-10 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">No comments yet</p>
              <p className="text-gray-500 text-sm">
                Be the first to share your thoughts!
              </p>
            </div>
          )}
        </div>
      </div>

      <RecommendedMovies movieId={id} />

      {/* Auth Modal */}
      <AuthModal
        show={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Re-check authentication after modal closes
          const token = localStorage.getItem("accessToken");
          if (token) {
            try {
              const decoded = jwtDecode(token);
              const userId = decoded["sub"];
              setCurrentUserId(parseInt(userId, 10));
            } catch (err) {
              localStorage.removeItem("accessToken");
              setCurrentUserId(null);
            }
          }
        }}
      />
    </div>
  );
};

export default MoviePlayer;
