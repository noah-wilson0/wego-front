import React, { useState } from 'react';
import { MapPin, Clock, Plus, Minus } from 'lucide-react';

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
}) => {
  const [isSettlementPanelOpen, setIsSettlementPanelOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            <div className={activeStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 1. 시간 선택
            </div>
            <div className={activeStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 2. 생성 방식 선택
            </div>
            <div className={activeStep === 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 3. 장소 선택
            </div>
            <div className={activeStep === 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 4. 숙소 선택
            </div>
          </nav>
        </div>
        <button
          className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base"
          onClick={onNext}
        >
          다음
        </button>
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
        
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
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
  id: string;
  name: string;
  image: string;
  time?: string;
  category?: string;
}

interface DaySchedule {
  day: number;
  date: string;
  places: Place[];
}

// TravelPlanCheck 컴포넌트
const TravelPlanCheck: React.FC = () => {
  const [activeStep, setActiveStep] = useState(3);
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [schedules, setSchedules] = useState<DaySchedule[]>([
    {
      day: 1,
      date: '2024년 4월 20일 (토)',
      places: [
        { id: '1', name: '성산 일출봉', image: '/api/placeholder/80/60', time: '09:00~11:00', category: '명소' },
        { id: '2', name: '성산 일출봉', image: '/api/placeholder/80/60', category: '명소' }
      ]
    },
    {
      day: 2,
      date: '2024년 4월 21일 (일)',
      places: [
        { id: '3', name: '성산 일출봉', image: '/api/placeholder/80/60', time: '09:00~11:00', category: '명소' },
        { id: '4', name: '성산 일출봉', image: '/api/placeholder/80/60', category: '명소' }
      ]
    }
  ]);

  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([
    { id: 's1', name: '산둘레숲길', category: '등산', image: '/api/placeholder/60/60' },
    { id: 's2', name: '홍두깨가게', category: '맛집', image: '/api/placeholder/60/60' },
    { id: 's3', name: '치료제과점마을', category: '카페', image: '/api/placeholder/60/60' }
  ]);

  const addPlace = (dayIndex: number) => {
    const newPlace: Place = {
      id: `new-${Date.now()}`,
      name: '새로운 장소',
      image: '/api/placeholder/80/60',
      category: '명소'
    };
    
    const updatedSchedules = [...schedules];
    updatedSchedules[dayIndex].places.push(newPlace);
    setSchedules(updatedSchedules);
  };

  const removePlace = (dayIndex: number, placeIndex: number) => {
    const updatedSchedules = [...schedules];
    updatedSchedules[dayIndex].places.splice(placeIndex, 1);
    setSchedules(updatedSchedules);
  };

  // 메인 본문 콘텐츠
  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">LOGO</h1>
          <span className="text-sm text-gray-500">제주</span>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">방문한 장소</span>
          <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">가고싶은 장소</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm">즐겨찾기</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">2024년 4월 20일 (토) ~ 2024년 4월 21일 (일)</p>
      </div>

      {/* 가로 스크롤 가능한 타임라인 */}
      <div className="flex-1 p-6">
        <div className="flex min-w-max">
          {/* 왼쪽 네비게이션 */}
          <div className="w-20 flex flex-col items-center mr-6 flex-shrink-0">
            <div className="flex flex-col gap-8">
              {schedules.map((schedule, dayIndex) => (
                <div key={dayIndex} className="flex flex-col items-center">
                  <div className="w-12 h-8 bg-black text-white rounded flex items-center justify-center text-sm font-semibold mb-2">
                    {schedule.day}일차
                  </div>
                  {dayIndex < schedules.length - 1 && (
                    <div className="w-px h-32 bg-gray-300"></div>
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-4 mt-8">
                <div className="w-12 h-8 bg-gray-200 text-gray-600 rounded flex items-center justify-center text-sm">
                  편집
                </div>
                <div className="w-12 h-8 bg-red-500 text-white rounded flex items-center justify-center text-sm">
                  저장
                </div>
              </div>
            </div>
          </div>

          {/* 가로로 스크롤되는 일정들 */}
          <div className={`flex gap-8 transition-all duration-300 ${isMainPanelOpen ? 'min-w-max' : ''}`}>
            {schedules.map((schedule, dayIndex) => (
              <div key={dayIndex} className={`flex-shrink-0 ${isMainPanelOpen ? 'w-80' : dayIndex === 0 ? 'w-80' : 'w-0 overflow-hidden'} transition-all duration-300`}>
                <div className="flex justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{schedule.day}일차</h2>
                    <p className="text-sm text-gray-500">{schedule.date}</p>
                  </div>
                </div>

                {/* 장소 리스트 */}
                <div className="relative">
                  {/* 세로 연결선 */}
                  <div className="absolute left-6 top-8 bottom-0 w-px bg-gray-300"></div>
                  
                  {schedule.places.map((place, placeIndex) => (
                    <div key={placeIndex} className="flex items-center mb-6 relative">
                      {/* 타임라인 점 */}
                      <div className={`w-3 h-3 rounded-full mr-6 z-10 ${
                        placeIndex === 0 ? 'bg-blue-500' : 
                        placeIndex === schedule.places.length - 1 ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                      
                      {/* 장소 정보 */}
                      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-3 flex-1">
                        <img 
                          src={place.image} 
                          alt={place.name}
                          className="w-16 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{place.name}</h3>
                            <span className="text-sm text-blue-500">{place.category}</span>
                          </div>
                          {place.time && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {place.time}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removePlace(dayIndex, placeIndex)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* 장소 추가 버튼 */}
                  <div className="flex items-center mb-6 relative">
                    <div className="w-3 h-3 rounded-full bg-gray-300 mr-6 z-10"></div>
                    <button
                      onClick={() => addPlace(dayIndex)}
                      className="flex items-center gap-2 text-gray-500 hover:text-blue-500 border border-dashed border-gray-300 hover:border-blue-300 rounded-lg p-3 flex-1"
                    >
                      <Plus className="w-4 h-4" />
                      장소 추가
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 지도 콘텐츠
  const mapContent = (
    <div className="h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-2">지도 영역</h3>
      <p className="text-gray-600">지도 API 연동 예정</p>
      {/* 실제로는 여기에 지도 컴포넌트가 들어갑니다 */}
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
      onNext={() => setActiveStep(activeStep + 1)}
    >
      {mainContent}
    </FullCheckColumnLayout>
  );
};

export default TravelPlanCheck;