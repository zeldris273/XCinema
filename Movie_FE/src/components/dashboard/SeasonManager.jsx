import { useEffect, useState } from "react";
import api from "../../api/api"; // axios instance đã setup
import customSwal from "../../utils/customSwal";

const SeasonManager = ({ tvSeriesId }) => {
  const [tvSeriesList, setTvSeriesList] = useState([]); // 📌 danh sách series
  const [seasons, setSeasons] = useState([]);
  const [newSeason, setNewSeason] = useState({
    tvSeriesId: tvSeriesId || "",
    seasonNumber: "",
  });

  // 📌 Lấy danh sách TV Series + Season khi load component
  useEffect(() => {
    fetchTvSeries();
    if (tvSeriesId) {
      setNewSeason((prev) => ({ ...prev, tvSeriesId }));
      fetchSeasons(tvSeriesId);
    }
  }, [tvSeriesId]);

  // 🔁 Tự động fetch seasons khi chọn TV Series từ select
  useEffect(() => {
    if (newSeason.tvSeriesId) {
      fetchSeasons(newSeason.tvSeriesId);
    } else {
      setSeasons([]);
    }
  }, [newSeason.tvSeriesId]);

  const fetchTvSeries = async () => {
    try {
      const res = await api.get("/api/tvseries");
      setTvSeriesList(res.data);
    } catch (err) {
      customSwal(
        "Lỗi!",
        "Không thể tải danh sách TV Series: " +
          (err.response?.data?.error || err.message),
        "error"
      );
    }
  };

  const fetchSeasons = async (id) => {
    try {
      const res = await api.get(`/api/tvseries/${id}/seasons`);
      setSeasons(res.data);
    } catch (err) {
      customSwal(
        "Lỗi!",
        "Không thể tải danh sách season: " +
          (err.response?.data?.error || err.message),
        "error"
      );
    }
  };

  // 📌 Thêm season
  const handleAddSeason = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/tvseries/seasons", newSeason, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setSeasons([...seasons, res.data]); // thêm season mới
      setNewSeason({ tvSeriesId: newSeason.tvSeriesId, seasonNumber: "" });
      customSwal("Thành công!", "Thêm season thành công!", "success");
    } catch (err) {
      customSwal(
        "Lỗi!",
        "Không thể thêm season: " + (err.response?.data?.error || err.message),
        "error"
      );
    }
  };

  // 📌 Xoá season
  const handleDeleteSeason = async (seasonId) => {
    try {
      await api.delete(`/api/tvseries/seasons/${seasonId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setSeasons(seasons.filter((s) => s.id !== seasonId));
      customSwal("Thành công!", "Xoá season thành công!", "success");
    } catch (err) {
      customSwal(
        "Lỗi!",
        "Không thể xoá season: " + (err.response?.data?.error || err.message),
        "error"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Form thêm season */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Add New Season</h2>
        <form onSubmit={handleAddSeason} className="space-y-4">
          {/* TV Series Select */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Chọn TV Series *
            </label>
            <select
              value={newSeason.tvSeriesId}
              onChange={(e) => {
                const selectedId = e.target.value ? Number(e.target.value) : "";
                setNewSeason({ ...newSeason, tvSeriesId: selectedId });
              }}
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              required
            >
              <option value="">-- Chọn TV Series --</option>
              {tvSeriesList.map((series) => (
                <option key={series.id} value={series.id}>
                  {series.title}
                </option>
              ))}
            </select>
          </div>

          {/* Season Number */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Season Number *
            </label>
            <input
              type="number"
              min="1"
              value={newSeason.seasonNumber}
              onChange={(e) =>
                setNewSeason({ ...newSeason, seasonNumber: e.target.value })
              }
              className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
          >
            Add Season
          </button>
        </form>
      </div>

      {/* Danh sách seasons */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Danh sách Seasons</h3>
        {seasons.length === 0 ? (
          <p className="text-gray-400">Chưa có season nào.</p>
        ) : (
          <div className="space-y-2">
            {seasons.map((season) => (
              <div
                key={season.id}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
              >
                <span>Season {season.seasonNumber}</span>
                <button
                  onClick={() => handleDeleteSeason(season.id)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-400 rounded-lg text-white"
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonManager;
