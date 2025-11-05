// src/travel_plan/components/EditTravelPlanLayout.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapView from "../../travel_plan/components/GoogleMapView";
import type { LatLng, MapMarker } from "../../travel_plan/components/mapTypes";

/**
 * ✅ EditTravelPlanLayout
 * FullCheckColumnLayout에서 settlementContent(정산 탭)를 제거한 버전
 * - 좌측: 사이드바
 * - 중앙: 본문
 * - 우측: 지도만 표시
 */

interface Props {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  sidebarButtons?: React.ReactNode;

  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  polylines?: MapPolyline[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;

  /** ✅ 중앙 마커 옵션 */
  centerMarker?: boolean | CenterMarkerOptions;
}

const EditTravelPlanLayout: React.FC<Props> = ({
  children,
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
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* ✅ 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between border-r border-gray-200">
        <div>
          {/* 로고 */}
          <button
            onClick={() => setShowConfirm(true)}
            className="text-left text-2xl font-bold mb-10 hover:opacity-80"
            aria-label="홈으로 이동"
          >
            wego
          </button>

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

      {/* ✅ 가운데 본문 */}
      <div
        className={`${isMainPanelOpen ? "w-[65%]" : "w-[35%]"} transition-all duration-300 p-4 h-full flex flex-col relative`}
      >
        {/* 패널 토글 버튼 */}
        <button
          onClick={() => setIsMainPanelOpen(!isMainPanelOpen)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path
              d={isMainPanelOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 본문 영역 */}
        <div
          className="flex-1 overflow-x-auto overflow-y-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          <div className="min-w-max h-full">{children}</div>
        </div>
      </div>

      {/* ✅ 오른쪽 지도 영역만 표시 */}
      <div
        className={`${isMainPanelOpen ? "flex-1" : "w-[65%]"} transition-all duration-300 relative flex flex-col`}
      >
        <div className="flex-1 bg-gray-200 p-4">
          <div className="h-full bg-white rounded shadow-sm">
            <GoogleMapView
              center={mapCenter}
              zoom={mapZoom}
              markers={mapMarkers}
              polylines={polylines}
              selectedMarkerId={selectedMarkerId ?? null}
              onMarkerClick={onMarkerClick}
              centerMarker={centerMarker}
            />
          </div>
        </div>
      </div>

      {/* ✅ 나가기 확인 모달 */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-sm p-5">
            <h3 className="text-lg font-semibold mb-2">페이지를 떠나시겠어요?</h3>
            <p className="text-sm text-gray-600 mb-5">
              현재 작업이 <span className="font-medium text-red-600">저장되지 않을 수 있습니다.</span>
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                className="px-3 py-2 rounded-md text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowConfirm(false)}
              >
                취소
              </button>
              <button
                className="px-3 py-2 rounded-md text-sm bg-red-500 text-white hover:bg-red-600"
                onClick={() => navigate("/")}
              >
                예, 나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTravelPlanLayout;
