// src/pages/components/FeedTimelineContainer.tsx
import React from "react";
import { Car } from "lucide-react";

export type FeedPlace = {
  name: string;
  image?: string;
  durationToNext?: string; // 다음 장소까지 이동 시간
};

type Props = {
  title?: string;
  places?: FeedPlace[];
};

const FeedTimelineContainer: React.FC<Props> = ({ title, places }) => {
  const list = places ?? [];
  const cols = list.length;
  if (cols === 0) return null;

  // n개 장소 -> 2n-1 슬롯
  const slots = cols * 2 - 1;
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))`,
  };

  // 선이 동그라미 중심에서 시작/끝
  const edgePct = 50 / slots;
  const NODE_RADIUS_PX = 10;

  // ✅ 모든 코스에서 동일하게 보일 카드 크기 (절대값)
  const CARD_W = 180; // px
  const CARD_H = 135; // px (4:3)

  return (
    <div className="w-full">
      {/* 제목 */}
      {title && (
        <div className="text-center mb-4">
          <span className="inline-block text-white bg-blue-500 px-4 py-2 rounded-full text-sm font-medium">
            {title}
          </span>
        </div>
      )}

      {/* ① 자동차/이동시간 (간격 슬롯에만 표시) */}
      <div className="grid px-6 mb-2" style={gridStyle}>
        {Array.from({ length: slots }).map((_, k) =>
          k % 2 === 1 ? (
            <div key={`gap-${k}`} className="flex flex-col items-center leading-none">
              <Car size={14} className="text-gray-400" />
              <span className="text-[11px] text-gray-500 mt-[2px]">
                {list[(k - 1) / 2]?.durationToNext ?? ""}
              </span>
            </div>
          ) : (
            <div key={`gap-${k}`} />
          )
        )}
      </div>

      {/* ② 직선 + ③ 노드 */}
      <div className="relative px-6 mb-6">
        {/* 선: 뒤로 */}
        <div
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-gray-300 z-0"
          style={{
            left: `calc(${edgePct}% + ${NODE_RADIUS_PX}px)`,
            right: `calc(${edgePct}% + ${NODE_RADIUS_PX}px)`,
          }}
        />
        {/* 노드: 앞으로 */}
        <div className="grid relative z-10" style={gridStyle}>
          {Array.from({ length: slots }).map((_, k) =>
            k % 2 === 0 ? (
              <div key={`node-${k}`} className="flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                  {k / 2 + 1}
                </div>
              </div>
            ) : (
              <div key={`node-${k}`} />
            )
          )}
        </div>
      </div>

      {/* ④ 썸네일(절대 크기) + 장소명 (노드 슬롯만) */}
      <div className="grid px-6 gap-y-2" style={gridStyle}>
        {Array.from({ length: slots }).map((_, k) =>
          k % 2 === 0 ? (
            <div key={`card-${k}`} className="flex items-start justify-center">
              {/* ← 그리드와 무관하게 고정 크기 유지 */}
              <div style={{ width: CARD_W }} className="mx-auto">
                <div
                  className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                  style={{ width: CARD_W, height: CARD_H }}
                >
                  {list[k / 2]?.image ? (
                    <img
                      src={list[k / 2]!.image}
                      alt={list[k / 2]!.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-800 text-center line-clamp-2">
                  {list[k / 2]?.name}
                </div>
              </div>
            </div>
          ) : (
            <div key={`card-${k}`} />
          )
        )}
      </div>
    </div>
  );
};

export default FeedTimelineContainer;
