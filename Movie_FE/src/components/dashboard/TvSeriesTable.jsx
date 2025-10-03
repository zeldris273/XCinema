import AsyncSelect from "react-select/async";
import selectStyles from "../../styles/SelectStyles";
import api from "../../api/api";

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
  // Load Actors
  const loadActorOptions = async (inputValue) => {
    const res = await api.get(`/api/actors?search=${inputValue || ""}`);
    return res.data.map((actor) => ({
      value: actor.id,
      label: actor.name,
    }));
  };

  // Load Genres
  const loadGenreOptions = async (inputValue) => {
    const res = await api.get(`/api/genres?search=${inputValue || ""}`);
    return res.data.map((genre) => ({
      value: genre.id,
      label: genre.name,
    }));
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
                <td className="px-4 py-2">
                  {formatDateForInput(series.releaseDate)}
                </td>
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
          <h3 className="text-xl font-semibold mb-4">
            Edit TV Series: {editTvSeries.title}
          </h3>
          <form onSubmit={handleUpdateTvSeries} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={updatedTvSeries.title}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    title: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Overview
              </label>
              <textarea
                value={updatedTvSeries.overview}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    overview: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                rows="3"
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Genres
              </label>
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadGenreOptions}
                value={
                  Array.isArray(updatedTvSeries.genres)
                    ? updatedTvSeries.genres
                        .filter((g) => g && (g.id !== undefined || g.name))
                        .map((g) => ({ value: g.id ?? 0, label: g.name ?? "" }))
                    : []
                }
                onChange={(selected) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    genres: selected.map((s) => ({
                      id: s.value,
                      name: s.label,
                    })),
                  })
                }
                placeholder="Chọn thể loại..."
                styles={selectStyles}
              />
            </div>

            {/* Actors */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Actors
              </label>
              <AsyncSelect
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadActorOptions}
                value={
                  updatedTvSeries.actors?.map((a) => ({
                    value: a.id,
                    label: a.name,
                  })) || []
                }
                onChange={(selected) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    actors: selected.map((s) => ({
                      id: s.value,
                      name: s.label,
                    })),
                  })
                }
                placeholder="Chọn diễn viên..."
                styles={selectStyles}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={updatedTvSeries.status}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    status: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Release Date
              </label>
              <input
                type="date"
                value={updatedTvSeries.releaseDate}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    releaseDate: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Studio
              </label>
              <input
                type="text"
                value={updatedTvSeries.studio}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    studio: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Director
              </label>
              <input
                type="text"
                value={updatedTvSeries.director}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    director: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Poster URL
              </label>
              <input
                type="text"
                value={updatedTvSeries.posterUrl}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    posterUrl: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Backdrop URL
              </label>
              <input
                type="text"
                value={updatedTvSeries.backdropUrl}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    backdropUrl: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Trailer URL
              </label>
              <input
                type="text"
                value={updatedTvSeries.trailerUrl}
                onChange={(e) =>
                  setUpdatedTvSeries({
                    ...updatedTvSeries,
                    trailerUrl: e.target.value,
                  })
                }
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
              type="button"
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
