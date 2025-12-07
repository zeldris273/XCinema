import { Link } from "react-router-dom";
import { IoClose } from "react-icons/io5";

const MobileGenresModal = ({ isOpen, onClose, genres }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 px-4 py-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Genres</h2>
        <button
          onClick={onClose}
          className="text-white text-2xl p-2 hover:bg-neutral-800 rounded-full"
        >
          <IoClose />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            to={`/genres/${genre.id}`}
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white text-center py-4 px-3 rounded-lg transition-colors duration-200"
          >
            {genre.name}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileGenresModal;
