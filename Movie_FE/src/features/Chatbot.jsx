import { useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { IoSendSharp } from 'react-icons/io5';

const Chatbot = () => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = sessionStorage.getItem('chatHistory'); // Sử dụng sessionStorage
    return savedMessages
      ? JSON.parse(savedMessages)
      : [
          { text: 'Hello! I can help you find movies. Please describe the movie you’re looking for.', isUser: false },
        ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lưu messages vào sessionStorage mỗi khi messages thay đổi
  useEffect(() => {
    sessionStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  // Không cần sự kiện beforeunload nữa vì sessionStorage tự động xử lý khi đóng tab/trình duyệt

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/Chatbot/search', {
        description: input,
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch movies. Please try again.');
      }

      const searchCriteria = response.data;

      let botMessage;

      if (searchCriteria.Error) {
        botMessage = { text: `Error: ${searchCriteria.Error}`, isUser: false };
      } else {
        const movies = searchCriteria.MovieTitles.map((title, index) => ({
          title: title,
          overview: searchCriteria.Themes || 'No description available',
          genres: searchCriteria.Genre || 'Unknown',
          actors: searchCriteria.Actors || 'Unknown',
          releaseDate: searchCriteria.Year || 'Unknown',
        }));

        botMessage = movies.length > 0
          ? { text: 'Here are the movies I found:', isUser: false, movies }
          : { text: 'Sorry, I couldn’t find any movies matching your description.', isUser: false };
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: `Error: ${error.message}`, isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-[85%] p-2 rounded-lg ${
                message.isUser
                  ? 'ml-auto bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.text}</p>
              {message.movies && message.movies.length > 0 && (
                <div className="mt-1 space-y-1">
                  {message.movies.map((movie, i) => (
                    <div key={i} className="p-1 bg-gray-50 border-l-2 border-yellow-500 text-xs">
                      <p className="font-semibold">{movie.title}</p>
                      <p className="text-[10px]">{movie.overview}</p>
                      <p className="text-[8px] text-gray-600">
                        Genres: {movie.genres} | Actors: {movie.actors} | Release: {movie.releaseDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="text-center text-yellow-500 text-sm">Loading...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-2 bg-white border-t">
        <div className="flex space-x-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-1 border rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm text-gray-900"
            placeholder="Enter movie description..."
          />
          <button
            onClick={handleSendMessage}
            className="px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 text-sm"
            disabled={isLoading}
          >
            <IoSendSharp />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;