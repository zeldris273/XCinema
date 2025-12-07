
const UploadProgress = ({ progress }) => {
  if (progress <= 0) return null;
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 mb-5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      ></div>
      <p className="text-center text-sm text-gray-300 mt-1">{progress}%</p>
    </div>
  );
};

export default UploadProgress;