// src/pages/TravelPlanCheck.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { SingleTimelineItem } from './components/TimelineIcon';
import TravelPlanSavedModal from './components/travelPlanSavedModal';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

/* ===========================================================
 * axios 인스턴스 (쿠키 자동 포함)
 * =========================================================== */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/* ===========================================================
 * 공통 에러 로거
 * =========================================================== */
const logAxiosError = (err: unknown, label: string) => {
  if (axios.isAxiosError(err)) {
    console.error(`[${label}] status=`, err.response?.status, 'data=', err.response?.data);
  } else {
    console.error(`[${label}]`, err);
  }
};

/* ===========================================================
 * 레이아웃
 * - 저장/편집 버튼을 외부 상태로 제어할 수 있도록 canSave/isEditing 추가
 * =========================================================== */
interface FullCheckColumnLayoutProps {
  children: React.ReactNode;
  settlementContent?: React.ReactNode;
  mapContent?: React.ReactNode;
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
  editDisabled?: boolean; // 생성 모드에서는 편집 버튼 비활성화
}

const FullCheckColumnLayout: React.FC<FullCheckColumnLayoutProps> = ({
  children,
  settlementContent,
  mapContent,
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
  const [isSettlementPanelOpen, setIsSettlementPanelOpen] = useState(true);

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
              canSave
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-red-100 text-red-300 cursor-not-allowed'
            }`}
            onClick={onSave}
          >
            저장
          </button>
        </div>
      </aside>

      {/* 가운데 본문 */}
      <div
        className={`${
          isMainPanelOpen ? 'w-[65%]' : 'w-[35%]'
        } transition-all duration-300 p-4 h-full flex flex-col relative`}
      >
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
        <div className={`${isSettlementPanelOpen ? 'h-1/2' : 'flex-1'} bg-gray-200 p-4 transition-all duration-300`}>
          <div className="h-full bg-white rounded shadow-sm">
            {mapContent || (
              <div className="h-full flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium mb-2">지도 영역</h3>
                <p className="text-gray-600">지도 API 연동 예정</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${isSettlementPanelOpen ? 'h-1/2' : 'h-8'} bg-white border-t transition-all duration-300 relative flex-shrink-0`}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <button
              onClick={() => setIsSettlementPanelOpen(!isSettlementPanelOpen)}
              className="bg-white border border-gray-300 w-20 h-6 flex items-center justify-center shadow-lg hover:bg-gray-50 rounded-lg"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                <path
                  d={isSettlementPanelOpen ? 'M6 9L12 15L18 9' : 'M18 15L12 9L6 15'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {isSettlementPanelOpen && (
            <div className="p-4 h-full pt-8 overflow-auto">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">정산하기</h2>
              </div>
              <div className="h-full">{settlementContent || <div className="text-gray-500 text-center py-8">정산 내역이 없습니다.</div>}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===========================================================
 * 타입 정의
 * =========================================================== */
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
  duration: number; // 초 단위
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

/* ===========================================================
 * 유틸
 * =========================================================== */
const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  return `${minutes}분`;
};

/* ===========================================================
 * 메인 컴포넌트
 * =========================================================== */
type Mode = 'create' | 'edit';

const TravelPlanCheck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { travelPlanId } = useParams<{ travelPlanId?: string }>();

  // URL 파라미터가 있으면 수정 모드, 없으면 생성 모드
  const mode: Mode = travelPlanId ? 'edit' : 'create';

  const [activeStep, setActiveStep] = useState(3);
  const [isMainPanelOpen, setIsMainPanelOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [loading, setLoading] = useState(true);

  // 수정/저장 제어 (수정 모드: 처음 저장 비활성)
  const [isEditing, setIsEditing] = useState(mode === 'create'); // 생성 모드면 true로 시작
  const [isDirty, setIsDirty] = useState(mode === 'create');     // 생성 모드면 true로 시작

  // 저장 성공 모달
  const [showSavedModal, setShowSavedModal] = useState(false);

  // 데모용 정산 리스트
  const [selectedPlaces] = useState([
    { id: 's1', name: '산둘레숲길', category: '명소', image: '/api/placeholder/60/60', placeType: 'A01' as const },
    { id: 's2', name: '홍두깨가게', category: '음식점', image: '/api/placeholder/60/60', placeType: 'A02' as const },
    { id: 's3', name: '치료제과점마을', category: '카페', image: '/api/placeholder/60/60', placeType: 'A03' as const },
  ]);

  /* -------------------------------------------
   * 데이터 로드
   *  - edit  : GET /travel_plan/member/schedule/{travelPlanId}
   *  - create: GET /travel_plan/temp/schedule/{uuid}
   * ------------------------------------------ */
  const fetchTravelData = useCallback(async (): Promise<TravelData> => {
    if (mode === 'edit') {
      if (!travelPlanId) throw new Error('MISSING_PLAN_ID');
      try {
        const res = await api.get(`/travel_plan/member/schedule/${travelPlanId}`);
        return res.data as TravelData;
      } catch (err) {
        logAxiosError(err, 'GET /travel_plan/member/schedule/{planId} FAIL');
        throw err;
      }
    }

    // create 모드
    const uuid = Cookies.get('travelPlanUUID');
    if (!uuid) {
      console.error('[fetchTravelData] travelPlanUUID 쿠키가 없습니다.');
      throw new Error('MISSING_UUID');
    }
    try {
      const tempRes = await api.get(`/travel_plan/temp/schedule/${uuid}`);
      return tempRes.data as TravelData;
    } catch (err) {
      logAxiosError(err, 'GET /travel_plan/temp/schedule/{uuid} FAIL');
      throw err;
    }
  }, [mode, travelPlanId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchTravelData();
        setTravelData(data);
      } catch (e: any) {
        if (e?.message === 'MISSING_UUID') {
          // 생성 플로우인데 임시 UUID가 없으면 홈으로
          navigate('/', { replace: true });
        } else {
          alert('여행 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchTravelData, navigate]);

  /* 편집 토글 (수정 모드에서만 의미 있음) */
  const handleEdit = () => {
    if (mode === 'edit') {
      setIsEditing((v) => !v);
      if (!isEditing) setIsDirty(false); // 편집 시작 시 변경 없음으로 초기화
    }
  };

  /* 변경 발생 표시(예: 어떤 입력 변경 핸들러에서 호출) */
  const markDirty = () => {
    if (!isEditing) return;
    setIsDirty(true);
  };

  /* -------------------------------------------
   * 저장
   *  - create: POST /travel_plan/schedule/{uuid}
   *  - edit  : PUT  /travel_plan/schedule/{travelPlanId} (body: travelData)
   * ------------------------------------------ */
  const handleSave = async () => {
    if (!travelData) return;

    // 로그인 확인
    try {
      await api.get('/auth/me');
    } catch (err) {
      logAxiosError(err, 'auth/me FAIL → redirect to login');
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`);
      return;
    }

    try {
      if (mode === 'create') {
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
        if (!travelPlanId) return;
        const res = await api.put(`/travel_plan/schedule/${travelPlanId}`, travelData);
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

  /* 저장 버튼 활성화 조건 */
  const canSave = mode === 'create' ? true : (isEditing && isDirty);
  const editDisabled = mode === 'create'; // 생성 모드에서는 '편집' 비활성

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
      {/* 헤더 */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">LOGO</h1>
            {/* 목적지 표시는 샘플 */}
            <span className="text-lg text-gray-500">제주</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {travelData.start_date} ~ {travelData.end_date}
        </p>
      </div>

      {/* 타임라인 */}
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
                      {/* 아이콘/선 */}
                      <div className="flex-shrink-0">
                        <SingleTimelineItem
                          index={placeIndex}
                          color={info.color}
                          isFirst={isFirst}
                          isLast={isLast}
                          duration={place.duration}
                        />
                      </div>

                      {/* 카드 */}
                      <div className="ml-4 flex-1" style={{ marginTop: isFirst ? '0px' : '178px' }}>
                        <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-3 w-full max-w-xs">
                          {place.time && <p className="text-sm text-gray-500 mb-3">{place.time}</p>}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm">{place.title}</h3>
                              <span className={`text-xs ${info.textColor}`}>{info.label}</span>
                            </div>
                            <img src={place.image} alt={place.title} className="w-16 h-12 object-cover rounded ml-3 flex-shrink-0" />
                          </div>
                        </div>
                        {/* 예시: 이 카드에서 뭔가 수정하면 markDirty() 호출 */}
                        {/* {isEditing && <button onClick={markDirty}>이 카드 수정됨 표시</button>} */}
                      </div>
                    </div>
                  );
                })}
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

  const settlementContent = (
    <div className="h-full">
      <div className="mb-4 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-semibold text-purple-800 mb-2">정산하기</h3>
        <p className="text-sm text-purple-600 mb-3">이번여행에서 1명당 1,000,000원을 쓸 예정이에요!</p>
        <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }} />
        </div>
        <p className="text-xs text-purple-600">1,000,000원</p>
        <button className="w-full bg-purple-600 text-white rounded-lg py-2 mt-3 text-sm">정산하기</button>
      </div>

      <div>
        <h3 className="font-semibold mb-4">사용 내역</h3>
        {selectedPlaces.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded" />
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {p.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{i === 0 ? '107,460원' : i === 1 ? '24,500원' : '148,000원'}</p>
              <p className="text-xs text-gray-500">{i === 0 ? '1인' : i === 1 ? '4인 기준' : '숙박비'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <FullCheckColumnLayout
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        mapContent={mapContent}
        settlementContent={settlementContent}
        isMainPanelOpen={isMainPanelOpen}
        setIsMainPanelOpen={setIsMainPanelOpen}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        totalDays={schedules.length}
        onEdit={handleEdit}
        onSave={handleSave}
        isEditing={isEditing}
        canSave={canSave}
        editDisabled={editDisabled}
        onNext={() => setActiveStep(activeStep + 1)}
      >
        {mainContent}
      </FullCheckColumnLayout>

      {/* 저장 성공 모달 */}
      <TravelPlanSavedModal
        show={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onConfirm={() => {
          setShowSavedModal(false);
          if (mode === 'create') {
            navigate('/mypage');
          } else {
            // 수정 모드에선 현재 페이지 유지 or 마이페이지로 이동 등 정책에 맞게
            // navigate('/mypage');
          }
        }}
      />
    </>
  );
};

export default TravelPlanCheck;
