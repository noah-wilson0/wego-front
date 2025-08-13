import React from 'react';
import { Heart, Eye, MapPin } from "lucide-react";

/* ========================= TagPill 컴포넌트 ========================= */
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

/* ========================= 여행 리뷰 데이터 타입 ========================= */
export interface TravelReviewData {
  id: number;
  title: string;
  location: string;
  duration: string;
  views: string;
  likes: string;
  tags: string[];
  region: string;
  image?: string;
}

/* ========================= 여행 리뷰 카드 UI 구현 ========================= */
interface TravelReviewCardProps {
  review: TravelReviewData;
  onClick?: (review: TravelReviewData) => void;
}

const TravelReviewCard: React.FC<TravelReviewCardProps> = ({
  review,
  onClick
}) => {
  const { id, image, title, location, duration, views, likes, tags, region } = review;

  const handleClick = () => {
    onClick?.(review);
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer max-w-sm"
      onClick={handleClick}
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
        
        {/* 지역 태그 (왼쪽 상단) */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
            <MapPin className="w-3 h-3 mr-1 text-blue-500" />
            {region}
          </span>
        </div>
        
        {/* 기간 태그 (오른쪽 상단) */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
            {duration}
          </span>
        </div>
      </div>

      {/* ===== 컨텐츠 섹션 ===== */}
      <div className="p-4">
        {/* 제목 및 통계 정보 (조회수/좋아요) */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex-1 mr-3">
            {title}
          </h3>
          {/* 조회수 및 좋아요 - 제목 오른쪽 배치 */}
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
        
        {/* 위치 및 기간 정보 */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>{location}</span>
          <span className="mx-2">|</span>
          <span>{duration}</span>
        </div>
        
        {/* 태그 리스트 */}
        <div className="space-y-2">
          {/* 처음 2개 태그는 일반 형태로 표시 */}
          {tags.slice(0, 2).map((tag, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
              <span className="line-clamp-1">{tag}</span>
            </div>
          ))}
          {/* 3번째 태그가 있으면 알약 형태로 표시 */}
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