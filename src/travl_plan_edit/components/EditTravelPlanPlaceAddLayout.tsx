// src/components/EditTravelPlanPlaceAddLayout.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleMapView from "../../travel_plan/components/GoogleMapView";
import type { LatLng, MapMarker } from "../../travel_plan/components/mapTypes";

type Mode = "place" | "accommodation";

interface EditTravelPlanPlaceAddLayoutProps {
  /** 본문 컨텐츠(좌측 사이드바 옆 중앙 영역) */
  children: React.ReactNode;

  /** 오른쪽 사이드 패널(컨텐츠만 전달 — 헤더 없음) */
  selectedPanel?: React.ReactNode;

  /** 진행 상태 표시 (호환성 유지용, 현재 레이아웃에서는 사용하지 않음) */
  activeStep?: number;
  setActiveStep?: (step: number) => void;
  onNext?: () => void;

  /** 호환성 유지용 */
  mode?: Mode;

  /** 지도 props */
  mapCenter?: LatLng;
  mapZoom?: number;
  mapMarkers?: MapMarker[];
  onMarkerClick?: (id: string | null) => void;
  selectedMarkerId?: string | null;

  /** ✅ EditTravelPlan 스타일 사이드바 콘텐츠/버튼 */
  sidebarContent?: React.ReactNode; // 상단 "전체" 등
  sidebarButtons?: React.ReactNode; // 하단 "취소/적용/저장" 등
}

const EditTravelPlanPlaceAddLayout: React.FC<EditTravelPlanPlaceAddLayoutProps> = ({
  children,
  selectedPanel,

  // 호환성 유지용 (현재는 사용하지 않음)
  activeStep, // eslint-disable-line @typescript-eslint/no-unused-vars
  setActiveStep, // eslint-disable-line @typescript-eslint/no-unused-vars
  onNext, // eslint-disable-line @typescript-eslint/no-unused-vars
  mode, // eslint-disable-line @typescript-eslint/no-unused-vars

  mapCenter = { lat: 37.5665, lng: 126.9780 },
  mapZoom = 11,
  mapMarkers = [],
  onMarkerClick,
  selectedMarkerId,

  /** 새로 추가된 사이드바 프롭 */
  sidebarContent,
  sidebarButtons,
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      {/* ✅ 왼쪽 사이드바: EditTravelPlan과 완전히 동일 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between border-r border-gray-200">
        <div>
          {/* 로고 (클릭 시 나가기 확인 모달) */}
          <button
            onClick={() => setShowConfirm(true)}
            className="text-left text-2xl font-bold mb-10 hover:opacity-80"
            aria-label="홈으로 이동"
          >
            wego
          </button>

          {/* 상단 콘텐츠(예: '전체' 고정 버튼) */}
          <nav className="flex flex-col gap-4 text-sm">
            {sidebarContent || <div className="text-gray-400">사이드바 콘텐츠가 없습니다.</div>}
          </nav>
        </div>

        {/* 하단 버튼(예: 취소/적용/저장 고정 버튼들) */}
        <div className="flex flex-col gap-3">
          {sidebarButtons || (
            <button className="bg-black text-white py-2 px-4 rounded-md text-base">기본 버튼</button>
          )}
        </div>
      </aside>

      {/* 가운데 본문 - 35% (기존 유지) */}
      <div className="w-[35%] p-4 overflow-auto">{children}</div>

      {/* 오른쪽 패널(헤더 없음) - 열림: 30%, 닫힘: 48px */}
      <div className={`${isPanelOpen ? "w-[30%]" : "w-12"} bg-white border-l border-r transition-all duration-300`}>
        {isPanelOpen && <div className="p-4 h-full">{selectedPanel ?? null}</div>}
      </div>

      {/* 오른쪽 지도 영역 */}
      <div className="flex-1 relative">
        {/* 패널 토글 */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path
              d={isPanelOpen ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 지도 */}
        <GoogleMapView
          center={mapCenter}
          zoom={mapZoom}
          markers={mapMarkers}
          onMarkerClick={onMarkerClick}
          selectedMarkerId={selectedMarkerId ?? null}
        />
      </div>

      {/* ✅ 나가기 확인 모달 (EditTravelPlan과 동일) */}
      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
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

export default EditTravelPlanPlaceAddLayout;
