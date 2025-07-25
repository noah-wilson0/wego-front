import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, X } from 'lucide-react';
import FourColumnLayout from './components/FourColumnLayout';
import Cookies from 'js-cookie';
import axios from 'axios';

interface Accommodation {
  contentId: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  likes: number;
  imageUrl: string;
  isLiked: boolean;
}

interface TravelInfo {
  destination: string;
  duration: string;
  totalDays: number;
}

const TravelPlanAccommodation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodations, setSelectedAccommodations] = useState<Accommodation[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo>({
    destination: '',
    duration: '',
    totalDays: 0
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) return;

    axios.get(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}/accommodation`)
      .then(res => {
        const { startDate, endDate } = res.data;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          setTravelInfo({
            destination: '제주',
            duration: `${startDate} ~ ${endDate}`,
            totalDays: diffDays
          });
        }
      })
      .catch(err => console.error('❌ 여행 정보 불러오기 실패', err));
  }, []);

  useEffect(() => {
    setAccommodations([]);
    setPage(0);
    setHasMore(true);
  }, []);

  useEffect(() => {
    loadAccommodations();
  }, [page]);

  const loadAccommodations = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/travel_plan/place/B01/paged?page=${page}&size=20`);
      const newData: Accommodation[] = res.data.content.map((item: any) => ({
        contentId: item.contentId,
        name: item.title,
        category: item.placeType,
        description: item.addr || '',
        rating: item.averageRating || 0,
        likes: item.likeCount || 0,
        imageUrl: item.image || '/placeholder.jpg',
        isLiked: false
      }));

      setAccommodations(prev => [...prev, ...newData]);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error('❌ 숙소 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  };

  const lastAccommodationRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const toggleLike = (contentId: string) => {
    setAccommodations(prev =>
      prev.map(accommodation =>
        accommodation.contentId === contentId
          ? { ...accommodation, isLiked: !accommodation.isLiked }
          : accommodation
      )
    );
  };

  const addAccommodation = (accommodation: Accommodation) => {
    if (!selectedAccommodations.find(a => a.contentId === accommodation.contentId)) {
      setSelectedAccommodations(prev => [...prev, accommodation]);
    }
  };

  const removeAccommodation = (contentId: string) => {
    setSelectedAccommodations(prev => prev.filter(a => a.contentId !== contentId));
  };

  const handleNext = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }

    const requestBody = selectedAccommodations.map(accommodation => ({
      contentId: accommodation.contentId
    }));

    try {
      await axios.post(`http://localhost:8080/travel_plan/place/temp/schedule/${uuid}/accommodation`, requestBody);
      navigate('/route');
    } catch (err) {
      alert('숙소 선택 저장 실패');
      console.error(err);
    }
  };

  const selectedAccommodationsComponent = (
    <div className="space-y-3">
      {selectedAccommodations.length === 0 ? (
        <div className="text-center text-gray-500 text-sm mt-8">
          <div>아직 선택된 숙소가 없습니다.</div>
          <div className="mt-2">숙소를 추가해보세요!</div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">
            총 {selectedAccommodations.length}개 숙소 선택됨
          </div>
          {selectedAccommodations.map((accommodation, index) => (
            <div key={accommodation.contentId} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <img src={accommodation.imageUrl} alt={accommodation.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{accommodation.name}</h4>
                    <button onClick={() => removeAccommodation(accommodation.contentId)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{accommodation.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${accommodation.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{accommodation.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{accommodation.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400">Day {Math.floor(index / 3) + 1}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <FourColumnLayout
      activeStep={4}
      setActiveStep={() => {}}
      onNext={handleNext}
      selectedPlaces={selectedAccommodationsComponent}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{travelInfo.destination}</h2>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>{travelInfo.duration}</div>
            <div>총 여행 일: {travelInfo.totalDays > 1 ? `${travelInfo.totalDays - 1}박 ${travelInfo.totalDays}일` : '당일여행'}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">숙소 선택</span>
            <button className="text-blue-600 text-sm hover:text-blue-800 transition-colors" onClick={() => setSelectedAccommodations([])}>초기화 ↻</button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="숙소명을 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-4">
          {accommodations.length === 0 && loading && (
            <div className="text-center py-8">숙소 데이터를 불러오는 중입니다...</div>
          )}
          {accommodations.map((accommodation, index) => (
            <div
              key={accommodation.contentId}
              ref={index === accommodations.length - 1 ? lastAccommodationRef : null}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <img src={accommodation.imageUrl} alt={accommodation.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{accommodation.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{accommodation.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart
                      className={`w-4 h-4 cursor-pointer transition-colors ${
                        accommodation.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                      onClick={() => toggleLike(accommodation.contentId)}
                    />
                    <span className="text-gray-600">{accommodation.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{accommodation.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addAccommodation(accommodation)}
                disabled={selectedAccommodations.some(a => a.contentId === accommodation.contentId)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                  selectedAccommodations.some(a => a.contentId === accommodation.contentId)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {selectedAccommodations.some(a => a.contentId === accommodation.contentId) ? (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </FourColumnLayout>
  );
};

export default TravelPlanAccommodation;
