import { useEffect, useState } from "react";

export default function AccountPage() {
  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState("nvh");
  const [email, setEmail] = useState("nvh.27304@gmail.com");
  const [gender, setGender] = useState("Nam");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, name, gender, avatar });
    alert("Thông tin đã được cập nhật!");
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-12 text-white">
      <h2 className="text-2xl font-bold mb-2">Tài khoản</h2>
      <p className="mb-6 text-gray-300">Cập nhật thông tin tài khoản</p>

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
          className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500"
        >
          Cập nhật
        </button>
      </form>

      <p className="mt-6 text-gray-300">
        Đổi mật khẩu, nhấn vào{" "}
        <a href="#" className="text-yellow-400 hover:underline">
          đây
        </a>
      </p>
    </div>
  );
}
