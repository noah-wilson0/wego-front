// src/pages/TravelFeedDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Eye, Share2, Bookmark, Plus, Minus } from "lucide-react";
import AppHeader from "../components/header/AppHeader";
import FeedTimelineContainer, { type FeedPlace } from "../main/components/FeedTimelineContainer";
import FeedComments from "./components/FeedComments";
import type { FeedResponse, DaySchedule, RouteInfo, RouteDetail } from "../data/feed";
import axios from "axios";

/* ---------- 기간 계산 ---------- */
const diffDays = (startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO);
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};
const formatNightsDays = (startISO?: string, endISO?: string) => {
  const days = diffDays(startISO, endISO);
  if (days <= 0) return "";
  const nights = Math.max(0, days - 1);
  return `${nights}박 ${days}일`;
};

/* ---------- 특정 날짜에 해당하는 RouteInfo 찾기 ---------- */
function findRouteInfoForDate(routes: RouteInfo[] | undefined, date: string): RouteInfo | undefined {
  if (!routes || routes.length === 0) return undefined;
  return routes.find((r) => r.daily_route && r.daily_route[date]);
}

/* ---------- 하루 코스 타임라인 변환 (숙소 포함) ---------- */
function buildFeedPlacesForDay(day: DaySchedule, routeInfo?: RouteInfo): FeedPlace[] {
  const dayRoutes: RouteDetail[] = (routeInfo?.daily_route?.[day.date] ?? []).slice();

  const items: FeedPlace[] = day.places.map((p) => ({
    name: p.title,
    image: p.image,
  }));

  if (day.accommodation) {
    items.push({
      name: day.accommodation.title,
      image: day.accommodation.image,
    });
  }

  for (let i = 0; i < items.length - 1; i++) {
    const seg = dayRoutes[i];
    if (seg != null) {
      const minutes = Math.round(seg.duration / 60);
      items[i].durationToNext = `${minutes}분`;
    }
  }
  return items;
}

/* ============ 케미 태그 UI(가로 스크롤, 절제된 톤) ============ */
type ChemiItem = NonNullable<FeedResponse["chemis"]>[number];

const ChemiChip: React.FC<{ item: ChemiItem }> = ({ item }) => {
  return (
    <span
      title={item.description || item.name}
      className="
        inline-flex items-center gap-2
        bg-gray-100 border border-gray-200 text-[12px] font-medium text-gray-700
        px-3 py-1.5 rounded-full shadow-sm
        hover:bg-gray-200 transition-colors
        whitespace-nowrap
      "
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-5 h-5 rounded-full object-cover"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
        />
      ) : (
        <span className="w-5 h-5 rounded-full bg-gray-300 inline-block" />
      )}
      <span>{item.name}</span>
    </span>
  );
};

const ChemiTagBar: React.FC<{ items?: ChemiItem[] }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <div
      className="
        mt-4 -mx-1 px-1
        overflow-x-auto
        [scrollbar-width:none] [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      <div className="flex items-center gap-2.5 pr-2">
        {items.map((c) => (
          <ChemiChip key={c.id} item={c} />
        ))}
      </div>
    </div>
  );
};
/* ============================================================ */

const TravelFeedDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const feedId = Number(id || 0);

  const [resp, setResp] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [heroSrc, setHeroSrc] = useState<string | undefined>(undefined);
  const [heroTriedJpeg, setHeroTriedJpeg] = useState(false);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await axios.get<FeedResponse>(`http://localhost:8080/feed/${feedId}`, {
          withCredentials: true,
        });
        if (!mounted) return;
        setResp(res.data);
        if (res.data.slug) setHeroSrc(`/src/assets/${res.data.slug}.jpg`);
      } catch (e) {
        if (mounted) setErrMsg("피드를 불러오지 못했어요.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [feedId]);

  const handleHeroError = () => {
    if (resp?.slug && !heroTriedJpeg) {
      setHeroSrc(`/src/assets/${resp.slug}.jpeg`);
      setHeroTriedJpeg(true);
    }
  };

  const W_70 = "w-full md:w-[70%]";
  const W_60 = "w-full md:w-[60%]";

  const header = (
    <div className="fixed top-0 left-0 right-0 z-50">
      <AppHeader activeMenu="feed" />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {header}
        <div className="pt-[64px] text-center text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (errMsg || !resp) {
    return (
      <div className="min-h-screen bg-white">
        {header}
        <div className="pt-[64px] max-w-4xl mx-auto px-4 py-10">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm">
            ← 뒤로
          </button>
          <div className="mt-8 text-center text-gray-500">{errMsg || "피드를 찾을 수 없습니다."}</div>
        </div>
      </div>
    );
  }

  const durationND = formatNightsDays(resp.start_date, resp.end_date);
  const firstDay = resp.days?.[0];
  const firstDayRouteInfo = firstDay ? findRouteInfoForDate(resp.routes, firstDay.date) : undefined;
  const firstDayPlaces: FeedPlace[] = firstDay ? buildFeedPlacesForDay(firstDay, firstDayRouteInfo) : [];
  const restDays = (resp.days || []).slice(1);

  return (
    <div className="min-h-screen bg-white">
      {header}
      <main className="pt-[64px]">
        <div className="px-4 lg:px-8 py-10">
          {/* ===== 상단(블로그 스타일 헤더) ===== */}
          <section className={`${W_70} mx-auto`}>
            {/* 여행 지역 (slug) */}
            {resp.slug && (
              <div className="mb-2">
                <span className="text-sm text-gray-500 font-medium">{resp.slug}</span>
              </div>
            )}

            {/* 1) 제목(좌) — 작성일(우) */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                {resp.title}
              </h1>
              {resp.created_at && (
                <time className="text-xs md:text-sm text-gray-400 mt-1">{resp.created_at}</time>
              )}
            </div>

            {/* 2) 메타 줄: 작성자 · n박n일 | 액션 아이콘 */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-sm text-gray-500">
                {/* 작성자명 (이미지 제거) */}
                <span className="font-medium text-gray-700">{resp.author}</span>

                {/* 구분점 */}
                {durationND && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{durationND}</span>
                  </>
                )}
              </div>

              {/* 아이콘 액션 */}
              <div className="flex items-center gap-4 text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Eye size={16} /> {resp.view_count}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Heart size={16} className="text-red-500" /> {resp.like_count}
                </span>
                <button className="hover:text-gray-700 transition-colors" aria-label="북마크">
                  <Bookmark size={16} />
                </button>
                <button className="hover:text-gray-700 transition-colors" aria-label="공유">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* 3) 케미 태그 */}
            <ChemiTagBar items={resp.chemis} />

            {/* 4) 구분선 */}
            <div className="mt-6 border-b border-gray-200" />
          </section>


          {/* ===== 커버 이미지 ===== */}
          <section className={`${W_70} mx-auto`}>
            <figure className="mt-6">
              <div className="relative w-full md:w-[90%] mx-auto aspect-[16/7] rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                {heroSrc ? (
                  <img
                    src={heroSrc}
                    alt={resp.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={handleHeroError}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 mb-3" />
                    <p className="text-gray-600 text-sm font-medium">대표 이미지 영역</p>
                  </div>
                )}
              </div>
            </figure>
          </section>

          {/* ===== 1일차 코스 ===== */}
          <section className={`${W_70} mx-auto`}>
            {firstDay && (
              <div className="mt-10">
                <FeedTimelineContainer title="1일차 코스" places={firstDayPlaces} />
              </div>
            )}

            {/* 전체 코스 토글 */}
            {restDays.length > 0 &&
              (!showAll ? (
                <div className="my-8 flex justify-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-medium shadow hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    전체 코스 보기
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-10 mt-6">
                    {restDays.map((d, idx) => {
                      const r = findRouteInfoForDate(resp.routes, d.date);
                      const places = buildFeedPlacesForDay(d, r);
                      return (
                        <FeedTimelineContainer
                          key={d.date + idx}
                          title={`${idx + 2}일차 코스`}
                          places={places}
                        />
                      );
                    })}
                  </div>
                  <div className="my-8 flex justify-center">
                    <button
                      onClick={() => setShowAll(false)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-800 text-white font-medium shadow hover:bg-gray-900"
                    >
                      <Minus size={16} />
                      전체 코스 숨기기
                    </button>
                  </div>
                </>
              ))}
          </section>

          {/* ===== 지도 Placeholder ===== */}
          <section className={`${W_60} mx-auto mt-12`}>
            <p className="text-center text-sm text-gray-500 mb-2">지도 API 연동 예정</p>
            <div className="h-80 md:h-96 rounded-2xl border border-gray-200 flex items-center justify-center bg-white">
              <span className="text-gray-500">Google Maps Placeholder</span>
            </div>
          </section>

          {/* ===== 여행 후기(body) ===== */}
          {resp.body && (
            <section className={`${W_60} mx-auto mt-12`}>
              <h2 className="text-xl font-semibold mb-3">여행 후기</h2>
              <article className="whitespace-pre-line text-gray-800 text-[15px] leading-7">
                {resp.body}
              </article>
            </section>
          )}

          {/* ===== 댓글 ===== */}
          <section className={`${W_60} mx-auto mt-12`}>
            <FeedComments feedId={resp.feed_id} />
          </section>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
};

export default TravelFeedDetail;
