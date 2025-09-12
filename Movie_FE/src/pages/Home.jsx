import React from "react";
import BannerHome from "../components/BannerHome";
import HorizontalScrollCard from "../components/HorizontalScrollCard";
import useFetch from "../hooks/useFetch";
import TrendingCard from "../components/common/TrendingCard";

const Home = () => {
  const { data: topRatedMovies } = useFetch("/api/movies/top-rated-by-votes");
  const { data: mostViewedTvSeries } = useFetch("/api/tvseries/most-viewed");

  return (
    <div>
      <BannerHome />
      <TrendingCard />
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
