// src/travl_plan_edit/components/PlaceStoragePanel.tsx
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 장소 보관함 공통 컨테이너
 * - 라이트 그레이 배경, 둥근 테두리, 스크롤 숨김
 */
export default function PlaceStoragePanel({ children, className = "", style }: Props) {
  return (
    <div
      className={`h-full rounded-2xl bg-gray-50 border border-gray-200 p-4 overflow-y-auto ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", ...style }}
    >
      {/* Webkit 스크롤바 숨김 */}
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  );
}
