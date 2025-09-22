import React, { useState } from 'react';
import GoogleMapView from './GoogleMapView';
import Sidebar from './Sidebar';
import type { LatLng, MapMarker } from './mapTypes';

type Mode = 'place' | 'accommodation';

interface UnifiedFourColumnLayoutProps {
  /** 본문 컨텐츠(좌측 사이드바 옆 중앙 영역) */
  children: React.ReactNode;

  /** 오른쪽 사이드 패널(선택된 항목들) */
  selectedPanel?: React.ReactNode;

  /** 진행 상태 표시 */
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;

  /** 어떤 화면인지(장소/숙소) */
  mode: Mode;

  /** 필요 시 타이틀/빈문구 오버라이드 */
  panelTitleOverride?: string;
  panelEmptyTextOverride?: string;

  /** 지도 props (공통) */
  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  onMarkerClick?: (id: string | null) => void;
  selectedMarkerId?: string | null;
}

const UnifiedFourColumnLayout: React.FC<UnifiedFourColumnLayoutProps> = ({
  children,
  selectedPanel,
  activeStep,
  setActiveStep,
  onNext,
  mode,

  panelTitleOverride,
  panelEmptyTextOverride,

  mapCenter = { lat: 37.5665, lng: 126.9780 }, // 기본 서울
  mapZoom = 11,
  mapMarkers = [],
  onMarkerClick,
  selectedMarkerId,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const panelTitle =
    panelTitleOverride ?? (mode === 'place' ? '선택된 장소' : '선택된 숙소');

  const emptyText =
    panelEmptyTextOverride ?? (mode === 'place' ? '선택된 장소가 없습니다.' : '선택된 숙소가 없습니다.');

  return (
    <div className="flex h-screen">
      {/* 공통 사이드바 (스텝 모드) */}
      <Sidebar
        activeStep={activeStep}
        onStepChange={setActiveStep}
        footer={
          <button
            className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base"
            onClick={onNext}
          >
            다음
          </button>
        }
      />

      {/* 가운데 본문 - 고정 35% */}
      <div className="w-[35%] p-4 overflow-auto">
        {children}
      </div>

      {/* 선택된 목록 패널 - 열림: 30%, 닫힘: 48px */}
      <div className={`${isPanelOpen ? 'w-[30%]' : 'w-12'} bg-white border-l border-r transition-all duration-300`}>
        {isPanelOpen && (
          <div className="p-4 h-full">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{panelTitle}</h2>
            </div>
            {selectedPanel || (
              <div className="text-gray-500 text-center py-8">
                <p>{emptyText}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 지도 영역 */}
      <div className="flex-1 relative">
        {/* 패널 토글 버튼 */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path
              d={isPanelOpen ? 'M15 18L9 12L15 6' : 'M9 18L15 12L9 6'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 구글 지도 */}
        <GoogleMapView
          center={mapCenter}
          zoom={mapZoom}
          markers={mapMarkers}
          onMarkerClick={onMarkerClick}
          selectedMarkerId={selectedMarkerId ?? null}
        />
      </div>
    </div>
  );
};

export default UnifiedFourColumnLayout;
