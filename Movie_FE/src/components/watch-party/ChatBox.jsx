import React from "react";
import { BsToggleOn, BsToggleOff, BsSend } from "react-icons/bs";

const ChatBox = ({
  isChatHidden,
  setIsChatHidden,
  messages,
  input,
  setInput,
  handleKeyPress,
  handleSend,
  currentUser,
}) => {
  if (isChatHidden) return null;

  return (
    <div className="w-[400px] bg-neutral-800 border-l border-neutral-700 flex flex-col sticky top-0 h-screen">
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

      <div className="bg-yellow-200 text-center text-black px-4 py-3 flex-shrink-0 rounded-b-lg">
        <p className="font-semibold">The watch party begins.</p>
        <p className="text-sm opacity-80">Hope you enjoy the movie!</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.user === currentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[75%] break-words ${
                m.user === currentUser
                  ? "bg-yellow-500 text-black rounded-br-none"
                  : "bg-neutral-700 text-gray-200 rounded-bl-none"
              }`}
            >
              <div className="text-xs font-semibold mb-1 opacity-80">
                {m.user}
              </div>
              <div className="text-sm">{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-neutral-700 bg-neutral-900 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-neutral-700 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-500 transition"
            placeholder="Chat something..."
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-yellow-500 px-4 py-3 rounded-lg hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
          >
            <BsSend size={18} />
          </button>
        </div>

        <div className="text-sm text-gray-400 mt-2 flex items-center gap-1">
          <span className="text-yellow-500">👤</span>
          {currentUser}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
