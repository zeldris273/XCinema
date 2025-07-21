import axios from "axios";
import { useEffect, useState } from "react";

const useFetch = (endpoint) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5116${endpoint}`);
            setLoading(false);
            setData(response.data); // Dữ liệu trả về từ API của bạn
        } catch (error) {
            console.log("Error fetching data:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    return { data, loading };
};

export default useFetch;