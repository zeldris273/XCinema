import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import customSwal from "../utils/customSwal.js";
import * as signalR from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";

const CreateRoom = () => {
  const [roomName, setRoomName] = useState("Watch Mango Garden Hotel together");
  const [autoStart, setAutoStart] = useState(false);
  const [privateRoom, setPrivateRoom] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      customSwal("Unauthorized", "Please log in to create a room.", "error");
      navigate("/auth");
    }
  }, [navigate]);

  const handleCreate = async () => {
    const roomId = "room-" + Math.floor(Math.random() * 100000);
    let currentUser = null;

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const decoded = jwtDecode(token);
        currentUser = decoded.sub;
      }
    } catch (err) {
      console.error("❌ Failed to decode token:", err);
    }

    if (!currentUser) {
      customSwal("Error", "Cannot identify your account.", "error");
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL)
      .withAutomaticReconnect()
      .build();

    try {
      await connection.start();
      await connection.invoke("CreateRoom", roomId, currentUser);

      customSwal("Room Created!", `Room ID: ${roomId}`, "success");
      navigate(`/watch-party?roomId=${roomId}&user=${currentUser}`);
    } catch (err) {
      console.error("❌ Failed to create room:", err);
      customSwal("Failed", "Could not create room.", "error");
    } finally {
      await connection.stop();
    }
  };

  // ✅ UI
  return (
    <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center p-4 md:p-8 pt-24 mt-10">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: Movie Poster */}
        <div className="bg-[#1a1a1d] rounded-2xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-black flex items-center justify-center">
            <img
              src="https://hentaiporns.net/r/entradas/2025/01/sample_bf2df1e9dae7de607a31f1e1e31203fc.jpg"
              alt="Poster"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="p-5 space-y-3">
            <h1 className="text-xl font-bold">Mango Garden Hotel</h1>
            <p className="text-yellow-400 font-semibold text-sm">Mango</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-300">
              <span className="px-2 py-1 bg-neutral-800 rounded">Drama</span>
              <span className="px-2 py-1 bg-neutral-800 rounded">Romance</span>
              <span className="px-2 py-1 bg-neutral-800 rounded">
                Psychology
              </span>
              <span className="px-2 py-1 bg-neutral-800 rounded">
                Emotional
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              An ambitious hotel manager and his reluctant daughter travel to
              Málaga, where they find what they have long desired in the
              peaceful mango garden of a local farmer.
            </p>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="flex flex-col bg-[#1a1a1d] rounded-2xl p-6 shadow-lg">
          <div className="flex-1 space-y-8">
            {/* 1. Room Name */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                1. Room Name
              </h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-[#2a2a2e] border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </div>

            {/* 2. Time Settings */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                2. Time Settings
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                You can start the session manually or automatically based on the
                schedule.
              </p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-base">Start automatically</span>
                <div
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    autoStart ? "bg-yellow-400" : "bg-gray-600"
                  }`}
                  onClick={() => setAutoStart(!autoStart)}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      autoStart ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>

            {/* 3. Privacy */}
            <div>
              <h2 className="font-semibold mb-3 text-base text-white">
                3. Privacy
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                When enabled, only people with the invite link can join this
                room.
              </p>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-base">Private Room</span>
                <div
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                    privateRoom ? "bg-yellow-400" : "bg-gray-600"
                  }`}
                  onClick={() => setPrivateRoom(!privateRoom)}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      privateRoom ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-neutral-700">
            <button className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-sm font-semibold shadow-md transition"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
