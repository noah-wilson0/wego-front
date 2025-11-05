import React from "react";
import { Trash2 } from "lucide-react";

/** 카드에 필요한 최소 Place 타입 */
export interface StoragePlace {
  contentId: string;
  name: string;
  category: string; // A01/A02/A03/B01
  imageUrl: string;
}

export interface StoragePlaceCardProps {
  place: StoragePlace;
  dragging?: boolean;
  dragHandleProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  onRemove?: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

/* 카테고리 태그 색상 */
const CATEGORY_META: Record<string, { label: string; text: string }> = {
  A01: { label: "명소", text: "text-blue-600" },
  A02: { label: "음식점", text: "text-red-600" },
  A03: { label: "카페", text: "text-orange-600" },
  B01: { label: "숙소", text: "text-purple-600" },
};

export function CategoryTag({ code }: { code: string }) {
  const meta = CATEGORY_META[code] ?? { label: "기타", text: "text-gray-600" };
  return <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>;
}

/** 점 9개 아이콘 (자체 SVG) */
function DotGrid9({ className = "h-4 w-4" }: { className?: string }) {
  const pts = [6, 12, 18];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      {pts.flatMap((x) => pts.map((y, i) => <circle key={`${x}-${y}-${i}`} cx={x} cy={y} r="1.6" />))}
    </svg>
  );
}

/** 장소 카드 (보관함 공통) — 부모 레이아웃에 의존하지 않는 ellipsis */
const StoragePlaceCard: React.FC<StoragePlaceCardProps> = ({
  place,
  dragging = false,
  dragHandleProps,
  onRemove,
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
        <div className="text-xs mt-1 text-gray-600 truncate break-keep">
          <CategoryTag code={place.category} />
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
          {onRemove && (
            <button
              type="button"
              aria-label="삭제"
              title="삭제"
              onClick={() => onRemove(place.contentId)}
              className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 -ml-1.5"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="w-14" />
      )}
    </div>
  );
};

export default StoragePlaceCard;
