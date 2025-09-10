import React, { useState, useEffect, useCallback } from 'react';
import { SingleTimelineItem } from './components/TimelineIcon';
import TravelPlanSavedModal from './components/travelPlanSavedModal';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Settlement from './components/Settlement';

/* axios */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/* 에러 로거 */
const logAxiosError = (err: unknown, label: string) => {
  if (axios.isAxiosError(err)) {
    console.error(`[${label}] status=`, err.response?.status, 'data=', err.response?.data);
  } else {
    console.error(`[${label}]`, err);
  }
};

/* 레이아웃 (이 파일 안에서 정의하는 버전) */
interface FullCheckColumnLayoutProps {
  children: React.ReactNode;
  settlementContent?: React.ReactNode;
  mapContent?: React.ReactNode;
  settlementHeaderRight?: React.ReactNode; // ✅ 오른쪽 버튼
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
  isMainPanelOpen: boolean;
  setIsMainPanelOpen: (open: boolean) => void;
  selectedDay: number | 'all';
  setSelectedDay: (day: number | 'all') => void;
  totalDays: number;
  onEdit?: () => void;
  onSave?: () => void;
  isEditing?: boolean;
  canSave?: boolean;
  editDisabled?: boolean;
}
const FullCheckColumnLayout: React.FC<FullCheckColumnLayoutProps> = ({
  children,
  settlementContent,
  mapContent,
  settlementHeaderRight,
  isMainPanelOpen,
  setIsMainPanelOpen,
  selectedDay,
  setSelectedDay,
  totalDays,
  onEdit,
  onSave,
  isEditing = false,
  canSave = false,
  editDisabled = false,
}) => {
  return (
    <div className="flex h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            <button
              onClick={() => setSelectedDay('all')}
              className={`w-12 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                selectedDay === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              전체
            </button>

            {Array.from({ length: totalDays }, (_, index) => {
              const day = index + 1;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-12 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
                    selectedDay === day ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {day}일차
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3">
          <button
            disabled={editDisabled}
            className={`py-2 px-4 rounded-md text-base transition-colors ${
              editDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isEditing
                ? 'bg-gray-800 text-white hover:bg-black'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            onClick={onEdit}
          >
            {isEditing ? '편집 종료' : '편집'}
          </button>
          <button
            disabled={!canSave}
            className={`py-2 px-4 rounded-md text-base transition-colors ${
              canSave ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-100 text-red-300 cursor-not-allowed'
            }`}
            onClick={onSave}
          >
            저장
          </button>
        </div>
      </aside>

      {/* 가운데 본문 */}
      <div className={`${isMainPanelOpen ? 'w-[65%]' : 'w-[35%]'} transition-all duration-300 p-4 h-full flex flex-col relative`}>
        <button
          onClick={() => setIsMainPanelOpen(!isMainPanelOpen)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 bg-white border border-gray-300 w-6 h-20 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg z-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path
              d={isMainPanelOpen ? 'M15 18L9 12L15 6' : 'M9 18L15 12L9 6'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`div::-webkit-scrollbar{display:none}`}</style>
          <div className="min-w-max h-full">{children}</div>
        </div>
      </div>

      {/* 오른쪽: 지도/정산 */}
      <div className={`${isMainPanelOpen ? 'flex-1' : 'w-[65%]'} transition-all duration-300 relative flex flex-col`}>
        <div className="h-1/2 bg-gray-200 p-4 transition-all duration-300">
          <div className="h-full bg-white rounded shadow-sm">
            {mapContent || (
              <div className="h-full flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-2">지도 영역</h3>
                <p className="text-gray-600">지도 API 연동 예정</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-1/2 bg-white border-t transition-all duration-300 relative flex-shrink-0">
          <div className="p-4 h-full pt-8 overflow-auto">
            {/* ✅ ‘정산하기’ 타이틀은 여기에서만 렌더 */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">정산하기</h2>
              {settlementHeaderRight}
            </div>

            <div className="h-full">
              {settlementContent || <div className="text-gray-500 text-center py-8">정산 내역이 없습니다.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 타입들 */
interface Place {
  content_id: string;
  place_type: string;
  title: string;
  image: string;
  sequence: number;
  start_time: string;
  end_time: string;
}
interface Accommodation {
  content_id: string;
  place_type: string;
  title: string;
  image: string;
  sequence: number;
  start_time: string;
  end_time: string;
}
interface DaySchedule {
  date: string;
  start_time: string;
  end_time: string;
  places: Place[];
  accommodation: Accommodation | null;
}
interface Route {
  sequence: number;
  origin: string;
  destination: string;
  taxiFare?: number;
  distance?: number;
  duration: number;
}
interface DayRoute {
  [date: string]: Route[];
}
interface RouteData {
  route_type: string;
  daily_route: DayRoute;
}
interface TravelData {
  start_date: string;
  end_date: string;
  days: DaySchedule[];
  routes: RouteData[];
}

/* 유틸 */
const formatDuration = (seconds: number): string => `${Math.round(seconds / 60)}분`;

/* 메인 */
type Mode = 'create' | 'edit';

const TravelPlanCheck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { travelPlanId } = useParams<{ travelPlanId?: string }>();
  const { token } = useParams<{ token?: string }>();

  const mode: Mode = travelPlanId ? 'edit' : 'create';

  const [activeStep, setActiveStep] = useState(3);
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [loading, setLoading] = useState(true);

  const [sharePlanId, setSharePlanId] = useState<string | null>(null);
  const shareMode = !!token || !!sharePlanId;

  const [isEditing, setIsEditing] = useState(mode === 'create');
  const [isDirty, setIsDirty] = useState(mode === 'create');
  const [showSavedModal, setShowSavedModal] = useState(false);

  // 정산 접근 권한
  const [isAuthForSettlement, setIsAuthForSettlement] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const redirectToLogin = () => {
    const redirect = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${redirect}`);
  };

  /* 공유 토큰 진입 */
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/travel_plan/share/${token}`, { withCredentials: true });
        const body: any = res.data;
        setTravelData(body as TravelData);

        const pid = body?.travel_plan_id ?? body?.travelPlanId ?? body?.planId ?? body?.id ?? null;
        if (pid) setSharePlanId(String(pid));
        else console.warn('[share] planId not found in TravelPlanResponse.');

        setIsEditing(false);
        setIsDirty(false);
      } catch (err) {
        logAxiosError(err, 'GET /travel_plan/share/{token} FAIL');
        alert('유효하지 않은 공유 링크거나 만료되었습니다.');
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  /* 기존 데이터 로드 */
  const fetchTravelData = useCallback(async (): Promise<TravelData> => {
    if (mode === 'edit') {
      if (!travelPlanId) throw new Error('MISSING_PLAN_ID');
      const res = await api.get(`/travel_plan/member/schedule/${travelPlanId}`);
      return res.data as TravelData;
    }

    const uuid = Cookies.get('travelPlanUUID');
    if (!uuid) {
      console.error('[fetchTravelData] travelPlanUUID 쿠키가 없습니다.');
      throw new Error('MISSING_UUID');
    }
    const tempRes = await api.get(`/travel_plan/temp/schedule/${uuid}`);
    return tempRes.data as TravelData;
  }, [mode, travelPlanId]);

  useEffect(() => {
    if (token) return;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchTravelData();
        setTravelData(data);
      } catch (e: any) {
        if (e?.message === 'MISSING_UUID') navigate('/', { replace: true });
        else alert('여행 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, fetchTravelData, navigate]);

  /* 정산 권한 확인 */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/auth/me', { withCredentials: true });
        console.log('auth/me status:', res.status);
        if (mounted) setIsAuthForSettlement(true);
      } catch (err: any) {
        console.log('auth/me status:', err?.response?.status);
        if (mounted) setIsAuthForSettlement(false);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* 편집/저장 */
  const handleEdit = () => {
    setIsEditing((v) => !v);
    if (!isEditing) setIsDirty(false);
  };
  const markDirty = () => {
    if (!isEditing) return;
    setIsDirty(true);
  };
  const handleSave = async () => {
    if (!travelData) return;

    if (!shareMode) {
      try {
        await api.get('/auth/me');
      } catch (err) {
        logAxiosError(err, 'auth/me FAIL → redirect to login');
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
        return;
      }
    }

    try {
      if (mode === 'create' && !shareMode) {
        const uuid = Cookies.get('travelPlanUUID');
        if (!uuid) {
          alert('임시 여행 일정 정보(UUID)가 없습니다.');
          return;
        }
        const res = await api.post(`/travel_plan/schedule/${uuid}`);
        if (res.status === 200) {
          Cookies.remove('travelPlanUUID');
          setShowSavedModal(true);
        } else {
          alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        const id = travelPlanId ?? sharePlanId;
        if (!id) {
          alert('저장 정보를 찾을 수 없습니다.(planId 누락)');
          return;
        }
        const res = await api.put(`/travel_plan/schedule/${id}`, travelData);
        if (res.status === 200) {
          setIsDirty(false);
          setIsEditing(false);
          setShowSavedModal(true);
        } else {
          alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    } catch (e) {
      logAxiosError(e, 'save FAIL');
      alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  /* 타입/색상 매핑 */
  const getPlaceTypeInfo = (placeType: string) => {
    switch (placeType) {
      case 'A01':
        return { color: 'bg-blue-500', textColor: 'text-blue-500', label: '명소' };
      case 'A02':
        return { color: 'bg-red-500', textColor: 'text-red-500', label: '음식점' };
      case 'A03':
        return { color: 'bg-red-500', textColor: 'text-red-500', label: '카페' };
      case 'B01':
        return { color: 'bg-gray-500', textColor: 'text-gray-500', label: '숙소' };
      default:
        return { color: 'bg-gray-400', textColor: 'text-gray-400', label: '기타' };
    }
  };

  const createTimelineItems = (dayData: DaySchedule, routes: Route[]) => {
    const items: Array<{
      id: string;
      title: string;
      image: string;
      time: string;
      placeType: 'A01' | 'A02' | 'A03' | 'B01';
      duration?: string;
    }> = [];

    dayData.places.forEach((p) => {
      const route = routes.find((r) => r.origin === p.content_id);
      items.push({
        id: p.content_id,
        title: p.title,
        image: p.image,
        time: `${p.start_time}~${p.end_time}`,
        placeType: p.place_type as 'A01' | 'A02' | 'A03' | 'B01',
        duration: route ? formatDuration(route.duration) : undefined,
      });
    });

    if (dayData.accommodation) {
      const a = dayData.accommodation;
      items.push({
        id: a.content_id,
        title: a.title,
        image: a.image,
        time: `${a.start_time}~${a.end_time}`,
        placeType: a.place_type as 'A01' | 'A02' | 'A03' | 'B01',
      });
    }
    return items;
  };

  const schedules =
    travelData?.days.map((day, idx) => {
      const dayRoutes = travelData.routes.find((r) => r.daily_route[day.date]);
      const routes = dayRoutes ? dayRoutes.daily_route[day.date] : [];
      return { day: idx + 1, date: day.date, places: createTimelineItems(day, routes) };
    }) ?? [];

  const filteredSchedules = selectedDay === 'all' ? schedules : schedules.filter((s) => s.day === selectedDay);

  const canSave = isEditing && (mode === 'create' ? true : isDirty);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">여행 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!travelData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">여행 데이터를 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">LOGO</h1>
            <span className="text-lg text-gray-500">제주</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {travelData.start_date} ~ {travelData.end_date}
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div className={`flex gap-12 transition-all duration-300 ${isMainPanelOpen ? 'min-w-max' : ''}`}>
          {filteredSchedules.map((schedule, dayIndex) => (
            <div
              key={dayIndex}
              className={`flex-shrink-0 ${isMainPanelOpen ? 'w-80' : dayIndex === 0 ? 'w-80' : 'w-0 overflow-hidden'} transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">{schedule.day}일차</h2>
                <p className="text-xs text-gray-400">{schedule.date}</p>
              </div>

              <div className="flex flex-col">
                {schedule.places.map((place, placeIndex) => {
                  const isFirst = placeIndex === 0;
                  const isLast = placeIndex === schedule.places.length - 1;
                  const info = getPlaceTypeInfo(place.placeType);

                return (
                    <div key={placeIndex} className="flex items-start mb-8">
                      <div className="flex-shrink-0">
                        <SingleTimelineItem
                          index={placeIndex}
                          color={info.color}
                          isFirst={isFirst}
                          isLast={isLast}
                          duration={place.duration}
                        />
                      </div>

                      <div className="ml-4 flex-1" style={{ marginTop: isFirst ? '0px' : '178px' }}>
                        <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-3 w-full max-w-xs">
                          {place.time && <p className="text-sm text-gray-500 mb-3">{place.time}</p>}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{place.title}</h3>
                              <span className={`text-xs ${info.textColor}`}>{info.label}</span>
                            </div>
                            <img
                              src={place.image || undefined}
                              alt={place.title}
                              className="w-16 h-12 object-cover rounded ml-3 flex-shrink-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );})}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const mapContent = (
    <div className="h-full flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-2">지도 영역</h3>
      <p className="text-gray-600">지도 API 연동 예정</p>
    </div>
  );

  const settlementContent = authChecked ? (
    <Settlement isAuthenticated={isAuthForSettlement} onRequireLogin={redirectToLogin} />
  ) : (
    <div className="h-full flex items-center justify-center text-gray-400">확인 중…</div>
  );

  /** ✅ 정산하기 타이틀 오른쪽 버튼 */
  const settlementHeaderRight = (
    <button
      onClick={() => window.dispatchEvent(new Event('wego:open-settlement-sheet'))}
      className="px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-md hover:bg-violet-200"
    >
      정산 내역 입력
    </button>
  );

  return (
    <>
      <FullCheckColumnLayout
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        mapContent={mapContent}
        settlementContent={settlementContent}
        settlementHeaderRight={settlementHeaderRight}
        isMainPanelOpen={isMainPanelOpen}
        setIsMainPanelOpen={setIsMainPanelOpen}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        totalDays={schedules.length}
        onEdit={handleEdit}
        onSave={handleSave}
        isEditing={isEditing}
        canSave={canSave}
        editDisabled={false}
        onNext={() => setActiveStep(activeStep + 1)}
      >
        {mainContent}
      </FullCheckColumnLayout>

      <TravelPlanSavedModal
        show={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onConfirm={() => {
          setShowSavedModal(false);
          if (mode === 'create' && !shareMode) navigate('/mypage');
        }}
      />
    </>
  );
};

export default TravelPlanCheck;
