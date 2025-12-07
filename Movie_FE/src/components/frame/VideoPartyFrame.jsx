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

const VideoPartyFrame = ({
  videoRef,
  containerRef,
  showControls,
  currentTime,
  duration,
  formatTime,
  handleSeek,
  handlePlayPause,
  isPlaying,
  toggleMute,
  isMuted,
  handleSkipBackward,
  handleSkipForward,
  showSettingsMenu,
  setShowSettingsMenu,
  settingsTab,
  setSettingsTab,
  handleQualityChange,
  qualityLevels,
  selectedQuality,
  playbackRate,
  handlePlaybackRateChange,
  toggleFullScreen,
  isFullScreen,
  handleMouseMove,
  sessionStarted,
  isHost,
  handleStartSession,
  movieTitle,
  movieBackdrop,
}) => {
  // ==========================================================
  // 🕒 BEFORE START — Waiting Screen
  // ==========================================================
  if (!sessionStarted) {
    return (
      <div className="relative flex items-center justify-center w-full h-full bg-black text-white overflow-hidden">
        {/* Background poster */}
        <img
          src={movieBackdrop}
          alt="poster"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />

        {/* Overlay content */}
        <div className="relative z-10 bg-black/60 backdrop-blur-md px-10 py-8 rounded-2xl text-center border border-neutral-700 shadow-2xl">
          <p className="text-gray-300 text-sm mb-1">Watch Party</p>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            {movieTitle}
          </h2>

          {/* Waiting spinner */}
          <div className="flex justify-center gap-3 mb-4">
            <button className="bg-white/10 text-white px-5 py-2 rounded-lg flex items-center gap-2 border border-white/20">
              <span className="text-lg animate-spin">⏳</span>
              Waiting to Start
            </button>
          </div>

          {/* Start button (Host only) */}
          {isHost && (
            <button
              onClick={handleStartSession}
              className="text-yellow-400 hover:text-yellow-300 flex items-center justify-center gap-2 text-sm mt-2 mx-auto transition"
            >
              <span>▶</span>
              Start Now
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // 🎥 AFTER START — Video Mode
  // ==========================================================
  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        onClick={handlePlayPause}
        controls={false}
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Time + Seekbar */}
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
                }%, #4b5563 ${duration ? (currentTime / duration) * 100 : 0}%)`,
              }}
            />
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-between">
            {/* Play / Mute */}
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

            {/* Skip / Settings / Fullscreen */}
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
                  className="text-white hover:text-yellow-500 transition text-xl mt-1"
                >
                  <IoMdSettings />
                </button>

                {showSettingsMenu && (
                  <div className="absolute bottom-10 right-0 w-48 bg-neutral-900 text-white rounded-lg shadow-xl z-50 border border-neutral-700">
                    {/* Tabs */}
                    <div className="flex justify-between items-center px-4 py-3 bg-neutral-800 rounded-t-lg border-b border-neutral-700">
                      <div className="flex space-x-4">
                        {/* Quality */}
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

                        {/* Speed */}
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

                    {/* Menu Content */}
                    <div className="px-2 py-2 space-y-1 max-h-64 overflow-y-auto text-sm">
                      {/* QUALITY LIST */}
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

                      {/* SPEED LIST */}
                      {settingsTab === "speed" &&
                        [0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)} // 🔥 FIXED
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

              {/* Fullscreen */}
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
    </div>
  );
};

export default VideoPartyFrame;
