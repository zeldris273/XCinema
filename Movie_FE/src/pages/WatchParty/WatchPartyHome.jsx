import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import theater from "../../assets/theater.jpg";
import api from "../../api/api";
import CreateRoomGuide from "../../components/watch-party/CreateRoomGuide";
import customSwal from "../../utils/customSwal";
import * as signalR from "@microsoft/signalr";

const WatchPartyHome = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [myActiveRoom, setMyActiveRoom] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPublicRooms();
    checkMyActiveRoom();
    const interval = setInterval(() => {
      fetchPublicRooms();
      checkMyActiveRoom();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkMyActiveRoom = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setMyActiveRoom(null);
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded["sub"];

      const response = await api.get(
        `/api/watchparty/my-rooms?userId=${userId}`
      );
      if (response.data && response.data.length > 0) {
        setMyActiveRoom(response.data[0]);
      } else {
        setMyActiveRoom(null);
      }
    } catch (err) {
      setMyActiveRoom(null);
    }
  };

  const fetchPublicRooms = async () => {
    try {
      const res = await api.get("/api/watchparty/public-rooms");
      console.log("Public Rooms:", res.data);
      setPublicRooms(res.data || []);
    } catch (err) {
      // Error fetching public rooms
    }
  };

  const handleOpenManage = async () => {
    setError("");
    setLoadingRooms(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("You are not logged in.");
        setLoadingRooms(false);
        return;
      }

      const decoded = jwtDecode(token);
      const userId = decoded.sub;

      const res = await api.get("/api/watchparty/my-rooms", {
        params: { userId },
      });

      setRooms(res.data || []);
      setShowManage(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch room list.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRejoin = (roomId) => {
    // Rejoin room (not creating new)
    navigate(`/watch-party/${roomId}`);
  };

  const handleEndRoom = async (roomId) => {
    const result = await customSwal(
      "End Watch Party?",
      "This will close the room for all viewers. Are you sure?",
      "warning",
      true, // showCancelButton
      "Yes, End Room",
      "Cancel"
    );

    if (result.isConfirmed) {
      try {
        // Connect to SignalR to send EndSession
        const hubUrl = `${import.meta.env.VITE_BACKEND_API_URL}/watchpartyhub`;
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();

        await connection.start();

        await connection.invoke("EndSession", roomId);

        await connection.stop();

        customSwal(
          "Room Ended",
          "The watch party has been closed successfully.",
          "success"
        );

        // Refresh room list and active room status
        await checkMyActiveRoom();
        handleOpenManage();
      } catch (err) {
        customSwal(
          "Error",
          "Failed to end the room. Please try again.",
          "error"
        );
      }
    }
  };

  return (
    <>
      {/* POPUP - Create Room Guide */}
      {showGuide && <CreateRoomGuide onClose={() => setShowGuide(false)} />}

      {/* POPUP - Manage Rooms */}
      {showManage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-[#141414] w-full max-w-xl rounded-2xl p-6 border border-neutral-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">My Rooms</h2>
              <button
                onClick={() => setShowManage(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {loadingRooms && (
              <p className="text-gray-300 text-sm">Loading rooms...</p>
            )}

            {error && (
              <p className="text-red-400 text-sm mb-3 whitespace-pre-line">
                {error}
              </p>
            )}

            {!loadingRooms && rooms.length === 0 && !error && (
              <p className="text-gray-400 text-sm">
                You haven't created any rooms yet.
              </p>
            )}

            {!loadingRooms && rooms.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {rooms.map((room) => {
                  const movie =
                    room.movieDataJson &&
                    (() => {
                      try {
                        return JSON.parse(room.movieDataJson);
                      } catch {
                        return null;
                      }
                    })();

                  return (
                    <div
                      key={room.roomId}
                      className="flex items-center justify-between bg-neutral-900/80 border border-neutral-700 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded-md overflow-hidden bg-neutral-800 flex items-center justify-center">
                          {movie?.posterUrl || movie?.backdropUrl ? (
                            <img
                              src={movie.posterUrl || movie.backdropUrl}
                              alt={movie?.title || room.roomId}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No image
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white line-clamp-1">
                            {movie?.title || room.roomId}
                          </p>
                          <p className="text-xs text-gray-400">
                            Room ID: {room.roomId}
                          </p>
                          <p className="text-xs text-gray-500">
                            Viewers: {room.viewerCount ?? 0} ·{" "}
                            {room.isStarted ? "Running" : "Not Started"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejoin(room.roomId)}
                          className="px-3 py-2 text-xs bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-500 transition"
                        >
                          Rejoin
                        </button>
                        <button
                          onClick={() => handleEndRoom(room.roomId)}
                          className="px-3 py-2 text-xs bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition"
                        >
                          End Room
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner chính */}
      <div className="relative w-full h-[260px] flex items-center justify-center">
        <img
          src={theater}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

        <div className="relative flex flex-col items-center gap-6 mt-8">
          <h1 className="text-white text-3xl font-bold tracking-wide">
            Watch Party
          </h1>

          <div className="flex items-center gap-5">
            {/* Manage Rooms Button */}
            <button
              onClick={handleOpenManage}
              className="px-7 py-3 flex items-center gap-2 bg-white text-black rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-all"
            >
              <span className="text-xl">📡</span>Manage
            </button>

            {/* Create New Room Button */}
            <button
              onClick={() => setShowGuide(true)}
              className={`px-7 py-3 flex items-center gap-2 rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-all bg-[#352336] text-white"
              }`}
            >
              <span className="text-2xl">＋</span> Create New
            </button>
          </div>
        </div>
      </div>

      {/* Public Rooms Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Public Watch Parties
          </h2>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900 rounded-xl">
            <p className="text-gray-400 text-lg">
              No public rooms available right now
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Create a public room to watch together!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicRooms.map((room) => (
              <div
                key={room.roomId}
                className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-yellow-400 transition-all cursor-pointer group"
                onClick={() => handleRejoin(room.roomId)}
              >
                {/* Movie Backdrop */}
                {room.movieData?.backdropUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={room.movieData.backdropUrl}
                      alt={room.movieData.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />

                    {room.isStarted && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                    )}
                  </div>
                )}

                {/* Room Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
                    {room.movieData?.title || "Unknown Movie"}
                  </h3>

                  {room.movieData?.seasonNumber && (
                    <p className="text-gray-400 text-sm mb-3">
                      S{room.movieData.seasonNumber}E
                      {room.movieData.episodeNumber}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                    <img
                      src={room.hostAvatarUrl}
                      alt={room.hostDisplayName}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{room.hostDisplayName}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>
                        {room.viewerCount} viewer
                        {room.viewerCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-semibold text-sm transition">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WatchPartyHome;
