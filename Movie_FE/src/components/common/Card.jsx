import { Link } from "react-router-dom";
import moment from "moment";
import { FaStar } from "react-icons/fa";

const Card = ({ data, trending, index, media_type }) => {
  // Chuẩn hóa mediaType để khớp với route
  // Ưu tiên mediaType từ data nếu có, nếu không thì dùng media_type prop
  const actualMediaType = data?.mediaType || media_type;
  const mediaType = actualMediaType === "movie" ? "movies" : "tvseries";

  // Backend đã xử lý slug, chỉ cần truyền title (có thể là bất kỳ giá trị, backend bỏ qua)
  const titlePlaceholder = data.title
    ? data.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
    : "untitled";

  return (
    <Link
      to={`/${mediaType}/${data.id}/${titlePlaceholder}`}
      className="w-full min-w-[230px] max-w-[230px] h-80 overflow-hidden block rounded relative"
    >
      <div className="w-full h-full transition-transform hover:scale-105">
        {data?.posterUrl ? (
          <img
            src={data.posterUrl}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="bg-neutral-800 h-full w-full flex justify-center items-center">
            No Image Found
          </div>
        )}
      </div>

      <div className="absolute top-4">
        {trending && (
          <div className="py-1 px-4 backdrop-blur-3xl rounded-r-full bg-black/50">
            #{index} Trending
          </div>
        )}
      </div>

      <div className="absolute bottom-0 h-14 backdrop-blur-3xl w-full bg-black/60 p-2">
        <h2 className="text-ellipsis line-clamp-1 text-lg font-semibold">
          {data?.title}
        </h2>
        <div className="text-sm text-neutral-400 flex justify-between">
          <p>
            {data.releaseDate
              ? moment(data.releaseDate).format("MMMM Do YYYY")
              : "N/A"}
          </p>
          {data.rating != null && (
            <div className="flex gap-1 bg-black px-1 rounded-full text-xs items-center text-white">
              <FaStar style={{ transform: "translateY(-1px)" }} />
              <p>{Number(data.rating).toFixed(1)}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default Card;
