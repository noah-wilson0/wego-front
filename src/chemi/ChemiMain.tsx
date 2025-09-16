// src/chemi/ChemiMain.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 타입만 import (데이터는 서버에서 받아옴)
import type { ChemiItem } from "../main/data/travelData";

/* --------------------------------- UI ---------------------------------- */

const ChemiCard: React.FC<{ 
  title: string; 
  image: string; 
  isSelected?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ title, image, isSelected = false, onClick, isClickable = false }) => {
  return (
    <div 
      className={`
        bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 min-w-[160px] flex-shrink-0
        ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${isSelected ? 'ring-4 ring-purple-500 shadow-xl scale-110 bg-purple-50' : ''}
      `}
      onClick={onClick}
    >
      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
        <img 
          src={image}           // ✅ 서버가 준 "/images/chemi/xxx.png" 그대로 사용
          alt={title}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '🎯';
              parent.className += ' text-3xl';
            }
          }}
        />
      </div>
      <h3 className={`text-center font-semibold text-sm ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
        {title}
      </h3>
    </div>
  );
};

const Header = ({ activeMenu = "", onMenuClick }: { activeMenu?: string; onMenuClick?: (k: string) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { key: "trip", label: "여행지" },
    { key: "guide", label: "가이드" },
    { key: "feed", label: "피드" },
    { key: "login", label: "로그인" },
  ];

  const handleMenuClick = (menuKey: string) => {
    onMenuClick?.(menuKey);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => handleMenuClick("home")} className="text-xl font-bold text-black">
            LOGO
          </button>
        </div>

        <nav className="hidden sm:flex items-center">
          <div className="flex items-center space-x-8 lg:space-x-12">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="text-base font-medium text-black hover:text-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="sm:hidden flex flex-col items-center justify-center w-6 h-6 space-y-1"
        >
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <nav className="px-6 py-4 space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="block w-full text-left text-base font-medium text-black hover:text-blue-600 transition-colors py-2"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

/* ------------------------------ 데이터 패치 ------------------------------ */

// dev: Vite proxy가 '/api'를 백엔드로 프록시
// prod: 같은 경로로 리버스 프록시를 구성하면 동일 코드로 동작
const api = axios.create({
  baseURL: "/api",
  // withCredentials: true, // 쿠키 쓰면 주석 해제
});

type ChemiDto = {
  name: string;
  image: string;        // 예: "/images/chemi/goal.png"
  description: string;
};

const deriveId = (imagePath: string, name: string) => {
  if (imagePath) {
    const file = imagePath.split("/").pop() || "";
    const noExt = file.replace(/\.[^/.]+$/, "");
    if (noExt) return noExt;
  }
  return name.replace(/\s+/g, "").toLowerCase();
};

/* --------------------------------- 페이지 -------------------------------- */

const ChemiMain: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("chemi");
  const navigate = useNavigate();

  const [items, setItems] = useState<ChemiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("[ChemiMain] GET: /api/chemis/all");
        const res = await api.get("http://localhost:8080/chemis/all");
        console.log("[ChemiMain] response.status:", res.status);
        console.log("[ChemiMain] response.data:", res.data);

        const list: ChemiDto[] = res?.data?.chemiDtoList ?? [];
        const mapped: ChemiItem[] = list.map((d) => ({
          id: deriveId(d.image, d.name),
          title: d.name,
          image: d.image, // ✅ "/images/chemi/xxx.png" 그대로 사용
        }));

        if (mounted) setItems(mapped);
      } catch (e: any) {
        console.error("[ChemiMain] fetch error:", e);
        if (mounted) setError(e?.message ?? "데이터를 불러오지 못했어요.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const slideItems = useMemo(() => {
    if (!items.length) return [];
    return [...items, ...items];
  }, [items]);

  const handleMenuClick = (menu: string) => {
    setCurrentPage(menu);
  };

  const handleTestStart = () => {
    navigate("/chemi/quiz");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#BB9EF4" }}>
      <Header activeMenu={currentPage} onMenuClick={handleMenuClick} />
      
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12 min-h-[600px] flex flex-col">
            <div className="text-center mb-16">
              <p className="text-gray-500 text-sm mb-4">
                여행지 선택부터 일정 설계까지, 당신만의 여행 취향을 알려주세요!
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                나의 여행 케미는?
              </h1>
            </div>

            <div className="flex-1 mb-12">
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />
                  ))}
                </div>
              )}

              {error && !loading && (
                <div className="text-center text-red-500 font-medium">
                  데이터를 불러오는 중 오류가 발생했어요. ({error})
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div className="relative mb-8">
                  <div className="overflow-hidden">
                    <div className="flex">
                      <div className="flex gap-4 will-change-transform marquee">
                        {slideItems.map((item, idx) => (
                          <ChemiCard key={`m1-${idx}-${item.id}`} title={item.title} image={item.image} />
                        ))}
                      </div>
                      <div className="flex gap-4 will-change-transform marquee" style={{ animationDelay: "30s" }}>
                        {slideItems.map((item, idx) => (
                          <ChemiCard key={`m2-${idx}-${item.id}`} title={item.title} image={item.image} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <style>{`
                    @keyframes chemi-marquee {
                      0%   { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                    .marquee {
                      width: max-content;
                      animation: chemi-marquee 60s linear infinite;
                    }
                  `}</style>
                </div>
              )}

              {!loading && !error && items.length === 0 && (
                <div className="text-center text-gray-500">
                  표시할 케미가 없어요.
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={handleTestStart}
                className="bg-purple-500 hover:bg-purple-600 text-white px-16 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                테스트 시작하기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChemiMain;
