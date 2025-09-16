import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, X } from 'lucide-react';
import FourColumnLayout from './components/FourColumnLayout';
import Cookies from 'js-cookie';
import axios from 'axios';

interface Place {
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

const categoryMap: Record<string, string> = {
  '장소': 'A01',
  '식당': 'A02',
  '카페': 'A03',
  '숙박': 'B01'
};

const travelPlanPlace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('장소');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
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

  const categories = ['장소', '식당', '카페', '숙박'];

  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) return;

    axios.get(`http://localhost:8080/draft-plans/${uuid}/dates`)
      .then(res => {
        const { startDate, endDate } = res.data;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          setTravelInfo({
            // NOTE: 목적지 표시는 서버/슬러그 맵핑이 준비되면 교체해도 됨
            destination: '제주',
            duration: `${startDate} ~ ${endDate}`,
            totalDays: diffDays
          });
        }
      })
      .catch(err => console.error('❌ 여행 정보 불러오기 실패', err));
  }, []);

  // ✅ 카테고리 변경 시 목록 초기화 & 첫 페이지부터 다시 로드
  useEffect(() => {
    setPlaces([]);
    setPage(0);
    setHasMore(true);
  }, [selectedCategory]);

  // ✅ page/카테고리 변경되면 로드
  useEffect(() => {
    loadPlaces();
  }, [page, selectedCategory]); // areaSlug 의존성 제거

  const loadPlaces = async () => {
    if (!hasMore || loading) return;

    const uuid = getUuidFromCookie();
    if (!uuid) {
      console.warn('⚠️ uuid 쿠키가 없습니다. 요청을 건너뜁니다.');
      return;
    }

    setLoading(true);
    try {
      const type = categoryMap[selectedCategory];

      // ✅ 변경된 백엔드 엔드포인트로 호출: /draft-plans/{uuid}/{placeType}/paged
      const res = await axios.get(
        `http://localhost:8080/draft-plans/${encodeURIComponent(uuid)}/${type}/paged?page=${page}&size=20`
      );

      const newData: Place[] = res.data.content.map((item: any) => ({
        contentId: item.contentId,
        name: item.title,
        category: item.placeType,
        description: item.addr || '',
        rating: item.averageRating || 0,
        likes: item.likeCount || 0,
        imageUrl: item.image || '/placeholder.jpg',
        isLiked: false
      }));

      setPlaces(prev => [...prev, ...newData]);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error('❌ 장소 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  };

  const lastPlaceRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const toggleLike = (placeId: string) => {
    setPlaces(prev => prev.map(place => place.contentId === placeId ? { ...place, isLiked: !place.isLiked } : place));
  };

  const addPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.contentId === place.contentId)) {
      setSelectedPlaces(prev => [...prev, place]);
    }
  };

  const removePlace = (placeId: string) => {
    setSelectedPlaces(prev => prev.filter(p => p.contentId !== placeId));
  };

  const handleNext = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }

    const requestBody = selectedPlaces.map(place => ({ contentId: place.contentId }));

    try {
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/places`, requestBody);
      navigate('/accommodation');
    } catch (err) {
      alert('장소 선택 저장 실패');
      console.error(err);
    }
  };

  const selectedPlacesComponent = (
    <div className="space-y-3">
      {selectedPlaces.length === 0 ? (
        <div className="text-center text-gray-500 text-sm mt-8">
          <div>아직 선택된 장소가 없습니다.</div>
          <div className="mt-2">장소를 추가해보세요!</div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">
            총 {selectedPlaces.length}개 장소 선택됨
          </div>
          {selectedPlaces.map((place, index) => (
            <div key={place.contentId} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <img src={place.imageUrl} alt={place.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{place.name}</h4>
                    <button onClick={() => removePlace(place.contentId)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{place.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Heart className={`w-3 h-3 ${place.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{place.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{place.rating}</span>
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
    <FourColumnLayout activeStep={3} setActiveStep={() => {}} onNext={handleNext} selectedPlaces={selectedPlacesComponent}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{travelInfo.destination}</h2>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>{travelInfo.duration}</div>
            <div>총 여행 일: {travelInfo.totalDays > 1 ? `${travelInfo.totalDays - 1}박 ${travelInfo.totalDays}일` : '당일여행'}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">장소 선택</span>
            <button className="text-blue-600 text-sm hover:text-blue-800 transition-colors" onClick={() => setSelectedPlaces([])}>초기화 ↻</button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="장소명을 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {categories.map(category => (
            <button key={category} onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {places.length === 0 && loading && (
            <div className="text-center py-8">장소 데이터를 불러오는 중입니다...</div>
          )}
          {places.map((place, index) => (
            <div
              key={place.contentId}
              ref={index === places.length - 1 ? lastPlaceRef : null}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <img src={place.imageUrl} alt={place.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{place.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart
                      className={`w-4 h-4 cursor-pointer transition-colors ${
                        place.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                      onClick={() => toggleLike(place.contentId)}
                    />
                    <span className="text-gray-600">{place.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{place.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addPlace(place)}
                disabled={selectedPlaces.some(p => p.contentId === place.contentId)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                  selectedPlaces.some(p => p.contentId === place.contentId)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {selectedPlaces.some(p => p.contentId === place.contentId) ? (
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

export default travelPlanPlace;
