// src/pages/MainFeed.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import AppHeader from "../components/header/AppHeader";
import TravelReviewCard from "../feed/components/TravelReviewCard";
import type { TravelReviewData } from "../feed/components/TravelReviewCard";
import { useNavigate } from "react-router-dom";

/* ---------------- 서버 타입 ---------------- */
import type { FeedResponse } from "../data/feed";

/* ---------------- 공통 axios ---------------- */
const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

/* ---------------- 유틸 ---------------- */
const diffDays = (startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};
// ✅ n박 n일 표기
const formatNightsDays = (startISO?: string, endISO?: string) => {
  const d = diffDays(startISO, endISO);
  if (d <= 0) return "";
  const n = Math.max(0, d - 1);
  return `${n}박 ${d}일`;
};

const collectTopPlaceTitles = (days: FeedResponse["days"] | undefined): string[] => {
  const titles: string[] = [];
  if (!days) return titles;
  for (const d of days) {
    const places = d?.places ?? [];
    for (const p of places) {
      if (p?.title) {
        titles.push(p.title);
        if (titles.length === 3) return titles;
      }
    }
  }
  return titles;
};
const findFirstPlaceImage = (days: FeedResponse["days"] | undefined): string | undefined => {
  if (!days) return;
  for (const d of days) {
    const first = d?.places?.[0];
    if (first?.image) return first.image;
  }
  return;
};

/* ---------------- 페이지 응답 ---------------- */
type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-base
  first: boolean;
  last: boolean;
};

/* ---------------- 필터 (UI 유지) ---------------- */
type Filters = {
  region: string;
  nights: number;
  days: number;
  chemi: string;
  keyword: string;
};
const defaultFilters: Filters = {
  region: "",
  nights: 1,
  days: 2,
  chemi: "",
  keyword: "",
};

const MainFeed: React.FC = () => {
  const activeMenu = "feed";
  const navigate = useNavigate();

  // 필터 상태
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  // 카드 목록 + 페이지네이션
  const [items, setItems] = useState<TravelReviewData[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [isLast, setIsLast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageMeta, setPageMeta] = useState<Pick<SpringPage<any>, "number" | "totalPages"> | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ✅ StrictMode로 인한 초기 useEffect 중복 실행 방지용
  const didInitRef = useRef(false);

  // 서버 호출
  const fetchPage = useCallback(
    async (nextPage: number, replace = false) => {
      if (isLoading) return;
      if (isLast && !replace) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get<SpringPage<FeedResponse>>("/feed/all/paged", {
          params: { page: nextPage, size },
        });

        const data = res.data;
        setIsLast(data.last);
        setPageMeta({ number: data.number, totalPages: data.totalPages });

        const mapped: TravelReviewData[] = (data.content ?? []).map((f) => {
          const tags = collectTopPlaceTitles(f.days);
          const cover =
            findFirstPlaceImage(f.days) ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop";

          // ✅ 케미 태그 매핑 추가
          const chemis =
            f.chemis?.map((c) => ({
              id: c.id,
              name: c.name,
              image: c.image,
            })) ?? [];

          return {
            id: f.feed_id,
            title: f.title,
            location: f.slug,                       // 지역 문자열
            duration: formatNightsDays(f.start_date, f.end_date), // n박 n일
            views: String(f.view_count),
            likes: String(f.like_count),
            tags,
            region: f.slug,
            image: cover,
            chemis,                                 // ✅ 카드에서 사용할 케미
          };
        });

        if (replace) setItems(mapped);
        else setItems((prev) => [...prev, ...mapped]);

        setPage(nextPage);
      } catch (e: any) {
        console.error("[FeedPage] fetch error:", e);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isLast, size]
  );

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchPage(0, true);
  }, [fetchPage]);

  const handleSearch = () => {
    setIsLast(false);
    setPage(0);
    fetchPage(0, true);
  };

  // 무한 스크롤
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && !isLast) {
          fetchPage(page + 1);
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [fetchPage, isLast, isLoading, page]);

  const regions = useMemo(() => ["", "제주", "서울", "부산", "강원", "경북", "전북"], []);
  const chemiOptions = useMemo(() => ["", "프로 계획러", "페스타 러버", "핫플에이트", "푸드 파이터"], []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader activeMenu={activeMenu} />
      </div>

      <div className="pt-[64px]">
        {/* 검색/필터 바 */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* 지역 */}
              <select
                value={filters.region}
                onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "" ? "지역 선택" : r}
                  </option>
                ))}
              </select>

              {/* n박 n일 */}
              <div className="flex gap-2">
                <select
                  value={filters.nights}
                  onChange={(e) => setFilters((f) => ({ ...f, nights: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}박
                    </option>
                  ))}
                </select>
                <select
                  value={filters.days}
                  onChange={(e) => setFilters((f) => ({ ...f, days: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {[2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>
                      {d}일
                    </option>
                  ))}
                </select>
              </div>

              {/* 케미 */}
              <select
                value={filters.chemi}
                onChange={(e) => setFilters((f) => ({ ...f, chemi: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {chemiOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === "" ? "케미 선택" : c}
                  </option>
                ))}
              </select>

              {/* 키워드 + 검색 */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                    placeholder="키워드 검색"
                    className="w-full border rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  검색
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 카드 그리드 */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

          {isLoading && items.length === 0 && !error && (
            <div className="py-6 text-center text-gray-500">불러오는 중...</div>
          )}

          {!isLoading && items.length === 0 && !error && (
            <div className="py-20 text-center text-gray-500">검색 결과가 없습니다.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((review) => (
              <TravelReviewCard
                key={review.id}
                review={review}
                onClick={(r) => navigate(`/feed/${r.id}`)}
              />
            ))}
          </div>

          {isLoading && items.length > 0 && !isLast && (
            <div className="py-6 text-center text-gray-500">불러오는 중...</div>
          )}

          {isLast && items.length > 0 && (
            <div className="py-6 text-center text-gray-400 text-sm">
              더 이상 결과가 없습니다
              {pageMeta ? ` (${pageMeta.number + 1}/${pageMeta.totalPages})` : ""}
            </div>
          )}

          <div ref={sentinelRef} className="h-10" />
        </main>
      </div>
    </div>
  );
};

export default MainFeed;
