import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from "../api/api";
import Card from '../components/common/Card';

const ExplorePage = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [mediaType, setMediaType] = useState('');

  // Xác định mediaType từ URL
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    if (pathSegments[0] === 'movies') {
      setMediaType('movie');
    } else if (pathSegments[0] === 'tv') {
      setMediaType('tv');
    }
  }, [location.pathname]);

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [location]);

  const fetchData = async () => {
    try {
      if (!mediaType) return; // Đợi mediaType được thiết lập

      const endpoint = mediaType === 'tv' ? 'tvseries' : 'movies';
      const response = await api.get(`/api/${endpoint}`);
      setData(response.data);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchData();
  }, [mediaType]);

  return (
    <div className="py-16">
      <div className="container mx-auto">
        <h3 className="capitalize text-lg lg:text-xl font-semibold my-3 ml-4">
          Popular {mediaType === 'movie' ? 'Movies' : 'TV Series'}
        </h3>

        <div className="grid grid-cols-[repeat(auto-fit,230px)] gap-6 justify-center lg:justify-start ml-4">
          {data.map((exploreData, index) => (
            <Card
              data={exploreData}
              key={exploreData.id + 'exploreSection'}
              media_type={mediaType}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;