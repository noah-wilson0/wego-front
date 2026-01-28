import React from "react";

/** -------------------- 타입 -------------------- */
export interface SchedulePlace {
  id: string;
  name: string;
  category: string; // A01/A02/A03/B01
  imageUrl: string;
  time?: string;
  className?: string;
}

/** -------------------- 카테고리 태그 -------------------- */
const CATEGORY_META: Record<string, { label: string; text: string }> = {
  A01: { label: "명소", text: "text-blue-600" },
  A02: { label: "식당", text: "text-red-600" },
  A03: { label: "카페", text: "text-orange-600" },
  B01: { label: "숙소", text: "text-purple-600" },
};

function CategoryTag({ code }: { code: string }) {
  const meta = CATEGORY_META[code] ?? { label: "기타", text: "text-gray-600" };
  return <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>;
}

/** ----------------------------------------------------------------
 *  AI 편집 전용 일정 카드 (오른쪽 액션/여백 완전 제거)
 *  - grid: [썸네일 48px, 내용 1fr]
 *  - 고정 높이(h-16), 내부 패딩만 유지
 *  - 모든 텍스트 한 줄 말줄임
 * ---------------------------------------------------------------- */
const TravelPlanAiEditSchedulePlaceCard: React.FC<{ place: SchedulePlace }> = ({ place }) => {
  return (
    <div
      className="
        bg-white rounded-2xl px-3 py-2 transition-shadow border h-16 w-full
        shadow-sm hover:shadow-md
        grid grid-cols-[48px,1fr] items-center gap-3
      "
      style={{ willChange: "transform" }}
    >
      {/* 썸네일 */}
      <img src={place.imageUrl} alt={place.name} className="h-12 w-12 rounded-lg object-cover" />

      {/* 내용 (남은 폭 100%, 말줄임) */}
      <div className="min-w-0">
      <div className="text-sm font-medium text-gray-800 truncate break-keep max-w-[100px]">
        {place.name}
        </div>

        <div className="text-xs mt-1 text-gray-600 flex items-center gap-1 min-w-0">
          <CategoryTag code={place.category} />
          {place.time && <span className="text-gray-500 truncate">{place.time}</span>}
        </div>
      </div>
    </div>
  );
};

export default TravelPlanAiEditSchedulePlaceCard;
