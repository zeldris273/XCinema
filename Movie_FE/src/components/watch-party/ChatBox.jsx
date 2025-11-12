import React, { useEffect, useState } from "react";
import { BsToggleOn, BsSend } from "react-icons/bs";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const ChatBox = ({
  isChatHidden,
  setIsChatHidden,
  messages,
  systemMessages = [],
  input,
  setInput,
  handleKeyPress,
  handleSend,
  avatarUrl,
  currentUser,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [localUser, setLocalUser] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const displayName =
          decoded["DisplayName"] || decoded["email"] || decoded["sub"];
        setLocalUser(displayName);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      let guestId = localStorage.getItem("guestId");
      if (!guestId) {
        guestId = `Guest-${Math.floor(100000 + Math.random() * 900000)}`;
        localStorage.setItem("guestId", guestId);
      }
      setLocalUser("1 khách");
      setIsLoggedIn(false);
    }
  }, []);

  if (isChatHidden) return null;

  return (
    <div className="w-[400px] bg-neutral-800 border-l border-neutral-700 flex flex-col sticky top-0 h-screen">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-900 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <button
          onClick={() => setIsChatHidden(true)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition"
        >
          <span className="text-sm">Hide</span>
          <BsToggleOn className="text-xl text-yellow-500" />
        </button>
      </div>

      {/* Notice */}
      <div className="bg-yellow-200 text-center text-black px-4 py-3 flex-shrink-0 rounded-b-lg">
        <p className="font-semibold">The watch party begins.</p>
        <p className="text-sm opacity-80">Hope you enjoy the movie!</p>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {/* System Messages */}
        {systemMessages.map((msg, i) => (
          <div
            key={`sys-${i}`}
            className="text-center text-gray-400 text-sm italic"
          >
            {msg}
          </div>
        ))}

        {messages.map((m, i) => {
          const isMine = m.user === localUser;
          return (
            <div
              key={i}
              className={`flex items-end ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {!isMine && (
                <img
                  src={
                    m.avatar ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${m.user}`
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2 border border-neutral-600 object-cover"
                />
              )}
              <div
                className={`p-3 rounded-lg max-w-[75%] break-words ${
                  isMine
                    ? "bg-yellow-500 text-black rounded-br-none"
                    : "bg-neutral-700 text-gray-200 rounded-bl-none"
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-80">
                  {m.user}
                </div>
                <div className="text-sm">{m.text}</div>
              </div>
              {isMine && (
                <img
                  src={m.avatar || avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ml-2 border border-neutral-600 object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neutral-700 bg-neutral-900 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-neutral-700 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500 transition"
            placeholder={
              isLoggedIn ? "Chat something..." : "You need login to chat"
            }
            disabled={!isLoggedIn}
          />
          <button
            onClick={() => handleSend(currentUser, avatarUrl)}
            disabled={!input.trim() || !isLoggedIn}
            className="bg-yellow-500 px-4 py-3 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
          >
            <BsSend size={18} />
          </button>
        </div>

        {/* Current User */}
        <div className="text-sm text-gray-400 mt-2 flex items-center gap-1">
          {isLoggedIn ? (
            <>
              <span className="text-yellow-500">👤</span>
              {currentUser}
            </>
          ) : (
            <p className="text-gray-400">
              You need{" "}
              <span
                onClick={() => navigate("/auth")}
                className="underline text-yellow-500 cursor-pointer hover:text-yellow-400"
              >
                login
              </span>{" "}
              to chat
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
