// src/main/TravelMainPage.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, ChevronDown, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/header/AppHeader";
import Footer from "./components/footer";
import TravelAreaCard from "./components/TravelAreaCard";
import type { TravelAreaData } from "./components/TravelAreaCard";
import ChemiCard from "./components/ChemiCard";
import TravelReviewCard from "../feed/components/TravelReviewCard";
import type { TravelReviewData } from "../feed/components/TravelReviewCard";
import DestinationPopup from "./components/DestinationPopup";

// ✅ 서버 Feed 타입
import type { FeedResponse } from "../data/feed";

// ✅ travelData에서 타입과 다른 데이터만 사용
import { travelAreas } from "./data/travelData";
import type { ChemiItem } from "./data/travelData";

/* ========================= 공통 axios ========================= */
const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

/* ========================= 유틸: duration ========================= */
const diffDays = (startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};
const formatDuration = (startISO?: string, endISO?: string) => {
  const d = diffDays(startISO, endISO);
  return d > 0 ? `${d}일` : "";
};

// PlaceItem.title 3개까지 수집
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

// 첫 장소 이미지 커버
const findFirstPlaceImage = (days: FeedResponse["days"] | undefined): string | undefined => {
  if (!days) return;
  for (const d of days) {
    const first = d?.places?.[0];
    if (first?.image) return first.image;
  }
  return;
};

/* ========================= 여행 일정 생성 드롭다운 ========================= */
const TravelPlanDropdown: React.FC<{
  areas: TravelAreaData[];
  onSelect: (area: TravelAreaData) => void;
}> = ({ areas, onSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getRegionName = (koreanName: string) => koreanName.split(" ").slice(-1)[0];
  const getLocationInfo = (koreanName: string) => koreanName.split(" ").slice(0, -1).join(" ");

  const filtered = areas.filter((a) => {
    const region = getRegionName(a.koreanName);
    const loc = getLocationInfo(a.koreanName);
    const hay = (region + " " + loc + " " + a.englishName).toLowerCase();
    return hay.includes(keyword.trim().toLowerCase());
  });

  const handleButtonClick = () => setIsDropdownOpen((v) => !v);

  const handleDestinationClick = (area: TravelAreaData) => {
    setIsDropdownOpen(false);
    onSelect(area);
  };

  const handleMoreDestinations = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center relative" ref={dropdownRef}>
      <button
        onClick={handleButtonClick}
        className={`
          bg-purple-500 hover:bg-purple-600 text-white px-10 py-4 rounded-full text-lg font-medium 
          transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105
          flex items-center justify-center gap-2 mx-auto
          ${isDropdownOpen ? "bg-purple-600 scale-105" : ""}
        `}
      >
        여행 일정 만들기
        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-full max-w-md z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-800">여행지를 선택해주세요</h3>
                </div>
                <button
                  onClick={handleMoreDestinations}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                >
                  목록에서 찾아보기 →
                </button>
              </div>
            </div>

            {/* 검색 */}
            <div className="px-6 py-4 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="어디로 여행을 떠나시나요?"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* 리스트 */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleDestinationClick(a)}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors group flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-purple-400 transition-colors flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{getRegionName(a.koreanName)}</div>
                    <div className="text-sm text-gray-500">{getLocationInfo(a.koreanName)}</div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-6 py-6 text-sm text-gray-500">검색 결과가 없습니다.</div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <span className="text-sm text-gray-500">원하는 여행지가 없으신가요? 더 많은 옵션을 확인해보세요!</span>
            </div>
          </div>
        </div>
      )}

      {isDropdownOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </div>
  );
};

/* --------------------------- 메인 페이지 --------------------------- */
type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

const TravelMainPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chemiItemsState, setChemiItemsState] = useState<ChemiItem[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 활성 메뉴
  const activeMenu = useMemo(() => {
    const p = location.pathname;
    if (p === "/") return "home";
    if (p.startsWith("/feed")) return "feed";
    if (p.startsWith("/login")) return "login";
    if (p.startsWith("/trip")) return "trip";
    if (p.startsWith("/guide")) return "guide";
    if (p.startsWith("/mypage")) return "mypage";
    return "home";
  }, [location.pathname]);

  // ✅ 케미 목록
  type ChemiDto = { name: string; image: string; description: string };
  const deriveId = (imagePath: string, name: string) => {
    if (imagePath) {
      const file = imagePath.split("/").pop() || "";
      const noExt = file.replace(/\.[^/.]+$/, "");
      if (noExt) return noExt;
    }
    return name.replace(/\s+/g, "").toLowerCase();
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/chemis/all");
        const list: ChemiDto[] = res?.data?.chemiDtoList ?? [];
        const mapped: ChemiItem[] = list.map((d) => ({
          id: deriveId(d.image, d.name),
          title: d.name,
          image: d.image,
        }));
        setChemiItemsState(mapped);
      } catch (e) {
        console.error("[TravelMainPage] /chemis/all fetch error:", e);
        setChemiItemsState([]);
      }
    })();
  }, []);

  // 팝업 상태
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<TravelAreaData | null>(null);

  // ✅ 카드 클릭 시 MainTravelAreasPage와 동일하게 팝업 오픈
  const handleAreaClick = (area: TravelAreaData) => {
    setSelectedDestination(area);
    setIsPopupOpen(true);
  };

  const handleMoreAreasClick = () => {
    navigate("/areas");
  };

  const handleDropdownSelect = (area: TravelAreaData) => {
    setSelectedDestination(area);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedDestination(null);
  };

  const displayedAreas = travelAreas.slice(0, 8);

  // 무한 슬라이더 아이템
  const slideItems = useMemo(() => {
    if (!chemiItemsState.length) return [];
    return [...chemiItemsState, ...chemiItemsState];
  }, [chemiItemsState]);

  /* --------------------------- 서버: 피드 페이지네이션 --------------------------- */
  const [page, setPage] = useState(0);
  const [feedPage, setFeedPage] = useState<SpringPage<FeedResponse> | null>(null);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [feedsError, setFeedsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setFeedsLoading(true);
        setFeedsError(null);
        const res = await api.get<SpringPage<FeedResponse>>("/feeds/all/paged", {
          params: { page, size: 12 },
        });
        if (!mounted) return;
        setFeedPage(res.data);
      } catch (e) {
        if (!mounted) return;
        console.error("[TravelMainPage] /feeds/all/paged 에러:", e);
        setFeedPage({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 12,
          number: page,
          first: page === 0,
          last: true,
        });
        setFeedsError("피드를 불러오지 못했어요.");
      } finally {
        if (mounted) setFeedsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [page]);

  const feedCards: TravelReviewData[] = useMemo(() => {
    const list = feedPage?.content ?? [];
    return list.map<TravelReviewData>((f) => {
      const tags = collectTopPlaceTitles(f.days);
      const cover =
        findFirstPlaceImage(f.days) ||
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop";
      return {
        id: f.feed_id,
        title: f.title,
        location: f.slug,
        duration: formatDuration(f.start_date, f.end_date),
        views: String(f.view_count),
        likes: String(f.like_count),
        tags,
        region: f.slug,
        image: cover,
      };
    });
  }, [feedPage]);

  const onFeedCardClick = (review: TravelReviewData) => {
    navigate(`/feed/${review.id}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader activeMenu={activeMenu} />

      <main>
        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-br from-purple-100 to-pink-100 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-relaxed">
              여행 성향부터 일정 설계까지, 맞춤형
              <br />
              여행 경로를 한번에.
            </h1>
            <p className="text-lg text-gray-600 mb-10">wego에서 나만의 여행 일정을 설계하고 공유하세요</p>
            <TravelPlanDropdown areas={travelAreas} onSelect={handleDropdownSelect} />
          </div>
        </section>

        {/* 여행 스타일 섹션 - 무한 슬라이딩 */}
        <section className="py-20 px-4 bg-white" aria-label="여행 케미 타입 무한 슬라이더">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">나의 여행 스타일은?</h2>
              <p className="text-lg text-gray-600">축제 여행가? 감성 포토그래퍼? 당신의 여행 스타일을 지금 확인해보세요!</p>
            </div>

            <div className="relative mb-16">
              <div className="group overflow-hidden">
                <div className="flex">
                  {/* 트랙 1 */}
                  <div className="flex gap-4 will-change-transform marquee">
                    {slideItems.map((it, idx) => (
                      <ChemiCard key={`m1-${idx}-${it.id}`} title={it.title} image={it.image} />
                    ))}
                  </div>
                  {/* 트랙 2 */}
                  <div className="flex gap-4 will-change-transform marquee" style={{ animationDelay: "30s" }}>
                    {slideItems.map((it, idx) => (
                      <ChemiCard key={`m2-${idx}-${it.id}`} title={it.title} image={it.image} />
                    ))}
                  </div>
                </div>
              </div>

              {/* keyframes + hover pause */}
              <style>{`
                @keyframes chemi-marquee {
                  0%   { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .marquee {
                  width: max-content;
                  animation: chemi-marquee 60s linear infinite;
                }
                .group:hover .marquee {
                  animation-play-state: paused;
                }
              `}</style>
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate("/chemi/test")}
                className="bg-purple-500 hover:bg-purple-600 text-white px-10 py-4 rounded-full text-lg font-medium transition-colors"
              >
                케미 테스트 시작하기
              </button>
            </div>
          </div>
        </section>

        {/* 여행지 추천 섹션 */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">어디로 여행을 떠나시나요?</h2>
              <div className="max-w-lg mx-auto mb-16">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pr-14 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text_base"
                    placeholder=""
                  />
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-12">
              {displayedAreas.map((area) => (
                <TravelAreaCard key={area.id} area={area} onClick={handleAreaClick} />
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleMoreAreasClick}
                className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors"
              >
                + 더 많은 여행지 보기
              </button>
            </div>
          </div>
        </section>

        {/* 인기 일정 섹션 - 서버 페이지네이션 */}
        <section className="py-20 px-4 bg_white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">피드</h2>
              <p className="text-gray-600 mt-3">좋아요/조회수 순으로 정렬된 인기 피드가 보여요</p>
            </div>

            <div className="min-h-[200px]">
              {feedsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              )}

              {!feedsLoading && feedsError && (
                <div className="text-center text-red-500 py-10">{feedsError}</div>
              )}

              {!feedsLoading && !feedsError && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
                    {feedCards.length > 0 ? (
                      feedCards.map((review) => (
                        <TravelReviewCard key={review.id} review={review} onClick={onFeedCardClick} />
                      ))
                    ) : (
                      <div className="col-span-3 text-center text-gray-500 py-12">아직 등록된 피드가 없어요.</div>
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {feedPage && feedPage.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <button
                        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={feedPage.first}
                      >
                        이전
                      </button>
                      <span className="text-sm text-gray-600">
                        {feedPage.number + 1} / {feedPage.totalPages}
                      </span>
                      <button
                        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
                        onClick={() => setPage((p) => (feedPage.last ? p : p + 1))}
                        disabled={feedPage.last}
                      >
                        다음
                      </button>
                    </div>
                  )}

                  {/* 더 많은 피드 보기 */}
                  <div className="text-center">
                    <button
                      onClick={() => navigate("/feed")}
                      className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors"
                    >
                      + 더 많은 피드 보기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>

      {/* DestinationPopup */}
      <DestinationPopup
        isOpen={isPopupOpen}
        onClose={handlePopupClose}
        destination={selectedDestination}
      />
    </div>
  );
};

export default TravelMainPage;
