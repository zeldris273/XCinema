import { useEffect } from "react";
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
    const userId = decoded["sub"];

    return userId ? parseInt(userId, 10) : null;
  } catch (error) {
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
  const { data: mostFavoriteMovies } = useFetch(
    "/api/watchlist/most-favorited"
  );

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
        heading={"Feast Your Eyes on Movies in Theaters"}
        media_type={"movie"}
      />
      <HorizontalScrollCard
        data={mostFavoriteMovies}
        heading={"most favorite movies"}
        media_type={"tv"}
      />
    </div>
  );
};

export default Home;
