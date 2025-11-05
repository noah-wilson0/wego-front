import React from "react";
import { MoreHorizontal } from "lucide-react";

export interface SchedulePlace {
  id: string;
  name: string;
  category: string; // A01/A02/A03/B01
  imageUrl: string;
  time?: string;
}

export interface SchedulePlaceCardProps {
  place: SchedulePlace;
  dragging?: boolean;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  onMenuClick?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

const CATEGORY_META: Record<string, { label: string; text: string }> = {
  A01: { label: "명소", text: "text-blue-600" },
  A02: { label: "식당", text: "text-red-600" },
  A03: { label: "카페", text: "text-orange-600" },
  B01: { label: "숙소", text: "text-purple-600" },
};

export function CategoryTag({ code }: { code: string }) {
  const meta = CATEGORY_META[code] ?? { label: "기타", text: "text-gray-600" };
  return <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>;
}

function DotGrid9({ className = "h-4 w-4" }: { className?: string }) {
  const pts = [6, 12, 18];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      {pts.flatMap((x) => pts.map((y, i) => <circle key={`${x}-${y}-${i}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  );
}

/** 일정 카드 — 부모 의존 없는 고정 높이 + 한 줄 … */
const TravelPlanEditSchedulePlaceCard: React.FC<SchedulePlaceCardProps> = ({
  place,
  dragging = false,
  dragHandleProps,
  onMenuClick,
  showActions = true,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-2xl px-3 py-2 transition-shadow border h-16 w-full
      ${dragging ? "shadow-lg ring-2 ring-blue-200" : "shadow-sm hover:shadow-md"} ${className}
      grid grid-cols-[48px,1fr,56px] items-center gap-3`}
      style={{ willChange: "transform" }}
    >
      {/* 이미지 */}
      <img
        src={place.imageUrl}
        alt={place.name}
        className="h-12 w-12 rounded-lg object-cover"
      />

      {/* 텍스트(안전 ellipsis) */}
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate break-keep">
          {place.name}
        </div>
        <div className="text-xs mt-1 text-gray-600 flex items-center gap-1 truncate break-keep">
          <CategoryTag code={place.category} />
          {place.time && <span className="text-gray-500">{place.time}</span>}
        </div>
      </div>

      {/* 액션 영역 고정폭 */}
      {showActions ? (
        <div className="flex items-center justify-end gap-0 w-14">
          <button
            type="button"
            aria-label="순서 변경"
            title="순서 변경"
            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
            {...(dragHandleProps ?? {})}
          >
            <DotGrid9 className="h-4 w-4" />
          </button>
          {onMenuClick && (
            <button
              type="button"
              aria-label="메뉴"
              title="메뉴"
              onClick={() => onMenuClick(place.id)}
              className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 -ml-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="w-14" />
      )}
    </div>
  );
};

export default TravelPlanEditSchedulePlaceCard;
