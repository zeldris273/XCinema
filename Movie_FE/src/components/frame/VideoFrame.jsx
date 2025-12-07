import { useEffect } from "react";
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
import { FaVolumeUp, FaPlay } from "react-icons/fa";
import Hls from "hls.js";

const VideoFrame = ({
  videoUrl,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  showControls,
  setShowControls,
  showSettingsMenu,
  setShowSettingsMenu,
  qualityLevels,
  setQualityLevels,
  selectedQuality,
  setSelectedQuality,
  playbackRate,
  setPlaybackRate,
  isMuted,
  setIsMuted,
  settingsTab,
  setSettingsTab,
  isFullScreen,
  setIsFullScreen,
  onSeek,
  onQualityChange,
  onPlaybackRateChange,
  onToggleMute,
  onSkipForward,
  onSkipBackward,
  onToggleFullScreen,
  onPlayPause,
  formatTime,
  containerRef,
  videoRef,
  handleMouseMove,
  posterUrl,
}) => {
  // --- HLS setup ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityLevels(hls.levels);
        setSelectedQuality(hls.currentLevel);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setSelectedQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          // HLS Error
        }
      });

      video.hls = hls;
      return () => {
        if (video.hls) {
          video.hls.destroy();
          video.hls = null;
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    }
  }, [videoUrl]);

  // --- Playback / Event listeners ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const setVideoDuration = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", setVideoDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    video.playbackRate = playbackRate;
    video.muted = isMuted;

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", setVideoDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [playbackRate, isMuted]);

  // --- Fullscreen tracking ---
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`mx-auto ${
        isFullScreen
          ? "fixed top-0 left-0 w-screen h-screen z-50 bg-black"
          : "max-w-[1024px] w-full p-2 sm:p-4 mt-20"
      }`}
      onMouseMove={handleMouseMove}
    >
      <div
        className="relative w-full"
        style={{
          paddingTop: isFullScreen ? "0" : "56.25%",
          height: isFullScreen ? "100%" : undefined,
        }}
      >
        {/* VIDEO */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg object-cover"
          onClick={onPlayPause}
          poster={posterUrl}
          controls={false}
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onSkipBackward();
            else if (e.key === "ArrowRight") onSkipForward();
          }}
          tabIndex={0}
        />

        {/* ✅ Nút Play trung tâm khi chưa phát */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg transition-all duration-500">
            <button
              onClick={onPlayPause}
              className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-black/70 hover:bg-black/90 text-white rounded-full shadow-xl hover:scale-110 transition-transform duration-300"
            >
              <FaPlay className="w-7 h-7 ml-1" />
            </button>
          </div>
        )}

        {/* ✅ Chỉ hiện các controls khi video đang phát */}
        {showControls && isPlaying && (
          <div
            className={`absolute bottom-0 left-0 right-0 ${
              isFullScreen ? "p-2 sm:p-4" : "p-1 sm:p-2"
            } bg-transparent`}
          >
            {/* Time & Seekbar */}
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="text-white text-xs sm:text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={onSeek}
                className="flex-1 h-1 bg-transparent rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #facc15 ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, transparent ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%)`,
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-1 sm:mt-2">
              {/* Left side */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={onPlayPause}
                  className="text-white hover:bg-transparent p-1"
                >
                  {isPlaying ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button onClick={onToggleMute} className="text-white p-1">
                  {isMuted ? <RiVolumeMuteFill /> : <FaVolumeUp />}
                </button>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                <button onClick={onSkipBackward} className="text-white p-1">
                  <MdReplay5 />
                </button>
                <button onClick={onSkipForward} className="text-white p-1">
                  <MdOutlineForward5 />
                </button>

                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="text-white p-1"
                  >
                    <IoMdSettings />
                  </button>

                  {showSettingsMenu && (
                    <div className="absolute bottom-10 right-0 w-44 bg-[#1e1e1e] text-white rounded shadow-lg z-50">
                      <div className="flex justify-between px-3 py-2 bg-black">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => setSettingsTab("quality")}
                            className={`${
                              settingsTab === "quality"
                                ? "border-b-2 border-white"
                                : "text-gray-400"
                            }`}
                          >
                            <MdSignalCellularAlt />
                          </button>
                          <button
                            onClick={() => setSettingsTab("speed")}
                            className={`${
                              settingsTab === "speed"
                                ? "border-b-2 border-white"
                                : "text-gray-400"
                            }`}
                          >
                            <MdSchedule />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowSettingsMenu(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <MdClose />
                        </button>
                      </div>

                      <div className="px-3 py-2 space-y-1 bg-[#2b2b2b] text-sm">
                        {settingsTab === "quality" && (
                          <>
                            <button
                              onClick={() => onQualityChange(-1)}
                              className={`block w-full text-left ${
                                selectedQuality === -1
                                  ? "text-white font-bold"
                                  : "text-gray-300"
                              }`}
                            >
                              Auto
                            </button>
                            {qualityLevels.map((level, index) => (
                              <button
                                key={index}
                                onClick={() => onQualityChange(index)}
                                className={`block w-full text-left ${
                                  selectedQuality === index
                                    ? "text-white font-bold"
                                    : "text-gray-300"
                                }`}
                              >
                                {level.height}p
                              </button>
                            ))}
                          </>
                        )}

                        {settingsTab === "speed" &&
                          [0.5, 1.0, 1.5, 2.0].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => onPlaybackRateChange(rate)}
                              className={`block w-full text-left ${
                                playbackRate === rate
                                  ? "text-white font-bold"
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
                <button onClick={onToggleFullScreen} className="text-white p-1">
                  {isFullScreen ? <MdFullscreenExit /> : <MdFullscreen />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoFrame;
