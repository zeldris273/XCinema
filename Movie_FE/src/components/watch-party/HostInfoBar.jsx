import React, { use } from "react";
import { FaEye, FaShareAlt, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import customSwal from "../../utils/customSwal";

const HostInfoBar = ({ avatarUrl, hostName, timeText, views }) => {
  const navigate = useNavigate();

  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
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
          <button onClick={() => handleWatchAlone}>Watch Alone</button>
        </button>
      </div>
    </div>
  );
};

export default HostInfoBar;
