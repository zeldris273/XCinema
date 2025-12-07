import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import api from "../api/api";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = location?.search?.slice(3)?.split("%20")?.join(" ") || "";

  const fetchData = async () => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await api.get("/api/search/all", {
        params: { query },
      });
      setData(response.data.results);
    } catch (error) {
      // Error fetching search results
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData([]);
    fetchData();
  }, [location?.search]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleSearch = (e) => {
    const value = e.target.value;
    navigate(`/search?q=${value}`);
  };

  return (
    <div className="py-16">
      <div className="lg:hidden my-2 mx-1 sticky top-[70px] z-30">
        <input
          type="text"
          placeholder="Search here..."
          onChange={handleSearch}
          value={query}
          className="px-4 py-1 text-lg w-full bg-white rounded-full text-neutral-900"
        />
      </div>
      <div className="container mx-auto">
        <h3 className="capitalize text-lg lg:text-xl font-semibold my-3">
          {query ? `Search Results for "${query}"` : "Search Results"}
        </h3>
        <div className="grid grid-cols-[repeat(auto-fit,230px)] gap-6 justify-center lg:justify-start">
          {data.map((searchData) => (
            <Card
              data={searchData}
              key={searchData.id}
              media_type={searchData.type.toLowerCase()}
            />
          ))}
        </div>
        {loading && <p className="text-center mt-4">Loading more results...</p>}
      </div>
    </div>
  );
};

export default SearchPage;
