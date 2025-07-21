import { useState, useEffect } from 'react';
import api from '../api/api'; // Sử dụng instance api thay vì axios

const useFetchDetails = (mediaType, id, title) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint =
          mediaType === 'movie'
            ? `/api/movies/${id}/${title}`
            : `/api/tvseries/${id}/${title}`;
        const response = await api.get(endpoint); // Sử dụng api thay vì axios
        setData(response.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          // Lấy thông điệp lỗi từ backend
          setError(err.response.data.error || 'Resource not found');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mediaType, id, title]);

  return { data, loading, error };
};

export default useFetchDetails;