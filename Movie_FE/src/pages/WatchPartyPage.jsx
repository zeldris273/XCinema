import React, { useState, useRef, useEffect } from "react";
import { BsSend } from "react-icons/bs";
import * as signalR from "@microsoft/signalr";
import VideoFrame from "../components/frame/VideoFrame";

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
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const roomId = "room123"; // có thể truyền qua URL params
  const [currentUser] = useState(`User${Math.floor(Math.random() * 1000)}`); // Generate unique user ID

  // ✅ Kết nối SignalR
  useEffect(() => {
    const connect = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connect.start().then(() => {
      console.log("Connected to SignalR");
      setConnection(connect);
      setIsConnected(true);
      connect.invoke("JoinRoom", roomId);
    });

    // ✅ FIX: Chỉ nhận message từ SignalR (không thêm local)
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

    return () => {
      connect.stop();
    };
  }, []);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // ✅ FIX: Gửi tin nhắn - XÓA việc thêm message local
  const handleSend = async () => {
    if (!input.trim()) return;
    if (connection) {
      // Chỉ gửi lên server, server sẽ broadcast về cho tất cả (bao gồm mình)
      await connection.invoke("SendChat", roomId, currentUser, input);

      // ❌ XÓA dòng này (gây duplicate)
      // setMessages((prev) => [...prev, { user: "You", text: input }]);

      setInput("");
    }
  };

  // ✅ Đồng bộ khi play/pause/seek
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !connection) return;

    if (isPlaying) {
      video.pause();
      await connection.invoke("SyncPause", roomId, video.currentTime);
    } else {
      video.play();
      await connection.invoke("SyncPlay", roomId, video.currentTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (e) => {
    const video = videoRef.current;
    if (!video || !duration || !connection) return;

    const seekTime = (e.target.value / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    await connection.invoke("SyncSeek", roomId, seekTime);
  };

  // ✅ Enter to send
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-white pt-16">
      {" "}
      {/* ✅ Add padding-top for navbar */}
      {/* 🎬 Video */}
      <div className="flex-[65%] relative">
        {" "}
        {/* ✅ Giảm từ 70% xuống 65% */}
        <VideoFrame
          videoUrl="https://d2az2ylwxkh7fk.cloudfront.net/tvseries/Solo+Leveling/season-1/episode-2/master.m3u8"
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          setDuration={setDuration}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          showControls={showControls}
          setShowControls={setShowControls}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          qualityLevels={qualityLevels}
          setQualityLevels={setQualityLevels}
          selectedQuality={selectedQuality}
          setSelectedQuality={setSelectedQuality}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
          showSettingsMenu={showSettingsMenu}
          setShowSettingsMenu={setShowSettingsMenu}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          onSeek={handleSeek}
          onPlayPause={handlePlayPause}
          videoRef={videoRef}
          formatTime={formatTime}
          containerRef={containerRef}
        />
      </div>
      {/* 💬 Chat */}
      <div className="flex-[35%] bg-neutral-800 border-l border-neutral-700 flex flex-col">
        {" "}
        {/* ✅ Tăng từ 30% lên 35% */}
        <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900">
          <h2 className="text-lg font-semibold">Watch Party Chat</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-neutral-700 px-2 py-1 rounded">
              {currentUser}
            </span>
            <span className="text-sm">{isConnected ? "🟢" : "🔴"}</span>
          </div>
        </div>
        {/* ✅ Messages Container với auto-scroll */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-neutral-600 scrollbar-track-neutral-800">
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
        {/* ✅ Input Area - Fixed at bottom */}
        <div className="p-4 border-t border-neutral-700 bg-neutral-900">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-neutral-700 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500 transition"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-yellow-500 px-4 py-3 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
            >
              <BsSend size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchParty;
