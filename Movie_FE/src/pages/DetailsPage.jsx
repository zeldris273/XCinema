import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useFetchDetails from "../hooks/useFetchDetails";
import moment from "moment";
import Divider from "../components/common/Divider";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import VideoTrailerFrame from "../components/frame/VideoTrailerFrame";
import api from "../api/api";
import { FaStar } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import Slug from "../utils/Slug";
import customSwal from "../utils/customSwal";
import { useDispatch } from "react-redux";
import { setSelectedMovie } from "../store/movieSlice.js";

const DetailsPage = () => {
  const { id, title: urlTitle } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const mediaType = location.pathname.includes("movies") ? "movie" : "tv";
  const {
    data: fetchedData,
    loading,
    error,
  } = useFetchDetails(mediaType, id, urlTitle);
  const [data, setData] = useState(null);
  const [playVideo, setPlayVideo] = useState(false);
  const [playVideoId, setPlayVideoId] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [episodeError, setEpisodeError] = useState(null);
  const [isInWatchList, setIsInWatchList] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    if (fetchedData) setData(fetchedData);
  }, [fetchedData]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (mediaType !== "tv" || !id) return;
      try {
        const seasonsResponse = await api.get(`/api/tvseries/${id}/seasons`);
        const seasons = seasonsResponse.data;

        if (seasons.length > 0) {
          const episodesResponse = await api.get(
            `/api/tvseries/seasons/${seasons[0].id}/episodes`
          );
          setEpisodes(episodesResponse.data);

          if (episodesResponse.data.length === 0) {
            setEpisodeError("No episodes found for this season.");
          }
        } else {
          setEpisodeError("No seasons found for this series.");
        }
      } catch (err) {
        setEpisodeError("Failed to fetch episodes.");
      }
    };

    fetchEpisodes();
  }, [mediaType, id]);

  const handleAddToWatchList = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      customSwal("Error", "Please log in to add to watch list.", "error");
      const currentPath = location.pathname + location.search;
      return;
    }

    try {
      const response = await api.post("/api/watchlist/add", {
        MediaId: parseInt(id),
        MediaType: mediaType,
      });

      if (response.status === 200) {
        setIsInWatchList(true);
        customSwal("Thành công", "Added to Watch List", "success");
      }
    } catch (error) {
      customSwal(
        "Lỗi",
        error.response?.data?.error || "Failed to add to watch list.",
        "error"
      );
    }
  };

  const fetchMediaDetails = async () => {
    if (!data?.title) return null;
    try {
      const slug = Slug(data.title);
      const response = await api.get(
        `/api/${mediaType === "movie" ? "movies" : "tvseries"}/${id}/${slug}`
      );
      return response.data;
    } catch (error) {
      return null;
    }
  };

  const handleRatingSubmit = async (rating) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      customSwal("Error", "Please log in to rate this media.", "error");
      const currentPath = location.pathname + location.search;
      return;
    }

    try {
      const response = await api.post("/api/ratings", {
        MediaId: parseInt(id),
        MediaType: mediaType,
        Rating: rating,
      });

      if (response.status === 200) {
        customSwal("Thành công", "Thank you for your rating!", "success");

        if (response.data.averageRating && response.data.numberOfRatings) {
          setData((prevData) => ({
            ...prevData,
            rating: response.data.averageRating,
            numberOfRatings: response.data.numberOfRatings,
          }));
        }

        const updatedData = await fetchMediaDetails();
        if (updatedData) setData(updatedData);
      }
    } catch (error) {
      let errorMessage = "Failed to submit rating.";
      if (error.response?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        if (!localStorage.getItem("accessToken")) {
          const currentPath = location.pathname + location.search;
          localStorage.setItem("loginRedirect", currentPath);
          navigate("/auth");
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      customSwal("Lỗi", errorMessage, "error");
    }
  };

  const handlePlayVideo = (data) => {
    setPlayVideoId(data);
    setPlayVideo(true);
  };

  const handlePlayNow = () => {
    if (mediaType === "movie") {
      // MOVIE — API /watch trả về videoUrl cho MoviePlayer
      dispatch(
        setSelectedMovie({
          id: data.id,
          title: data.title,
          overview: data.overview,
          posterUrl: data.posterUrl,
          backdropUrl: data.backdropUrl,
          genres: data.genres,
          director: data.director,
          studio: data.studio,
          status: data.status,
          releaseDate: data.releaseDate,
          videoUrl: data.videoUrl, // movie ok
          mediaType: "movie", // Add mediaType for clarity
        })
      );

      const slug = Slug(data.title);
      navigate(`/movies/${data.id}/${slug}/watch`);
    } else if (mediaType === "tv") {
      const firstEpisode = episodes[0];

      if (!firstEpisode) {
        customSwal("Lỗi", "No episodes available!", "error");
        return;
      }

      // TV SERIES — LẤY VideoUrl TỪ Episode
      // Find the season info to get the correct seasonNumber
      const season = data.seasons?.find((s) => s.id === firstEpisode.seasonId);

      dispatch(
        setSelectedMovie({
          id: data.id,
          title: data.title,
          overview: data.overview,
          posterUrl: data.posterUrl,
          backdropUrl: data.backdropUrl,
          genres: data.genres,
          director: data.director,
          studio: data.studio,
          status: data.status,
          releaseDate: data.releaseDate,

          videoUrl: firstEpisode.videoUrl, // <🔥 FIX MOST IMPORTANT LINE
          episodeNumber: firstEpisode.episodeNumber,
          seasonNumber: season?.seasonNumber || 1, // ✅ FIX: Use seasonNumber instead of seasonId
          mediaType: "tv", // Add mediaType for clarity
        })
      );

      const slug = Slug(data.title);
      navigate(
        `/tvseries/${data.id}/${slug}/episode/${firstEpisode.episodeNumber}/watch`
      );
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-white text-center py-20">
        <h2 className="text-2xl font-bold">Không tồn tại</h2>
        <p className="mt-2">
          {mediaType === "movie" ? "Bộ phim" : "TV series"} này không tồn tại
          hoặc URL không chính xác.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-white text-center py-20">
        <h2 className="text-2xl font-bold">Không tồn tại</h2>
        <p className="mt-2">
          {mediaType === "movie" ? "Bộ phim" : "TV series"} này không tồn tại.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full h-[280px] relative hidden lg:block">
        <div className="w-full h-full">
          {data?.backdropUrl ? (
            <img
              src={data.backdropUrl}
              className="h-full w-full object-cover"
              alt="Backdrop"
            />
          ) : (
            <div className="bg-neutral-800 h-full w-full flex justify-center items-center">
              No Backdrop Image
            </div>
          )}
        </div>
        <div className="absolute w-full h-full top-0 bg-gradient-to-t from-neutral-900/90 to-transparent"></div>
      </div>

      <div className="container mx-auto px-3 py-20 lg:py-0 flex flex-col lg:flex-row gap-5 lg:gap-10">
        <div className="relative mx-auto w-fit lg:mx-0 min-w-60 lg:-mt-28">
          {data?.posterUrl ? (
            <img
              src={data.posterUrl}
              className="h-80 w-60 object-cover rounded"
              alt={data.title}
            />
          ) : (
            <div className="bg-neutral-800 h-80 w-60 flex justify-center items-center rounded">
              No Image Found
            </div>
          )}
          <button
            onClick={() => handlePlayVideo(data)}
            className="mt-5 w-full py-2 px-4 text-center bg-white text-black rounded font-bold text-lg hover:bg-gradient-to-l from-red-500 to-orange-500 hover:scale-105 transition-all"
          >
            Watch Trailer
          </button>
          <button
            onClick={handlePlayNow}
            className="mt-5 w-full py-2 px-4 text-center bg-white text-black rounded font-bold text-lg hover:bg-gradient-to-l from-red-500 to-orange-500 hover:scale-105 transition-all"
          >
            Play Now
          </button>
          {!isAdmin && ( // Chỉ hiển thị nút Add to Watchlist nếu không phải Admin
            <button
              onClick={handleAddToWatchList}
              className={`flex flex-col items-center justify-center gap-1 w-full cursor-pointer px-3 py-2 border border-black rounded-lg text-white transition mt-5 ${
                isInWatchList
                  ? "bg-green-600"
                  : "bg-black/30 hover:bg-transparent"
              }`}
              disabled={isInWatchList}
            >
              <span className="text-sm font-medium">
                {isInWatchList ? "Added to Watch List" : "+ Add to Watch List"}
              </span>
            </button>
          )}
        </div>

        <div>
          <h2 className="text-2xl lg:text-4xl font-bold text-white">
            {data?.title}
          </h2>

          <Divider />
          <div className="flex items-center my-3 gap-3">
            {data?.rating > 0 && (
              <>
                <p>Rating: </p>
                <div className="w-8 h-8">
                  <CircularProgressbar
                    value={data.rating * 10}
                    text={`${(data.rating * 10).toFixed(0)}%`}
                    styles={buildStyles({
                      textColor: "#fff",
                      textSize: "25px",
                      pathColor:
                        data.rating >= 7
                          ? "green"
                          : data.rating >= 5
                          ? "orange"
                          : "red",
                      trailColor: "#ddd",
                    })}
                  />
                </div>
                <p className="text-white">
                  ({data.numberOfRatings || 0} votes)
                </p>
              </>
            )}
          </div>

          <div className="my-3">
            <p className="text-white mb-1">Rate this:</p>
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <FaStar
                    key={index}
                    className="cursor-pointer"
                    color={
                      ratingValue <= (hoverRating || userRating)
                        ? "#ffc107"
                        : "#e4e5e9"
                    }
                    onMouseEnter={() => setHoverRating(ratingValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setUserRating(ratingValue);
                      handleRatingSubmit(ratingValue);
                    }}
                  />
                );
              })}
              {userRating > 0 && (
                <span className="text-white ml-2">({userRating}/10)</span>
              )}
            </div>
          </div>

          <Divider />

          <div>
            <h3 className="text-xl font-bold text-white mb-1">Overview</h3>
            <p>{data?.overview || "No overview available."}</p>

            <Divider />

            <div className="flex gap-2">
              {Array.isArray(data?.genres) && data.genres.length > 0 ? (
                data.genres.map((genre, index) => (
                  <span
                    key={"Genre" + index}
                    className="bg-gray-700/60 text-white text-xs font-bold px-2 py-1 rounded-md"
                  >
                    {genre}
                  </span>
                ))
              ) : (
                <span className="text-gray-400">No genres available</span>
              )}
            </div>

            <Divider />
            <div className="flex items-center gap-3 my-3 text-center">
              <p>Status: {data?.status}</p>
              <span>|</span>
              <p>
                Release Date:{" "}
                {data?.releaseDate
                  ? moment(data.releaseDate).format("YYYY")
                  : "N/A"}
              </p>
            </div>
            <Divider />
            {mediaType === "tv" && (
              <>
                <p>Episode Number: {data?.numberOfEpisodes}</p>
                <Divider />
              </>
            )}

            <div>
              <p>
                <span className="text-white">Director: </span>
                {data?.director || "N/A"}
              </p>
              <Divider />
              <p>
                <span className="text-white">Studio: </span>
                {data?.studio || "N/A"}
              </p>
            </div>
          </div>

          {data?.actors?.length > 0 ? (
            <>
              <Divider />
              <h3 className="text-white font-semibold text-md mt-4 mb-2">
                Cast
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-5">
                {data.actors.map((actor, index) => (
                  <div key={index} className="text-center">
                    <div className="w-24 h-24 mx-auto flex justify-center items-center bg-gray-700 rounded-full">
                      <FaUser className="w-12 h-12 text-white" />
                    </div>
                    <p className="font-bold text-center text-sm text-neutral-400 mt-2">
                      {actor.name || "Unknown Actor"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-5"></div>
          )}
        </div>
      </div>

      {playVideo && (
        <VideoTrailerFrame
          data={playVideoId}
          close={() => setPlayVideo(false)}
          media_type={mediaType}
        />
      )}
    </div>
  );
};

export default DetailsPage;
