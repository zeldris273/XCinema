
const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;
  return (
    <div className="text-red-500 mb-4">
      {error}
      <button onClick={onDismiss} className="ml-2 text-yellow-400 underline">
        Dismiss
      </button>
    </div>
  );
};

export default ErrorMessage;