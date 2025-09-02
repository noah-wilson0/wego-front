// src/mypage/components/TravelReviewCard.tsx
import React from 'react';
import { Heart, Eye, MapPin } from "lucide-react";
import { useNavigate } from 'react-router-dom';

/* ========================= TagPill ========================= */
interface TagPillProps {
  text: string;
  showPlus?: boolean;
}
const TagPill: React.FC<TagPillProps> = ({ text, showPlus = true }) => {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 shadow-sm text-xs font-medium text-gray-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
      {showPlus && <span className="font-light">+</span>}
      <span>{text}</span>
    </span>
  );
};

/* ========================= 데이터 타입 ========================= */
export interface TravelReviewData {
  /** ✅ 서버의 feed_id 를 넣어주세요 */
  id: number;                 // feed_id
  title: string;
  location: string;
  duration: string;
  views: string;
  likes: string;
  tags: string[];
  region: string;
  image?: string;
}

/* ========================= 카드 ========================= */
interface TravelReviewCardProps {
  review: TravelReviewData;

  /** 선택: 클릭 시 먼저 호출되는 콜백 (이후 기본 네비도 수행) */
  onClick?: (review: TravelReviewData) => void;

  /** 선택: 이동 경로 지정 (문자열 또는 함수). 기본값: `/feed/${review.id}` */
  to?: string | ((review: TravelReviewData) => string);

  /** 선택: true면 기본 네비게이션을 하지 않음(온전히 onClick만 수행) */
  disableNavigate?: boolean;
}

const TravelReviewCard: React.FC<TravelReviewCardProps> = ({
  review,
  onClick,
  to,
  disableNavigate = false,
}) => {
  const navigate = useNavigate();
  const { id, image, title, location, duration, views, likes, tags, region } = review;

  const resolvePath = () => {
    if (typeof to === 'function') return to(review);
    if (typeof to === 'string') return to;
    return `/feed/${id}`; // ✅ 기본: feed 상세
  };

  const handleClick = () => {
    onClick?.(review);
    if (!disableNavigate) {
      const path = resolvePath();
      if (path) navigate(path);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer max-w-sm"
      onClick={handleClick}
      role="button"
    >
      {/* ===== 이미지 섹션 ===== */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600">
          <img
            src={image || "/api/placeholder/300/225"}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 지역 태그 */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
            <MapPin className="w-3 h-3 mr-1 text-blue-500" />
            {region}
          </span>
        </div>

        {/* 기간 태그 */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
            {duration}
          </span>
        </div>
      </div>

      {/* ===== 컨텐츠 섹션 ===== */}
      <div className="p-4">
        {/* 제목 + 조회/좋아요 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex-1 mr-3">
            {title}
          </h3>
          <div className="flex items-center space-x-3 text-sm text-gray-500 flex-shrink-0">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {views}
            </span>
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              {likes}
            </span>
          </div>
        </div>

        {/* 위치 | 기간 */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>{location}</span>
          <span className="mx-2">|</span>
          <span>{duration}</span>
        </div>

        {/* 태그 리스트 */}
        <div className="space-y-2">
          {tags.slice(0, 2).map((tag, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
              <span className="line-clamp-1">{tag}</span>
            </div>
          ))}
          {tags.length > 2 && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
              <TagPill text={tags[2]} showPlus={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelReviewCard;
export { TagPill };
