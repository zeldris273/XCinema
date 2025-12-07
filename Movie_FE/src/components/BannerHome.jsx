import { useEffect, useState } from "react";
import { FaAngleLeft, FaAngleRight, FaStar } from "react-icons/fa";
import { IoEye } from "react-icons/io5";
import { Link } from "react-router-dom";
import api from "../api/api";

const BannerHome = () => {
  const [bannerData, setBannerData] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/new-releases", {
          params: { limit: 10, offset: 0 },
        });
        setBannerData(response.data.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch new releases");
        setLoading(false);
      }
    };

    fetchNewReleases();
  }, []);

  const handleNext = () => {
    if (currentImage < bannerData.length - 1) {
      setCurrentImage((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentImage > 0) {
      setCurrentImage((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (bannerData.length > 0) {
        if (currentImage < bannerData.length - 1) {
          handleNext();
        } else {
          setCurrentImage(0);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerData, currentImage]);

  // Xử lý trạng thái loading và error
  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  if (bannerData.length === 0) {
    return (
      <div className="text-white text-center">No new releases available.</div>
    );
  }

  return (
    <section className="w-full h-full">
      <div className="flex min-h-full max-h-[95vh] overflow-hidden">
        {bannerData.map((data, index) => {
          // Đảm bảo data.title tồn tại trước khi tạo slug
          if (!data.title) {
            return null; // Bỏ qua item nếu title không tồn tại
          }

          const slug = data.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-");

          return (
            <div
              key={data.id + "bannerHome" + index}
              className="min-w-full min-h-[450px] lg:min-h-full overflow-hidden relative transition-all"
              style={{ transform: `translateX(-${currentImage * 100}%)` }}
            >
              <div className="w-full h-full">
                {data.backdropUrl ? (
                  <img
                    src={data.backdropUrl}
                    alt={data.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full bg-gray-800 flex items-center justify-center object-cover"
                    style={{ backgroundColor: "#333" }}
                  >
                    <span className="text-white">No Image Available</span>
                  </div>
                )}
              </div>

              <div className="absolute top-0 w-full h-full flex items-center justify-between px-4 group-hover:lg:flex">
                <button
                  onClick={handlePrev}
                  className="bg-white p-2 rounded-full text-xl z-10 text-black"
                >
                  <FaAngleLeft />
                </button>
                <button
                  onClick={handleNext}
                  className="bg-white p-2 rounded-full text-xl z-10 text-black"
                >
                  <FaAngleRight />
                </button>
              </div>

              <div className="absolute top-0 w-full h-full bg-gradient-to-t from-neutral-900 to-transparent"></div>

              <div className="container mx-auto">
                <div className="w-full absolute bottom-0 max-w-md px-3">
                  <h2 className="font-bold text-2xl lg:text-4xl text-white drop-shadow-2xl">
                    {data.title}
                  </h2>
                  <p className="text-ellipsis line-clamp-3 my-2">
                    {data.overview || "No description available"}
                  </p>
                  <div className="flex items-center gap-4">
                    <FaStar style={{ transform: "translateY(-2px)" }} />
                    <p>{data.rating?.toFixed(1) || "N/A"}</p>
                    <span>|</span>
                    <IoEye />
                    <p>{data.viewCount ?? 0}</p>
                  </div>

                  <Link to={`/${data.mediaType}/${data.id}/${slug}`}>
                    <button className="block bg-white px-4 py-2 text-black font-bold rounded-full mt-4 hover:bg-gradient-to-l from-red-700 to-orange-500 shadow-md transition-all hover:scale-105">
                      Play Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BannerHome;
