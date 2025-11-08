import React, { useState, useRef, useEffect } from "react";
import { BsSend, BsToggleOn, BsToggleOff } from "react-icons/bs";
import {
  MdOutlineForward5,
  MdReplay5,
  MdFullscreen,
  MdFullscreenExit,
  MdSignalCellularAlt,
  MdSchedule,
  MdClose,
} from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiVolumeMuteFill } from "react-icons/ri";
import { FaVolumeUp } from "react-icons/fa";
import * as signalR from "@microsoft/signalr";
import Hls from "hls.js";

const WatchParty = () => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
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
  const roomId = "room123";
  const [currentUser] = useState(`User${Math.floor(Math.random() * 1000)}`);

  // ✅ Kết nối SignalR
  useEffect(() => {
    const connect = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connect
      .start()
      .then(() => {
        console.log("Connected to SignalR");
        setConnection(connect);
        setIsConnected(true);
        connect.invoke("JoinRoom", roomId);
      })
      .catch((err) => console.error("SignalR Connection Error:", err));

    connect.on("ReceiveChat", (user, message) => {
      setMessages((prev) => [...prev, { user, text: message }]);
    });

    connect.on("ReceivePlay", (time) => {
      const video = videoRef.current;
      if (video && typeof time === "number" && isFinite(time)) {
        video.currentTime = time;
        video.play().catch((err) => console.error("Play error:", err));
        setIsPlaying(true);
      }
    });

    connect.on("ReceivePause", (time) => {
      const video = videoRef.current;
      if (video && typeof time === "number" && isFinite(time)) {
        video.currentTime = time;
        video.pause();
        setIsPlaying(false);
      }
    });

    connect.on("ReceiveSeek", (time) => {
      const video = videoRef.current;
      if (video && typeof time === "number" && isFinite(time)) {
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

    connect.on("ReceiveEndSession", () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
      alert("Buổi xem chung đã kết thúc!");
      setIsPlaying(false);
      setIsConnected(false);
      connect.stop();
    });

    return () => {
      if (connect) {
        connect.stop();
      }
    };
  }, [duration]);

  useEffect(() => {
    const video = videoRef.current;
    const videoUrl =
      "https://d2az2ylwxkh7fk.cloudfront.net/tvseries/Solo+Leveling/season-1/episode-2/master.m3u8";

    if (!video) return;

    let hls;

    // Nếu trình duyệt hỗ trợ native HLS (như Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setQualityLevels(data.levels);
      });

      video.hls = hls;
    } else {
      console.error("HLS not supported by this browser.");
    }

    // ✅ Lắng nghe sự kiện video
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    // Cleanup khi unmount
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      if (hls) hls.destroy();
    };
  }, []);

  const formatTime = (time) => {
    if (!time || isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSend = async () => {
    if (!input.trim() || !connection) return;
    try {
      await connection.invoke("SendChat", roomId, currentUser, input);
      setInput("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !connection) return;

    try {
      if (isPlaying) {
        video.pause();
        await connection.invoke("SyncPause", roomId, video.currentTime);
      } else {
        await video.play();
        await connection.invoke("SyncPlay", roomId, video.currentTime);
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error("Play/Pause error:", err);
    }
  };

  const handleSeek = async (e) => {
    const video = videoRef.current;
    if (!video || !duration || !connection || !isFinite(duration)) return;

    try {
      const seekTime = (e.target.value / 100) * duration;
      if (isFinite(seekTime)) {
        video.currentTime = seekTime;
        setCurrentTime(seekTime);
        await connection.invoke("SyncSeek", roomId, seekTime);
      }
    } catch (err) {
      console.error("Seek error:", err);
    }
  };

  const handleSkipForward = async () => {
    const video = videoRef.current;
    if (video && connection && duration && isFinite(duration)) {
      try {
        const newTime = Math.min(video.currentTime + 5, duration);
        video.currentTime = newTime;
        setCurrentTime(newTime);
        await connection.invoke("SyncSkipForward", roomId);
      } catch (err) {
        console.error("Skip forward error:", err);
      }
    }
  };

  const handleSkipBackward = async () => {
    const video = videoRef.current;
    if (video && connection) {
      try {
        const newTime = Math.max(video.currentTime - 5, 0);
        video.currentTime = newTime;
        setCurrentTime(newTime);
        await connection.invoke("SyncSkipBackward", roomId);
      } catch (err) {
        console.error("Skip backward error:", err);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
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

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    // Validate playbackRate
    if (
      video &&
      typeof rate === "number" &&
      isFinite(rate) &&
      rate > 0 &&
      rate <= 2
    ) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
  };

  const handleQualityChange = (level) => {
    const hls = videoRef.current?.hls;
    if (hls && typeof level === "number" && isFinite(level)) {
      hls.currentLevel = level;
      setSelectedQuality(level);
      setShowSettingsMenu(false);
      if (settingsMenuTimeoutRef.current) {
        clearTimeout(settingsMenuTimeoutRef.current);
      }
    }
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

  const handleEndSession = async () => {
    if (connection) {
      try {
        await connection.invoke("EndSession", roomId);
      } catch (err) {
        console.error("End session error:", err);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* ✅ Watch Party Header - Fixed */}
      <div className="bg-black border-b border-neutral-800 px-6 py-3 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition"
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
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
              LIVE
            </span>
            <div>
              <h1 className="text-lg font-semibold">
                Cùng xem Nhật Quyền Nhân nhé
              </h1>
              <p className="text-sm text-gray-400">
                Phần 3 - Tập 1 • Nhật Quyền Nhân
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleEndSession}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition font-semibold"
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
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Kết thúc
        </button>
      </div>

      {/* ✅ Main Content - Flex container */}
      <div className="flex flex-1 overflow-hidden">
        {/* 🎬 Left: Video + Movie Info */}
        <div
          className={`flex flex-col bg-black transition-all duration-300 ${
            isChatHidden ? "flex-1" : "flex-[65%]"
          }`}
        >
          {/* Video Player - Takes remaining space */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
          >
            <video
              ref={videoRef}
              src="https://d2az2ylwxkh7fk.cloudfront.net/tvseries/Solo+Leveling/season-1/episode-2/master.m3u8"
              className="w-full h-full object-contain bg-black"
              onClick={handlePlayPause}
              controls={false}
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
            />

            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                {/* Time & Seekbar */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-white text-sm whitespace-nowrap">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #facc15 ${
                        duration ? (currentTime / duration) * 100 : 0
                      }%, #4b5563 ${
                        duration ? (currentTime / duration) * 100 : 0
                      }%)`,
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePlayPause}
                      className="text-white hover:text-yellow-500 transition"
                    >
                      {isPlaying ? (
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-yellow-500 transition text-xl"
                    >
                      {isMuted ? <RiVolumeMuteFill /> : <FaVolumeUp />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSkipBackward}
                      className="text-white hover:text-yellow-500 transition text-xl"
                    >
                      <MdReplay5 />
                    </button>
                    <button
                      onClick={handleSkipForward}
                      className="text-white hover:text-yellow-500 transition text-xl"
                    >
                      <MdOutlineForward5 />
                    </button>

                    {/* Settings Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        className="text-white hover:text-yellow-500 transition text-xl mt-2"
                      >
                        <IoMdSettings />
                      </button>
                      {showSettingsMenu && (
                        <div className="absolute bottom-10 right-0 w-48 bg-neutral-900 text-white rounded-lg shadow-xl z-50 border border-neutral-700">
                          <div className="flex justify-between items-center px-4 py-3 bg-neutral-800 rounded-t-lg border-b border-neutral-700">
                            <div className="flex space-x-4">
                              <button
                                onClick={() => setSettingsTab("quality")}
                                className={`text-xl ${
                                  settingsTab === "quality"
                                    ? "text-yellow-500"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                <MdSignalCellularAlt />
                              </button>
                              <button
                                onClick={() => setSettingsTab("speed")}
                                className={`text-xl ${
                                  settingsTab === "speed"
                                    ? "text-yellow-500"
                                    : "text-gray-400 hover:text-white"
                                }`}
                              >
                                <MdSchedule />
                              </button>
                            </div>
                            <button
                              onClick={() => setShowSettingsMenu(false)}
                              className="text-gray-400 hover:text-white text-xl"
                            >
                              <MdClose />
                            </button>
                          </div>
                          <div className="px-2 py-2 space-y-1 max-h-64 overflow-y-auto">
                            {settingsTab === "quality" && (
                              <>
                                <button
                                  onClick={() => handleQualityChange(-1)}
                                  className={`block w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition ${
                                    selectedQuality === -1
                                      ? "text-yellow-500 font-bold"
                                      : "text-gray-300"
                                  }`}
                                >
                                  Auto
                                </button>
                                {qualityLevels.map((level, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleQualityChange(index)}
                                    className={`block w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition ${
                                      selectedQuality === index
                                        ? "text-yellow-500 font-bold"
                                        : "text-gray-300"
                                    }`}
                                  >
                                    {level.height}p
                                  </button>
                                ))}
                              </>
                            )}

                            {settingsTab === "speed" &&
                              [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => handlePlaybackRateChange(rate)}
                                  className={`block w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition ${
                                    playbackRate === rate
                                      ? "text-yellow-500 font-bold"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={toggleFullScreen}
                      className="text-white hover:text-yellow-500 transition text-xl"
                    >
                      {isFullScreen ? <MdFullscreenExit /> : <MdFullscreen />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nút hiện chat khi ẩn - Floating button */}
            {isChatHidden && (
              <button
                onClick={() => setIsChatHidden(false)}
                className="absolute top-4 right-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold z-50"
              >
                <BsToggleOff className="text-xl" />
                Hiện chat
              </button>
            )}
          </div>

          {/* ✅ Movie Info Section - Compact layout */}
          <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex-shrink-0">
            <div className="flex gap-4 items-center">
              {/* Poster - Smaller */}
              <div className="w-24 h-36 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="https://m10.hentaiera.com/029/bt1rvyaflj/9t.jpg"
                  alt="Movie Poster"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info - Compact */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 truncate">
                  Nhật Quyền Nhân
                </h2>
                <p className="text-gray-400 text-sm mb-3">One Punch Man</p>

                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 bg-neutral-800 rounded text-xs">
                    2015
                  </span>
                  <span className="px-2 py-1 bg-neutral-800 rounded text-xs">
                    Phần 3
                  </span>
                  <span className="px-2 py-1 bg-neutral-800 rounded text-xs">
                    Tập 4
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  <span>Hành Động</span>
                  <span>•</span>
                  <span>Anime</span>
                  <span>•</span>
                  <span>Hài</span>
                  <span>•</span>
                  <span>Hoạt Hình</span>
                  <span>•</span>
                  <span>Kỹ Ảo</span>
                  <span>•</span>
                  <span>Phiêu Lưu</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 💬 Right: Chat - Fixed position, full height */}
        {!isChatHidden && (
          <div className="w-[35%] bg-neutral-800 border-l border-neutral-700 flex flex-col transition-all duration-300">
            {/* Header - Fixed */}
            <div className="p-4 border-b border-neutral-700 bg-neutral-900 flex justify-between items-center flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">Chat</h2>

              {/* Toggle Ẩn Chat */}
              <button
                onClick={() => setIsChatHidden(true)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                <span className="text-sm">Ẩn chat</span>
                <BsToggleOn className="text-xl text-yellow-500" />
              </button>
            </div>

            {/* ✅ Thông báo buổi xem - Fixed */}
            <div className="bg-green-700 text-center text-white px-4 py-3 flex-shrink-0">
              <p className="font-semibold">Buổi xem chung bắt đầu.</p>
              <p className="text-sm opacity-90">
                Chúc các bạn xem phim vui vẻ không quạu.
              </p>
            </div>

            {/* Tin nhắn - Scrollable, takes remaining space */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.user === currentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[75%] break-words ${
                      m.user === currentUser
                        ? "bg-yellow-500 text-black rounded-br-none"
                        : "bg-neutral-700 text-gray-200 rounded-bl-none"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-80">
                      {m.user}
                    </div>
                    <div className="text-sm">{m.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input - Fixed at bottom */}
            <div className="p-4 border-t border-neutral-700 bg-neutral-900 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-neutral-700 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500 transition"
                  placeholder="Chat gì đó..."
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-yellow-500 px-4 py-3 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  <BsSend size={18} />
                </button>
              </div>

              {/* User info */}
              <div className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                {currentUser ? (
                  <>
                    <span className="text-yellow-500">👤</span>
                    {currentUser}
                  </>
                ) : (
                  <span className="italic">Bạn cần đăng nhập để chat</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchParty;
