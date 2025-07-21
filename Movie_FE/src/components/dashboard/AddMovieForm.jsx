import React from "react";
import UploadProgress from "./UploadProgress";

const AddMovieForm = ({ newMovie, setNewMovie, handleAddMovie, uploadProgress }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Add New Movie</h2>
      <form onSubmit={handleAddMovie} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Title *</label>
          <input
            type="text"
            value={newMovie.title}
            onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Overview</label>
          <textarea
            value={newMovie.overview}
            onChange={(e) => setNewMovie({ ...newMovie, overview: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Genres (comma-separated)</label>
          <input
            type="text"
            value={newMovie.genres}
            onChange={(e) => setNewMovie({ ...newMovie, genres: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            placeholder="e.g., Action, Drama"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Actors (comma-separated)</label>
          <input
            type="text"
            value={newMovie.actors}
            onChange={(e) => setNewMovie({ ...newMovie, actors: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            placeholder="e.g., Tom Hanks, Leonardo DiCaprio"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Status *</label>
          <select
            value={newMovie.status}
            onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
            required
          >
            <option value="">Select Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Released">Released</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Release Date</label>
          <input
            type="date"
            value={newMovie.releaseDate}
            onChange={(e) => setNewMovie({ ...newMovie, releaseDate: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Studio</label>
          <input
            type="text"
            value={newMovie.studio}
            onChange={(e) => setNewMovie({ ...newMovie, studio: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Director</label>
          <input
            type="text"
            value={newMovie.director}
            onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Video File *</label>
          <input
            type="file"
            accept="video/mp4,video/avi,video/mov,video/mp2t"
            onChange={(e) => setNewMovie({ ...newMovie, videoFile: e.target.files[0] })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Backdrop Image *</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setNewMovie({ ...newMovie, backdropFile: e.target.files[0] })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Poster Image *</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setNewMovie({ ...newMovie, posterFile: e.target.files[0] })}
            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-500 rounded-lg hover:bg-yellow-400"
        >
          Add Movie
        </button>
      </form>
      <UploadProgress progress={uploadProgress} />
    </div>
  );
};

export default AddMovieForm;