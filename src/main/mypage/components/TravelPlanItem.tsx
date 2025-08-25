// src/mypage/components/TravelPlanItem.tsx
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface TravelPlanData {
  id: number;                 // 서버 Long -> number
  title: string;
  destination: string;        // 예: slug 라벨
  dDay: string;
  startDate: string;
  endDate: string;
  lastModified: string;
  image: string;
  tags: string[];
}

interface TravelPlanItemProps {
  plan: TravelPlanData;

  /** (선택) 클릭 시 실행할 커스텀 핸들러.
   *  반환값과 관계없이 실행 후 기본 네비게이션도 수행됩니다.
   *  기본 네비를 막고 싶다면 disableNavigate를 true로.
   */
  onClick?: (plan: TravelPlanData) => void;

  /** (선택) 이동 경로를 커스텀.
   *  문자열 혹은 plan을 받아 경로를 만드는 함수.
   *  미지정 시 기본값은 `/check/${plan.id}`.
   */
  to?: string | ((plan: TravelPlanData) => string);

  /** (선택) true면 기본 네비게이션을 하지 않음(온전히 onClick만 수행). */
  disableNavigate?: boolean;
}

const TravelPlanItem: React.FC<TravelPlanItemProps> = ({
  plan,
  onClick,
  to,
  disableNavigate = false,
}) => {
  const { id, title, destination, dDay, startDate, endDate, lastModified, image, tags } = plan;
  const navigate = useNavigate();

  const resolvePath = () => {
    if (typeof to === 'function') return to(plan);
    if (typeof to === 'string') return to;
    if (id != null) return `/check/${id}`;       // ✅ 기본: /check/:travelPlanId
    return undefined;
  };

  const go = () => {
    const path = resolvePath();
    if (!path) {
      console.warn('[TravelPlanItem] id 또는 to가 없어 이동할 수 없습니다.', plan);
      return;
    }
    navigate(path);
  };

  const handleClick = () => {
    onClick?.(plan);
    if (!disableNavigate) go();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 네비 방지
    console.log(`${destination} 더보기 클릭됨`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="flex items-start mb-16 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
    >
      <img src={image} alt={destination} className="w-60 h-60 rounded-2xl object-cover mr-8" />
      <div className="flex-1 pt-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <span className="bg-black text-white text-sm px-4 py-2 rounded-full mr-4 font-medium">
              {dDay}
            </span>
            <h3 className="font-bold text-3xl">{destination}</h3>
          </div>
          <div className="text-right text-gray-400">
            <div className="text-sm mb-1">최근 수정일</div>
            <div className="text-sm">{lastModified}</div>
            <button
              onClick={handleMoreClick}
              className="mt-2 ml-auto block hover:text-gray-600 transition-colors"
              aria-label={`${title} 더보기`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-lg mb-2">{title}</h4>
          <p className="text-gray-500 text-base">
            {startDate} ~ {endDate}
          </p>
        </div>

        <div className="flex space-x-3">
          {tags.map((tag, index) => (
            <span key={index} className="bg-blue-500 text-white text-sm px-6 py-2 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelPlanItem;
