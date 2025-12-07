import { IoClose } from "react-icons/io5";

const VideoPlay = ({ data, close, media_type }) => {
  // Lấy trailerUrl từ data
  const trailerUrl = data?.trailerUrl;

  // Trích xuất video ID từ trailerUrl (ví dụ: https://www.youtube.com/watch?v=example_trailer)
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regex = /[?&]v=([^&#]*)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(trailerUrl);

  return (
    <section className="fixed bg-neutral-700 top-0 right-0 bottom-0 left-0 z-40 bg-opacity-50 flex justify-center items-center">
      <div className="bg-black w-full max-h-[80vh] max-w-screen-lg aspect-video rounded overflow-hidden relative">
        <button onClick={close} className="absolute right-0 top-0 text-3xl z-50">
          <IoClose />
        </button>

        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Trailer"
          />
        ) : (
          <div className="text-white text-center flex justify-center items-center h-full">
            No trailer available.
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoPlay;