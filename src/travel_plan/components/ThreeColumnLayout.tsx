import React from 'react';
import GoogleMapView from './GoogleMapView';
import Sidebar from './Sidebar';
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
  selectedMarkerId,
}) => {
  return (
    <div className="flex h-screen w-full">
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
