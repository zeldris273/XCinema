import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import customSwal from "../../utils/customSwal.js";
import { toast, Bounce } from "react-toastify";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";

const CreateWatchParty = () => {
  const [autoStart, setAutoStart] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);
  const [movie, setMovie] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const navigate = useNavigate();

  const { selectedMovie } = useSelector((state) => state.movie);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      customSwal("Unauthorized", "Please log in to create a room.", "error");
      localStorage.setItem('loginRedirect', '/watch-party/create');
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedMovie) {
      setMovie(selectedMovie);
      localStorage.setItem("selectedMovie", JSON.stringify(selectedMovie));
    } else {
      const cached = localStorage.getItem("selectedMovie");
      if (cached) setMovie(JSON.parse(cached));
    }
  }, [selectedMovie]);

  const handleCreate = async () => {
    // Validate scheduled time if autoStart is enabled
    if (autoStart) {
      if (!scheduledDate || !scheduledTime) {
        customSwal("Error", "Please select both date and time for scheduled start.", "error");
        return;
      }

      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        customSwal("Error", "Scheduled time must be in the future.", "error");
        return;
      }
    }

    const roomId = "room-" + Math.floor(Math.random() * 100000);
    let currentUser = null;

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const decoded = jwtDecode(token);
        currentUser = decoded.sub;
      }
    } catch (err) {
      console.error("❌ Failed to decode token:", err);
    }

    if (!currentUser) {
      customSwal("Error", "Cannot identify your account.", "error");
      return;
    }

    // 🔥 LƯU MOVIE DATA VÀ FLAG TẠO PHÒNG
    const movieDataJson = JSON.stringify(movie);
    localStorage.setItem("selectedMovie", movieDataJson);
    localStorage.setItem("isCreatingRoom", "true");
    localStorage.setItem("pendingRoomId", roomId);

    // Save scheduling info
    if (autoStart && scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      localStorage.setItem("scheduledStartTime", scheduledDateTime.toISOString());
      localStorage.setItem("autoStart", "true");
    } else {
      localStorage.removeItem("scheduledStartTime");
      localStorage.removeItem("autoStart");
    }

    // Save private room flag
    localStorage.setItem("isPrivateRoom", privateRoom.toString());

    toast.success(`Creating Room: ${roomId}`, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      pauseOnFocusLoss: false,
      transition: Bounce,
    });

    navigate(`/watch-party/${roomId}?create=true`, {
      state: { movie, isHost: true },
    });
  };

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center p-4 md:p-8 pt-24 mt-10">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: Movie Poster */}
        <div className="bg-[#1a1a1d] rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-black flex items-center justify-center">
            <img
              src={movie?.posterUrl}
              alt={movie?.title}
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="p-5 space-y-3">
            <h1 className="text-xl font-bold">
              {movie?.title || "Loading..."}
            </h1>
            <p className="text-yellow-400 font-semibold text-sm">
              {movie?.studio || "Unknown Studio"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-300">
              {movie?.genres?.map((g, idx) => (
                <span key={idx} className="px-2 py-1 bg-neutral-800 rounded">
                  {g}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
              {movie?.overview || "No description available."}
            </p>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex flex-col bg-[#1a1a1d] rounded-2xl p-6 shadow-lg">
          <div className="flex-1 space-y-8">
            {/* 1. Room Name */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                1. Room Name
              </h2>
              <input
                type="text"
                value={`Let's Watch ${movie?.title || "Movie"} Together !`}
                readOnly
                className="w-full bg-[#2a2a2e] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            {/* 2. Time Settings */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                2. Time Settings
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                You can start the session manually or automatically based on the
                schedule.
              </p>
              <label className="flex items-center justify-between cursor-pointer mb-4">
                <span className="text-base">Start automatically</span>
                <div
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    autoStart ? "bg-yellow-400" : "bg-gray-600"
                  }`}
                  onClick={() => setAutoStart(!autoStart)}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      autoStart ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>

              {autoStart && (
                <div className="space-y-3 mt-4 p-4 bg-[#2a2a2e] rounded-lg border border-neutral-700">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      📅 Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-[#1a1a1d] border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      ⏰ Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-[#1a1a1d] border border-neutral-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400 transition"
                    />
                  </div>
                  {scheduledDate && scheduledTime && (
                    <p className="text-xs text-yellow-400 mt-2">
                      🎬 Session will start automatically on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 3. Privacy */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                3. Privacy
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                When enabled, only people with the invite link can join this
                room.
              </p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-base">Private Room</span>
                <div
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    privateRoom ? "bg-yellow-400" : "bg-gray-600"
                  }`}
                  onClick={() => setPrivateRoom(!privateRoom)}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      privateRoom ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-700">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-sm font-semibold shadow-md transition"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWatchParty;
