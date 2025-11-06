import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { jwtDecode } from "jwt-decode";
import VideoFrame from "../components/frame/VideoFrame";
import RecommendedMovies from "../components/common/RecommendedMovies";

const MoviePlayer = () => {
  const { id, title, episodeNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState(null);
  const [episodes, setEpisodes] = useState([]);
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
        console.error("Play failed:", err.message);
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
        console.error("Play failed:", err.message);
        setError("Failed to play video. Please click play manually.");
      });
      setIsPlaying(true);
    }
    setShowResumePrompt(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userId = decoded["sub"];
        setCurrentUserId(parseInt(userId, 10));
      } catch (err) {
        console.error("Error decoding token:", err);
        setError("Invalid token. Please log in again.");
        navigate("/auth");
      }
    } else {
      setError("You are not logged in. Please log in to continue.");
      navigate("/auth");
    }
  }, [navigate]);

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
        const seasons = seasonResponse.data;

        if (seasons.length > 0) {
          const episodesResponse = await api.get(
            `/api/tvseries/seasons/${seasons[0].id}/episodes`
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
        console.error("Play failed:", err.message);
        setError("Failed to play video. Please click play manually.");
      });
      // Log view when user starts playing
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
      console.error("Failed to log view:", error);
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
          console.error("Error attempting to enable full-screen mode:", err);
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
        className={`p-2 sm:p-4 bg-gray-800 rounded-lg flex flex-col space-y-1 ${
          level > 0 ? "ml-4 sm:ml-8 border-l-2 border-gray-700" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-600 flex-shrink-0">
              <img
                src={comment.avatarUrl || "/src/assets/user.png"}
                alt="User Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/src/assets/user.png";
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base">
                {comment.displayName || comment.username}
              </span>
              <span className="text-gray-400 text-xs sm:text-sm">
                {new Date(comment.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
          {comment.userId === currentUserId && (
            <div className="relative">
              <button
                onClick={() => toggleMenu(comment.id)}
                className="text-gray-400 hover:text-gray-300"
              >
                <svg
                  className="w-4 sm:w-5 h-4 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
                <div className="absolute right-0 mt-2 w-24 sm:w-32 bg-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleEditComment(comment)}
                    className="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-600 rounded-t-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="block w-full text-left px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-gray-200 hover:bg-gray-600 rounded-b-lg"
                  >
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
            className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2"
          >
            <input
              type="text"
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="flex-1 p-1 sm:p-2 rounded-lg bg-gray-700 text-white text-xs sm:text-sm border border-gray-600 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-xs sm:text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditCommentId(null)}
              className="px-2 sm:px-3 py-1 bg-gray-600 rounded-lg hover:bg-gray-500 text-xs sm:text-sm"
            >
              Cancel
            </button>
          </form>
        ) : (
          <p className="text-gray-300 text-sm sm:text-base">
            {comment.commentText}
          </p>
        )}

        <button
          onClick={() =>
            setReplyCommentId(replyCommentId === comment.id ? null : comment.id)
          }
          className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm mt-1 self-start"
        >
          {replyCommentId === comment.id ? "Cancel Reply" : "Reply"}
        </button>

        {replyCommentId === comment.id && (
          <form
            onSubmit={(e) => handleReplyComment(e, comment.id)}
            className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 p-1 sm:p-2 rounded-lg bg-gray-700 text-white text-xs sm:text-sm border border-gray-600 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-3 py-1 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-xs sm:text-sm"
            >
              Post Reply
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 sm:mt-2">
            {renderComments(comment.replies, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (error) {
    return (
      <div className="mt-15 text-white text-center p-4">
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            setVideoUrl(null);
          }}
          className="ml-2 px-2 py-1 bg-yellow-500 rounded text-sm hover:bg-yellow-400"
        >
          Retry
        </button>
        <button
          onClick={() => navigate("/")}
          className="ml-2 px-2 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!videoUrl) {
    return <div className="text-white text-center p-4">Loading video...</div>;
  }

  if (!currentUserId) {
    return <div className="text-white text-center p-4">Authenticating...</div>;
  }

  return (
    <div className="bg-neutral-900 min-h-screen text-white">
      {showResumePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-80 sm:w-96 text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
              Resume Playback
            </h3>
            <p className="text-sm sm:text-base mb-4 sm:mb-6">
              You previously watched up to {formatTime(savedTime)}. Would you
              like to resume from there?
            </p>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <button
                onClick={handleResume}
                className="px-4 sm:px-6 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400 text-sm sm:text-base"
              >
                Resume
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 sm:px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-sm sm:text-base"
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
      />

      {mediaType === "tv" && (
        <div className="container mx-auto p-2 sm:p-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
            Episodes
          </h2>
          <div className="flex overflow-x-auto space-x-2 sm:space-x-4 pb-2 sm:pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
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
                    className={`flex-shrink-0 w-16 sm:w-30 p-1 sm:p-2 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-yellow-500 border-yellow-300"
                        : "bg-slate-700 hover:bg-slate-600 border-slate-600"
                    }`}
                  >
                    <h3 className="text-xs sm:text-sm font-semibold text-center">
                      Episode {currentEpisodeNumber}
                    </h3>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No episodes available.</p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto p-2 sm:p-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Comments</h2>
        <form onSubmit={handleAddComment} className="mb-3 sm:mb-6">
          <div className="flex items-center space-x-1 sm:space-x-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-2 sm:p-3 rounded-lg bg-gray-800 text-white text-sm sm:text-base border border-gray-700 focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              className="px-2 sm:px-4 py-1 sm:py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400 transition-all text-sm sm:text-base"
            >
              Post
            </button>
          </div>
        </form>
        <div className="space-y-2 sm:space-y-4">
          {comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <p className="text-gray-400 text-center text-sm sm:text-base">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>

      <RecommendedMovies movieId={id} />
    </div>
  );
};

export default MoviePlayer;
