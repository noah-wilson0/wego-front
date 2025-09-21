// src/travel_plan/components/FullCheckColumnLayout.tsx
import React, { useState } from "react";
import GoogleMapView from "./GoogleMapView";
import type { LatLng, MapMarker, MapPolyline, CenterMarkerOptions } from "./mapTypes";

interface Props {
  children: React.ReactNode;
  settlementContent?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  sidebarButtons?: React.ReactNode;

  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  polylines?: MapPolyline[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;

  /** ✅ 센터 마커 */
  centerMarker?: boolean | CenterMarkerOptions;
}

const FullCheckColumnLayout: React.FC<Props> = ({
  children,
  settlementContent,
  sidebarContent,
  sidebarButtons,

  mapCenter = { lat: 36.5, lng: 127.9 },
  mapZoom = 7,
  mapMarkers = [],
  polylines = [],
  selectedMarkerId = null,
  onMarkerClick,
  centerMarker = false,
}) => {
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [isSettlementPanelOpen, setIsSettlementPanelOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            {sidebarContent || <div className="text-gray-400">사이드바 콘텐츠가 없습니다.</div>}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          {sidebarButtons || (
            <button className="bg-black text-white py-2 px-4 rounded-md text-base">기본 버튼</button>
          )}
        </div>
      </aside>

      {/* 가운데 본문 */}
      <div
        className={`${isMainPanelOpen ? "w-[65%]" : "w-[35%]"} transition-all duration-300 p-4 h-full flex flex-col relative`}
      >
        <button
          onClick={() => setIsMainPanelOpen(!isMainPanelOpen)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d={isMainPanelOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          <div className="min-w-max h-full">{children}</div>
        </div>
      </div>

      {/* 오른쪽: 지도/정산 */}
      <div className={`${isMainPanelOpen ? "flex-1" : "w-[65%]"} transition-all duration-300 relative flex flex-col`}>
        {/* 지도 */}
        <div className={`${isSettlementPanelOpen ? "h-1/2" : "flex-1"} bg-gray-200 p-4 transition-all duration-300`}>
          <div className="h-full bg-white rounded shadow-sm">
            <GoogleMapView
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              polylines={polylines}
              selectedMarkerId={selectedMarkerId ?? null}
              onMarkerClick={onMarkerClick}
              centerMarker={centerMarker}  // ✅ 추가
            />
          </div>
        </div>

        {/* 정산하기 */}
        <div className={`${isSettlementPanelOpen ? "h-1/2" : "h-8"} bg-white border-t transition-all duration-300 relative flex-shrink-0`}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => setIsSettlementPanelOpen(!isSettlementPanelOpen)}
              className="bg-white border border-gray-300 w-20 h-6 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path d={isSettlementPanelOpen ? "M6 9L12 15L18 9" : "M18 15L12 9L6 15"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {isSettlementPanelOpen && (
            <div className="p-4 h-full pt-8 overflow-auto">
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

export default FullCheckColumnLayout;
