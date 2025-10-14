import React, { useEffect } from "react";
import BannerHome from "../components/BannerHome";
import HorizontalScrollCard from "../components/HorizontalScrollCard";
import useFetch from "../hooks/useFetch";
import TrendingCard from "../components/common/TrendingCard";
import { jwtDecode } from "jwt-decode";

const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const decoded = jwtDecode(token);
    const userId =
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ];

    return userId ? parseInt(userId, 10) : null;
  } catch (error) {
    console.error("Lỗi khi decode token:", error);
    return null;
  }
};

const getMediaTypeFromPosterUrl = (posterUrl) => {
  if (!posterUrl) return "movie";
  return posterUrl.includes("/tvseries/") ? "tv" : "movie";
};

const Home = () => {
  const userId = getUserIdFromToken();
  const { data: topRatedMovies } = useFetch("/api/movies/top-rated-by-votes");
  const { data: mostViewedTvSeries } = useFetch("/api/tvseries/most-viewed");

  const {
    data: recommendedMovies,
    loading: recommendationLoading,
    error: recommendationError,
  } = useFetch(userId ? `/api/recommendation/user/${userId}?top_n=10` : null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div>
      <BannerHome />
      <TrendingCard />
      {/* Debug info */}

      {userId && recommendationLoading && (
        <div className="container mx-auto px-3 my-10">
          <p className="text-white">🔄 Đang tải gợi ý phim...</p>
        </div>
      )}

      {userId &&
        recommendedMovies &&
        Array.isArray(recommendedMovies) &&
        recommendedMovies.length > 0 && (
          <HorizontalScrollCard
            data={recommendedMovies.map((item) => ({
              id: item.id,
              title: item.title,
              posterUrl: item.poster,
              rating: item.PredictedScore,
              releaseDate: item.releaseDate,
              mediaType: getMediaTypeFromPosterUrl(item.poster),
            }))}
            heading={"Recommended For You"}
            media_type={"movie"}
          />
        )}

      <HorizontalScrollCard
        data={topRatedMovies}
        heading={"Movies with Most Ratings"}
        media_type={"movie"}
      />
      <HorizontalScrollCard
        data={mostViewedTvSeries}
        heading={"Most Viewed TV Series"}
        media_type={"tv"}
      />
    </div>
  );
};

export default Home;
