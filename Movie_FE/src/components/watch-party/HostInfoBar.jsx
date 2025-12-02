import React, { useState, useEffect } from "react";
import { FaEye, FaShareAlt, FaLock, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import customSwal from "../../utils/customSwal";

const HostInfoBar = ({ avatarUrl, hostName, timeText, views, scheduledStartTime, autoStart }) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!autoStart || !scheduledStartTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const scheduled = new Date(scheduledStartTime);
      const diff = scheduled - now;

      if (diff <= 0) {
        setCountdown("Starting now...");
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [autoStart, scheduledStartTime]);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    navigator.clipboard.writeText(url);
    customSwal("Link copied to clipboard!", "", "success");
  };

  const handleWatchAlone = () => {
    navigate("");
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 px-6 py-3 flex items-center justify-between">
      {/* Left: Avatar + Host Info */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <img
            src={avatarUrl}
            alt="avatar"
            className="w-12 h-12 rounded-full object-cover border-2 border-red-500 animate-zoom-pulse"
          />
        </div>

        <div>
          <p className="text-sm font-semibold">{hostName}</p>
          <p className="text-xs text-gray-400">{timeText}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-6 text-gray-400 text-sm">
        {/* ⏰ Countdown if scheduled */}
        {autoStart && scheduledStartTime && countdown && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
            <FaClock className="text-lg text-yellow-400 animate-pulse" />
            <span className="text-yellow-400 font-semibold">{countdown}</span>
          </div>
        )}

        {/* 👁 Viewer count */}
        <div className="flex items-center gap-2">
          <FaEye className="text-lg" />
          <span>{views}</span>
        </div>

        {/* 🔗 Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 hover:text-white transition"
        >
          <FaShareAlt className="text-lg" />
          <span>Share</span>
        </button>

        {/* 🔒 Private mode (chưa có logic, placeholder) */}
        <button className="flex items-center gap-2 hover:text-white transition">
          <FaLock className="text-lg" />
          <span onClick={() => handleWatchAlone}>Watch Alone</span>
        </button>
      </div>
    </div>
  );
};

export default HostInfoBar;
