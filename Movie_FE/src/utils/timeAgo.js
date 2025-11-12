export const timeAgo = (utcString) => {
  if (!utcString) return "";
  const diff = Math.floor((Date.now() - new Date(utcString)) / 1000 / 60); // phút
  if (diff < 1) return "just now";
  if (diff === 1) return "1 minute ago";
  if (diff < 60) return `${diff} minutes ago`;
  const hours = Math.floor(diff / 60);
  return `${hours} hour${hours > 1 ? "s" : ""} ago`;
};

export default timeAgo;
