import React from "react";
import { Car } from "lucide-react";

interface TimelineItemProps {
  index: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  duration?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ index, color, isFirst, isLast, duration }) => (
  <div className="flex flex-col items-center" style={{ height: 120 }}>
    {/* 동그라미 */}
    <div
      className={`flex items-center justify-center rounded-full ${color}`}
      style={{
        width: 24,
        height: 24,
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        zIndex: 1,
      }}
    >
      {index + 1}
    </div>
    
    {/* 마지막이 아닌 경우 자동차 아이콘과 연결선 */}
    {!isLast && (
      <>
        {/* 동그라미 아래 실선 - 길이 증가 */}
        <div style={{ width: 2, height: 200, background: "#D1D5DB", marginTop: 8 }} />
        {/* 자동차 아이콘과 이동 시간 */}
        <div className="flex flex-col items-center" style={{ marginTop: 16 }}>
          <Car className="text-gray-400" size={16} />
          {duration && (
            <span className="text-sm text-gray-500 mt-1">{duration}</span>
          )}
        </div>
      </>
    )}
    
    {/* 마지막이면 검은 동그라미까지의 실선 */}
    {isLast && (
      <>
        {/* 동그라미 아래 실선 - 길이 증가 */}
        <div style={{ width: 2, height: 200, background: "#D1D5DB" }} />
        {/* 검은 동그라미 */}
        <div
          style={{
            width: 20,
            height: 20,
            background: "#111",
            borderRadius: "50%",
            marginTop: 16,
          }}
        />
      </>
    )}
  </div>
);

// 개별 타임라인 아이템을 위한 컴포넌트 - 실선 길이 30% 감소
interface SingleTimelineItemProps {
  index: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  duration?: string;
}

const SingleTimelineItem: React.FC<SingleTimelineItemProps> = ({ index, color, isFirst, isLast, duration }) => (
  <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
    {/* 첫 번째가 아닌 경우 위쪽 연결선 - 길이 30% 감소 */}
    {!isFirst && (
      <div style={{ width: 2, height: 154, background: "#D1D5DB", marginBottom: 8 }} />
    )}
    
    {/* 동그라미 */}
    <div
      className={`flex items-center justify-center rounded-full ${color}`}
      style={{
        width: 24,
        height: 24,
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        zIndex: 1,
      }}
    >
      {index + 1}
    </div>
    
    {/* 마지막이 아닌 경우 자동차 아이콘과 연결선 - 길이 30% 감소 */}
    {!isLast && (
      <>
        {/* 동그라미 아래 실선 - 길이 30% 감소 */}
        <div style={{ width: 2, height: 154, background: "#D1D5DB", marginTop: 8 }} />
        {/* 자동차 아이콘과 이동 시간 */}
        <div className="flex flex-col items-center" style={{ marginTop: 16 }}>
          <Car className="text-gray-400" size={16} />
          {duration && (
            <span className="text-sm text-gray-500 mt-1">{duration}</span>
          )}
        </div>
      </>
    )}
    
    {/* 마지막이면 검은 동그라미까지의 실선 - 길이 30% 감소 */}
    {isLast && (
      <>
        {/* 동그라미 아래 실선 - 길이 30% 감소 */}
        <div style={{ width: 2, height: 154, background: "#D1D5DB", marginTop: 8 }} />
        {/* 검은 동그라미 */}
        <div
          style={{
            width: 20,
            height: 20,
            background: "#111",
            borderRadius: "50%",
            marginTop: 16,
          }}
        />
      </>
    )}
  </div>
);

interface TimelineContainerProps {
  places: Array<{ placeType: string; duration?: string }>;
  getPlaceTypeInfo: (placeType: string) => { color: string };
}

const TimelineContainer: React.FC<TimelineContainerProps> = ({ places, getPlaceTypeInfo }) => {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
      {places.map((place, index) => {
        const isFirst = index === 0;
        const isLast = index === places.length - 1;
        const placeTypeInfo = getPlaceTypeInfo(place.placeType);
        
        return (
          <React.Fragment key={index}>
            {/* 첫 번째가 아닌 경우 위쪽 연결선 - 길이 증가 */}
            {!isFirst && (
              <div style={{ width: 2, height: 200, background: "#D1D5DB" }} />
            )}
            
            {/* 타임라인 아이템 */}
            <TimelineItem
              index={index}
              color={placeTypeInfo.color}
              isFirst={isFirst}
              isLast={isLast}
              duration={place.duration}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export { TimelineContainer, SingleTimelineItem };
export default TimelineContainer;