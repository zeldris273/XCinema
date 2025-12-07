import { useState, useEffect } from "react";
import api from "../../api/api";
import customSwal from "../../utils/customSwal";

const ActorTable = () => {
  const [actors, setActors] = useState([]);
  const [newActorName, setNewActorName] = useState("");
  const [editActor, setEditActor] = useState(null);
  const [updatedActor, setUpdatedActor] = useState({ name: "" });

  useEffect(() => {
    fetchActors();
  }, []);

  const fetchActors = async () => {
    try {
      const res = await api.get("/api/actors");
      setActors(res.data);
    } catch (err) {
      customSwal("Lỗi", "Không thể lấy danh sách diễn viên", "error");
    }
  };

  const handleAddActor = async (e) => {
    e.preventDefault();
    if (!newActorName.trim()) {
      customSwal("Lỗi", "Tên diễn viên không được để trống", "warning");
      return;
    }
    try {
      const res = await api.post("/api/actors/find-or-create", {
        name: newActorName.trim(),
      });
      const exists = actors.some((a) => a.id === res.data.id);
      if (!exists) setActors([...actors, res.data]);
      setNewActorName("");
      customSwal("Thành công!", "Actor đã được thêm", "success");
    } catch (err) {
      customSwal("Lỗi", "Không thể thêm diễn viên", "error");
    }
  };

  const handleDeleteActor = async (id) => {
    try {
      await api.delete(`/api/actors/${id}`);
      setActors(actors.filter((a) => a.id !== id));
      customSwal("Thành công!", "Xóa diễn viên thành công!", "success");
    } catch (err) {
      customSwal("Lỗi", "Không thể xóa diễn viên", "error");
    }
  };

  const handleEditActor = (actor) => {
    setEditActor(actor);
    setUpdatedActor({ name: actor.name });
  };

  const handleUpdateActor = async (e) => {
    e.preventDefault();
    if (!editActor) return;
    try {
      const res = await api.put(`/api/actors/${editActor.id}`, updatedActor);
      setActors(
        actors.map((actor) =>
          actor.id === editActor.id ? { ...actor, ...res.data } : actor
        )
      );
      setEditActor(null);
      setUpdatedActor({ name: "" });
      customSwal("Thành công!", "Cập nhật diễn viên thành công!", "success");
    } catch (err) {
      customSwal("Lỗi", "Không thể cập nhật diễn viên", "error");
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-white">Manage Actors</h2>

      {/* Add Actor Form */}
      <form onSubmit={handleAddActor} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newActorName}
          onChange={(e) => setNewActorName(e.target.value)}
          placeholder="Tên diễn viên"
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

      {/* Actors Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed bg-gray-800 rounded-lg border border-gray-700">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-4 py-2 text-left w-2/3">Tên</th>
              <th className="px-4 py-2 text-right w-1/3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {actors.map((actor) => (
              <tr
                key={actor.id}
                className="border-t border-gray-700 hover:bg-gray-700"
              >
                <td className="px-4 py-2 text-white text-left w-2/3">
                  {editActor?.id === actor.id ? (
                    <input
                      type="text"
                      value={updatedActor.name}
                      onChange={(e) =>
                        setUpdatedActor({ name: e.target.value })
                      }
                      className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600 
                                 text-white focus:outline-none focus:border-yellow-500"
                    />
                  ) : (
                    actor.name
                  )}
                </td>
                <td className="px-4 py-2 text-right w-1/3">
                  {editActor?.id === actor.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleUpdateActor}
                        className="px-3 py-1 bg-yellow-500 text-black font-semibold rounded-lg 
                                   hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditActor(null)}
                        className="px-3 py-1 bg-gray-500 text-white font-semibold rounded-lg 
                                   hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditActor(actor)}
                        className="px-3 py-1 bg-blue-600 text-white font-semibold rounded-lg 
                                   hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActor(actor.id)}
                        className="px-3 py-1 bg-red-600 text-white font-semibold rounded-lg 
                                   hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {actors.length === 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-4 text-center text-gray-400">
                  Chưa có diễn viên nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActorTable;
