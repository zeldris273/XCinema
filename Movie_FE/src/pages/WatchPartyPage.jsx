import React, { useState, useRef, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import Hls from "hls.js";
import { BsToggleOff } from "react-icons/bs";
import { FaStop, FaArrowLeft } from "react-icons/fa";
import { PiVideoCameraSlashFill } from "react-icons/pi";
import VideoPartyFrame from "../components/frame/VideoPartyFrame.jsx";
import ChatBox from "../components/watch-party/ChatBox.jsx";
import HostInforBar from "../components/watch-party/HostInfoBar.jsx";
import HostInfoBar from "../components/watch-party/HostInfoBar.jsx";
import { useNavigate } from "react-router-dom";
import MovieInfo from "../components/watch-party/MovieInfo.jsx";
import customSwal from "../utils/customSwal.js";

const WatchParty = () => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isHost] = useState(true);

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

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const settingsMenuTimeoutRef = useRef(null);

  const navigate = useNavigate();

  const roomId = "room123";
  const [currentUser] = useState(`User${Math.floor(Math.random() * 1000)}`);

  useEffect(() => {
    const saved = localStorage.getItem("sessionStarted");
    if (saved === "true") {
      console.log("🟢 Khôi phục buổi xem từ localStorage");
      setSessionStarted(true);

      // Chờ một chút cho video mount xong rồi phát
      setTimeout(() => {
        const video = videoRef.current;
        if (video) {
          video.play().catch(() => console.log("Autoplay bị chặn"));
          setIsPlaying(true);
        }
      }, 500);
    }
  }, []);

  // ===================== SignalR Connection =====================
  useEffect(() => {
    const connect = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connect
      .start()
      .then(() => {
        console.log("✅ Connected to SignalR Hub");
        setConnection(connect);
        setIsConnected(true);
        connect.invoke("JoinRoom", roomId);
      })
      .catch((err) => console.error("SignalR connection error:", err));

    connect.on("ReceiveChat", (user, message) => {
      setMessages((prev) => [...prev, { user, text: message }]);
    });

    connect.on("ReceivePlay", (time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        video.play();
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

    connect.on("ReceiveSeek", (time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        setCurrentTime(time);
      }
    });

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

    // Khi host bắt đầu buổi xem chung
    connect.on("ReceiveStartSession", () => {
      console.log("Buổi xem chung đã bắt đầu!");
      setSessionStarted(true);
    });

    // Khi host kết thúc
    connect.on("ReceiveEndSession", () => {
      const video = videoRef.current;
      if (video) video.pause();
      setIsPlaying(false);
      setSessionStarted(false);
      customSwal("The watch party is over!!", "See you soon!", "info");
    });

    return () => {
      connect.stop();
    };
  }, [duration]);

  // ===================== HLS Setup =====================
  useEffect(() => {
    const video = videoRef.current;
    const videoUrl =
      "https://d2az2ylwxkh7fk.cloudfront.net/tvseries/Solo+Leveling/season-1/episode-2/master.m3u8";

    if (!video) return;
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
      video.hls = hls;
    }

    if (sessionStarted) {
      setTimeout(() => {
        if (video.readyState >= 2) {
          video.play().catch(() => console.log("Autoplay bị chặn"));
          setIsPlaying(true);
        } else {
          video.oncanplay = () => {
            video.play().catch(() => console.log("Autoplay bị chặn"));
            setIsPlaying(true);
          };
        }
      }, 400);
    }

    video.onloadedmetadata = () => setDuration(video.duration);
    video.ontimeupdate = () => setCurrentTime(video.currentTime);
    video.onended = () => setIsPlaying(false);

    return () => {
      if (hls) hls.destroy();
    };
  }, []);

  // ===================== Helpers =====================
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // ===================== Chat =====================
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

  // ===================== Video Controls =====================
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !connection) return;
    if (isPlaying) {
      video.pause();
      await connection.invoke("SyncPause", roomId, video.currentTime);
    } else {
      await video.play();
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

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettingsMenu(false);
  };

  const handleQualityChange = (level) => {
    const hls = videoRef.current?.hls;
    if (hls && typeof level === "number") {
      hls.currentLevel = level;
      setSelectedQuality(level);
      setShowSettingsMenu(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettingsMenu) setShowControls(false);
    }, 3000);
  };

  // ===================== Host Actions =====================
  const handleStartSession = async () => {
    if (connection) {
      await connection.invoke("StartSession", roomId);
      console.log("✅ Nhận được tín hiệu bắt đầu xem!");

      setSessionStarted(true);
      localStorage.setItem("sessionStarted", "true");

      const video = videoRef.current;
      if (video) {
        try {
          await video.play();
          await connection.invoke("SyncPlay", roomId, video.currentTime);
          setIsPlaying(true);
        } catch (err) {
          console.error("Không thể tự động phát video:", err);
        }
      }
    }
  };

  const handleEndSession = async () => {
    if (connection) {
      await connection.invoke("EndSession", roomId);
      setSessionStarted(false);
      const video = videoRef.current;
      if (video) video.pause();
    }
  };

  // ===================== JSX =====================
  return (
    <div className="flex min-h-screen bg-black text-white overflow-hidden">
      {/* LEFT SIDE */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-black border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-neutral-800 transition"
              >
                <FaArrowLeft className="text-gray-300 text-lg hover:text-white" />
              </button>

              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>{" "}
                LIVE
              </span>
              <div>
                <h1 className="text-lg font-semibold">
                  Let's Watch Nhật Quyền Nhân Together!
                </h1>
                <p className="text-sm text-gray-400">
                  Season 3 - Episode 1 • Nhật Quyền Nhân
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isChatHidden && (
              <button
                onClick={() => setIsChatHidden(false)}
                className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 px-3 py-1.5 rounded-lg text-gray-200 transition"
              >
                <span className="text-sm">Hiện</span>
                <BsToggleOff className="text-xl text-yellow-500" />
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
          handleQualityChange={handleQualityChange}
          qualityLevels={qualityLevels}
          selectedQuality={selectedQuality}
          handlePlaybackRateChange={handlePlaybackRateChange}
          playbackRate={playbackRate}
          toggleFullScreen={toggleFullScreen}
          isFullScreen={isFullScreen}
          handleMouseMove={handleMouseMove}
          sessionStarted={sessionStarted}
          isHost={isHost}
          handleStartSession={handleStartSession}
        />

        {/* Viewer Info Bar */}

        <HostInfoBar
          avatarUrl="https://ic-vt-nss.xhcdn.com/a/YTkwN2JmOGYwMTFkZjBmYmY2ZDU1Mjc0MGU3MjQxNjQ/s(w:2560,h:1440),webp/026/688/155/v2/2560x1440.204.webp"
          viewerName="Hinata hentai"
          timeText="Created 5 minutes ago"
          views={1}
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
