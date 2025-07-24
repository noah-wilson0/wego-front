import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, X } from 'lucide-react';
import FourColumnLayout from './components/FourColumnLayout';
import Cookies from 'js-cookie';
import axios from 'axios';

interface Place {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const categories = ['장소', '식당', '카페', '숙박'];

  // 쿠키에서 uuid 읽기
  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  // 여행 정보 및 장소 데이터 불러오기
  useEffect(() => {
    const uuid = getUuidFromCookie();
    console.log('쿠키에서 읽은 uuid:', uuid);
    if (!uuid) {
      setLoading(false);
      return;
    }

    // 여행 기본 정보 불러오기
    axios.get(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`)
      .then(res => {
        const { startDate, endDate } = res.data;
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          setTravelInfo({
            destination: '제주', // 예시로 제주로 설정
            duration: `${startDate} ~ ${endDate}`,
            totalDays: diffDays
          });
        }
      })
      .catch(err => {
        console.error('❌ 여행 정보 불러오기 실패', err);
      });

    // 장소 데이터 불러오기 (예시 데이터)
    loadPlaces();
  }, []);

  // 장소 데이터 로드 (실제로는 API에서 가져와야 함)
  const loadPlaces = async () => {
    try {
      // 예시 데이터 - 실제로는 API 호출
      const mockPlaces: Place[] = [
        {
          id: '1',
          name: '성산 일출봉',
          category: '장소',
          description: '제주동부지역 사이클링 여행으로 성...',
          rating: 4.5,
          likes: 11,
          imageUrl: '/api/placeholder/80/80',
          isLiked: false
        },
        {
          id: '2',
          name: '카페',
          category: '카페',
          description: '제주동부지역 사이클링 여행으로 성...',
          rating: 4.5,
          likes: 11,
          imageUrl: '/api/placeholder/80/80',
          isLiked: false
        }
      ];
      
      // 카테고리별로 여러 개 생성
      const allPlaces = mockPlaces.flatMap(place => 
        Array(6).fill(null).map((_, index) => ({
          ...place,
          id: `${place.id}_${index}`,
          name: place.name
        }))
      );
      
      setPlaces(allPlaces);
    } catch (err) {
      console.error('❌ 장소 데이터 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  };

  // 장소 좋아요 토글
  const toggleLike = (placeId: string) => {
    setPlaces(prev => prev.map(place => 
      place.id === placeId ? { ...place, isLiked: !place.isLiked } : place
    ));
  };

  // 장소 추가
  const addPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.id === place.id)) {
      setSelectedPlaces(prev => [...prev, place]);
    }
  };

  // 장소 제거
  const removePlace = (placeId: string) => {
    setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
  };

  // 카테고리별 필터링된 장소들
  const filteredPlaces = places.filter(place => {
    const matchesCategory = selectedCategory === '장소' || place.category === selectedCategory;
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 장소 선택 완료 및 다음 단계로
  const handleNext = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }

    try {
      // 선택된 장소들을 서버에 저장
      await axios.post(
        `http://localhost:8080/travel_plan/places/temp/schedule/${uuid}`,
        { selectedPlaces: selectedPlaces.map(place => place.id) }
      );
      
      navigate('/accommodation'); // 숙소 선택 페이지로 이동
    } catch (err) {
      alert('장소 선택 저장 실패');
      console.error(err);
    }
  };

  // 선택된 장소 컴포넌트
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
            <div key={place.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3">
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{place.name}</h4>
                    <button
                      onClick={() => removePlace(place.id)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
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
    <FourColumnLayout 
      activeStep={3} 
      setActiveStep={() => {}} 
      onNext={handleNext}
      selectedPlaces={selectedPlacesComponent}
    >
      <div className="space-y-6">
        {/* 헤더 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{travelInfo.destination}</h2>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>{travelInfo.duration}</div>
            <div>총 여행 일: {travelInfo.totalDays > 1 ? `${travelInfo.totalDays - 1}박 ${travelInfo.totalDays}일` : '당일여행'}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">장소 선택</span>
            <button 
              className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
              onClick={() => setSelectedPlaces([])}
            >
              초기화 ↻
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="장소를 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 장소 목록 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">장소 데이터를 불러오는 중입니다...</div>
          ) : (
            filteredPlaces.map(place => (
              <div key={place.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{place.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart
                        className={`w-4 h-4 cursor-pointer transition-colors ${
                          place.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
                        }`}
                        onClick={() => toggleLike(place.id)}
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
                  disabled={selectedPlaces.some(p => p.id === place.id)}
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                    selectedPlaces.some(p => p.id === place.id)
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {selectedPlaces.some(p => p.id === place.id) ? (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  ) : (
                    <Plus className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </FourColumnLayout>
  );
};

export default travelPlanPlace;