import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { FaAngleLeft, FaAngleRight, FaPlay } from "react-icons/fa";
import Slug from "../../utils/Slug";

export default function RecommendedMovies({ movieId }) {
  const [movies, setMovies] = useState([]);
  const containerRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!movieId) return;

    const fetchSimilarMovies = async () => {
      try {
        const res = await api.get(
          `/api/recommendation/similar/${movieId}?top_n=10`
        );
        const data = res.data;
        if (Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error("Similar movies API did not return an array:", data);
          setMovies([]);
        }
      } catch (error) {
        console.error("Error loading similar movies:", error);
        setMovies([]);
      }
    };

    fetchSimilarMovies();
  }, [movieId]);

  const handleNext = () => {
    containerRef.current.scrollLeft += 300;
  };

  const handlePrevious = () => {
    containerRef.current.scrollLeft -= 300;
  };

  const handleMovieClick = (movie) => {
    // Navigate to detail page based on type with title slug
    const titleSlug = Slug(movie.title);
    
    if (movie.type === "movie") {
      navigate(`/movies/${movie.id}/${titleSlug}`);
    } else if (movie.type === "tvseries") {
      navigate(`/tvseries/${movie.id}/${titleSlug}`);
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="text-white px-8 py-6">
      <h2 className="text-2xl font-bold mb-4">Similar Movies</h2>

      <div className="relative">
        <div
          ref={containerRef}
          className="flex overflow-x-scroll overflow-hidden gap-3 z-10 relative scroll-smooth transition-all scrollbar-none"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => handleMovieClick(movie)}
              className="flex-shrink-0 group relative cursor-pointer w-[260px]"
            >
              {/* Card với ảnh backdrop */}
              <div className="relative overflow-hidden">
                <div className="relative aspect-video">
                  <img
                    src={movie.backdrop}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay khi hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <FaPlay className="text-black text-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin phim bên dưới */}
              <div className="mt-2">
                {/* Tiêu đề */}
                <h3 className="font-semibold text-sm leading-tight line-clamp-1 mb-1.5">
                  {movie.title}
                </h3>

                {/* Thông tin chi tiết */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                  <span className="font-semibold">
                    {movie.releaseDate
                      ? movie.releaseDate.split("-")[0]
                      : "N/A"}
                  </span>
                  <span>•</span>
                  <span>{movie.status || "1 Phần"}</span>
                  <span>•</span>
                  <span className="font-semibold">
                    {movie.quality || "Full HD"}
                  </span>
                </div>

                {/* Mô tả */}
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {movie.overview || "Không có mô tả."}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Nút điều hướng trái/phải */}
        <div
          className="absolute top-2.5 hidden lg:flex justify-between w-full items-center pointer-events-none"
          style={{ height: "146px" }}
        >
          <button
            onClick={handlePrevious}
            className="bg-white p-1.5 text-black rounded-full -ml-2 z-10 hover:bg-gray-200 transition-colors pointer-events-auto"
          >
            <FaAngleLeft size={18} />
          </button>

          <button
            onClick={handleNext}
            className="bg-white p-1.5 text-black rounded-full -mr-2 z-10 hover:bg-gray-200 transition-colors pointer-events-auto"
          >
            <FaAngleRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
