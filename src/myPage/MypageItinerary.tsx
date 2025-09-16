// src/mypage/MyPageItinerary.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import AppHeader from '../components/header/AppHeader';
import MyPageSideBar from '../myPage/components/MyPageSideBar';
import TravelPlanItem from '../myPage/components/TravelPlanItem';
import type { TravelPlanData } from '../myPage/components/TravelPlanItem';

// ✅ 서버 응답 DTO 타입 (백엔드 TravelPlanDto와 동일)
type ServerTravelPlanDto = {
  id: number;
  slug: string;
  title: string;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string;   // 'yyyy-MM-dd'
  createdAt: string; // 'yyyy-MM-dd'
};

// ✅ 날짜 차이(일수) 계산: UTC 영향 줄이기 위해 local 기준으로 단순 계산
function daysBetween(today: Date, target: Date) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const s = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffMs = t - s;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ✅ D-Day 문자열 계산: 시작일 기준
function calcDDay(startDateISO: string): string {
  const today = new Date();
  const start = new Date(startDateISO);

  // start - today 의 일수 차이 (양수면 시작일이 과거)
  const diff = daysBetween(today, start) * -1; // today - start 의 부호 반전

  if (diff === 0) return 'D-Day';
  if (diff < 0) return `D-${Math.abs(diff)}`; // 아직 시작 전
  return `D+${diff}`; // 시작일 경과
}

// ✅ 문자열 비교용 헬퍼 (yyyy-MM-dd 형식 가정)
function compareDateAsc(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}
function compareDateDesc(a: string, b: string) {
  return new Date(b).getTime() - new Date(a).getTime();
}

const MyPageItinerary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /** 현재 URL 기준으로 사이드바 활성 탭 계산 */
  const activeMenu = useMemo(() => {
    if (location.pathname.startsWith('/mypage/profile')) return 'profile';
    if (location.pathname.startsWith('/mypage/chemi')) return 'chemi';
    if (location.pathname.startsWith('/mypage/feed')) return 'review';
    if (location.pathname.startsWith('/mypage/itinerary')) return 'itinerary';
    return 'home';
  }, [location.pathname]);

  /** ✅ 사이드바에 표시할 사용자 이름 상태 */
  const [displayName, setDisplayName] = useState<string>('');

  /** 사이드바 메뉴 클릭 시 라우팅 */
  const handleSidebarMenuClick = (menu: string) => {
    switch (menu) {
      case 'profile':
        navigate('/mypage/profile');
        break;
      case 'home':
        navigate('/mypage');
        break;
      case 'chemi':
        navigate('/mypage/chemi');
        break;
      case 'review':
        navigate('/mypage/feed');
        break;
      case 'itinerary':
        navigate('/mypage/itinerary');
        break;
      default:
        navigate('/mypage');
    }
  };

  /** 상단 헤더 메뉴 클릭 */
  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
  };

  // ✅ 정렬 드롭다운 상태
  const [sortBy, setSortBy] = useState('최근 수정일 순');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sortOptions = ['최근 수정일 순', '생성일 순', '여행일 순'];

  // ✅ 여행일정 탭 상태 추가 (기본값: 전체일정)
  const [activeTab, setActiveTab] = useState('전체일정');
  const tabOptions = ['전체일정', '공유된 일정', '만료된 일정'];

  // ✅ 서버에서 가져온 원본 데이터 & 화면에 보여줄 변환 데이터
  const [serverPlans, setServerPlans] = useState<ServerTravelPlanDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ 서버 호출 함수 분리
  const fetchTravelPlans = async (status: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await axios.get<ServerTravelPlanDto[]>(
        `http://localhost:8080/me/travel-plans`,
        { 
          params: { status }, // query string으로 status 전달
          withCredentials: true // 쿠키(JWT) 포함
        }
      );

      // 응답 데이터가 배열인지 확인하고 안전하게 처리
      const data = res.data;
      if (Array.isArray(data)) {
        setServerPlans(data);
      } else {
        console.warn('서버 응답이 배열 형식이 아닙니다:', data);
        setServerPlans([]);
      }
    } catch (err) {
      console.error('여행 일정 조회 실패:', err);
      setErrorMsg('여행 일정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      setServerPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 탭별 status 매핑
  const getStatusFromTab = (tab: string): string => {
    switch (tab) {
      case '전체일정':
        return 'all';
      case '만료된 일정':
        return 'expired';
      case '공유된 일정':
        return 'shared'; // TODO: 백엔드에서 shared 상태 추가 시 사용
      default:
        return 'all';
    }
  };

  // ✅ 탭 클릭 핸들러
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    console.log(`${tab} 탭이 클릭되었습니다.`);
    
    // 탭 변경 시 해당 상태의 데이터를 다시 가져오기
    const status = getStatusFromTab(tab);
    fetchTravelPlans(status);
  };

  // ✅ 탭 컴포넌트
  const TravelPlanTabs = () => (
    <div className="mt-6">
      <div className="flex space-x-8">
        {tabOptions.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  // ✅ 최초 로딩 시 전체 일정(status=all) 호출
  useEffect(() => {
    fetchTravelPlans('all');
  }, []);

  // ✅ (추가) 사용자 이름 불러오기: /auth/me 가 문자열만 반환
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get<string>('http://localhost:8080/auth/me', {
          withCredentials: true,
          responseType: 'text',
        });
        if (!mounted) return;
        setDisplayName((res.data || '').trim());
      } catch {
        // 인증 실패 시 로그인으로 리다이렉트
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
      }
    })();
    return () => { mounted = false; };
  }, [location.pathname, navigate]);

  // ✅ 서버 데이터 → TravelPlanItem용 데이터로 변환 + 정렬 반영
  const viewPlans: TravelPlanData[] = useMemo(() => {
    // serverPlans가 null이거나 배열이 아닌 경우 빈 배열 반환
    if (!serverPlans || !Array.isArray(serverPlans)) {
      return [];
    }

    // 1) 정렬
    let sorted = [...serverPlans];
    switch (sortBy) {
      case '최근 수정일 순':
        // 수정일 필드가 없으므로 createdAt 기준 내림차순(최신 먼저)
        sorted.sort((a, b) => compareDateDesc(a.createdAt, b.createdAt));
        break;
      case '생성일 순':
        sorted.sort((a, b) => compareDateAsc(a.createdAt, b.createdAt));
        break;
      case '여행일 순':
        sorted.sort((a, b) => compareDateAsc(a.startDate, b.startDate));
        break;
      default:
        break;
    }

    // 2) 매핑
    return sorted.map((p, index) => {
      const dDay = calcDDay(p.startDate);

      const item: TravelPlanData = {
        id: p.id, 
        title: p.title,
        destination: p.slug, // TODO: slug → 라벨 매핑 필요시 별도 테이블 사용
        dDay,
        startDate: p.startDate,
        endDate: p.endDate,
        lastModified: p.createdAt, // 수정일 없으므로 createdAt 사용
        image:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=240&h=240&fit=crop',
        tags: [],
      };
      return item;
    });
  }, [serverPlans, sortBy]);

  const handlePlanClick = (plan: TravelPlanData) => {
    console.log(`${plan.destination} 여행 일정 클릭됨`);
    // 예시: navigate(`/travel-plans/${plan.destination}`);
  };

  const handleSortChange = (option: string) => {
    setSortBy(option);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 공통 Header */}
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
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 헤더 영역 */}
            <div className="p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">여행 일정</h2>

                {/* 정렬 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span>{sortBy}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                      {sortOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSortChange(option)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            sortBy === option ? 'text-blue-500 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 여행일정 상태 탭 추가 */}
              <TravelPlanTabs />
            </div>

            {/* 본문 */}
            <div className="p-6">
              {/* 로딩/에러 처리 */}
              {loading && (
                <div className="text-center text-gray-600 py-10">불러오는 중...</div>
              )}
              {!loading && errorMsg && (
                <div className="text-center text-red-500 py-10">{errorMsg}</div>
              )}

              {!loading && !errorMsg && (
                <>
                  {/* 여행 일정 리스트 */}
                  <div className="space-y-8">
                    {viewPlans.length > 0 ? (
                      viewPlans.map((plan) => (
                        <TravelPlanItem key={plan.id} plan={plan} onClick={handlePlanClick} />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-10">
                        저장된 여행 일정이 없어요.
                      </div>
                    )}
                  </div>

                  {/* 더 많은 일정 보기 (추후 페이징/무한스크롤 연결) */}
                  {viewPlans.length > 0 && (
                    <div className="text-center mt-12">
                      <button className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors">
                        + 더 많은 일정 보기
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyPageItinerary;
