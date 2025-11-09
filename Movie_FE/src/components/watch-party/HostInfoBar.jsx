import React from "react";
import { FaEye, FaShareAlt, FaLock } from "react-icons/fa";

const HostInfoBar = ({ avatarUrl, viewerName, timeText, views }) => {
  const handleShare = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    alert("✅ Đã sao chép link buổi xem vào clipboard!");
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 px-6 py-3 flex items-center justify-between">
      {/* Left: Avatar + Name + Time */}
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold">{viewerName}</p>
          <p className="text-xs text-gray-400">{timeText}</p>
        </div>
      </div>

      {/* Right: Icons + Actions */}
      <div className="flex items-center gap-6 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <FaEye className="text-lg" />
          <span>{views}</span>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 hover:text-white transition"
        >
          <FaShareAlt className="text-lg" />
          <span>Share</span>
        </button>

        <button className="flex items-center gap-2 hover:text-white transition">
          <FaLock className="text-lg" />
          <span>Watch Alone</span>
        </button>
      </div>
    </div>
  );
};

export default HostInfoBar;
