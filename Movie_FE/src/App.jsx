import { Outlet, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import MobileNavigation from "./components/mobile/MobileNavigation";
import Chatbot from "./features/Chatbot";
import { useState } from "react";
import chatbotIcon from "./assets/chatbot.png";
function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const location = useLocation();

  const hideHeader = /^\/watch-party\/room-\d+$/i.test(location.pathname);

  return (
    <main className="pb-14 lg:bg-0">
      {!hideHeader && <Header />}

      <div className="min-h-[90vh]">
        <Outlet />
      </div>

      {!hideHeader && <Footer />}
      <MobileNavigation />

      {/* Nút nổi để mở chatbot */}
      {!hideHeader && (
        <button
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="fixed bottom-20 right-5 bg-yellow-500 text-white p-4 rounded-full shadow-lg hover:bg-yellow-600 focus:outline-none z-50"
        >
          <img src={chatbotIcon} alt="Chatbot Icon" className="w-6 h-6" />
        </button>
      )}

      {/* Khung chat nhỏ cố định */}
      {isChatbotOpen && (
        <div className="fixed bottom-20 right-5 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col z-50 border border-gray-300">
          <div className="bg-yellow-500 text-white p-2 flex justify-between items-center rounded-t-lg">
            <h2 className="text-lg font-semibold">Movie Finder Chatbot</h2>
            <button
              onClick={() => setIsChatbotOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <Chatbot />
        </div>
      )}
    </main>
  );
}

export default App;
