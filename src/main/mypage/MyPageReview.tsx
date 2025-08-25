// src/mypage/MyPageReview.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppHeader from '../../components/AppHeader';
import MyPageSideBar from './components/MyPageSideBar';
import TravelReviewCard from '../components/TravelReviewCard';
import type { TravelReviewData } from '../components/TravelReviewCard';

/* ------------------------ Axios 인스턴스 (쿠키 포함) ------------------------ */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // ✅ HttpOnly 세션 쿠키 포함
});

const MyPageReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /** 현재 경로 → 사이드바 활성 키 계산 */
  const activeMenu = useMemo(() => {
    if (location.pathname.startsWith('/mypage/profile')) return 'profile';
    if (location.pathname.startsWith('/mypage/review')) return 'review';
    if (location.pathname.startsWith('/mypage/itinerary')) return 'itinerary';
    if (location.pathname.startsWith('/mypage/chemi')) return 'chemi';
    return 'home';
  }, [location.pathname]);

  /** 사이드바에 표시할 사용자 이름 */
  const [displayName, setDisplayName] = useState<string>('');

  // ✅ 마운트 시 이름만 받아와서 사이드바에 표시 (문자열 응답)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get<string>('/auth/me', { responseType: 'text' });
        if (!mounted) return;
        setDisplayName((res.data || '').trim());
      } catch (e) {
        // 인증 실패 등 → 로그인 페이지로
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
      }
    })();

    return () => { mounted = false; };
  }, [location.pathname, location.search, navigate]);

  /** 사이드바 메뉴 클릭 → 라우팅 */
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
        navigate('/mypage/review');
        break;
      case 'itinerary':
        navigate('/mypage/itinerary');
        break;
      default:
        navigate('/mypage');
    }
  };

  /** 상단 헤더 메뉴 클릭 (필요 시 라우팅 붙이기) */
  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
    // trip/guide/feed/login 등은 프로젝트 정책에 맞게 추가
  };

  // 정렬 드롭다운 상태
  const [sortBy, setSortBy] = useState('최근 순');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sortOptions = ['최근 순', '인기 순', '조회수 순'];

  // 리뷰 목업 데이터
  const reviews: TravelReviewData[] = [
    {
      id: 1,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
    {
      id: 2,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
    {
      id: 3,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
    {
      id: 4,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
    {
      id: 5,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
    {
      id: 6,
      title: '해무도 넘어 바라지',
      location: '속초',
      duration: '5시간',
      views: '100',
      likes: '1000',
      tags: ['해변 액티비티', '해수욕장', '일몰'],
      region: '공유',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=200&fit=crop',
    },
  ];

  const handleReviewClick = (review: TravelReviewData) => {
    console.log(`${review.title} 클릭됨`);
  };

  const handleSortChange = (option: string) => {
    setSortBy(option);
    setIsDropdownOpen(false);
    // TODO: 실제 정렬 로직 연결
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 공통 Header */}
      <AppHeader activeMenu={activeMenu} onMenuClick={handleTopMenuClick} />

      <div className="flex max-w-7xl mx-auto">
        {/* ✅ 사이드바: activeMenu + 콜백 + displayName 전달 */}
        <MyPageSideBar
          activeMenu={activeMenu}
          onMenuClick={handleSidebarMenuClick}
          displayName={displayName}
        />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 카드 상단 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">리뷰</h2>

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
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                      {sortOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSortChange(option)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            sortBy === option
                              ? 'text-blue-500 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 리뷰 그리드 */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-8">
                {reviews.map((review) => (
                  <TravelReviewCard
                    key={review.id}
                    review={review}
                    onClick={handleReviewClick}
                  />
                ))}
              </div>

              {/* 더 많은 리뷰 보기 */}
              <div className="text-center">
                <button className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors">
                  + 더 많은 리뷰 보기
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyPageReview;
