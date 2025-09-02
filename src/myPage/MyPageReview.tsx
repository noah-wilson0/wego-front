// src/mypage/MyPageReview.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

import AppHeader from '../components/header/AppHeader';
import MyPageSideBar from '../myPage/components/MyPageSideBar';
import TravelReviewCard from '../feed/components/TravelReviewCard';
import type { TravelReviewData } from '../feed/components/TravelReviewCard';

// ✅ 서버 Feed 타입 재사용
import type { FeedResponse } from '../data/feed';

/* ------------------------ Axios 인스턴스 (쿠키 포함) ------------------------ */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/* ------------------------ 유틸 ------------------------ */
const diffDays = (startISO: string, endISO: string) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};

const formatDuration = (startISO: string, endISO: string) => {
  const days = diffDays(startISO, endISO);
  return days > 0 ? `${days}일` : '';
};

// days를 1일차부터 순서대로 훑으면서 PlaceItem.title을 최대 3개 모읍니다.
const collectTopPlaceTitles = (days: FeedResponse['days'] | undefined): string[] => {
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

// 첫 번째 place의 이미지를 찾아 커버로 사용 (없으면 플레이스홀더)
const findFirstPlaceImage = (days: FeedResponse['days'] | undefined): string | undefined => {
  if (!days) return;
  for (const d of days) {
    const first = d?.places?.[0];
    if (first?.image) return first.image;
  }
  return;
};

const MyPageReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /** 현재 경로 → 사이드바 활성 키 계산 */
  const activeMenu = useMemo(() => {
    if (location.pathname.startsWith('/mypage/profile')) return 'profile';
    if (location.pathname.startsWith('/mypage/feed')) return 'review';
    if (location.pathname.startsWith('/mypage/itinerary')) return 'itinerary';
    if (location.pathname.startsWith('/mypage/chemi')) return 'chemi';
    return 'home';
  }, [location.pathname]);

  /** 사이드바에 표시할 사용자 이름 */
  const [displayName, setDisplayName] = useState<string>('');

  // 이름 불러오기
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<string>('/auth/me', { responseType: 'text' });
        if (!mounted) return;
        setDisplayName((res.data || '').trim());
      } catch {
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
      }
    })();
    return () => { mounted = false; };
  }, [location.pathname, location.search, navigate]);

  /** 사이드바 메뉴 클릭 → 라우팅 */
  const handleSidebarMenuClick = (menu: string) => {
    switch (menu) {
      case 'profile': navigate('/mypage/profile'); break;
      case 'home': navigate('/mypage'); break;
      case 'chemi': navigate('/mypage/chemi'); break;
      case 'review': navigate('/mypage/feed'); break;
      case 'itinerary': navigate('/mypage/itinerary'); break;
      default: navigate('/mypage');
    }
  };

  /** 상단 헤더 메뉴 클릭 */
  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
  };

  // 정렬 드롭다운 상태
  const [sortBy, setSortBy] =
    useState<'최근 순' | '인기 순' | '조회수 순'>('최근 순');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sortOptions: Array<typeof sortBy> = ['최근 순', '인기 순', '조회수 순'];

  /* ------------------------ 서버: 내 피드 목록 ------------------------ */
  const [feeds, setFeeds] = useState<FeedResponse[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await api.get<FeedResponse[]>('/members/feed');
        if (!mounted) return;
        setFeeds(Array.isArray(res.data) ? res.data : []);
      } catch {
        setErrorMsg('내 피드를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        setFeeds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* ------------------------ 뷰 모델 변환 & 정렬 ------------------------ */
  const reviewCards: TravelReviewData[] = useMemo(() => {
    if (!feeds) return [];

    const sorted = [...feeds].sort((a, b) => {
      switch (sortBy) {
        case '인기 순':
          return b.like_count - a.like_count;
        case '조회수 순':
          return b.view_count - a.view_count;
        case '최근 순':
        default: {
          const ta = new Date(a.created_at).getTime();
          const tb = new Date(b.created_at).getTime();
          return tb - ta;
        }
      }
    });

    return sorted.map<TravelReviewData>((f) => {
      const tags = collectTopPlaceTitles(f.days); // ✅ 0~2까지 채우되 모자라면 다음 날로 이어서 채움
      const cover = findFirstPlaceImage(f.days) ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop';

      return {
        id: f.feed_id,
        title: f.title,
        location: f.slug,
        duration: formatDuration(f.start_date, f.end_date),
        views: String(f.view_count),
        likes: String(f.like_count),
        tags,                 // ✅ 항상 최대 3개까지 들어가도록 수집
        region: f.slug,
        image: cover,
      };
    });
  }, [feeds, sortBy]);

  const handleReviewClick = (review: TravelReviewData) => {
    console.log(`${review.title} 클릭됨`);
    // detail 페이지가 있다면 navigate(`/feed/${review.id}`)
  };

  const handleSortChange = (option: typeof sortBy) => {
    setSortBy(option);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader activeMenu={activeMenu} onMenuClick={handleTopMenuClick} />

      <div className="flex max-w-7xl mx-auto">
        <MyPageSideBar
          activeMenu={activeMenu}
          onMenuClick={handleSidebarMenuClick}
          displayName={displayName}
        />

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
              {loading && (
                <div className="text-center text-gray-600 py-10">불러오는 중...</div>
              )}
              {!loading && errorMsg && (
                <div className="text-center text-red-500 py-10">{errorMsg}</div>
              )}

              {!loading && !errorMsg && (
                <>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    {reviewCards.length > 0 ? (
                      reviewCards.map((review) => (
                        <TravelReviewCard
                          key={review.id}
                          review={review}
                          onClick={handleReviewClick}
                        />
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-gray-500 py-10">
                        작성한 리뷰가 없어요.
                      </div>
                    )}
                  </div>

                  {reviewCards.length > 0 && (
                    <div className="text-center">
                      <button className="text-gray-600 hover:text-gray-800 text-lg font-medium transition-colors">
                        + 더 많은 리뷰 보기
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

export default MyPageReview;
