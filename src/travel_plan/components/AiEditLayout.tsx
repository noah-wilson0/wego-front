// src/travel_plan/components/AiEditLayout.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapView from "./GoogleMapView";
import type { LatLng, MapMarker, MapPolyline } from "./mapTypes";

interface Props {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;  // 사이드바 상단
  sidebarButtons?: React.ReactNode;  // 사이드바 하단

  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  polylines?: MapPolyline[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;
}

const AiEditLayout: React.FC<Props> = ({
  children,
  sidebarContent,
  sidebarButtons,

  mapCenter = { lat: 36.5, lng: 127.9 },
  mapZoom = 7,
  mapMarkers = [],
  polylines = [],
  selectedMarkerId = null,
  onMarkerClick,
}) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex h-screen w-full">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[180px] bg-white border-r border-gray-200 p-6 flex flex-col justify-between">
        <div>
          {/* 로고 */}
          <button
            onClick={() => setShowConfirm(true)}
            className="text-left text-2xl font-bold mb-8 hover:opacity-80"
            aria-label="홈으로 이동"
          >
            WEGO
          </button>

          <nav className="flex flex-col gap-4 text-sm">
            {sidebarContent || <div className="text-gray-400">사이드바 없음</div>}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          {sidebarButtons || (
            <button className="bg-black text-white py-2 px-4 rounded-md text-base">확인</button>
          )}
        </div>
      </aside>

      {/* 가운데 본문 */}
      <main className="flex-[6] max-w-[620px] bg-white border-r border-gray-200 overflow-auto p-6">
        {children}
      </main>

      {/* 오른쪽 지도 */}
      <section className="flex-[4] bg-gray-100">
        <GoogleMapView
          center={mapCenter}
          zoom={mapZoom}
          markers={mapMarkers}
          polylines={polylines}
          selectedMarkerId={selectedMarkerId ?? null}
          onMarkerClick={onMarkerClick}
        />
      </section>

      {/* 나가기 확인 모달 */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
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

export default AiEditLayout;
