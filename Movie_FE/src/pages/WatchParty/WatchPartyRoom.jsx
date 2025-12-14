import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import Hls from "hls.js";
import { BsToggleOff } from "react-icons/bs";
import { PiVideoCameraSlashFill } from "react-icons/pi";
import { FaArrowLeft } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import { useParams } from "react-router-dom";

import VideoPartyFrame from "../../components/frame/VideoPartyFrame.jsx";
import ChatBox from "../../components/watch-party/ChatBox.jsx";
import HostInfoBar from "../../components/watch-party/HostInfoBar.jsx";
import MovieInfo from "../../components/watch-party/MovieInfo.jsx";
import timeAgo from "../../utils/timeAgo.js";
import customSwal from "../../utils/customSwal.js";

const WatchPartyRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const query = new URLSearchParams(location.search);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Nếu có create=true thì xóa nó khỏi URL NGAY LẬP TỨC
    if (params.get("create") === "true") {
      params.delete("create");

      const newUrl =
        window.location.pathname +
        (params.toString() ? "?" + params.toString() : "");

      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Current user or guest
  let currentUser = null;
  try {
    const token = localStorage.getItem("accessToken");
    if (token) currentUser = jwtDecode(token).sub;
  } catch {}

  if (!currentUser) {
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = `Guest-${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem("guestId", guestId);
    }
    currentUser = guestId;
  }

  // ======================================================
  // 🔧 State variables
  // ======================================================
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const [movie, setMovie] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const [viewerCount, setViewerCount] = useState(1);
  const [hostInfo, setHostInfo] = useState({});

  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [input, setInput] = useState("");

  const [userProfile, setUserProfile] = useState({
    displayName: "",
    avatarUrl: "",
  });

  // Video states
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState(-1);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState("quality");

  const [isChatHidden, setIsChatHidden] = useState(false);
  const controlsTimeoutRef = useRef(null);

  // ======================================================
  // 1️⃣ SIGNALR — FIXED VERSION
  // ======================================================
  useEffect(() => {
    if (!roomId || !currentUser) {
      return;
    }

    const hub = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_BACKEND_API_URL + "/watchpartyhub")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 🧩 Setup all event listeners BEFORE connecting
    hub.on(
      "JoinedRoom",
      (
        roomId,
        isHostFromServer,
        hostUserId,
        hostDisplayName,
        hostAvatarUrl,
        createdAt,
        count,
        movieDataJson,
        autoStart,
        scheduledStartTime
      ) => {
        setIsHost(isHostFromServer);
        setViewerCount(count || 1);

        const hostInfoData = {
          hostUserId,
          hostDisplayName,
          hostAvatar: hostAvatarUrl,
          createdAt,
          autoStart,
          scheduledStartTime,
        };

        setHostInfo(hostInfoData);

        if (movieDataJson) {
          try {
            const parsed = JSON.parse(movieDataJson);
            setMovie(parsed);
            localStorage.setItem("selectedMovie", JSON.stringify(parsed));
          } catch (err) {
            // Failed to parse movie data
          }
        } else {
          // Try to get from localStorage if server doesn't have it
          const cachedMovie = localStorage.getItem("selectedMovie");
          if (cachedMovie) {
            try {
              const parsed = JSON.parse(cachedMovie);
              setMovie(parsed);
            } catch (err) {
              // Failed to parse cached movie data
            }
          }
        }

        // Show scheduled info if autoStart is enabled
        if (autoStart && scheduledStartTime) {
          const scheduledDate = new Date(scheduledStartTime);
          const now = new Date();
          const timeDiff = scheduledDate - now;

          if (timeDiff > 0) {
            const minutes = Math.floor(timeDiff / 60000);
            const seconds = Math.floor((timeDiff % 60000) / 1000);

            setSystemMessages((prev) => [
              ...prev,
              ` This session is scheduled to start automatically at ${scheduledDate.toLocaleString()}` +
                ` (in ${minutes}m ${seconds}s)`,
            ]);
          }
        }
      }
    );

    hub.on("ViewerCountUpdated", (count) => {
      setViewerCount(count);
    });

    hub.on("ReceiveUserProfile", (displayName, avatarUrl) => {
      setUserProfile({ displayName, avatarUrl });
    });

    hub.on("ReceiveChat", (user, text, avatar) => {
      setMessages((prev) => [...prev, { user, text, avatar }]);
    });

    hub.on("ReceiveSystemMessage", (msg) => {
      setSystemMessages((prev) => [...prev, msg]);
    });

    // ======================================================
    // 🎥 START SESSION - THIS IS THE KEY FIX
    // ======================================================
    hub.on("ReceiveStartSession", () => {
      setSessionStarted(true);

      // Wait a bit for React state to update
      setTimeout(() => {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        video.currentTime = 0;
        video
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            // Play failed
          });
      }, 100);
    });

    // ======================================================
    // 🎬 END SESSION
    // ======================================================
    hub.on("ReceiveEndSession", () => {
      const v = videoRef.current;
      if (v) v.pause();
      setSessionStarted(false);
      setIsPlaying(false);

      customSwal("Watch party ended!", "See you soon!", "info").then(() =>
        navigate("/")
      );
    });

    // ======================================================
    // 🎞 SYNC EVENTS
    // ======================================================
    hub.on("ReceivePlay", (time) => {
      const v = videoRef.current;
      if (!v) return;

      v.currentTime = time;
      v.play().catch(() => {});
      setIsPlaying(true);
    });

    hub.on("ReceivePause", (time) => {
      const v = videoRef.current;
      if (!v) return;

      v.currentTime = time;
      v.pause();
      setIsPlaying(false);
    });

    hub.on("ReceiveSeek", (time) => {
      const v = videoRef.current;
      if (!v) return;

      v.currentTime = time;
      setCurrentTime(time);
    });

    hub.on("ReceiveSkipForward", () => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.min(v.currentTime + 5, duration);
    });

    hub.on("ReceiveSkipBackward", () => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = Math.max(v.currentTime - 5, 0);
    });

    // ======================================================
    // 🚨 ERROR HANDLER
    // ======================================================
    hub.on("Error", (message) => {
      customSwal("Error", message, "error");
    });

    // 🔥 Setup RoomCreated event listener
    hub.on("RoomCreated", (createdRoomId, success, errorMessage) => {
      if (!success) {
        setError(errorMessage || "Failed to create room. Please try again.");
        setTimeout(() => {
          navigate("/watch-party");
        }, 3000);
      }
    });

    // 🔥 Now connect and join
    hub
      .start()
      .then(async () => {
        setConnection(hub);
        setIsConnected(true);

        // 🔥 CHECK IF WE NEED TO CREATE ROOM (for host)
        const isCreatingRoom = query.get("create") === "true";
        const movieData = localStorage.getItem("selectedMovie");

        if (isCreatingRoom && movieData) {
          const autoStart = localStorage.getItem("autoStart") === "true";
          const scheduledStartTimeStr =
            localStorage.getItem("scheduledStartTime");
          const isPrivate = localStorage.getItem("isPrivateRoom") === "true";

          let scheduledStartTime = null;
          if (autoStart && scheduledStartTimeStr) {
            scheduledStartTime = new Date(scheduledStartTimeStr);
          }

          await hub.invoke(
            "CreateRoom",
            roomId,
            currentUser,
            movieData,
            autoStart,
            scheduledStartTime,
            isPrivate
          );

          // 🔥 Clean up flags
          localStorage.removeItem("isCreatingRoom");
          localStorage.removeItem("autoStart");
          localStorage.removeItem("scheduledStartTime");
          localStorage.removeItem("isPrivateRoom");
        }

        await hub.invoke("JoinRoom", roomId, currentUser);
      })
      .catch((err) => {
        // SignalR connection error
      });

    return () => {
      hub.stop();
    };
  }, [roomId, currentUser]); // 🔥 Add dependencies

  // ======================================================
  // 2️⃣ HLS VIDEO LOAD - Load video AFTER session started
  // ======================================================
  useEffect(() => {
    if (!sessionStarted) return; // 🔥 Only load when started

    const video = videoRef.current;
    if (!video) {
      return;
    }

    // 🔥 Get video URL from movie data
    const videoUrl = movie?.videoUrl;

    if (!videoUrl) {
      return;
    }

    let hls;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualityLevels(data.levels || []);
      });
    }

    video.onloadedmetadata = () => {
      setDuration(video.duration);
    };

    video.ontimeupdate = () => setCurrentTime(video.currentTime);
    video.onended = () => setIsPlaying(false);

    return () => hls && hls.destroy();
  }, [sessionStarted]); // 🔥 Trigger when session starts

  // ======================================================
  // 3️⃣ VIDEO CONTROL
  // ======================================================
  const handlePlayPause = async () => {
    if (!connection) return;
    const v = videoRef.current;

    if (isPlaying) {
      v.pause();
      await connection.invoke("SyncPause", roomId, v.currentTime);
    } else {
      v.play().catch(() => {});
      await connection.invoke("SyncPlay", roomId, v.currentTime);
    }

    setIsPlaying(!isPlaying);
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);

    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleSeek = async (e) => {
    const v = videoRef.current;
    const newTime = (e.target.value / 100) * duration;

    v.currentTime = newTime;
    setCurrentTime(newTime);

    await connection.invoke("SyncSeek", roomId, newTime);
  };

  const handleSkipForward = async () => {
    await connection.invoke("SyncSkipForward", roomId);
  };

  const handleSkipBackward = async () => {
    await connection.invoke("SyncSkipBackward", roomId);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // ======================================================
  // 4️⃣ HOST ACTIONS
  // ======================================================
  const handleStartSession = async () => {
    if (!connection || !isHost) {
      return;
    }

    try {
      await connection.invoke("StartSession", roomId);
    } catch (err) {
      // StartSession failed
    }
  };

  const handleEndSession = async () => {
    if (connection && isHost) {
      await connection.invoke("EndSession", roomId);
    }
  };

  // ======================================================
  // 5️⃣ CHAT
  // ======================================================
  const handleSend = async () => {
    if (!input.trim()) return;

    const sender = userProfile.displayName || currentUser;
    const avatar =
      userProfile.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${sender}`;

    await connection.invoke("SendChat", roomId, sender, input, avatar);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ======================================================
  // 6️⃣ RENDER UI
  // ======================================================
  return (
    <div className="flex min-h-screen bg-black text-white overflow-hidden">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-black border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-neutral-800 transition"
            >
              <FaArrowLeft className="text-gray-300 text-lg hover:text-white" />
            </button>

            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>

            <div>
              <h1 className="text-lg font-semibold">
                Let's Watch {movie?.title || "Loading"} Together !
              </h1>
              <p className="text-sm text-gray-400">Room ID: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isChatHidden && (
              <button
                onClick={() => setIsChatHidden(false)}
                className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 px-3 py-1.5 rounded-lg text-gray-200 transition"
              >
                <span className="text-sm">Show Chat</span>
                <BsToggleOff className="text-xl text-yellow-500" />
              </button>
            )}

            {isHost && !sessionStarted && (
              <button
                onClick={handleStartSession}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-5 py-2.5 rounded-full transition font-semibold shadow-lg"
              >
                ▶ Start
              </button>
            )}

            {isHost && sessionStarted && (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-5 py-2.5 rounded-full transition font-semibold shadow-lg"
              >
                <PiVideoCameraSlashFill className="text-lg text-red-600" /> End
              </button>
            )}
          </div>
        </div>

        {/* Video Frame */}
        <VideoPartyFrame
          videoRef={videoRef}
          containerRef={containerRef}
          showControls={showControls}
          currentTime={currentTime}
          duration={duration}
          formatTime={formatTime}
          handleSeek={handleSeek}
          handlePlayPause={handlePlayPause}
          isPlaying={isPlaying}
          toggleMute={toggleMute}
          isMuted={isMuted}
          handleSkipBackward={handleSkipBackward}
          handleSkipForward={handleSkipForward}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          handleQualityChange={setSelectedQuality}
          qualityLevels={qualityLevels}
          selectedQuality={selectedQuality}
          playbackRate={playbackRate}
          handlePlaybackRateChange={(rate) => {
            const video = videoRef.current;
            if (video) video.playbackRate = rate;
            setPlaybackRate(rate);
          }}
          toggleFullScreen={toggleFullScreen}
          isFullScreen={isFullScreen}
          handleMouseMove={handleMouseMove}
          sessionStarted={sessionStarted}
          isHost={isHost}
          handleStartSession={handleStartSession}
          movieTitle={movie?.title || "Loading..."}
          movieBackdrop={movie?.backdropUrl}
        />

        {/* Host Info */}
        <HostInfoBar
          avatarUrl={
            hostInfo.hostAvatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${hostInfo.hostUserId}`
          }
          hostName={
            hostInfo.hostDisplayName ||
            `User ${hostInfo.hostUserId || "Unknown"}`
          }
          timeText={
            hostInfo.createdAt
              ? `Created ${timeAgo(hostInfo.createdAt)}`
              : "Just now"
          }
          views={viewerCount}
          scheduledStartTime={hostInfo.scheduledStartTime}
          autoStart={hostInfo.autoStart}
          movie={movie}
        />

        {/* Movie Info */}
        {movie && (
          <MovieInfo
            posterUrl={movie.posterUrl || movie.backdropUrl}
            title={movie.title}
            originalTitle={movie.originalTitle || movie.title}
            year={
              movie.releaseDate
                ? new Date(movie.releaseDate).getFullYear()
                : "N/A"
            }
            season={movie.seasonNumber || "1"}
            episode={movie.episodeNumber || "1"}
            genres={movie.genres || []}
          />
        )}
      </div>

      {/* Chat */}
      <ChatBox
        isChatHidden={isChatHidden}
        setIsChatHidden={setIsChatHidden}
        messages={messages}
        systemMessages={systemMessages}
        input={input}
        setInput={setInput}
        handleKeyPress={handleKeyPress}
        handleSend={handleSend}
        currentUser={
          userProfile.displayName || currentUser
        }
        avatarUrl={userProfile.avatarUrl}
        isConnected={isConnected}
      />
    </div>
  );
};

export default WatchPartyRoom;
