import React from 'react';
import GoogleMapView from './GoogleMapView';
import type { LatLng, MapMarker } from './mapTypes';

interface ThreeColumnLayoutProps {
  children: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;

  /** 지도 props */
  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  onMarkerClick?: (id: string | null) => void;
  selectedMarkerId?: string | null;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  children,
  activeStep,
  setActiveStep,
  onNext,
  mapCenter = { lat: 37.5665, lng: 126.9780 }, // 기본 서울
  mapZoom = 11,
  mapMarkers = [],
  onMarkerClick,
  selectedMarkerId
}) => {
  return (
    <div className="flex h-screen w-full">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            <div className={activeStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>Step 1. 시간 선택</div>
            <div className={activeStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>Step 2. 생성 방식 선택</div>
            <div className={activeStep === 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>Step 3. 장소 선택</div>
            <div className={activeStep === 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>Step 4. 숙소 선택</div>
          </nav>
        </div>
        <button
          className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base"
          onClick={onNext}
        >
          다음
        </button>
      </aside>

      {/* 가운데 본문 */}
      <main className="flex-[6] max-w-[620px] bg-white border-r border-gray-200 overflow-auto p-6">
        {children}
      </main>

      {/* 오른쪽 지도 */}
      <section className="flex-[4]">
        <GoogleMapView
          center={mapCenter}
          zoom={mapZoom}
          markers={mapMarkers}
          onMarkerClick={onMarkerClick}
          selectedMarkerId={selectedMarkerId ?? null}
        />
      </section>
    </div>
  );
};

export default ThreeColumnLayout;
