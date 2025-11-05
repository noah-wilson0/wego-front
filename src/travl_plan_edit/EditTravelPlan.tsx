// src/travl_plan_edit/EditTravelPlan.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import EditTravelPlanLayout from "./components/EditTravelPlanLayout";
import type { MapMarker, MapPolyline, LatLng } from "../travel_plan/components/mapTypes";
import { ArrowLeftRight } from "lucide-react";

// 재사용 컴포넌트
import SavedPlaceCard from "./components/StoragePlaceCard";
import PlaceStoragePanel from "../travl_plan_edit/components/PlaceStoragePanel";
import TravelPlanEditSchedulePlaceCard from "./components/TravelPlanEditSchedulePlaceCard";

// dnd-kit
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";

/** -------------------- API -------------------- */
const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

/** -------------------- 타입 -------------------- */
type PlaceType = "A01" | "A02" | "A03" | "B01";

interface ServerPlace {
  content_id: string;
  placeType: PlaceType;
  title: string;
  image: string;
  sequence: number;
  longitude: number;
  latitude: number;
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
}

interface ServerDay {
  date: string;       // "yyyy-MM-dd"
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
  places: ServerPlace[];
}

interface ServerRouteLeg {
  sequence: number;
  origin: string;
  destination: string;
  duration: number; // seconds
}

interface ServerTravelData {
  label: string;
  start_date: string;
  end_date: string;
  days: ServerDay[];
  routes: {
    route_type: string | null;
    dailyRoutes: Record<string, ServerRouteLeg[]>;
  }[];
  createdAt?: string;
}

interface StoragePlace {
  contentId: string;
  name: string;
  category: PlaceType;
  description: string;
  rating: number;
  likes: number;
  imageUrl: string;
  isLiked: boolean;
  longitude?: number;
  latitude?: number;
}

interface RenderPlace {
  id: string;
  title: string;
  tag: "명소" | "식당" | "카페" | "숙소";
  placeType: PlaceType;
  colorClass: string;
  time?: string;
  lat?: number;
  lng?: number;
  image?: string;
}

interface DayPlan {
  day: number;
  date: string;       // "yyyy-MM-dd"
  start_time: string; // "HH:mm"
  end_time: string;   // "HH:mm"
  items: RenderPlace[];
}

/** -------------------- 유틸 -------------------- */
const JEJU_CENTER: LatLng = { lat: 33.4996, lng: 126.5312 };

const PT_META: Record<PlaceType, { tag: RenderPlace["tag"]; colorClass: string }> = {
  A01: { tag: "명소", colorClass: "text-blue-600" },
  A02: { tag: "식당", colorClass: "text-red-500" },
  A03: { tag: "카페", colorClass: "text-emerald-600" },
  B01: { tag: "숙소", colorClass: "text-gray-600" },
};

function canScrollVertically(el: HTMLElement, deltaY: number): boolean {
  if (!el) return false;
  if (el.scrollHeight <= el.clientHeight) return false;
  if (deltaY < 0) return el.scrollTop > 0;
  if (deltaY > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
  return false;
}

/** 시간 포맷 도우미 */
function hhmmToParts(hhmm: string) {
  const [hStr, mStr] = (hhmm || "00:00").split(":");
  let h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  const isPM = h >= 12;
  const hour12 = (h % 12) || 12;
  return { ampm: (isPM ? "오후" : "오전") as "오전" | "오후", hour: hour12, min: m };
}
function partsToHHMM(ampm: "오전" | "오후", hour12: number, min: number) {
  let h = Math.max(1, Math.min(12, hour12 | 0));
  let m = Math.max(0, Math.min(59, min | 0));
  if (ampm === "오후" && h !== 12) h += 12;
  if (ampm === "오전" && h === 12) h = 0;
  const hs = h.toString().padStart(2, "0");
  const ms = m.toString().padStart(2, "0");
  return `${hs}:${ms}`;
}
const toLocalTime = (hhmm: string) => `${hhmm}:00`; // 백엔드 포맷 "HH:mm:ss"

/** 🔹 이동 시간 행 */
function TravelTimeRow({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center text-gray-700 px-2 py-2 select-none">
      <div className="w-5 flex justify-center">
        <span className="h-6 border-l-2 border-dotted border-gray-300" />
      </div>
      <span className="ml-2 mr-2 text-gray-600">이동 시간</span>
      <span className="inline-flex items-center justify-center h-8 min-w-[48px] px-3 rounded-lg font-semibold bg-gray-100 text-gray-800">
        {minutes}
      </span>
      <span className="ml-2 text-gray-600">분</span>
    </div>
  );
}

/** -------------------- 인라인 시작/종료시간 에디터 -------------------- */
/** 컨테이너와 내부 요소 사이즈를 전반적으로 축소해 버튼이 테두리 안에 들어오도록 조정 */
function StartTimeEditor({
  date,
  startHHMM,
  endHHMM,
  onLocalChange,
  onCommit,
}: {
  date: string;
  startHHMM: string;
  endHHMM: string;
  onLocalChange: (start: string, end: string) => void;
  onCommit: (date: string, start: string, end: string) => void;
}) {
  // 각각의 로컬 파츠 상태
  const s0 = hhmmToParts(startHHMM);
  const e0 = hhmmToParts(endHHMM);
  const [sAmpm, setSAmpm] = useState<"오전" | "오후">(s0.ampm);
  const [sHour, setSHour] = useState<number>(s0.hour);
  const [sMin, setSMin] = useState<number>(s0.min);
  const [eAmpm, setEAmpm] = useState<"오전" | "오후">(e0.ampm);
  const [eHour, setEHour] = useState<number>(e0.hour);
  const [eMin, setEMin] = useState<number>(e0.min);

  // 어떤 것을 현재 컨트롤에 보여줄지
  const [mode, setMode] = useState<"start" | "end">("start");

  // 외부 값 변경시 동기화
  useEffect(() => {
    const p = hhmmToParts(startHHMM);
    setSAmpm(p.ampm); setSHour(p.hour); setSMin(p.min);
  }, [startHHMM]);
  useEffect(() => {
    const p = hhmmToParts(endHHMM);
    setEAmpm(p.ampm); setEHour(p.hour); setEMin(p.min);
  }, [endHHMM]);

  // 디바운스 커밋
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleCommit = (nextStart: string, nextEnd: string) => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      onCommit(date, nextStart, nextEnd);
    }, 400);
  };

  // 공통 변경 처리
  const applyChange = (target: "start" | "end", field: "ampm" | "hour" | "min", value: number | "오전" | "오후") => {
    let sA = sAmpm, sH = sHour, sM = sMin;
    let eA = eAmpm, eH = eHour, eM = eMin;
    if (target === "start") {
      if (field === "ampm") sA = value as "오전" | "오후";
      if (field === "hour") sH = value as number;
      if (field === "min") sM = value as number;
      setSAmpm(sA); setSHour(sH); setSMin(sM);
    } else {
      if (field === "ampm") eA = value as "오전" | "오후";
      if (field === "hour") eH = value as number;
      if (field === "min") eM = value as number;
      setEAmpm(eA); setEHour(eH); setEMin(eM);
    }
    const nextStart = partsToHHMM(sA, sH, sM);
    const nextEnd = partsToHHMM(eA, eH, eM);
    onLocalChange(nextStart, nextEnd);
    scheduleCommit(nextStart, nextEnd);
  };

  // 현재 모드에 보여줄 값
  const a = mode === "start" ? sAmpm : eAmpm;
  const h = mode === "start" ? sHour : eHour;
  const m = mode === "start" ? sMin : eMin;

  return (
    <div className="mb-3">
      {/* 크기 축소: gap-1 / h-7 / px-2 py-1.5 */}
      <div className="flex flex-nowrap items-center gap-1 border rounded-xl px-2 py-1.5 text-[13px] text-gray-700">
        {/* 라벨 */}
        <span className="text-gray-500 mr-1 shrink-0 whitespace-nowrap">
          {mode === "start" ? "시작" : "종료"}
        </span>

        {/* 오전/오후 (좁은 폭) */}
        <select
          className="h-7 px-2 rounded-md bg-white border border-gray-200 text-gray-700 mr-1 shrink-0"
          value={a}
          onChange={(e) =>
            applyChange(mode, "ampm", e.target.value as "오전" | "오후")
          }
        >
          <option value="오전">오전</option>
          <option value="오후">오후</option>
        </select>

        {/* 시 (폭 축소) */}
        <input
          type="number"
          min={1}
          max={12}
          value={h}
          onChange={(e) => {
            const v = parseInt(e.target.value || "0", 10);
            applyChange(mode, "hour", Number.isFinite(v) ? Math.max(1, Math.min(12, v)) : 1);
          }}
          className="h-7 w-12 text-center border border-gray-200 rounded-md mr-1 shrink-0"
        />
        <span className="mr-1 shrink-0">:</span>

        {/* 분 (폭 축소) */}
        <input
          type="number"
          min={0}
          max={59}
          value={m}
          onChange={(e) => {
            const v = parseInt(e.target.value || "0", 10);
            applyChange(mode, "min", Number.isFinite(v) ? Math.max(0, Math.min(59, v)) : 0);
          }}
          className="h-7 w-12 text-center border border-gray-200 rounded-md shrink-0"
        />

        {/* 스왑 버튼 (더 컴팩트) */}
        <button
          type="button"
          aria-label={mode === "start" ? "종료 편집으로 전환" : "시작 편집으로 전환"}
          title={mode === "start" ? "종료 편집으로 전환" : "시작 편집으로 전환"}
          onClick={() => setMode((m) => (m === "start" ? "end" : "start"))}
          className="ml-auto inline-flex items-center gap-1 h-7 px-2 text-[11px] rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0 whitespace-nowrap"
        >
          <ArrowLeftRight size={13} />
          {mode === "start" ? "종료 편집" : "시작 편집"}
        </button>
      </div>
    </div>
  );
}

/** -------------------- 컴포넌트 -------------------- */
export default function EditTravelPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ travelPlanId?: string }>();
  const travelPlanId = (location.state as any)?.travelPlanId ?? params.travelPlanId ?? undefined;

  const [storageLoading, setStorageLoading] = useState(false);
  const [storageList, setStorageList] = useState<StoragePlace[]>([]);

  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("여행지");
  const [headerDates, setHeaderDates] = useState("");
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [travelTimes, setTravelTimes] = useState<Record<number, Record<number, number>>>({});

  const daysScrollRef = useRef<HTMLDivElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [activeItem, setActiveItem] = useState<{
    fromContainer: string;
    contentId: string;
    payload: StoragePlace | RenderPlace;
  } | null>(null);

  const saveChanges = async () => {
    if (!travelPlanId) return;
    try {
      await api.patch(`/travel-plans/${travelPlanId}/me`);
      alert("변경사항이 저장장되었습니다.");
      navigate(`/check/${travelPlanId}`);
    } catch (error) {
      console.error("변경사항 저장장 실패", error);
      alert("변경사항을 저장장하는 데 실패했습니다.");
    }
  };

  const cancelChanges = async () => {
    if (!travelPlanId) return;
    try {
      await api.delete(`/travel-plans/${travelPlanId}/me`);
      alert("변경사항이 취소되었습니다.");
      navigate(`/check/${travelPlanId}`);
    } catch (error) {
      console.error("변경사항 취소 실패", error);
      alert("변경사항을 취소하는 데 실패했습니다.");
    }
  };

  /** 서버 응답 → 화면 상태 변환 */
  const applyServerPlan = (data: ServerTravelData) => {
    setLabel(data.label || "여행지");
    setHeaderDates(data.start_date && data.end_date ? `${data.start_date} - ${data.end_date}` : "");

    const days: DayPlan[] = data.days.map((d, idx) => {
      const items: RenderPlace[] = d.places.map((p) => {
        const meta = PT_META[p.placeType];
        const safeImg = p.image && p.image.trim() ? p.image : "/placeholder.jpg";
        return {
          id: p.content_id,
          title: p.title,
          tag: meta.tag,
          placeType: p.placeType,
          colorClass: meta.colorClass,
          time: p.start_time && p.end_time ? `${p.start_time}-${p.end_time}` : undefined,
          lat: p.latitude,
          lng: p.longitude,
          image: safeImg,
        };
      });
      return {
        day: idx + 1,
        date: d.date,
        start_time: d.start_time || "10:00",
        end_time: d.end_time || "22:00",
        items,
      };
    });
    setDayPlans(days);

    const tt: Record<number, Record<number, number>> = {};
    for (const r of data.routes ?? []) {
      const daily = r.dailyRoutes || {};
      for (const key of Object.keys(daily)) {
        const segments = daily[key] || [];
        const dayNo = data.days.findIndex((d) => d.date === key) + 1;
        if (!dayNo || dayNo < 1) continue;
        if (!tt[dayNo]) tt[dayNo] = {};
        for (const seg of segments) {
          const minutes = Math.ceil((seg.duration ?? 0) / 60);
          tt[dayNo][seg.sequence] = minutes;
        }
      }
    }
    setTravelTimes(tt);
  };

  /** 최초 로드 */
  useEffect(() => {
    if (!travelPlanId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<ServerTravelData>(`/travel-plans/${travelPlanId}/me/edit`);
        if (!mounted) return;
        applyServerPlan(res.data);
      } catch (e) {
        console.error("[EditTravelPlan] 일정 불러오기 실패", e);
        alert("일정을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [travelPlanId]);

  /** 보관함 GET */
  useEffect(() => {
    if (!travelPlanId) return;
    let mounted = true;
    (async () => {
      try {
        setStorageLoading(true);
        const res = await api.get(`/travel-plans/${travelPlanId}/storages`, {
          params: { page: 0, size: 1000 },
        });
        const content: any[] = res?.data?.content ?? [];
        const mapped: StoragePlace[] = content.map((item: any) => ({
          contentId: item.contentId,
          name: item.title ?? item.name ?? "",
          category: (item.placeType ?? "A01") as PlaceType,
          description: item.addr ?? "",
          rating: item.averageRating ?? 0,
          likes: item.likeCount ?? 0,
          imageUrl: item.image && String(item.image).trim() ? item.image : "/placeholder.jpg",
          isLiked: false,
          longitude: item.longitude,
          latitude: item.latitude,
        }));
        if (mounted) setStorageList(mapped);
      } catch (e) {
        console.error("[EditTravelPlan] 보관함 조회 실패]", e);
      } finally {
        if (mounted) setStorageLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [travelPlanId]);

  /** ✅ 보관함 휴지통 클릭 시 삭제 */
  const handleRemoveStorageItem = async (id: string) => {
    const before = [...storageList];
    setStorageList((prev) => prev.filter((p) => p.contentId !== id));

    if (!travelPlanId) return;
    try {
      await api.delete(`/travel-plans/${travelPlanId}/storages/${id}`);
    } catch (e) {
      console.error("보관함 항목 삭제 실패:", e);
      setStorageList(before);
    }
  };

  /** 🔸 점 3개 메뉴 클릭 */
  const handleScheduleMenuClick = (id: string) => {
    console.log("menu click:", id);
  };

  /** -------------------- 서버 호출 -------------------- */
  const callInsert = async (toDate: string, index: number, contentId: string) => {
    const res = await api.post<ServerTravelData>(
      `/travel-plans/${travelPlanId}/edit/days/${toDate}`,
      { index, contentId }
    );
    applyServerPlan(res.data);
  };

  const callMove = async (
    fromDate: string,
    body: { fromIndex: number; toDay: string; toIndex: number; contentId: string }
  ) => {
    const res = await api.patch<ServerTravelData>(
      `/travel-plans/${travelPlanId}/edit/days/${fromDate}`,
      body
    );
    applyServerPlan(res.data);
  };

  const callDelete = async (fromDate: string, index: number, contentId: string) => {
    const res = await api.delete<ServerTravelData>(
      `/travel-plans/${travelPlanId}/edit/days/${fromDate}`,
      { data: { index, contentId } }
    );
    applyServerPlan(res.data);
  };

  // ✅ 일자의 시작/종료 시간 PATCH
  const patchDayTime = async (date: string, startHHMM: string, endHHMM: string) => {
    if (!travelPlanId) return;
    try {
      const res = await api.patch<ServerTravelData>(
        `/travel-plans/${travelPlanId}/edit/days/${date}/time`,
        {
          startTime: toLocalTime(startHHMM),
          endTime: toLocalTime(endHHMM),
        }
      );
      applyServerPlan(res.data);
    } catch (e) {
      console.error("[EditTravelPlan] 시간 변경 PATCH 실패", e);
    }
  };

  /** -------------------- DND 유틸 -------------------- */
  const getStorageIndex = (contentId: string) =>
    storageList.findIndex((p) => p.contentId === contentId);

  const getDayIndexByContainer = (container: string) => {
    const dayNum = Number(container.split("-")[1]);
    return dayPlans.findIndex((d) => d.day === dayNum);
  };

  const getDayItemIndex = (dayIdx: number, contentId: string) =>
    dayPlans[dayIdx].items.findIndex((p) => p.id === contentId);

  const buildDraggedPayload = (fromContainer: string, contentId: string) => {
    if (fromContainer === "storage") {
      const idx = getStorageIndex(contentId);
      return storageList[idx];
    } else if (fromContainer.startsWith("day-")) {
      const dIdx = getDayIndexByContainer(fromContainer);
      const iIdx = getDayItemIndex(dIdx, contentId);
      return dayPlans[dIdx].items[iIdx];
    }
    return null;
  };

  /** -------------------- DND: 정렬/이동 로직 -------------------- */
  const handleDragStart = (e: DragStartEvent) => {
    const { id } = e.active;
    const [container, contentId] = String(id).split("_");
    const payload = buildDraggedPayload(container, contentId);
    if (payload) setActiveItem({ fromContainer: container, contentId, payload });
  };

  const handleDragOver = (_e: DragOverEvent) => {};

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveItem(null);
    if (!over) return;

    const [fromContainer, contentId] = String(active.id).split("_");
    const [toContainer, toContentId] = String(over.id).split("_");

    if (fromContainer === toContainer && contentId === toContentId) return;

    try {
      if (fromContainer === "storage" && toContainer === "storage") {
        const fromIdx = getStorageIndex(contentId);
        const toIdx = getStorageIndex(toContentId);
        if (fromIdx < 0 || toIdx < 0) return;
        setStorageList((prev) => arrayMove(prev, fromIdx, toIdx));
        return;
      }

      if (fromContainer.startsWith("day-") && toContainer === fromContainer) {
        const dIdx = getDayIndexByContainer(fromContainer);
        const fromIdx = getDayItemIndex(dIdx, contentId);
        const toIdx = getDayItemIndex(dIdx, toContentId);
        const date = dayPlans[dIdx].date;
        await callMove(date, {
          fromIndex: fromIdx,
          toDay: date,
          toIndex: toIdx >= 0 ? toIdx : dayPlans[dIdx].items.length - 1,
          contentId,
        });
        return;
      }

      if (fromContainer === "storage" && toContainer.startsWith("day-")) {
        const toDayIdx = getDayIndexByContainer(toContainer);
        const toIdx = getDayItemIndex(toDayIdx, toContentId);
        const toDate = dayPlans[toDayIdx].date;
        await callInsert(toDate, toIdx >= 0 ? toIdx : dayPlans[toDayIdx].items.length, contentId);
        setStorageList((prev) => prev.filter((p) => p.contentId !== contentId));
        return;
      }

      if (fromContainer.startsWith("day-") && toContainer === "storage") {
        const fromDayIdx = getDayIndexByContainer(fromContainer);
        const fromIdx = getDayItemIndex(fromDayIdx, contentId);
        const fromDate = dayPlans[fromDayIdx].date;
        await callDelete(fromDate, fromIdx, contentId);
        return;
      }

      if (fromContainer.startsWith("day-") && toContainer.startsWith("day-") && fromContainer !== toContainer) {
        const fromDayIdx = getDayIndexByContainer(fromContainer);
        const toDayIdx = getDayIndexByContainer(toContainer);
        const fromIdx = getDayItemIndex(fromDayIdx, contentId);
        const toIdx = getDayItemIndex(toDayIdx, toContentId);
        const fromDate = dayPlans[fromDayIdx].date;
        const toDate = dayPlans[toDayIdx].date;
        await callMove(fromDate, {
          fromIndex: fromIdx,
          toDay: toDate,
          toIndex: toIdx >= 0 ? toIdx : dayPlans[toDayIdx].items.length,
          contentId,
        });
        return;
      }
    } catch (err) {
      console.error("[EditTravelPlan] 편집 요청 실패:", err);
      alert("편집 적용 실패");
    }
  };

  /** -------------------- 보관함 Sortable -------------------- */
  function SortableStorageItem({ place }: { place: StoragePlace }) {
    const id = `storage_${place.contentId}`;
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style}>
        <SavedPlaceCard
          place={place}
          dragHandleProps={{ ...attributes, ...listeners }}
          onRemove={handleRemoveStorageItem}
        />
      </div>
    );
  }

  function SortableDayItem({ day, item }: { day: number; item: RenderPlace }) {
    const id = `day-${day}_${item.id}`;
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style}>
        <TravelPlanEditSchedulePlaceCard
          place={{
            id: item.id,
            name: item.title,
            category: item.placeType,
            imageUrl: item.image && item.image.trim() ? item.image : "/placeholder.jpg",
            time: item.time,
          }}
          dragHandleProps={{ ...attributes, ...listeners }}
          onMenuClick={handleScheduleMenuClick}
        />
      </div>
    );
  }

  /** -------------------- 사이드바 -------------------- */
  const sidebarContent = (
    <button className="w-12 h-8 rounded flex items-center justify-center text-sm font-semibold bg-black text-white cursor-default">
      전체
    </button>
  );

  const sidebarButtons = (
    <div className="flex flex-col gap-2 mt-3">
      <button
        onClick={cancelChanges}
        className="py-3 px-4 rounded-xl text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        취소
      </button>

      <button
        onClick={saveChanges}
        className="py-3 px-4 rounded-xl text-base bg-black text-white hover:opacity-90"
      >
        저장
      </button>
    </div>
  );

  /** -------------------- 지도 데이터 -------------------- */
  const mapMarkers: MapMarker[] = useMemo(() => {
    const targets = dayPlans.flatMap((d) => d.items);
    let running = 1;
    return targets
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
      .map((p) => ({
        id: `mk-${p.id}`,
        position: { lat: p.lat as number, lng: p.lng as number },
        title: p.title,
        category: p.placeType,
        order: running++,
        infoHtml: p.time ? `<div>${p.time}</div>` : undefined,
      }));
  }, [dayPlans]);

  const polylines: MapPolyline[] = useMemo(() => {
    const coords = dayPlans.flatMap((d) => d.items);
    const lines: MapPolyline[] = [];
    for (let i = 0; i < coords.length - 1; i++) {
      if (
        typeof coords[i].lat === "number" &&
        typeof coords[i].lng === "number" &&
        typeof coords[i + 1].lat === "number" &&
        typeof coords[i + 1].lng === "number"
      ) {
        lines.push({
          id: `route-${coords[i].id}-${coords[i + 1].id}`,
          path: [
            { lat: coords[i].lat as number, lng: coords[i].lng as number },
            { lat: coords[i + 1].lat as number, lng: coords[i + 1].lng as number },
          ],
          options: { strokeColor: "#7c3aed" },
        });
      }
    }
    return lines;
  }, [dayPlans]);

  const mapCenter: LatLng = useMemo(() => mapMarkers[0]?.position ?? JEJU_CENTER, [mapMarkers]);
  const mapZoom = 9;

  /** -------------------- 본문 -------------------- */
  const mainContent = (
    <div className="bg-white h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{label}</h2>
            <p className="text-sm text-gray-500">{headerDates}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
              항공권
            </button>
            <button className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
              렌터카
            </button>
            <button className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
              숙소
            </button>
          </div>
        </div>
      </div>

      {/* 본문: 보관함 + 일정 */}
      <div className="flex-1 p-6 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={(_e: DragOverEvent) => {}}
          onDragEnd={handleDragEnd}
        >
          <section className="grid grid-cols-[320px_1fr] gap-6 h-full">
            {/* 보관함 */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="text-base font-semibold">장소 보관함</div>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-black text-white px-3 py-2 text-sm"
                  onClick={() =>
                    navigate("/edit-travel-plan-place-add", { state: { travelPlanId, label } })
                  }
                >
                  장소 추가
                </button>
              </div>

              <span className="text-gray-400 text-sm mb-2">
                {storageLoading ? "불러오는 중..." : `${storageList.length}개의 포함되지 않은 장소`}
              </span>

              <PlaceStoragePanel className="flex-1">
                {storageList.length === 0 && !storageLoading ? (
                  <div className="text-center text-gray-400 py-8">보관된 장소가 없습니다.</div>
                ) : (
                  <SortableContext
                    items={storageList.map((p) => `storage_${p.contentId}`)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="space-y-3">
                      {storageList.map((p) => (
                        <SortableStorageItem key={p.contentId} place={p} />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </PlaceStoragePanel>
            </div>

            {/* 일정: 우측 가로 스크롤 래퍼 */}
            <div
              className="overflow-x-auto overscroll-contain"
              ref={daysScrollRef}
              onWheel={(e) => {
                const wrap = daysScrollRef.current;
                if (!wrap) return;
                const absX = Math.abs(e.deltaX as number);
                const absY = Math.abs(e.deltaY as number);
                const delta = absX > absY ? (e.deltaX as number) : (e.deltaY as number);
                if (delta !== 0) {
                  wrap.scrollLeft += delta;
                }
              }}
            >
              {loading ? (
                <div className="text-gray-400 text-sm p-6">일정을 불러오는 중...</div>
              ) : (
                <div className="flex gap-4 min-w-max">
                  {dayPlans.map((dp, dpIdx) => (
                    <div
                      key={dp.day}
                      className="w-[360px] overscroll-contain"
                      onWheelCapture={(e) => {
                        const column = e.currentTarget;
                        const wrap = daysScrollRef.current;
                        if (!wrap) return;
                        if (Math.abs(e.deltaX as number) > Math.abs(e.deltaY as number)) {
                          wrap.scrollLeft += e.deltaX as number;
                          return;
                        }
                        if (canScrollVertically(column, e.deltaY as number)) return;
                        wrap.scrollLeft += e.deltaY as number;
                      }}
                    >
                      {/* 일차 헤더 + 날짜 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-semibold">{dp.day}일차</div>
                        <div className="text-sm text-gray-400">{dp.date}</div>
                      </div>

                      {/* 시작/종료 시간 에디터 (PATCH 연동) */}
                      <StartTimeEditor
                        date={dp.date}
                        startHHMM={dp.start_time}
                        endHHMM={dp.end_time}
                        onLocalChange={(s, e) =>
                          setDayPlans((prev) =>
                            prev.map((d, i) =>
                              i === dpIdx ? { ...d, start_time: s, end_time: e } : d
                            )
                          )
                        }
                        onCommit={(date, s, e) => patchDayTime(date, s, e)}
                      />

                      <div className="rounded-2xl bg-gray-50 p-3 border border-gray-200 space-y-3 overflow-y-auto max-h-[calc(100vh-220px)]">
                        <SortableContext
                          items={dp.items.map((p) => `day-${dp.day}_${p.id}`)}
                          strategy={rectSortingStrategy}
                        >
                          {dp.items.map((p, idx) => {
                            const seq = idx + 1;
                            const minutes = travelTimes?.[dp.day]?.[seq];
                            return (
                              <React.Fragment key={`${dp.day}-${p.id}`}>
                                <div className="flex items-stretch gap-2">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold mt-2">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <SortableDayItem day={dp.day} item={p} />
                                  </div>
                                </div>

                                {idx < dp.items.length - 1 && Number.isFinite(Number(minutes)) && (
                                  <TravelTimeRow minutes={Number(minutes)} />
                                )}
                              </React.Fragment>
                            );
                          })}

                          {dp.items.length === 0 && (
                            <div className="rounded-xl bg-white border border-dashed border-gray-300 px-3 py-6 text-center text-gray-400 text-sm">
                              일정이 없습니다. 보관함에서 끌어다 놓으세요.
                            </div>
                          )}
                        </SortableContext>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 드래그 오버레이 */}
          <DragOverlay dropAnimation={{ duration: 140 }}>
            {activeItem ? (
              activeItem.fromContainer === "storage" ? (
                <SavedPlaceCard place={activeItem.payload as StoragePlace} dragging showActions={false} />
              ) : (
                <TravelPlanEditSchedulePlaceCard
                  place={{
                    id: (activeItem.payload as RenderPlace).id,
                    name: (activeItem.payload as RenderPlace).title,
                    category: (activeItem.payload as RenderPlace).placeType,
                    imageUrl:
                      (activeItem.payload as RenderPlace).image &&
                      (activeItem.payload as RenderPlace).image!.trim()
                        ? (activeItem.payload as RenderPlace).image!
                        : "/placeholder.jpg",
                    time: (activeItem.payload as RenderPlace).time,
                  }}
                  dragging
                  showActions={false}
                />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );

  return (
    <EditTravelPlanLayout
      sidebarContent={sidebarContent}
      sidebarButtons={sidebarButtons}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      mapMarkers={mapMarkers}
      polylines={polylines}
      selectedMarkerId={null}
      onMarkerClick={() => {}}
      centerMarker={true}
    >
      {mainContent}
    </EditTravelPlanLayout>
  );
}
