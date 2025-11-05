// src/travel_plan/travel_plan_check.tsx
import React, { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { SingleTimelineItem } from './components/TimelineIcon';
import Settlement from './components/Settlement';
import TravelPlanSavedModal from './components/travelPlanSavedModal';
import FullCheckColumnLayout from './components/FullCheckColumnLayout';
import type { MapMarker, MapPolyline, LatLng } from './components/mapTypes';

/** axios */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/** 타입 */
type Mode = 'create' | 'edit';

interface Place {
  content_id: string;
  placeType: 'A01' | 'A02' | 'A03' | 'B01';
  title: string;
  image: string;
  sequence: number;
  longitude: number;
  latitude: number;
  start_time: string;
  end_time: string;
}
interface Accommodation {
  content_id: string;
  placeType: 'B01';
  title: string;
  image: string;
  sequence: number;
  longitude: number;
  latitude: number;
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
interface RouteDetail {
  sequence: number;
  origin: string;
  destination: string;
  duration: number;
}
interface RouteInfo {
  route_type: string | null;
  daily_route: Record<string, RouteDetail[]>;
}
interface TravelData {
  slug: string;
  start_date: string;
  end_date: string;
  days: DaySchedule[];
  routes: RouteInfo[];
}

/** 유틸 */
const formatDuration = (seconds: number): string => `${Math.round(seconds / 60)}분`;
const getQuery = (search: string) => new URLSearchParams(search);
const withParam = (path: string, key: string, value: string) => {
  const url = new URL(window.location.origin + path);
  url.searchParams.set(key, value);
  return url.pathname + url.search;
};

const TravelPlanCheck: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { travelPlanId } = useParams<{ travelPlanId?: string }>();
  const { token } = useParams<{ token?: string }>();

  const mode: Mode = travelPlanId ? 'edit' : 'create';

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isAuthForSettlement, setIsAuthForSettlement] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const autoSaveRequested = getQuery(location.search).get('autoSave') === '1';

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let data: TravelData;

        if (token) {
          const res = await api.get(`/travel-plans/${token}`, { withCredentials: true });
          data = res.data as TravelData;
        } else if (travelPlanId) {
          const res = await api.get(`/travel-plans/${travelPlanId}/me`);
          data = res.data as TravelData;
        } else {
          const uuid = Cookies.get('travelPlanUUID');
          if (!uuid) throw new Error('MISSING_UUID');
          const tempRes = await api.get(`/draft-plans/${uuid}`);
          data = tempRes.data as TravelData;
        }

        setTravelData(data);
      } catch (e: any) {
        console.error('[TravelPlanCheck] load fail', e);
        if (e?.message === 'MISSING_UUID') navigate('/', { replace: true });
        else alert('여행 데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, travelPlanId, navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.get('/auth/me', { withCredentials: true });
        if (mounted) setIsAuthForSettlement(true);
      } catch {
        if (mounted) setIsAuthForSettlement(false);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 자동 저장 (드래프트만)
  useEffect(() => {
    (async () => {
      if (!authChecked) return;
      if (!isAuthForSettlement) return;
      if (!autoSaveRequested) return;
      if (!travelData) return;
      if (token || travelPlanId) return;

      try {
        const uuid = Cookies.get('travelPlanUUID');
        if (!uuid) return;

        const res = await api.post(`/draft-plans/${uuid}`);
        if (res.status === 200) {
          Cookies.remove('travelPlanUUID');
          setShowSavedModal(true);
          const cleaned = withParam(location.pathname + location.search, 'autoSave', '0');
          navigate(cleaned, { replace: true });
        }
      } catch (err) {
        console.error('[autoSave] 실패', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, isAuthForSettlement, autoSaveRequested, travelData]);

  const idToCoord = useMemo(() => {
    if (!travelData) return {} as Record<string, { lat: number; lng: number; title?: string }>;
    const map: Record<string, { lat: number; lng: number; title?: string }> = {};
    travelData.days.forEach((d) => {
      d.places.forEach((p) => {
        map[p.content_id] = { lat: p.latitude, lng: p.longitude, title: p.title };
      });
      if (d.accommodation) {
        map[d.accommodation.content_id] = {
          lat: d.accommodation.latitude,
          lng: d.accommodation.longitude,
          title: d.accommodation.title,
        };
      }
    });
    return map;
  }, [travelData]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!travelData) return [];
    const markers: MapMarker[] = [];

    const dayFilter = (date: string, dayIndex: number) => {
      if (selectedDay === 'all') return true;
      return selectedDay === dayIndex + 1;
    };

    let runningOrder = 1;
    travelData.days.forEach((day, dayIdx) => {
      if (!dayFilter(day.date, dayIdx)) return;

      day.places.forEach((p, idx) => {
        if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return;
        markers.push({
          id: `place-${day.date}-${p.content_id}`,
          position: { lat: p.latitude, lng: p.longitude },
          title: p.title,
          category: p.placeType,
          order: selectedDay === 'all' ? runningOrder++ : idx + 1,
          infoHtml: `<div>${p.start_time} ~ ${p.end_time}</div>`,
        });
      });

      if (day.accommodation) {
        const a = day.accommodation;
        if (typeof a.latitude === 'number' && typeof a.longitude === 'number') {
          markers.push({
            id: `acc-${day.date}-${a.content_id}`,
            position: { lat: a.latitude, lng: a.longitude },
            title: a.title,
            category: 'B01',
            infoHtml: `<div>${a.start_time} ~ ${a.end_time} • 숙소</div>`,
          });
        }
      }
    });

    return markers;
  }, [travelData, selectedDay]);

  const polylines: MapPolyline[] = useMemo(() => {
    if (!travelData) return [];
    const lines: MapPolyline[] = [];

    const dayFilter = (date: string, dayIndex: number) => {
      if (selectedDay === 'all') return true;
      return selectedDay === dayIndex + 1;
    };

    travelData.routes.forEach((routeInfo) => {
      Object.entries(routeInfo.daily_route || {}).forEach(([date, arr]) => {
        const dayIndex = travelData.days.findIndex((d) => d.date === date);
        if (dayIndex === -1 || !dayFilter(date, dayIndex)) return;

        arr.forEach((rd) => {
          const o = idToCoord[rd.origin];
          const d = idToCoord[rd.destination];
          if (!o || !d) return;
          lines.push({
            id: `route-${date}-${rd.sequence}`,
            path: [
              { lat: o.lat, lng: o.lng },
              { lat: d.lat, lng: d.lng },
            ],
            options: { strokeColor: '#7c3aed' },
          });
        });
      });
    });

    return lines;
  }, [travelData, idToCoord, selectedDay]);

  const mapCenter: LatLng = useMemo(
    () =>
      mapMarkers[0]?.position ??
      (travelData?.days?.[0]?.places?.[0]
        ? {
            lat: travelData.days[0].places[0].latitude,
            lng: travelData.days[0].places[0].longitude,
          }
        : { lat: 36.5, lng: 127.9 }),
    [mapMarkers, travelData]
  );

  const schedules =
    travelData?.days.map((day, idx) => {
      const routes = travelData.routes.find((r) => r.daily_route[day.date])?.daily_route[day.date] ?? [];
      const items = [
        ...day.places.map((p) => {
          const r = routes.find((rt) => rt.origin === p.content_id);
          return {
            id: p.content_id,
            title: p.title,
            image: p.image,
            time: `${p.start_time}~${p.end_time}`,
            placeType: p.placeType,
            duration: r ? formatDuration(r.duration) : undefined,
          };
        }),
        ...(day.accommodation
          ? [
              {
                id: day.accommodation.content_id,
                title: day.accommodation.title,
                image: day.accommodation.image,
                time: `${day.accommodation.start_time}~${day.accommodation.end_time}`,
                placeType: day.accommodation.placeType,
              },
            ]
          : []),
      ];
      return { day: idx + 1, date: day.date, places: items };
    }) ?? [];

  const filteredSchedules = selectedDay === 'all' ? schedules : schedules.filter((s) => s.day === selectedDay);

  const getPlaceTypeInfo = (placeType: string) => {
    switch (placeType) {
      case 'A01':
        return { color: 'bg-blue-500', textColor: 'text-blue-500', label: '명소' };
      case 'A02':
        return { color: 'bg-red-500', textColor: 'text-red-500', label: '음식점' };
      case 'A03':
        return { color: 'bg-emerald-500', textColor: 'text-emerald-500', label: '카페' };
      case 'B01':
        return { color: 'bg-gray-500', textColor: 'text-gray-500', label: '숙소' };
      default:
        return { color: 'bg-gray-400', textColor: 'text-gray-400', label: '기타' };
    }
  };

  const redirectToLoginWith = (extraParam?: Record<string, string>) => {
    const cur = new URL(window.location.href);
    if (extraParam) {
      Object.entries(extraParam).forEach(([k, v]) => cur.searchParams.set(k, v));
    }
    const redirect = encodeURIComponent(cur.pathname + cur.search);
    navigate(`/login?redirect=${redirect}`);
  };

  /** ✅ AI편집: 누구나 사용 가능 */
  const handleOpenAiEdit = () => {
    if (token) {
      navigate(`/ai-edit?mode=share&token=${encodeURIComponent(token)}${travelPlanId ? `&travelPlanId=${encodeURIComponent(travelPlanId)}` : ''}`);
      return;
    }
    if (travelPlanId) {
      navigate(`/ai-edit?mode=member&id=${encodeURIComponent(travelPlanId)}&travelPlanId=${encodeURIComponent(travelPlanId)}`);
      return;
    }
    const uuid = Cookies.get('travelPlanUUID');
    if (!uuid) {
      alert('임시 일정 정보(UUID)를 찾을 수 없습니다.');
      return;
    }
    navigate(`/ai-edit?mode=draft&uuid=${encodeURIComponent(uuid)}${travelPlanId ? `&travelPlanId=${encodeURIComponent(travelPlanId)}` : ''}`);
  };

  /** ✅ 편집 버튼: edit 화면으로 travelPlanId 함께 전달 */
  const handleOpenEdit = () => {
    const state: Record<string, string> = {};
    if (travelPlanId) state.travelPlanId = travelPlanId; // ← 여기!
    navigate('/edit-travel-plan', { state });
  };

  /** 저장 */
  const handleSave = async () => {
    if (!isAuthForSettlement) {
      redirectToLoginWith({ autoSave: '1' });
      return;
    }

    try {
      if (token) {
        alert('공유 일정은 저장할 수 없습니다. 정산 기능만 가능합니다.');
        return;
      }

      if (travelPlanId) {
        try {
          await api.patch(`/travel-plans/${travelPlanId}`, travelData ?? {});
        } catch (e) {
          console.warn('[save] PATCH 실패(무시하고 모달 표시)', e);
        }
        setShowSavedModal(true);
        return;
      }

      const uuid = Cookies.get('travelPlanUUID');
      if (!uuid) {
        alert('임시 여행 일정 정보(UUID)가 없습니다.');
        return;
      }
      const res = await api.post(`/draft-plans/${uuid}`);
      if (res.status === 200) {
        Cookies.remove('travelPlanUUID');
        setShowSavedModal(true);
      } else {
        alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('[save] 실패', err);
      alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  /** 사이드바 상단 버튼 */
  const sidebarContent = (
    <>
      <button
        onClick={() => setSelectedDay('all')}
        className={`w-12 h-8 rounded flex items-center justify-center text-sm font-semibold transition-colors ${
          selectedDay === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        전체
      </button>
      {Array.from({ length: schedules.length }, (_, i) => {
        const day = i + 1;
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
    </>
  );

  /** 🔧 사이드바 하단 버튼 (편집 토글/적용/취소 제거) */
  const sidebarButtons = (
    <div className="flex flex-col gap-2 mt-3">
      <button
        onClick={handleOpenAiEdit}
        className="py-2 px-4 rounded-md text-base bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap inline-flex items-center justify-center"
        title="AI가 일정을 분석하고 자동으로 제안/수정합니다."
      >
        AI편집
      </button>

      {/* 👉 편집: travelPlanId를 state로 전달 */}
      <button
        onClick={handleOpenEdit}
        className="py-2 px-4 rounded-md text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
      >
        편집
      </button>

      <button
        onClick={handleSave}
        className="py-2 px-4 rounded-md text-base bg-red-500 text-white hover:bg-red-600"
      >
        저장
      </button>
    </div>
  );

  /** 메인 콘텐츠 */
  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">{travelData?.slug ?? '여행'}</h1>
          </div>
        </div>
        {travelData && (
          <p className="text-sm text-gray-500">
            {travelData.start_date} ~ {travelData.end_date}
          </p>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        <div className="flex gap-12 transition-all duration-300 min-w-max">
          {filteredSchedules.map((schedule, dayIndex) => (
            <div key={dayIndex} className="flex-shrink-0 w-80 transition-all duration-300">
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
                          duration={(place as any).duration}
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
                              src={(place as any).image || undefined}
                              alt={place.title}
                              className="w-16 h-12 object-cover rounded ml-3 flex-shrink-0"
                            />
                          </div>
                        </div>
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

  const settlementContent = authChecked ? (
    <div className="h-full pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">정산하기</h2>
        {isAuthForSettlement && (
          <button
            onClick={() => window.dispatchEvent(new Event('wego:open-settlement-sheet'))}
            className="px-3 py-1 text-sm bg-violet-100 text-violet-700 rounded-md hover:bg-violet-200"
          >
            정산 내역 입력
          </button>
        )}
      </div>

      <Settlement
        isAuthenticated={isAuthForSettlement}
        onRequireLogin={() => {
          const redirect = encodeURIComponent(location.pathname + location.search);
          navigate(`/login?redirect=${redirect}`);
        }}
      />
    </div>
  ) : (
    <div className="h-full flex items-center justify-center text-gray-400">확인 중...</div>
  );

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

  const mapZoom = selectedDay === 'all' ? 7 : 11;

  return (
    <>
      <FullCheckColumnLayout
        sidebarContent={sidebarContent}
        sidebarButtons={sidebarButtons}
        settlementContent={settlementContent}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        mapMarkers={mapMarkers}
        polylines={polylines}
        selectedMarkerId={selectedMarkerId}
        onMarkerClick={(id) => setSelectedMarkerId(id)}
        centerMarker={true}
      >
        {mainContent}
      </FullCheckColumnLayout>

      <TravelPlanSavedModal
        show={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onConfirm={() => {
          setShowSavedModal(false);
          if (!token) navigate('/mypage');
        }}
      />
    </>
  );
};

export default TravelPlanCheck;
