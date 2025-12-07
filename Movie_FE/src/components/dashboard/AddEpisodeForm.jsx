import UploadProgress from "./UploadProgress";

const AddEpisodeForm = ({
  newEpisode,
  setNewEpisode,
  handleAddEpisode,
  tvSeries,
  seasonsList,
  fetchSeasons,
  uploadProgress,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add New Episode</h2>
      <form onSubmit={handleAddEpisode} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">TV Series *</label>
          <select
            value={newEpisode.tvSeriesId}
            onChange={(e) => {
              setNewEpisode({ ...newEpisode, tvSeriesId: e.target.value });
              if (e.target.value) fetchSeasons(e.target.value);
            }}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            required
          >
            <option value="">Select TV Series</option>
            {tvSeries.map((series) => (
              <option key={series.id} value={series.id}>
                {series.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Season (Optional - Season 1 will be created if none exists)
          </label>
          <select
            value={newEpisode.seasonId}
            onChange={(e) => setNewEpisode({ ...newEpisode, seasonId: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            disabled={!newEpisode.tvSeriesId}
          >
            <option value="">Select Season (or leave blank to auto-create)</option>
            {seasonsList.map((season) => (
              <option key={season.id} value={season.id}>
                Season {season.seasonNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Episode Number *</label>
          <input
            type="number"
            value={newEpisode.episodeNumber}
            onChange={(e) => setNewEpisode({ ...newEpisode, episodeNumber: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">HLS Zip File *</label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setNewEpisode({ ...newEpisode, hlsZipFile: e.target.files[0] })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
        >
          Add Episode
        </button>
      </form>
      <UploadProgress progress={uploadProgress} />
    </div>
  );
};

export default AddEpisodeForm;