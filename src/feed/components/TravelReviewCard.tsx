// src/mypage/components/TravelReviewCard.tsx
import React from 'react';
import { Heart, Eye, MapPin } from "lucide-react";
import { useNavigate } from 'react-router-dom';

/* ========================= TagPill ========================= */
/** 
 * 코스 태그(장소 이름 등)를 표시하는 작은 말풍선 모양 컴포넌트
 * showPlus=true 면 앞에 "+" 기호가 붙어서 "추가 태그" 느낌을 줌
 */
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

/* ========================= 케미 미니 칩 ========================= */
/**
 * 케미(여행 성향) 태그를 작게 보여주는 컴포넌트
 * - 이미지가 있으면 원형 아바타처럼 보여줌
 * - 없으면 회색 원으로 대체
 */
interface ChemiMiniChipProps {
  name: string;
  image?: string;
}
const ChemiMiniChip: React.FC<ChemiMiniChipProps> = ({ name, image }) => {
  return (
    <span
      title={name} // 마우스를 올리면 툴팁으로 이름 표시
      className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-700 px-2.5 py-1 rounded-full"
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-4 h-4 rounded-full object-cover"
          // 이미지 에러 시 안 보이도록 처리
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      ) : (
        <span className="w-4 h-4 rounded-full bg-gray-300 inline-block" />
      )}
      <span className="leading-none">{name}</span>
    </span>
  );
};

/* ========================= 데이터 타입 ========================= */
/**
 * TravelReviewData = 피드 카드에 들어가는 데이터 구조
 * - 서버에서 받은 FeedResponse를 매핑해서 사용
 * - duration은 상위 컴포넌트(MainFeed, MyPageReview)에서 "n박 n일" 등으로 변환해서 전달
 */
export interface TravelReviewData {
  id: number;                 // feed_id (서버 기본 PK)
  title: string;              // 피드 제목
  location: string;           // 여행 지역(슬러그)
  duration: string;           // 여행 기간 (ex. "1박 2일")
  views: string;              // 조회수
  likes: string;              // 좋아요 수
  tags: string[];             // 주요 장소 태그
  region: string;             // 지역명 (표시용)
  image?: string;             // 대표 이미지 (없으면 placeholder)

  // ✅ 케미 태그 (추가된 부분: 최대 3개 표시)
  chemis?: { id: number; name: string; image?: string }[];
}

/* ========================= 카드 컴포넌트 ========================= */
interface TravelReviewCardProps {
  review: TravelReviewData;   // 카드에 들어갈 데이터
  onClick?: (review: TravelReviewData) => void; // 클릭 이벤트 (선택)
  to?: string | ((review: TravelReviewData) => string); // 이동 경로 (선택)
  disableNavigate?: boolean;  // true면 이동을 막고 onClick만 실행
}

const TravelReviewCard: React.FC<TravelReviewCardProps> = ({
  review,
  onClick,
  to,
  disableNavigate = false,
}) => {
  const navigate = useNavigate();

  // review 객체에서 필요한 값 추출
  const {
    id, image, title, location, duration, views, likes, tags, region, chemis = [],
  } = review;

  // 이동할 경로 계산 (to 속성이 있으면 그것을 우선 사용)
  const resolvePath = () => {
    if (typeof to === 'function') return to(review);
    if (typeof to === 'string') return to;
    return `/feed/${id}`; // 기본: 피드 상세 페이지
  };

  // 클릭 핸들러
  const handleClick = () => {
    onClick?.(review); // 부모가 전달한 콜백 실행
    if (!disableNavigate) {
      const path = resolvePath();
      if (path) navigate(path);
    }
  };

  // ✅ 케미 태그는 최대 3개만 표시하고, 나머지는 "…"으로 처리
  const MAX_CHEMI = 3;
  const visibleChemis = chemis.slice(0, MAX_CHEMI);
  const extraCount = Math.max(0, chemis.length - MAX_CHEMI);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer max-w-sm"
      onClick={handleClick}
      role="button"
    >
      {/* ===== 이미지 섹션 ===== */}
      <div className="relative">
        {/* 대표 이미지 (없으면 placeholder) */}
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600">
          <img
            src={image || "/api/placeholder/300/225"}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 왼쪽 상단: 지역 태그 */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
            <MapPin className="w-3 h-3 mr-1 text-blue-500" />
            {region}
          </span>
        </div>

        {/* 오른쪽 상단: 기간 태그 */}
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
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="line-clamp-1">{location}</span>
          <span className="mx-2">|</span>
          <span>{duration}</span>
        </div>

        {/* 장소 태그 리스트 (코스 요약) */}
        <div className="space-y-2 mb-3">
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

        {/* ✅ 케미 태그 (최대 3개 + 나머지는 "…"으로 표시) */}
        {chemis.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            {visibleChemis.map((c) => (
              <ChemiMiniChip key={c.id} name={c.name} image={c.image} />
            ))}
            {extraCount > 0 && (
              <span
                className="text-[11px] text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full"
                title={`외 ${extraCount}개`}
              >
                …
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelReviewCard;
export { TagPill };
