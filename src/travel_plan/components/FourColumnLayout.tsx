import React, { useState } from 'react';

interface FourColumnLayoutProps {
  children: React.ReactNode;
  selectedPlaces?: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
}

const FourColumnLayout: React.FC<FourColumnLayoutProps> = ({
  children,
  selectedPlaces,
  activeStep,
  setActiveStep,
  onNext,
}) => {
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState(true);

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

      {/* 가운데 본문 - 고정 35% */}
      <div className="w-[35%] p-4 overflow-auto">
        {children}
      </div>

      {/* 선택된 장소 탭 - 열림: 30%, 닫힘: 48px */}
      <div className={`${isPlacesPanelOpen ? 'w-[30%]' : 'w-12'} bg-white border-l border-r transition-all duration-300`}>
        {isPlacesPanelOpen && (
          <div className="p-4 h-full">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">선택된 장소</h2>
            </div>
            {selectedPlaces || (
              <div className="text-gray-500 text-center py-8">
                <p>선택된 장소가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 지도 영역 - 나머지 공간 차지 */}
      <div className="flex-1 bg-gray-200 p-4 transition-all duration-300 relative">
        {/* 토글 버튼 - 장소 선택 탭 오른쪽 세로면에 완전히 닿게 위치 */}
        <button
          onClick={() => setIsPlacesPanelOpen(!isPlacesPanelOpen)}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-gray-400"
          >
            <path 
              d={isPlacesPanelOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"} 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        <div className="h-full bg-white rounded shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium mb-2">지도 영역</h3>
          <p className="text-gray-600">지도 API 연동 예정</p>
        </div>
      </div>
    </div>
  );
};

export default FourColumnLayout;