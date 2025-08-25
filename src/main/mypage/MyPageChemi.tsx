// src/mypage/MyPageChemi.tsx
import React, { useMemo, useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import MyPageSideBar from './components/MyPageSideBar';
import ChemiCard from '../components/ChemiCard';

// 케미 데이터 타입 (기존 그대로 사용)
interface ChemiData {
  title: string;
  image?: string;
}

/* ------------------------ 서버 DTO 타입 ------------------------ */
type ChemiDto = {
  name: string;
  image: string;        // 예: "/images/chemi/goal.png"
  description: string;
};
type ChemiListResponse = {
  chemiDtoList: ChemiDto[];
};

/* ------------------------ 쿠키 포함 axios ------------------------ */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // ✅ HttpOnly 세션 쿠키 포함
});

const MyPageChemi: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /** 현재 URL → 사이드바 활성키 계산 */
  const activeMenu = useMemo(() => {
    if (location.pathname.startsWith('/mypage/profile')) return 'profile';
    if (location.pathname.startsWith('/mypage/chemi')) return 'chemi';
    if (location.pathname.startsWith('/mypage/review')) return 'review';
    if (location.pathname.startsWith('/mypage/itinerary')) return 'itinerary';
    return 'home';
  }, [location.pathname]);

  /** 사이드바 클릭 → 라우팅 */
  const handleSidebarMenuClick = (menu: string) => {
    switch (menu) {
      case 'profile':
        navigate('/mypage/profile');
        break;
      case 'home':
        navigate('/mypage'); break;
      case 'chemi':
        navigate('/mypage/chemi'); break;
      case 'review':
        navigate('/mypage/review'); break;
      case 'itinerary':
        navigate('/mypage/itinerary'); break;
      default:
        navigate('/mypage');
    }
  };

  /** 상단 헤더 메뉴(원하면 글로벌 라우팅 연결) */
  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
  };

  /* ------------------------ 사이드바에 표시할 이름 ------------------------ */
  const [displayName, setDisplayName] = useState<string>('');

  /* ------------------------ 서버 데이터 상태 ------------------------ */
  const [meChemi, setMeChemi] = useState<ChemiDto | null>(null);
  const [allChemis, setAllChemis] = useState<ChemiData[]>([]);
  const [recommendedChemis, setRecommendedChemis] = useState<ChemiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  /* ------------------------ 로그인 가드 + 데이터 로딩 ------------------------ */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) 인증 확인 + 이름 받아오기 (문자열)
        //    실패 시 로그인으로 이동
        const meNameRes = await api.get<string>('/auth/me', { responseType: 'text' });
        if (!mounted) return;
        setDisplayName((meNameRes.data || '').trim());

        setLoading(true);
        setErrMsg(null);

        // 2) /chemi/me, /chemi/all, /chemi/similar 병렬 로딩
        const [meRes, allRes, simRes] = await Promise.all([
          api.get<ChemiDto>('/chemi/me'),
          api.get<ChemiListResponse>('/chemi/all'),
          api.get<ChemiListResponse>('/chemi/similar'),
        ]);

        if (!mounted) return;

        // me
        setMeChemi(meRes.data ?? null);

        // all
        const allList = allRes.data?.chemiDtoList ?? [];
        setAllChemis(allList.map(d => ({ title: d.name, image: d.image })));

        // similar
        const simList = simRes.data?.chemiDtoList ?? [];
        setRecommendedChemis(simList.map(d => ({ title: d.name, image: d.image })));
      } catch (e: any) {
        if (!mounted) return;
        // 인증 실패 등
        setErrMsg(e?.message ?? '케미 정보를 불러오지 못했어요.');
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 공통 헤더 */}
      <AppHeader activeMenu={activeMenu} onMenuClick={handleTopMenuClick} />
      
      <div className="flex max-w-7xl mx-auto">
        {/* ✅ 사이드바에 displayName 전달 */}
        <MyPageSideBar
          activeMenu={activeMenu}
          onMenuClick={handleSidebarMenuClick}
          displayName={displayName}
        />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">케미</h2>
              <button
                onClick={() => navigate('/chemi/test')}
                className="bg-blue-500 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-blue-600 transition-colors"
              >
                재검사
              </button>
            </div>
            
            {/* 나는 (내 케미) */}
            <div className="flex items-center mb-12">
              <div className="w-48 h-48 border-2 border-gray-300 rounded-3xl flex flex-col items-center justify-center mr-8 bg-gray-50 overflow-hidden">
                {loading ? (
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse" />
                ) : meChemi?.image ? (
                  <img
                    src={meChemi.image}  // vite proxy로 /images 경로 그대로 사용 가능
                    alt={meChemi.name}
                    className="w-24 h-24 mb-4 rounded-2xl object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                ) : (
                  <div className="text-6xl mb-4">🍗</div>
                )}
                <div className="text-sm text-gray-600 mb-4">
                  {loading ? '불러오는 중...' : (meChemi?.name ?? '—')}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4">
                  {loading ? '케미를 불러오는 중...' : `나는 ${meChemi?.name ?? '—'}`}
                </h3>
                <p className="text-xl text-gray-700">
                  {loading ? '잠시만 기다려 주세요.' : (meChemi?.description ?? '설명이 없습니다.')}
                </p>
                {errMsg && !loading && (
                  <p className="mt-2 text-sm text-red-500">{errMsg}</p>
                )}
              </div>
            </div>

            {/* 모든 케미 그리드 → /chemi/all */}
            <div className="mb-12">
              <div className="grid grid-cols-4 gap-4">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl" />
                    ))
                  : allChemis.map((chemi) => (
                      <div key={chemi.title} className="pointer-events-none">
                        <ChemiCard title={chemi.title} image={chemi.image} />
                      </div>
                    ))
                }
              </div>
            </div>

            {/* 잘 어울리는 케미 → /chemi/similar */}
            <div>
              <h3 className="text-xl font-semibold mb-6">잘 어울리는 케미</h3>
              <div className="grid grid-cols-4 gap-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-2xl" />
                    ))
                  : recommendedChemis.map((chemi) => (
                      <div key={`rec-${chemi.title}`} className="pointer-events-none">
                        <ChemiCard title={chemi.title} image={chemi.image} />
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyPageChemi;
