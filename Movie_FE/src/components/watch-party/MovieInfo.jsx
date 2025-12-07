import React from "react";
const MovieInfo = ({
  posterUrl,
  title,
  originalTitle,
  year,
  season,
  episode,
  genres = [],
}) => {
  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 flex-shrink-0">
      <div className="flex gap-4 items-center">
        {/* Poster */}
        <div className="w-24 h-36 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Movie details */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-1 truncate">{title}</h2>
          <p className="text-gray-400 text-sm mb-3">{originalTitle}</p>

          {/* Tags (Year, Season, Episode) */}
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            {year && (
              <span className="px-2 py-1 bg-neutral-800 rounded">{year}</span>
            )}
            {season && (
              <span className="px-2 py-1 bg-neutral-800 rounded">
                Phần {season}
              </span>
            )}
            {episode && (
              <span className="px-2 py-1 bg-neutral-800 rounded">
                Tập {episode}
              </span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {genres.map((g, i) => (
              <React.Fragment key={i}>
                <span>{g}</span>
                {i !== genres.length - 1 && <span>•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieInfo;
