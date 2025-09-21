// src/travel_plan/travel_plan_check.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

/** 타입 (Draft/회원/공유 공통 필드만 사용) */
type Mode = 'create' | 'edit';

interface Place {
  content_id: string;
  placeType: 'A01' | 'A02' | 'A03' | 'B01';
  title: string;
  image: string;
  sequence: number;
  longitude: number; // 서버 제공
  latitude: number;  // 서버 제공
  start_time: string; // "HH:mm" or "HH:mm:ss"
  end_time: string;   // "HH:mm" or "HH:mm:ss"
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
  date: string;       // "yyyy-MM-dd"
  start_time: string; // "HH:mm" or "HH:mm:ss"
  end_time: string;   // "HH:mm" or "HH:mm:ss"
  places: Place[];
  accommodation: Accommodation | null;
}
interface RouteDetail {
  sequence: number;
  origin: string;      // content_id
  destination: string; // content_id
  duration: number;    // seconds
}
interface RouteInfo {
  route_type: string | null;
  daily_route: Record<string, RouteDetail[]>; // key: "yyyy-MM-dd"
}
interface TravelData {
  // draft에는 slug가 있고, 회원/공유에는 createdAt이 있을 수 있지만
  // 화면에서는 start/end/days/routes만 사용하므로 공통만 둡니다.
  start_date: string;
  end_date: string;
  days: DaySchedule[];
  routes: RouteInfo[];
}

/** 유틸 */
const formatDuration = (seconds: number): string => `${Math.round(seconds / 60)}분`;

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

  /** 여행 데이터 로드(임시/Draft, 회원/공유) */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let data: TravelData;

        if (token) {
          // 공유 일정
          const res = await api.get(`/travel-plans/${token}`, { withCredentials: true });
          data = res.data as TravelData;
        } else if (travelPlanId) {
          // 회원 본인 일정
          const res = await api.get(`/travel-plans/${travelPlanId}/me`);
          data = res.data as TravelData;
        } else {
          // 임시(Draft) 일정
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

  /** 정산 권한 */
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

  /** content_id -> 좌표 lookup (서버에서 위경도 제공) */
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

  /** 지도용 마커 계산 */
  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!travelData) return [];
    const markers: MapMarker[] = [];

    const dayFilter = (date: string, dayIndex: number) => {
      if (selectedDay === 'all') return true;
      return selectedDay === dayIndex + 1;
    };

    travelData.days.forEach((day, dayIdx) => {
      if (!dayFilter(day.date, dayIdx)) return;

      // 장소
      day.places.forEach((p, idx) => {
        if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return;
        markers.push({
          id: `place-${day.date}-${p.content_id}`,
          position: { lat: p.latitude, lng: p.longitude },
          title: p.title,
          category: p.placeType,
          order: idx + 1,
          infoHtml: `<div>${p.start_time} ~ ${p.end_time}</div>`,
        });
      });

      // 숙소
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

  /** 지도용 경로(폴리라인) 계산 */
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

  /** 지도 중심: 첫 마커 or 기본값 */
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

  /** 타임라인(기존 기능 유지) */
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

  const filteredSchedules =
    selectedDay === 'all' ? schedules : schedules.filter((s) => s.day === selectedDay);

  /** 사이드바 */
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

  const sidebarButtons = (
    <>
      <button
        onClick={() => window.dispatchEvent(new Event('wego:open-settlement-sheet'))}
        className="py-2 px-4 rounded-md text-base bg-violet-100 text-violet-700 hover:bg-violet-200"
      >
        정산 내역 입력
      </button>
    </>
  );

  /** 본문(타임라인) */
  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">LOGO</h1>
          </div>
        </div>
        {travelData && (
          <p className="text-sm text-gray-500">
            {travelData.start_date} ~ {travelData.end_date}
          </p>
        )}
      </div>

      <div
        className="flex-1 p-6 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
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
                  const info = (() => {
                    switch (place.placeType) {
                      case 'A01':
                        return { color: 'bg-blue-500', textColor: 'text-blue-500', label: '명소' };
                      case 'A02':
                        return { color: 'bg-red-500', textColor: 'text-red-500', label: '음식점' };
                      case 'A03':
                        return {
                          color: 'bg-emerald-500',
                          textColor: 'text-emerald-500',
                          label: '카페',
                        };
                      case 'B01':
                        return { color: 'bg-gray-500', textColor: 'text-gray-500', label: '숙소' };
                      default:
                        return { color: 'bg-gray-400', textColor: 'text-gray-400', label: '기타' };
                    }
                  })();

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

                      <div
                        className="ml-4 flex-1"
                        style={{ marginTop: isFirst ? '0px' : '178px' }}
                      >
                        <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-3 w-full max-w-xs">
                          {place.time && (
                            <p className="text-sm text-gray-500 mb-3">{place.time}</p>
                          )}
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

  /** 정산 */
  const settlementContent = authChecked ? (
    <Settlement
      isAuthenticated={isAuthForSettlement}
      onRequireLogin={() => {
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
      }}
    />
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

  /** 지도 줌 */
  const mapZoom = selectedDay === 'all' ? 7 : 11;

  return (
    <>
      <FullCheckColumnLayout
        // 사이드바
        sidebarContent={sidebarContent}
        sidebarButtons={sidebarButtons}
        // 정산
        settlementContent={settlementContent}
        // 지도
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
          if (mode === 'create' && !token) navigate('/mypage');
        }}
      />
    </>
  );
};

export default TravelPlanCheck;
