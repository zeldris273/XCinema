import { useState, useEffect } from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function MovieCarousel() {
  const [movies, setMovies] = useState([]);
  const [current, setCurrent] = useState(0);
  const itemsPerView = 4; // số phim hiển thị 1 lần
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await api.get("/api/trending/all");
        // Ensure we always set an array
        const data = res.data;
        if (Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error("Trending API did not return an array:", data);
          setMovies([]);
        }
      } catch (err) {
        console.error("Error fetching trending movies:", err);
        setMovies([]);
      }
    };

    fetchTrending();
  }, []);

  const handlePrevious = () => {
    setCurrent((prev) =>
      prev === 0 ? Math.max(0, movies.length - itemsPerView) : prev - 1
    );
  };

  const handleNext = () => {
    setCurrent((prev) => (prev >= movies.length - itemsPerView ? 0 : prev + 1));
  };

  if (movies.length === 0) {
    return (
      <div className="text-white p-6 -mb-5">
        <h2 className="text-2xl font-bold mb-4">Trending</h2>
        <p className="text-gray-400">Đang tải phim...</p>
      </div>
    );
  }

  return (
    <div className="text-white p-6 -mb-5 relative">
      <h2 className="text-2xl font-bold mb-4">Trending</h2>

      <div className="relative overflow-hidden">
        {/* Container cho carousel */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${current * 25}%)`,
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={`${movie.id}-${index}`}
              className="flex-shrink-0 w-1/4 px-2"
            >
              <div
                className="bg-[#1a1a29] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => {
                  const mediaType =
                    movie.type === "movie" ? "movies" : "tvseries";
                  const sourceTitle = movie.title || "";
                  const slug =
                    sourceTitle
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                      .replace(/-+/g, "-") || "untitled";
                  navigate(`/${mediaType}/${movie.id}/${slug}`);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    const mediaType =
                      movie.type === "movie" ? "movies" : "tvseries";
                    const sourceTitle = movie.title || "";
                    const slug =
                      sourceTitle
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                        .replace(/-+/g, "-") || "untitled";
                    navigate(`/${mediaType}/${movie.id}/${slug}`);
                  }
                }}
              >
                {/* backdrop */}
                <div className="relative">
                  <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                  {/* poster overlay */}
                  <div className="absolute -bottom-6 left-4 w-16 shadow-lg rounded-lg overflow-hidden border-2 border-white/20">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-20 object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-medium">
                      {movie.badge || "Hot"}
                    </span>
                  </div>
                </div>

                {/* info */}
                <div className="p-4 pt-8">
                  <h3
                    className="font-semibold text-sm truncate mb-1"
                    title={movie.title}
                  >
                    {movie.title}
                  </h3>
                  <p
                    className="text-gray-400 text-xs truncate mb-2"
                    title={movie.engTitle}
                  >
                    {movie.engTitle}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="bg-yellow-600 text-white px-1.5 py-0.5 rounded">
                      {movie.rating || "8.5"}
                    </span>
                    <span>•</span>
                    <span>{movie.year || "2024"}</span>
                    <span>•</span>
                    <span>{movie.duration || "120m"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        {movies.length > itemsPerView && (
          <>
            <button
              onClick={handlePrevious}
              disabled={current === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-3 rounded-full z-10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              disabled={current >= movies.length - itemsPerView}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white p-3 rounded-full z-10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaAngleRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
