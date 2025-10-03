import AsyncSelect from "react-select/async";
import selectStyles from "../../styles/SelectStyles";
import api from "../../api/api";

const MovieTable = ({
  movies,
  editMovie,
  updatedMovie,
  setUpdatedMovie,
  handleEditMovie,
  handleUpdateMovie,
  handleDeleteMovie,
  formatDateForInput,
  setEditMovie,
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
      <h2 className="text-2xl font-semibold mb-4">Manage Movies</h2>
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
            {movies.map((movie) => (
              <tr key={movie.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{movie.title}</td>
                <td className="px-4 py-2">{movie.status}</td>
                <td className="px-4 py-2">
                  {formatDateForInput(movie.releaseDate)}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEditMovie(movie)}
                    className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-500 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMovie(movie.id)}
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

      {editMovie && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Edit Movie: {editMovie.title}
          </h3>
          <form onSubmit={handleUpdateMovie} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Title
              </label>
              <input
                type="text"
                value={updatedMovie.title}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, title: e.target.value })
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
                value={updatedMovie.overview}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, overview: e.target.value })
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
                  Array.isArray(updatedMovie.genres)
                    ? updatedMovie.genres
                        .filter((g) => g && (g.id !== undefined || g.name))
                        .map((g) => ({ value: g.id ?? 0, label: g.name ?? "" }))
                    : []
                }
                onChange={(selected) =>
                  setUpdatedMovie({
                    ...updatedMovie,
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
                  updatedMovie.actors?.map((a) => ({
                    value: a.id,
                    label: a.name,
                  })) || []
                }
                onChange={(selected) =>
                  setUpdatedMovie({
                    ...updatedMovie,
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
                value={updatedMovie.status}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, status: e.target.value })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
                required
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Released">Released</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Release Date
              </label>
              <input
                type="date"
                value={updatedMovie.releaseDate}
                onChange={(e) =>
                  setUpdatedMovie({
                    ...updatedMovie,
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
                value={updatedMovie.studio}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, studio: e.target.value })
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
                value={updatedMovie.director}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, director: e.target.value })
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
                value={updatedMovie.posterUrl}
                onChange={(e) =>
                  setUpdatedMovie({
                    ...updatedMovie,
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
                value={updatedMovie.backdropUrl}
                onChange={(e) =>
                  setUpdatedMovie({
                    ...updatedMovie,
                    backdropUrl: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Video URL
              </label>
              <input
                type="text"
                value={updatedMovie.videoUrl}
                onChange={(e) =>
                  setUpdatedMovie({ ...updatedMovie, videoUrl: e.target.value })
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
                value={updatedMovie.trailerUrl}
                onChange={(e) =>
                  setUpdatedMovie({
                    ...updatedMovie,
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
              Update Movie
            </button>
            <button
              type="button"
              onClick={() => setEditMovie(null)}
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

export default MovieTable;
