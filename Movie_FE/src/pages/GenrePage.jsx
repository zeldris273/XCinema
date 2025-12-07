import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import Card from "../components/common/Card";

const GenrePage = () => {
  const { id } = useParams();
  const [mediaList, setMediaList] = useState([]);
  const [genreName, setGenreName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔹 Lấy tên thể loại
        const resGenres = await api.get("/api/genres");
        const genre = resGenres.data.find((g) => g.id === parseInt(id));
        setGenreName(genre ? genre.name : "Unknown Genre");

        // 🔹 Lấy phim + tv series thuộc thể loại đó
        const resMedia = await api.get(`/api/genres/${id}/media`);
        setMediaList(resMedia.data);
      } catch (error) {
        // Error loading genre
      }
    };
    fetchData();
  }, [id]);

  // ✅ Scroll to top khi đổi genre
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <div className="container mx-auto px-4 py-10 text-white mt-8">
      <h2 className="text-xl font-semibold mb-8">
        {genreName} ({mediaList.length})
      </h2>

      {mediaList.length === 0 ? (
        <p className="text-gray-400 text-center mt-10">
          Không có phim hoặc TV series nào thuộc thể loại này.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,230px)] gap-6 justify-center lg:justify-start">
          {mediaList.map((item, index) => (
            <Card
              key={`${item.type}-${item.id}`}
              data={{
                id: item.id,
                title: item.title,
                posterUrl: item.posterUrl,
                releaseDate: item.releaseDate,
                rating: item.rating,
                mediaType: item.type,
              }}
              index={index + 1}
              media_type={item.type}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GenrePage;
