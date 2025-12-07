
const TabNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center justify-center space-x-4 mb-6 border-b border-gray-700">
      <button
        onClick={() => setActiveTab("addMovie")}
        className={`pb-2 px-4 ${
          activeTab === "addMovie"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Add Movie
      </button>
      <button
        onClick={() => setActiveTab("addTvSeries")}
        className={`pb-2 px-4 ${
          activeTab === "addTvSeries"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Add TV Series
      </button>
      <button
        onClick={() => setActiveTab("addEpisode")}
        className={`pb-2 px-4 ${
          activeTab === "addEpisode"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Add Episode
      </button>
      <button
        onClick={() => setActiveTab("manageMovies")}
        className={`pb-2 px-4 ${
          activeTab === "manageMovies"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Manage Movies
      </button>

      <button
        onClick={() => setActiveTab("manageTvSeries")}
        className={`pb-2 px-4 ${
          activeTab === "manageTvSeries"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Manage TvSeries
      </button>

      <button
        onClick={() => setActiveTab("managerSeasons")}
        className={`pb-2 px-4 ${
          activeTab === "managerSeasons"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Add Season
      </button>

      <button
        onClick={() => setActiveTab("manageActors")}
        className={`pb-2 px-4 ${
          activeTab === "manageActors"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Manage Actors
      </button>
      <button
        onClick={() => setActiveTab("manageGenres")}
        className={`pb-2 px-4 ${
          activeTab === "manageGenres"
            ? "border-b-2 border-yellow-500 text-yellow-500"
            : "text-gray-400"
        }`}
      >
        Manage Genres
      </button>
    </div>
  );
};

export default TabNavigation;
