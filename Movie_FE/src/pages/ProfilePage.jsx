import { useEffect, useState } from "react";
import api from "../api/api.jsx";
import { useUserProfile } from "../hooks/useUserProfile.jsx";
import AuthModal from "../components/common/AuthModal.jsx";

export default function AccountPage() {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Nam");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { profile, updateProfile } = useUserProfile();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setEmail(profile.email || "");
      setGender(profile.gender || "Nam");
      if (profile.avatarUrl) {
        setAvatar(profile.avatarUrl);
      }
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
        return;
      }

      // Kiểm tra loại file
      if (!file.type.startsWith("image/")) {
        setMessage("Vui lòng chọn file ảnh hợp lệ.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("displayName", name);
      formData.append("gender", gender);

      // Thêm avatar nếu có file được chọn
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && fileInput.files[0]) {
        formData.append("avatar", fileInput.files[0]);
      }

      const response = await api.put("/api/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Thông tin đã được cập nhật thành công!");

      // Cập nhật profile trong hook
      updateProfile(response.data);

      // Cập nhật avatar URL nếu có
      if (response.data.avatarUrl) {
        setAvatar(response.data.avatarUrl);
      }
    } catch (error) {
      setMessage("Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="max-w-md mx-auto p-6 mt-12 text-white">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-12 text-white">
      <h2 className="text-2xl font-bold mb-2">Tài khoản</h2>
      <p className="mb-6 text-gray-300">Cập nhật thông tin tài khoản</p>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes("thành công")
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Avatar
            </div>
          )}
        </div>
        <label className="mt-3 cursor-pointer text-sm text-yellow-400 hover:underline">
          Cập nhật avatar
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1">Tên hiển thị</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-2">Giới tính</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={gender === "Nam"}
                onChange={() => setGender("Nam")}
              />
              Nam
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={gender === "Nữ"}
                onChange={() => setGender("Nữ")}
              />
              Nữ
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-400 text-black hover:bg-yellow-500"
          }`}
        >
          {loading ? "Đang cập nhật..." : "Cập nhật"}
        </button>
      </form>

      <p className="mt-6 text-gray-300">
        Đổi mật khẩu, nhấn vào{" "}
        <button
          onClick={() => setShowForgotPasswordModal(true)}
          className="text-yellow-400 hover:underline focus:outline-none"
        >
          đây
        </button>
      </p>

      {/* Forgot Password Modal */}
      <AuthModal
        show={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        initialMode="forgot"
      />
    </div>
  );
}
