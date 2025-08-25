// src/main/TravelMainPage.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, ChevronDown, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader"; // ✅ 공통 헤더 사용
import Footer from "./components/footer";
import TravelAreaCard from "./components/TravelAreaCard";
import type { TravelAreaData } from "./components/TravelAreaCard";
import ChemiCard from "./components/ChemiCard";
import TravelReviewCard from "./components/TravelReviewCard";
import type { TravelReviewData } from "./components/TravelReviewCard";
import DestinationPopup from "./components/DestinationPopup";

// ✅ travelData에서 타입과 다른 데이터만 사용
import { travelAreas, travelAreasById } from "./data/travelData";
import type { ChemiItem } from "./data/travelData";

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
    console.log(`${area.koreanName} 선택됨`);
    setIsDropdownOpen(false);
    onSelect(area);
  };

  const handleMoreDestinations = () => {
    console.log("더 많은 여행지 찾기 클릭됨");
    setIsDropdownOpen(false);
  };

  // 외부 클릭 시 닫기
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
              {filtered.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleDestinationClick(area)}
                  className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors group flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-purple-400 transition-colors flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{getRegionName(area.koreanName)}</div>
                    <div className="text-sm text-gray-500">{getLocationInfo(area.koreanName)}</div>
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
const TravelMainPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ 케미 데이터: 서버에서 가져와서 상태로 보관
  const [chemiItemsState, setChemiItemsState] = useState<ChemiItem[]>([]);

  // ✅ 응답 DTO 타입과 id 파생 유틸
  type ChemiDto = { name: string; image: string; description: string };
  const deriveId = (imagePath: string, name: string) => {
    if (imagePath) {
      const file = imagePath.split("/").pop() || "";
      const noExt = file.replace(/\.[^/.]+$/, "");
      if (noExt) return noExt;
    }
    return name.replace(/\s+/g, "").toLowerCase();
  };

  // ✅ 서버에서 케미 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("http://localhost:8080/chemi/all");
        const list: ChemiDto[] = res?.data?.chemiDtoList ?? [];
        const mapped: ChemiItem[] = list.map((d) => ({
          id: deriveId(d.image, d.name),
          title: d.name,
          image: d.image,
        }));
        setChemiItemsState(mapped);
      } catch (e) {
        console.error("[TravelMainPage] /chemi/all fetch error:", e);
        setChemiItemsState([]); // 실패 시 빈 배열
      }
    })();
  }, []);

  // ✅ navigate 훅
  const navigate = useNavigate();

  // 팝업 상태
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<TravelAreaData | null>(null);

  // ✅ 헤더 메뉴 클릭 처리 (AppHeader → 여기로 위임됨)
  const handleHeaderMenuClick = (menu: string) => {
    setCurrentPage(menu);
    switch (menu) {
      case "home":
        navigate("/");
        break;
      case "login":
        navigate("/login");
        break;
      case "trip":
        // TODO: 여행지 메인 라우팅 연결 시 사용
        console.log("여행지 페이지로 이동");
        break;
      case "guide":
        console.log("가이드 페이지로 이동");
        break;
      case "feed":
        console.log("피드 페이지로 이동");
        break;
      default:
        break;
    }
  };

  const handleAreaClick = (area: TravelAreaData) => {
    console.log(`${area.koreanName} 클릭됨`);
  };

  const handleMoreAreasClick = () => {
    console.log("더 많은 여행지 보기 클릭됨");
  };

  const handleReviewClick = (review: TravelReviewData) => {
    console.log(`${review.title} 리뷰 클릭됨`);
  };

  const handleDropdownSelect = (area: TravelAreaData) => {
    setSelectedDestination(area);
    setIsPopupOpen(true);
  };

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    setSelectedDestination(null);
  };

  // 메인 페이지에서는 처음 8개만 표시
  const displayedAreas = travelAreas.slice(0, 8);

  // 여행 리뷰 데이터 (기존 그대로)
  const travelReviews: TravelReviewData[] = [
    {
      id: 1,
      title: "제주도 힐링 여행",
      location: "제주도",
      duration: "1박 2일",
      views: "100",
      likes: "1000",
      tags: ["해변 액티비티", "맛집 총집합", "관광지"],
      region: "제주",
      image: "/src/assets/itinerary/jeju-healing.jpg",
    },
    {
      id: 2,
      title: "서울 도심 투어",
      location: "서울",
      duration: "2박 3일",
      views: "250",
      likes: "850",
      tags: ["문화 체험", "쇼핑", "카페 투어"],
      region: "서울",
      image: "/src/assets/itinerary/seoul-tour.jpg",
    },
    {
      id: 3,
      title: "부산 바다 여행",
      location: "부산",
      duration: "2박 3일",
      views: "180",
      likes: "1200",
      tags: ["해수욕장", "수산시장", "야경 명소"],
      region: "부산",
      image: "/src/assets/itinerary/busan-sea.jpg",
    },
    {
      id: 4,
      title: "강릉 동해안 여행",
      location: "강릉",
      duration: "1박 2일",
      views: "90",
      likes: "650",
      tags: ["해변 드라이브", "커피 거리", "일출 명소"],
      region: "강원",
      image: "/src/assets/itinerary/gangneung-coast.jpg",
    },
    {
      id: 5,
      title: "경주 역사 탐방",
      location: "경주",
      duration: "2박 3일",
      views: "120",
      likes: "720",
      tags: ["역사 유적", "문화재", "전통 체험"],
      region: "경북",
      image: "/src/assets/itinerary/gyeongju-history.jpg",
    },
    {
      id: 6,
      title: "전주 한옥마을",
      location: "전주",
      duration: "1박 2일",
      views: "200",
      likes: "950",
      tags: ["한옥 체험", "전통 음식", "공예 체험"],
      region: "전북",
      image: "/src/assets/itinerary/jeonju-hanok.jpg",
    },
  ];

  // ✅ 끊김 없는 루프용 복제 (서버 데이터 기반)
  const slideItems = useMemo(() => {
    if (!chemiItemsState.length) return [];
    return [...chemiItemsState, ...chemiItemsState];
  }, [chemiItemsState]);

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ 공통 헤더 적용 */}
      <AppHeader activeMenu={currentPage} onMenuClick={handleHeaderMenuClick} />

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
            {/* 드롭다운에서 선택 시 팝업 오픈 */}
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
              {/* ✅ 버튼 클릭 시 /chemi/test 로 이동 */}
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
              {travelAreas.slice(0, 8).map((area) => (
                <TravelAreaCard key={area.id} area={area} onClick={handleAreaClick} />
              ))}
            </div>

            <div className="text-center">
              <button onClick={handleMoreAreasClick} className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors">
                + 더 많은 여행지 보기
              </button>
            </div>
          </div>
        </section>

        {/* 인기 일정 섹션 */}
        <section className="py-20 px-4 bg_white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">유저들의 인기 추천 여행일정</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
              {[
                {
                  id: 1,
                  title: "제주도 힐링 여행",
                  location: "제주도",
                  duration: "1박 2일",
                  views: "100",
                  likes: "1000",
                  tags: ["해변 액티비티", "맛집 총집합", "관광지"],
                  region: "제주",
                  image: "/src/assets/itinerary/jeju-healing.jpg",
                },
                {
                  id: 2,
                  title: "서울 도심 투어",
                  location: "서울",
                  duration: "2박 3일",
                  views: "250",
                  likes: "850",
                  tags: ["문화 체험", "쇼핑", "카페 투어"],
                  region: "서울",
                  image: "/src/assets/itinerary/seoul-tour.jpg",
                },
                {
                  id: 3,
                  title: "부산 바다 여행",
                  location: "부산",
                  duration: "2박 3일",
                  views: "180",
                  likes: "1200",
                  tags: ["해수욕장", "수산시장", "야경 명소"],
                  region: "부산",
                  image: "/src/assets/itinerary/busan-sea.jpg",
                },
                {
                  id: 4,
                  title: "강릉 동해안 여행",
                  location: "강릉",
                  duration: "1박 2일",
                  views: "90",
                  likes: "650",
                  tags: ["해변 드라이브", "커피 거리", "일출 명소"],
                  region: "강원",
                  image: "/src/assets/itinerary/gangneung-coast.jpg",
                },
                {
                  id: 5,
                  title: "경주 역사 탐방",
                  location: "경주",
                  duration: "2박 3일",
                  views: "120",
                  likes: "720",
                  tags: ["역사 유적", "문화재", "전통 체험"],
                  region: "경북",
                  image: "/src/assets/itinerary/gyeongju-history.jpg",
                },
                {
                  id: 6,
                  title: "전주 한옥마을",
                  location: "전주",
                  duration: "1박 2일",
                  views: "200",
                  likes: "950",
                  tags: ["한옥 체험", "전통 음식", "공예 체험"],
                  region: "전북",
                  image: "/src/assets/itinerary/jeonju-hanok.jpg",
                },
              ].map((review) => (
                <TravelReviewCard key={review.id} review={review} onClick={(r) => console.log(`${r.title} 리뷰 클릭됨`)} />
              ))}
            </div>

            <div className="text-center">
              <button className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors">+ 더 많은 일정 보기</button>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      {/* DestinationPopup */}
      <DestinationPopup isOpen={isPopupOpen} onClose={handlePopupClose} destination={selectedDestination} />
    </div>
  );
};

export default TravelMainPage;
