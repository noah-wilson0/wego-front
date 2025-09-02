// src/mypage/MyPageMain.tsx
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Heart, Eye, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../components/header/AppHeader';
import MyPageSideBar from './components/MyPageSideBar';
import TravelPlanItem from './components/TravelPlanItem';
import type { TravelPlanData } from './components/TravelPlanItem';

// ✅ 서버 Feed 타입 재사용
import type { FeedResponse } from '../data/feed';

/* ------------------------ Axios 인스턴스 (쿠키 포함) ------------------------ */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // ✅ HttpOnly 세션 쿠키 포함
});

/* ----------------------------- 타입 정의 ----------------------------- */
type ServerTravelPlanDto = {
  id: number;
  slug: string;
  title: string;
  startDate: string; // 'yyyy-MM-dd'
  endDate: string;   // 'yyyy-MM-dd'
  createdAt: string; // 'yyyy-MM-dd'
};

/* ----------------------------- ChemiCard ----------------------------- */
export type ChemiCardProps = {
  title: string;
  image?: string;
  onClick?: () => void;
  className?: string;
};

const ChemiCard: React.FC<ChemiCardProps> = ({ title, image, onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className={[
        "flex-shrink-0 w-32 h-40 p-3 rounded-2xl border-2 border-gray-200 bg-white",
        "hover:border-blue-400 hover:shadow-lg transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        className || ""
      ].join(" ")}
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-16 h-16 mb-3 rounded-2xl object-cover shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 mb-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-gray-700">{title.slice(0, 2)}</span>
          </div>
        )}
        <h3 className="text-xs font-semibold text-gray-800 leading-tight">{title}</h3>
      </div>
    </button>
  );
};

/* -------------------------- 리뷰 카드(기존 유지) -------------------------- */
export interface TravelReviewData {
  id: number;
  title: string;
  location: string;
  duration: string;
  views: string;
  likes: string;
  tags: string[];
  region: string;
  image?: string;
}

interface TagPillProps {
  text: string;
  showPlus?: boolean;
}

const TagPill: React.FC<TagPillProps> = ({ text, showPlus = true }) => {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 shadow-sm text-xs font-medium text-gray-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
      {showPlus && <span className="font-light">+</span>}
      <span>{text}</span>
    </span>
  );
};

interface TravelReviewCardProps {
  review: TravelReviewData;
  onClick?: (review: TravelReviewData) => void;
}

const TravelReviewCard: React.FC<TravelReviewCardProps> = ({ review, onClick }) => {
  const { image, title, location, duration, views, likes, tags, region } = review;
  const handleClick = () => onClick?.(review);

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer max-w-sm"
      onClick={handleClick}
    >
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600">
          <img 
            src={image || "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300&h=225&fit=crop"} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center shadow-sm">
            <MapPin className="w-3 h-3 mr-1 text-blue-500" />
            {region}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
            {duration}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-1 flex-1 mr-3">
            {title}
          </h3>
          <div className="flex items-center space-x-3 text-sm text-gray-500 flex-shrink-0">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {views}
            </span>
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              {likes}
            </span>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>{location}</span>
          <span className="mx-2">|</span>
          <span>{duration}</span>
        </div>
        <div className="space-y-2">
          {tags.slice(0, 2).map((tag, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
              <span className="line-clamp-1">{tag}</span>
            </div>
          ))}
          {tags.length > 2 && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
              <TagPill text={tags[2]} showPlus={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ----------------------------- 유틸(DDay) ----------------------------- */
function daysBetween(today: Date, target: Date) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const s = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((s - t) / (1000 * 60 * 60 * 24)); // target - today
}

function calcDDay(startDateISO: string): string {
  const today = new Date();
  const start = new Date(startDateISO);
  const diff = daysBetween(today, start);

  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

/* ----------------------------- 리뷰 유틸 ----------------------------- */
// 날짜 차이(일수)
const diffDays = (startISO?: string, endISO?: string) => {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO);
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
};
const formatDuration = (startISO?: string, endISO?: string) => {
  const days = diffDays(startISO, endISO);
  return days > 0 ? `${days}일` : '';
};

// PlaceItem.title 3개까지 수집(모자라면 다음 날로 이어서)
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

// 첫 번째 place 이미지 찾기
const findFirstPlaceImage = (days: FeedResponse['days'] | undefined): string | undefined => {
  if (!days) return;
  for (const d of days) {
    const first = d?.places?.[0];
    if (first?.image) return first.image;
  }
  return;
};

/* ------------------------------- 페이지 ------------------------------- */
const MyPageMain: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 사이드바에 보여줄 이름
  const [displayName, setDisplayName] = useState<string>('');

  const activeMenu = useMemo(() => {
    if (location.pathname.startsWith('/mypage/profile')) return 'profile';
    if (location.pathname.startsWith('/mypage/chemi')) return 'chemi';
    if (location.pathname.startsWith('/mypage/feed')) return 'review';
    if (location.pathname.startsWith('/mypage/itinerary')) return 'itinerary';
    return 'home';
  }, [location.pathname]);

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

  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
  };

  /* -------------------- ✅ 로그인 가드 + 이름 + 케미 데이터 로딩 -------------------- */
  type ChemiDto = { name: string; image: string; description: string; };
  type ChemiListResponse = { chemiDtoList: ChemiDto[]; };

  const [meChemi, setMeChemi] = useState<ChemiDto | null>(null);
  const [similarChemis, setSimilarChemis] = useState<ChemiDto[]>([]);
  const [chemiLoading, setChemiLoading] = useState(true);
  const [chemiError, setChemiError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) ✅ 인증 확인 + 이름 가져오기
        let nameStr = '';
        try {
          const meRes = await api.get<string>('/auth/me', { responseType: 'text' });
          nameStr = (meRes.data || '').trim();
          if (mounted) setDisplayName(nameStr);
        } catch {
          const redirect = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirect=${redirect}`);
          return;
        }

        // 2) 케미 데이터 병렬 로딩
        setChemiLoading(true);
        setChemiError(null);

        const [meChemiRes, simRes] = await Promise.all([
          api.get<ChemiDto>('/chemi/me'),
          api.get<ChemiListResponse>('/chemi/similar'),
        ]);

        if (!mounted) return;

        setMeChemi(meChemiRes.data || null);
        setSimilarChemis(simRes.data?.chemiDtoList ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setChemiError(e?.message ?? '케미 정보를 불러오지 못했어요.');
      } finally {
        if (mounted) setChemiLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [location.pathname, navigate]);

  /* ------------------------------ 여행 일정 로딩 ------------------------------ */
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [serverPlans, setServerPlans] = useState<ServerTravelPlanDto[]>([]);

  const isPlan = (x: any): x is ServerTravelPlanDto =>
    x && typeof x === 'object' &&
    typeof x.slug === 'string' &&
    typeof x.startDate === 'string' &&
    typeof x.endDate === 'string';

  function normalizePlans(data: any): ServerTravelPlanDto[] {
    if (Array.isArray(data)) return data as ServerTravelPlanDto[];
    if (isPlan(data)) return [data];
    if (data && isPlan(data.travelPlan)) return [data.travelPlan];
    if (data && Array.isArray(data.travelPlans)) return data.travelPlans as ServerTravelPlanDto[];
    if (data && Array.isArray(data.content)) return data.content as ServerTravelPlanDto[];
    return [];
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setPlanLoading(true);
        setPlanError(null);

        const res = await api.get<any>('/profile/travel-plans');
        if (!mounted) return;

        const list = normalizePlans(res.data);
        setServerPlans(list);
      } catch (e: any) {
        if (!mounted) return;
        console.error('여행 일정 조회 실패:', e);
        setPlanError(e?.message ?? '여행 일정을 불러오지 못했어요.');
        setServerPlans([]);
      } finally {
        if (mounted) setPlanLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const viewPlans: TravelPlanData[] = useMemo(() => {
    return (Array.isArray(serverPlans) ? serverPlans : []).map((p) => ({
      id: p.id,
      title: p.title,
      destination: p.slug,
      dDay: calcDDay(p.startDate),
      startDate: p.startDate,
      endDate: p.endDate,
      lastModified: p.createdAt,
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=240&h=240&fit=crop",
      tags: [],
    }));
  }, [serverPlans]);

  /* ------------------------------ ✅ 내 피드 목록 (서버) ------------------------------ */
  const [feeds, setFeeds] = useState<FeedResponse[] | null>(null);
  const [feedLoading, setFeedLoading] = useState<boolean>(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setFeedLoading(true);
        setFeedError(null);
        const res = await api.get<FeedResponse[]>('/members/feed');
        if (!mounted) return;
        setFeeds(Array.isArray(res.data) ? res.data : []);
      } catch {
        setFeedError('내 피드를 불러오지 못했어요.');
        setFeeds([]);
      } finally {
        if (mounted) setFeedLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const reviewCards: TravelReviewData[] = useMemo(() => {
    if (!feeds) return [];
    return [...feeds].sort((a, b) => {
      // 최신 생성일 우선
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    }).map<TravelReviewData>((f) => {
      const tags = collectTopPlaceTitles(f.days);
      const cover = findFirstPlaceImage(f.days) ||
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop';
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
  }, [feeds]);

  const handleReviewClick = (review: TravelReviewData) => {
    // 상세 페이지로 이동
    navigate(`/feed/${review.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader activeMenu={activeMenu} onMenuClick={handleTopMenuClick} />
      
      <div className="flex max-w-7xl mx-auto">
        {/* ✅ 서버에서 받은 name 전달 */}
        <MyPageSideBar
          activeMenu={activeMenu}
          onMenuClick={handleSidebarMenuClick}
          displayName={displayName}
        />

        <main className="flex-1 p-6">
          {/* ------------------------------ 케미 섹션 ------------------------------ */}
          <section className="mb-8">
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

              {/* 내 케미 카드 */}
              <div className="flex items-center mb-12">
                <div className="w-48 h-48 border-2 border-gray-300 rounded-3xl flex flex-col items-center justify-center mr-8 bg-gray-50 overflow-hidden">
                  {chemiLoading ? (
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse" />
                  ) : meChemi?.image ? (
                    <img
                      src={meChemi.image}
                      alt={meChemi.name}
                      className="w-24 h-24 mb-4 rounded-2xl object-contain"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  ) : (
                    <div className="text-6xl mb-4">🍗</div>
                  )}
                  <div className="text-sm text-gray-600 mb-1">
                    {chemiLoading ? '불러오는 중...' : (meChemi?.name || '—')}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold mb-4">
                    {chemiLoading ? '케미를 불러오는 중...' : `나는 ${meChemi?.name ?? '—'}`}
                  </h3>
                  <p className="text-xl text-gray-700">
                    {chemiLoading ? '잠시만 기다려 주세요.' : (meChemi?.description ?? '설명이 없습니다.')}
                  </p>
                </div>
              </div>

              {/* 잘 어울리는 케미 */}
              <h3 className="text-xl font-semibold mb-6">잘 어울리는 케미</h3>
              {chemiLoading ? (
                <div className="flex gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="w-32 h-40 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : chemiError ? (
                <div className="text-red-500">{chemiError}</div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-4 min-w-max">
                    {similarChemis.map((c) => (
                      <ChemiCard key={c.name} title={c.name} image={c.image} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---------------------------- 여행 일정 섹션 ---------------------------- */}
          <section className="mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-8">여행 일정</h2>

              {planLoading && (
                <div className="space-y-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              )}

              {!planLoading && planError && (
                <div className="text-center text-red-500 py-8">{planError}</div>
              )}

              {!planLoading && !planError && (
                <>
                  <div className="space-y-16">
                    {Array.isArray(serverPlans) && serverPlans.length > 0 ? (
                      viewPlans.map((plan) => (
                        <TravelPlanItem
                          key={plan.id}
                          plan={plan}
                          onClick={(p) => {
                            console.log(`${p.destination} 클릭됨`);
                            // navigate(`/travel-plans/${p.destination}`);
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        저장된 여행 일정이 없어요.
                      </div>
                    )}
                  </div>

                  <div className="text-center mt-6">
                    <button
                      className="text-gray-600 text-lg flex items-center mx-auto hover:text-gray-800 transition-colors font-medium"
                      onClick={() => navigate('/mypage/itinerary')}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      전체 일정 보기
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ------------------------------- 리뷰 섹션 ------------------------------ */}
          <section>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold">리뷰</h2>
              </div>
              <div className="p-6">
                {feedLoading && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-60 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                )}

                {!feedLoading && feedError && (
                  <div className="text-center text-red-500 py-6">{feedError}</div>
                )}

                {!feedLoading && !feedError && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                      <div className="text-center py-4">
                        <button
                          className="text-blue-500 text-sm flex items-center mx-auto hover:text-blue-600 transition-colors"
                          onClick={() => navigate('/mypage/feed')}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          전체 리뷰 보기
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default MyPageMain;
