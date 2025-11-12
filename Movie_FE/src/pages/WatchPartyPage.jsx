import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import api from "../api/api.jsx";
import Hls from "hls.js";
import { BsToggleOff } from "react-icons/bs";
import { PiVideoCameraSlashFill } from "react-icons/pi";
import { FaArrowLeft } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

import VideoPartyFrame from "../components/frame/VideoPartyFrame.jsx";
import ChatBox from "../components/watch-party/ChatBox.jsx";
import HostInfoBar from "../components/watch-party/HostInfoBar.jsx";
import MovieInfo from "../components/watch-party/MovieInfo.jsx";
import timeAgo from "../utils/timeAgo.js";
import customSwal from "../utils/customSwal.js";

const WatchParty = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  // 🧩 Params
  const roomId = query.get("roomId");
  let currentUser;
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decoded = jwtDecode(token);
      currentUser = decoded.sub;
    }
  } catch {
    console.error("❌ Token decode error:", err);
  }

  if (!currentUser) {
    // Kiểm tra xem đã có guestId trong localStorage chưa
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = `Guest-${Math.floor(100000 + Math.random() * 900000)}`; // VD: Guest-482901
      localStorage.setItem("guestId", guestId);
    }
    currentUser = guestId;
  }

  // ⚙️ State
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [hostInfo, setHostInfo] = useState({ hostUserId: "", createdAt: "" });

  // Video state
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

  const [userProfile, setUserProfile] = useState({
    displayName: "",
    email: "",
    avatarUrl: "",
  });

  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // ======================================================
  // 🧠 SignalR
  // ======================================================
  useEffect(() => {
    const connect = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connect
      .start()
      .then(async () => {
        console.log("✅ Connected to SignalR Hub");
        setConnection(connect);
        setIsConnected(true);
        await connect.invoke("JoinRoom", roomId, currentUser);
      })
      .catch((err) => console.error("SignalR connection error:", err));

    // Chat
    connect.on("ReceiveChat", (user, message) =>
      setMessages((prev) => [...prev, { user, text: message }])
    );

    // Play / Pause
    connect.on("ReceivePlay", (time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        video.play().catch(() => {});
        setIsPlaying(true);
      }
    });

    connect.on("ReceivePause", (time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        video.pause();
        setIsPlaying(false);
      }
    });

    // Seek
    connect.on("ReceiveSeek", (time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        setCurrentTime(time);
      }
    });

    // Skip
    connect.on("ReceiveSkipForward", () => {
      const video = videoRef.current;
      if (video && duration) {
        const newTime = Math.min(video.currentTime + 5, duration);
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    });
    connect.on("ReceiveSkipBackward", () => {
      const video = videoRef.current;
      if (video) {
        const newTime = Math.max(video.currentTime - 5, 0);
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    });

    // Session start / end
    connect.on("ReceiveStartSession", () => {
      console.log("🎥 Session started!");
      setSessionStarted(true);
      const video = videoRef.current;
      if (video) video.play().catch(() => {});
      setIsPlaying(true);
    });

    connect.on("ReceiveEndSession", () => {
      console.log("🎬 Session ended!");
      const video = videoRef.current;
      if (video) video.pause();
      setSessionStarted(false);
      setIsPlaying(false);
      customSwal("The watch party has ended!", "See you soon!", "info").then(
        () => navigate("/")
      );
    });

    connect.on(
      "JoinedRoom",
      (
        roomId,
        isHostFromServer,
        hostUserId,
        hostDisplayName,
        hostAvatarUrl,
        createdAt,
        count
      ) => {
        setIsHost(isHostFromServer);
        setHostInfo({
          hostUserId,
          hostDisplayName,
          hostAvatar: hostAvatarUrl,
          createdAt,
        });
        setViewerCount(count || 1);
        console.log(
          `👤 Host Profile: ${hostDisplayName}, Avatar: ${hostAvatarUrl}`
        );
      }
    );

    connect.on("ViewerCountUpdated", (count) => {
      setViewerCount(count);
    });

    return () => connect.stop();
  }, [duration]);

  // ======================================================
  // 🎞️ Video HLS
  // ======================================================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const videoUrl =
      "https://d2az2ylwxkh7fk.cloudfront.net/tvseries/Solo+Leveling/season-1/episode-2/master.m3u8";

    let hls;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) =>
        setQualityLevels(data.levels || [])
      );
      hls.on(Hls.Events.ERROR, (_, data) =>
        console.error("🚨 HLS Error:", data)
      );
    }

    video.onloadedmetadata = () => setDuration(video.duration);
    video.ontimeupdate = () => setCurrentTime(video.currentTime);
    video.onended = () => setIsPlaying(false);

    return () => hls && hls.destroy();
  }, [sessionStarted]);

  // ======================================================
  // 🎬 Video controls
  // ======================================================
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !connection) return;
    if (isPlaying) {
      video.pause();
      await connection.invoke("SyncPause", roomId, video.currentTime);
    } else {
      await video.play().catch(() => {});
      await connection.invoke("SyncPlay", roomId, video.currentTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (e) => {
    const video = videoRef.current;
    const newTime = (e.target.value / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
    await connection.invoke("SyncSeek", roomId, newTime);
  };

  const handleSkipForward = async () => {
    const video = videoRef.current;
    const newTime = Math.min(video.currentTime + 5, duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    await connection.invoke("SyncSkipForward", roomId);
  };

  const handleSkipBackward = async () => {
    const video = videoRef.current;
    const newTime = Math.max(video.currentTime - 5, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    await connection.invoke("SyncSkipBackward", roomId);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !isMuted;
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
  // 🧩 Host actions
  // ======================================================
  const handleStartSession = async () => {
    if (connection && isHost) {
      await connection.invoke("StartSession", roomId);
      setSessionStarted(true);
    }
  };

  const handleEndSession = async () => {
    if (connection && isHost) {
      await connection.invoke("EndSession", roomId);
      setSessionStarted(false);
      const video = videoRef.current;
      if (video) video.pause();
    }
  };

  // ======================================================
  // 🧾 Chat
  // ======================================================
  const handleSend = async () => {
    if (!input.trim() || !connection) return;
    await connection.invoke("SendChat", roomId, currentUser, input);
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ======================================================
  // 🖥️ JSX
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
              <h1 className="text-lg font-semibold">Watch Party Room</h1>
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
          formatTime={(t) =>
            `${Math.floor(t / 60)}:${Math.floor(t % 60)
              .toString()
              .padStart(2, "0")}`
          }
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
          handleQualityChange={(q) => setSelectedQuality(q)}
          qualityLevels={qualityLevels}
          selectedQuality={selectedQuality}
          playbackRate={playbackRate}
          toggleFullScreen={toggleFullScreen}
          isFullScreen={isFullScreen}
          handleMouseMove={() => {
            setShowControls(true);
            clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
              if (isPlaying && !showSettingsMenu) setShowControls(false);
            }, 3000);
          }}
          sessionStarted={sessionStarted}
          isHost={isHost}
          handleStartSession={handleStartSession}
        />

        {/* Host Info */}
        <HostInfoBar
          avatarUrl={hostInfo.hostAvatar}
          hostName={hostInfo.hostDisplayName || `User ${hostInfo.hostUserId}`}
          timeText={`Created ${timeAgo(hostInfo.createdAt)}`}
          views={viewerCount}
        />

        {/* Movie Info */}
        <MovieInfo
          posterUrl="https://m10.hentaiera.com/029/bt1rvyaflj/9t.jpg"
          title="Nhật Quyền Nhân"
          originalTitle="One Punch Man"
          year="2015"
          season="3"
          episode="4"
          genres={[
            "Hành Động",
            "Anime",
            "Hài",
            "Hoạt Hình",
            "Kỹ Ảo",
            "Phiêu Lưu",
          ]}
        />
      </div>

      {/* Chat Box */}
      <ChatBox
        isChatHidden={isChatHidden}
        setIsChatHidden={setIsChatHidden}
        messages={messages}
        input={input}
        setInput={setInput}
        handleKeyPress={handleKeyPress}
        handleSend={handleSend}
        currentUser={currentUser}
        isConnected={isConnected}
      />
    </div>
  );
};

export default WatchParty;
