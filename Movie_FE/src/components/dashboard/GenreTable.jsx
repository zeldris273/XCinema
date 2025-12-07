import { useState, useEffect } from "react";
import api from "../../api/api";
import customSwal from "../../utils/customSwal";

const GenreTable = () => {
  const [genres, setGenres] = useState([]);
  const [newGenre, setNewGenre] = useState("");

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await api.get("/api/genres");
      setGenres(res.data);
    } catch (err) {
      customSwal("Lỗi!", "Không thể tải danh sách thể loại", "error");
    }
  };

  const handleAddGenre = async (e) => {
    e.preventDefault();
    if (!newGenre.trim()) return;

    try {
      const res = await api.post("/api/genres", { name: newGenre.trim() });
      setGenres([...genres, res.data]);
      setNewGenre("");
      customSwal("Thành công!", "Thêm thể loại thành công!", "success");
    } catch (err) {
      customSwal("Lỗi!", "Không thể thêm thể loại", "error");
    }
  };

  const handleDeleteGenre = async (id) => {
    try {
      await api.delete(`/api/genres/${id}`);
      setGenres(genres.filter((g) => g.id !== id));
      customSwal("Thành công!", "Xóa thể loại thành công!", "success");
    } catch (err) {
      customSwal("Lỗi!", "Không thể xóa thể loại", "error");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-white">Manage Genres</h2>

      {/* Form thêm thể loại */}
      <form onSubmit={handleAddGenre} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          placeholder="Tên thể loại"
          className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white 
                     focus:outline-none focus:border-yellow-500"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg 
                     hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          Thêm
        </button>
      </form>

      {/* Bảng hiển thị thể loại */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed bg-gray-800 rounded-lg border border-gray-700">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-4 py-2 text-left w-2/3">Tên thể loại</th>
              <th className="px-4 py-2 text-right w-1/3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {genres.map((genre) => (
              <tr
                key={genre.id}
                className="border-t border-gray-700 hover:bg-gray-700"
              >
                <td className="px-4 py-2 text-white text-left w-2/3">
                  {genre.name}
                </td>
                <td className="px-4 py-2 text-right w-1/3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDeleteGenre(genre.id)}
                      className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg 
                                 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {genres.length === 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-4 text-center text-gray-400">
                  Chưa có thể loại nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GenreTable;
