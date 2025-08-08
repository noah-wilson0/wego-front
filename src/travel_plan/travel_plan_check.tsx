import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Plus, Minus, Car } from 'lucide-react';
import { SingleTimelineItem } from './components/TimelineIcon';
import Cookies from 'js-cookie';
import axios from 'axios';
/**
 * TODO: 로그인 구현 후 여행 일정 저장, 편집 기능 구현할 예정
 */
// 업데이트된 FullCheckColumnLayout 컴포넌트
interface FullCheckColumnLayoutProps {
  children: React.ReactNode;
  settlementContent?: React.ReactNode;
  mapContent?: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
  isMainPanelOpen: boolean;
  setIsMainPanelOpen: (open: boolean) => void;
  selectedDay: number | 'all';
  setSelectedDay: (day: number | 'all') => void;
  totalDays: number;
  onEdit?: () => void;
  onSave?: () => void;
}

const FullCheckColumnLayout: React.FC<FullCheckColumnLayoutProps> = ({
  children,
  settlementContent,
  mapContent,
  activeStep,
  setActiveStep,
  onNext,
  isMainPanelOpen,
  setIsMainPanelOpen,
  selectedDay,
  setSelectedDay,
  totalDays,
  onEdit,
  onSave,
}) => {
  const [isSettlementPanelOpen, setIsSettlementPanelOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            {/* 전체 버튼 */}
            <button
              onClick={() => setSelectedDay('all')}
              className={`w-12 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                selectedDay === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              전체
            </button>
            
            {/* 동적으로 생성되는 일차 버튼들 */}
            {Array.from({ length: totalDays }, (_, index) => {
              const day = index + 1;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-12 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                    selectedDay === day 
                      ? 'bg-black text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {day}일차
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            className="bg-gray-200 text-gray-600 py-2 px-4 rounded-md text-base hover:bg-gray-300 transition-colors"
            onClick={onEdit}
          >
            편집
          </button>
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-md text-base hover:bg-red-600 transition-colors"
            onClick={onSave}
          >
            저장
          </button>
        </div>
      </aside>

      {/* 가운데 본문 - 토글 가능한 너비 */}
      <div className={`${isMainPanelOpen ? 'w-[65%]' : 'w-[35%]'} transition-all duration-300 p-4 h-full flex flex-col relative`}>
        {/* 본문 토글 버튼 */}
        <button
          onClick={() => setIsMainPanelOpen(!isMainPanelOpen)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-gray-400"
          >
            <path 
              d={isMainPanelOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        <div className="flex-1 overflow-x-auto overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="min-w-max h-full">
            {children}
          </div>
        </div>
      </div>

      {/* 오른쪽 영역 - 지도와 정산하기 탭 */}
      <div className={`${isMainPanelOpen ? 'flex-1' : 'w-[65%]'} transition-all duration-300 relative flex flex-col`}>
        {/* 지도 영역 - 정산하기 탭 상태에 따라 높이 조절 */}
        <div className={`${isSettlementPanelOpen ? 'h-1/2' : 'flex-1'} bg-gray-200 p-4 transition-all duration-300`}>
          <div className="h-full bg-white rounded shadow-sm">
            {mapContent || (
              <div className="h-full flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-2">지도 영역</h3>
                <p className="text-gray-600">지도 API 연동 예정</p>
              </div>
            )}
          </div>
        </div>

        {/* 정산하기 탭 - 접힘/펼침 상태에 따라 높이 조절 */}
        <div className={`${isSettlementPanelOpen ? 'h-1/2' : 'h-8'} bg-white border-t transition-all duration-300 relative flex-shrink-0`}>
          {/* 정산하기 탭 토글 버튼 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => setIsSettlementPanelOpen(!isSettlementPanelOpen)}
              className="bg-white border border-gray-300 w-20 h-6 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-gray-400"
              >
                <path 
                  d={isSettlementPanelOpen ? "M6 9L12 15L18 9" : "M18 15L12 9L6 15"} 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {isSettlementPanelOpen && (
            <div className="p-4 h-full pt-8 overflow-auto">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">정산하기</h2>
              </div>
              <div className="h-full">
                {settlementContent || (
                  <div className="text-gray-500 text-center py-8">
                    <p>정산 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 데이터 인터페이스
interface Place {
  content_id: string;
  place_type: string;
  title: string;
  image: string;
  sequence: number;
  start_time: string;
  end_time: string;
}

interface Accommodation {
  content_id: string;
  place_type: string;
  title: string;
  image: string;
  sequence: number;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  date: string;
  start_time: string;
  end_time: string;
  places: Place[];
  accommodation: Accommodation | null;
}

interface Route {
  sequence: number;
  origin: string;
  destination: string;
  taxiFare: number;
  distance: number;
  duration: number; // 초단위
}

interface DayRoute {
  [date: string]: Route[];
}

interface RouteData {
  route_type: string;
  daily_route: DayRoute;
}

interface TravelData {
  start_date: string;
  end_date: string;
  days: DaySchedule[];
  routes: RouteData[];
}

// API 함수
const fetchTravelData = async (): Promise<TravelData> => {
  // UUID 쿠키에서 가져오기
  const uuid = Cookies.get('travelPlanUUID');
  if (!uuid) {
    throw new Error('UUID가 없습니다. 쿠키를 확인해주세요.');
  }

  try {
    // 서버에서 여행 데이터 가져오기
    const response = await axios.get(`http://localhost:8080/travel_plan/temp/schedule/${uuid}`);
    return response.data;
  } catch (error) {
    console.error('❌ 여행 데이터 불러오기 실패:', error);
    throw error;
  }
};

// 초를 분으로 변환하는 유틸 함수
const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return `${minutes}분`;
};

// TravelPlanCheck 컴포넌트
const TravelPlanCheck: React.FC = () => {
  const [activeStep, setActiveStep] = useState(3);
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlaces, setSelectedPlaces] = useState([
    { id: 's1', name: '산둘레숲길', category: '명소', image: '/api/placeholder/60/60', placeType: 'A01' as const },
    { id: 's2', name: '홍두깨가게', category: '음식점', image: '/api/placeholder/60/60', placeType: 'A02' as const },
    { id: 's3', name: '치료제과점마을', category: '카페', image: '/api/placeholder/60/60', placeType: 'A03' as const }
  ]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const loadTravelData = async () => {
      try {
        // UUID 확인
        const uuid = Cookies.get('travelPlanUUID');
        if (!uuid) {
          console.error('❌ UUID가 쿠키에 없습니다.');
          setLoading(false);
          return;
        }

        console.log('📡 여행 데이터 로딩 중... UUID:', uuid);
        const data = await fetchTravelData();
        console.log('✅ 여행 데이터 로드 성공:', data);
        setTravelData(data);
      } catch (error) {
        console.error('❌ 여행 데이터 로드 실패:', error);
        // 에러 발생 시 사용자에게 알림
        alert('여행 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    };

    loadTravelData();
  }, []);

  const handleEdit = () => {
    console.log('편집 버튼 클릭');
  };

  const handleSave = () => {
    console.log('저장 버튼 클릭');
  };

  // placeType에 따른 색상과 카테고리명 반환
  const getPlaceTypeInfo = (placeType: string) => {
    switch (placeType) {
      case 'A01': // 명소
        return { color: 'bg-blue-500', textColor: 'text-blue-500', label: '명소' };
      case 'A02': // 음식점
        return { color: 'bg-red-500', textColor: 'text-red-500', label: '음식점' };
      case 'A03': // 카페
        return { color: 'bg-red-500', textColor: 'text-red-500', label: '카페' };
      case 'B01': // 숙소
        return { color: 'bg-gray-500', textColor: 'text-gray-500', label: '숙소' };
      default:
        return { color: 'bg-gray-400', textColor: 'text-gray-400', label: '기타' };
    }
  };

  // 각 날짜별 장소와 숙소를 합쳐서 타임라인 아이템 생성
  const createTimelineItems = (dayData: DaySchedule, routes: Route[]) => {
    const items = [];
    
    // 장소들 추가
    dayData.places.forEach((place, index) => {
      const route = routes.find(r => r.origin === place.content_id);
      items.push({
        id: place.content_id,
        title: place.title,
        image: place.image,
        time: `${place.start_time}~${place.end_time}`,
        placeType: place.place_type as 'A01' | 'A02' | 'A03' | 'B01',
        duration: route ? formatDuration(route.duration) : undefined
      });
    });

    // 숙소 추가
    if (dayData.accommodation) {
      items.push({
        id: dayData.accommodation.content_id,
        title: dayData.accommodation.title,
        image: dayData.accommodation.image,
        time: `${dayData.accommodation.start_time}~${dayData.accommodation.end_time}`,
        placeType: dayData.accommodation.place_type as 'A01' | 'A02' | 'A03' | 'B01',
        duration: undefined // 숙소는 마지막이므로 duration 없음
      });
    }

    return items;
  };

  // 날짜별 스케줄과 경로 데이터 결합 (travelData가 있을 때만)
  const schedules = travelData ? travelData.days.map((day, index) => {
    const dayRoute = travelData.routes.find(route => 
      route.daily_route[day.date]
    );
    const routes = dayRoute ? dayRoute.daily_route[day.date] : [];
    
    return {
      day: index + 1,
      date: day.date,
      places: createTimelineItems(day, routes)
    };
  }) : [];

  // 선택된 일차에 따른 스케줄 필터링
  const filteredSchedules = selectedDay === 'all' 
    ? schedules 
    : schedules.filter(schedule => schedule.day === selectedDay);

  // 로딩 중일 때 (Hook 선언 이후에 위치)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">여행 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!travelData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">여행 데이터를 불러올 수 없습니다.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  // 메인 본문 콘텐츠
  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">LOGO</h1>
            <span className="text-lg text-gray-500">제주</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs hover:bg-blue-200 transition-colors">
              일정만보기
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors">
              시간표로 보기
            </button>
            <button className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs hover:bg-purple-200 transition-colors">
              공유하기
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500">{travelData.start_date} ~ {travelData.end_date}</p>
      </div>

      {/* 가로 스크롤 가능한 타임라인 */}
      <div className="flex-1 p-6 overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* 가로로 스크롤되는 일정들 */}
        <div className={`flex gap-12 transition-all duration-300 ${isMainPanelOpen ? 'min-w-max' : ''}`}>
          {filteredSchedules.map((schedule, dayIndex) => (
            <div key={dayIndex} className={`flex-shrink-0 ${isMainPanelOpen ? 'w-80' : dayIndex === 0 ? 'w-80' : 'w-0 overflow-hidden'} transition-all duration-300`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{schedule.day}일차</h2>
                <p className="text-xs text-gray-400">{schedule.date}</p>
              </div>

              {/* 장소 리스트 */}
              <div className="flex flex-col">
                {schedule.places.map((place, placeIndex) => {
                  const isFirst = placeIndex === 0;
                  const isLast = placeIndex === schedule.places.length - 1;
                  const placeTypeInfo = getPlaceTypeInfo(place.placeType);
                  
                  return (
                    <div key={placeIndex} className="flex items-start mb-8">
                      {/* 타임라인 아이템 */}
                      <div className="flex-shrink-0">
                        <SingleTimelineItem
                          index={placeIndex}
                          color={placeTypeInfo.color}
                          isFirst={isFirst}
                          isLast={isLast}
                          duration={place.duration}
                        />
                      </div>
                      
                      {/* 장소 카드 - 동그라미 아이콘 중심과 정렬 */}
                      <div className="ml-4 flex-1" style={{marginTop: isFirst ? '0px' : '178px'}}>
                        <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-3 w-full max-w-xs">
                          {place.time && (
                            <p className="text-sm text-gray-500 mb-3">{place.time}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{place.title}</h3>
                              <span className={`text-xs ${placeTypeInfo.textColor}`}>{placeTypeInfo.label}</span>
                            </div>
                            <img 
                              src={place.image} 
                              alt={place.title}
                              className="w-16 h-12 object-cover rounded ml-3 flex-shrink-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 지도 콘텐츠
  const mapContent = (
    <div className="h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-2">지도 영역</h3>
      <p className="text-gray-600">지도 API 연동 예정</p>
    </div>
  );

  // 정산 콘텐츠
  const settlementContent = (
    <div className="h-full">
      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-2">정산하기</h3>
        <p className="text-sm text-purple-600 mb-3">이번여행에서 1명당 1,000,000원을 쓸 예정이에요!</p>
        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
        </div>
        <p className="text-xs text-purple-600">1,000,000원</p>
        <button className="w-full bg-purple-600 text-white rounded-lg py-2 mt-3 text-sm">
          정산하기
        </button>
      </div>

      <div>
        <h3 className="font-semibold mb-4">사용 내역</h3>
        {selectedPlaces.map((place, index) => (
          <div key={place.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <img 
                src={place.image} 
                alt={place.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div>
                <p className="font-medium text-sm">{place.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {place.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {index === 0 ? '107,460원' : index === 1 ? '24,500원' : '148,000원'}
              </p>
              <p className="text-xs text-gray-500">
                {index === 0 ? '1인' : index === 1 ? '4인 기준' : '숙박비'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <FullCheckColumnLayout
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      mapContent={mapContent}
      settlementContent={settlementContent}
      isMainPanelOpen={isMainPanelOpen}
      setIsMainPanelOpen={setIsMainPanelOpen}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      totalDays={schedules.length}
      onEdit={handleEdit}
      onSave={handleSave}
      onNext={() => setActiveStep(activeStep + 1)}
    >
      {mainContent}
    </FullCheckColumnLayout>
  );
};

export default TravelPlanCheck;