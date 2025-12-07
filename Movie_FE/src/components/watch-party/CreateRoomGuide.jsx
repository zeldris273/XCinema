
const CreateRoomGuide = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1f25] w-full max-w-md rounded-2xl p-6 shadow-xl">
        {/* Title */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Create Watch Party Room
          </h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          A quick guide on how to create a watch party room
        </p>

        {/* Steps */}
        <div className="space-y-6">
          <div>
            <p className="text-yellow-300 font-bold text-2xl">1</p>
            <p className="mt-1 text-gray-200">
              Find the movie you want to watch together.
            </p>
          </div>

          <div>
            <p className="text-yellow-300 font-bold text-2xl">2</p>
            <p className="mt-1 text-gray-200">
              Go to its watch page and click the{" "}
              <span className="px-2 py-1 border rounded-lg bg-black text-white">
                🎥 Watch Party
              </span>{" "}
              button in the player control bar.
            </p>
          </div>

          <div>
            <p className="text-yellow-300 font-bold text-2xl">3</p>
            <p className="mt-1 text-gray-200">
              Fill in the room details and set your viewing schedule.
            </p>
          </div>

          <div>
            <p className="text-yellow-300 font-bold text-2xl">4</p>
            <p className="mt-1 text-gray-200">
              Complete setup and share the room link with your friends.
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default CreateRoomGuide;
