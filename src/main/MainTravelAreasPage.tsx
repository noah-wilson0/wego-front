// src/main/MainTravelAreasPage.tsx
import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";

import AppHeader from "../components/header/AppHeader";
import Footer from "./components/footer";
import TravelAreaCard from "./components/TravelAreaCard";
import type { TravelAreaData } from "./components/TravelAreaCard";
import DestinationPopup from "./components/DestinationPopup";

// 로컬 데이터 (서버 연동시엔 API로 교체)
import { travelAreas } from "./data/travelData";

// 지역(광역) 이름 파생
const getRegionName = (koreanName: string) => koreanName.split(" ").slice(-1)[0];
const getLocationInfo = (koreanName: string) => koreanName.split(" ").slice(0, -1).join(" ");

const MainTravelAreasPage: React.FC = () => {
  // 헤더 메뉴 하이라이트
  const activeMenu = "trip";

  // 검색 상태
  const [q, setQ] = useState("");

  // 팝업
  const [selected, setSelected] = useState<TravelAreaData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // 검색 필터
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return travelAreas.filter((a) => {
      const hay = (a.koreanName + " " + a.englishName + " " + getLocationInfo(a.koreanName)).toLowerCase();
      return term ? hay.includes(term) : true;
    });
  }, [q]);

  const onCardClick = (area: TravelAreaData) => {
    setSelected(area);
    setIsPopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader activeMenu={activeMenu} />

      <main className="px-4">
        {/* ===== Hero: 제목 + 검색 박스 ===== */}
        <section className="max-w-6xl mx-auto pt-12 pb-4">
          <h1 className="text-center text-3xl md:text-4xl font-bold text-gray-900">
            어디로 여행을 떠나시나요?
          </h1>

          {/* 검색 인풋 */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="예) 제주, 부산, gangneung…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </section>

        {/* ===== 결과 카운트 ===== */}
        <section className="max-w-6xl mx-auto pb-2">
          <div className="mt-4 text-sm text-gray-600">
            총 <span className="font-semibold text-gray-800">{filtered.length.toLocaleString()}</span>개 여행지
          </div>
        </section>

        {/* ===== 카드 그리드 ===== */}
        <section className="max-w-6xl mx-auto pb-16">
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((area) => (
              <TravelAreaCard key={area.id} area={area} onClick={onCardClick} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              조건에 맞는 여행지를 찾지 못했어요.
            </div>
          )}
        </section>

        <Footer />
      </main>

      {/* 목적지 팝업 */}
      <DestinationPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelected(null);
        }}
        destination={selected}
      />
    </div>
  );
};

export default MainTravelAreasPage;
