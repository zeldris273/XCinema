import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import theater from "../../assets/theater.jpg";
import api from "../../api/api";
import CreateRoomGuide from "../../components/watch-party/CreateRoomGuide";

const WatchPartyHome = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleOpenManage = async () => {
    setError("");
    setLoadingRooms(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Bạn chưa đăng nhập.");
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
      setError(err.response?.data?.error || "Không lấy được danh sách phòng.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleRejoin = (roomId) => {
    // join lại phòng (không tạo mới)
    navigate(`/watch-party/${roomId}`);
  };

  return (
    <>
      {/* POPUP hướng dẫn tạo phòng */}
      {showGuide && <CreateRoomGuide onClose={() => setShowGuide(false)} />}

      {/* POPUP quản lý phòng */}
      {showManage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
          <div className="bg-[#141414] w-full max-w-xl rounded-2xl p-6 border border-neutral-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Phòng đã tạo</h2>
              <button
                onClick={() => setShowManage(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {loadingRooms && (
              <p className="text-gray-300 text-sm">Đang tải danh sách...</p>
            )}

            {error && (
              <p className="text-red-400 text-sm mb-3 whitespace-pre-line">
                {error}
              </p>
            )}

            {!loadingRooms && rooms.length === 0 && !error && (
              <p className="text-gray-400 text-sm">Bạn chưa tạo phòng nào.</p>
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
                            {room.isStarted ? "Đang chạy" : "Chưa bắt đầu"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRejoin(room.roomId)}
                        className="px-3 py-2 text-xs bg-yellow-400 text-black font-semibold rounded-full hover:bg-yellow-500 transition"
                      >
                        Join lại
                      </button>
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
            {/* Quản lý → gọi API + mở popup */}
            <button
              onClick={handleOpenManage}
              className="px-7 py-3 flex items-center gap-2 bg-white text-black rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-all"
            >
              <span className="text-xl">📡</span>Quản lý
            </button>

            {/* Tạo mới → mở popup hướng dẫn */}
            <button
              onClick={() => setShowGuide(true)}
              className="px-7 py-3 flex items-center gap-2 bg-[#352336] text-white rounded-full text-lg font-semibold shadow-lg hover:scale-105 transition-all"
            >
              <span className="text-2xl">＋</span> Tạo mới
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WatchPartyHome;
