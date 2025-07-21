import React, { useState, useEffect } from "react";

const TvSeriesTable = ({
  tvSeries,
  editTvSeries,
  updatedTvSeries,
  setUpdatedTvSeries,
  handleEditTvSeries,
  handleUpdateTvSeries,
  handleDeleteTvSeries,
  formatDateForInput,
  setEditTvSeries,
}) => {
  // State tạm thời để lưu chuỗi người dùng nhập vào input actors
  const [actorInput, setActorInput] = useState("");

  // Khi editTvSeries thay đổi, cập nhật actorInput từ updatedTvSeries.actors
  useEffect(() => {
    if (editTvSeries) {
      setActorInput(updatedTvSeries.actors.map((actor) => actor.name || "").join(", "));
    }
  }, [editTvSeries, updatedTvSeries.actors]);

  // Hàm đồng bộ actorInput với updatedTvSeries.actors (gọi khi mất focus hoặc submit)
  const syncActors = () => {
    const names = actorInput.split(",").map((name) => name.trim()).filter((name) => name);
    const newActors = names.map((name) => {
      const existingActor = updatedTvSeries.actors.find((a) => (a.name || "").toLowerCase() === name.toLowerCase());
      return existingActor || { name }; // Giữ id nếu tồn tại, nếu không tạo mới với name
    });
    setUpdatedTvSeries({ ...updatedTvSeries, actors: newActors });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage TV Series</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Release Date</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tvSeries.map((series) => (
              <tr key={series.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{series.title}</td>
                <td className="px-4 py-2">{series.status}</td>
                <td className="px-4 py-2">{formatDateForInput(series.releaseDate)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEditTvSeries(series)}
                    className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTvSeries(series.id)}
                    className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editTvSeries && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Edit TV Series: {editTvSeries.title}</h3>
          <form onSubmit={(e) => { syncActors(); handleUpdateTvSeries(e); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={updatedTvSeries.title}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, title: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Overview</label>
              <textarea
                value={updatedTvSeries.overview}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, overview: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Genres</label>
              <input
                type="text"
                value={updatedTvSeries.genres}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, genres: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Actors (comma-separated names)</label>
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onBlur={syncActors} // Đồng bộ khi input mất focus
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                placeholder="e.g., Actor 1, Actor 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
              <select
                value={updatedTvSeries.status}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, status: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Release Date</label>
              <input
                type="date"
                value={updatedTvSeries.releaseDate}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, releaseDate: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Studio</label>
              <input
                type="text"
                value={updatedTvSeries.studio}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, studio: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Director</label>
              <input
                type="text"
                value={updatedTvSeries.director}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, director: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Poster URL</label>
              <input
                type="text"
                value={updatedTvSeries.posterUrl}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, posterUrl: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Backdrop URL</label>
              <input
                type="text"
                value={updatedTvSeries.backdropUrl}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, backdropUrl: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Trailer URL</label>
              <input
                type="text"
                value={updatedTvSeries.trailerUrl}
                onChange={(e) => setUpdatedTvSeries({ ...updatedTvSeries, trailerUrl: e.target.value })}
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400"
            >
              Update TV Series
            </button>
            <button
              onClick={() => setEditTvSeries(null)}
              className="ml-2 px-4 py-2 bg-gray-500 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TvSeriesTable;