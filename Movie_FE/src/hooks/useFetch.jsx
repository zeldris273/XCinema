import { useEffect, useState } from "react";
import api from "../api/api";

const useFetch = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoint);
      setLoading(false);
      // Ensure we always set an array
      const responseData = response.data;
      if (Array.isArray(responseData)) {
        setData(responseData);
      } else {
        console.error(`useFetch: API endpoint ${endpoint} did not return an array:`, responseData);
        setData([]);
      }
    } catch (error) {
      console.error(`useFetch: Error fetching ${endpoint}:`, error);
      setLoading(false);
      setData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading };
};

export default useFetch;
