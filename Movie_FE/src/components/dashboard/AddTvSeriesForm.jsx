import AsyncSelect from "react-select/async";
import UploadProgress from "./UploadProgress";
import api from "../../api/api";
import selectStyles from "../../styles/SelectStyles";

// Load Actors
const loadActorOptions = async (inputValue) => {
  const res = await api.get(`/api/actors?search=${inputValue}`);
  return res.data.map((actor) => ({
    value: actor.id,
    label: actor.name,
  }));
};

// Load Genres
const loadGenreOptions = async (inputValue) => {
  const res = await api.get(`/api/genres?search=${inputValue}`);
  return res.data.map((genre) => ({
    value: genre.id,
    label: genre.name,
  }));
};

const AddTvSeriesForm = ({
  newTvSeries,
  setNewTvSeries,
  handleAddTvSeries,
  uploadProgress,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add New TV Series</h2>
      <form onSubmit={handleAddTvSeries} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={newTvSeries.title}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, title: e.target.value })
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
            value={newTvSeries.overview}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, overview: e.target.value })
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
            value={newTvSeries.genres}
            onChange={(selected) =>
              setNewTvSeries({ ...newTvSeries, genres: selected || [] })
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
            value={newTvSeries.actors}
            onChange={(selected) =>
              setNewTvSeries({ ...newTvSeries, actors: selected || [] })
            }
            placeholder="Chọn diễn viên..."
            styles={selectStyles}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Status *
          </label>
          <select
            value={newTvSeries.status}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, status: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            required
          >
            <option value="">Select Status</option>
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
            value={newTvSeries.releaseDate}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, releaseDate: e.target.value })
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
            value={newTvSeries.studio}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, studio: e.target.value })
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
            value={newTvSeries.director}
            onChange={(e) =>
              setNewTvSeries({ ...newTvSeries, director: e.target.value })
            }
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Poster Image *
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) =>
              setNewTvSeries({
                ...newTvSeries,
                posterImageFile: e.target.files[0],
              })
            }
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Backdrop Image *
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) =>
              setNewTvSeries({
                ...newTvSeries,
                backdropImageFile: e.target.files[0],
              })
            }
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
        >
          Add TV Series
        </button>
      </form>
      <UploadProgress progress={uploadProgress} />
    </div>
  );
};

export default AddTvSeriesForm;
