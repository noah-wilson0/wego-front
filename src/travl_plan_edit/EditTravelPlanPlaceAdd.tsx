import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, Star, Plus } from "lucide-react";
import axios from "axios";

// dnd-kit
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
  restrictToParentElement,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import EditTravelPlanPlaceAddLayout from "./components/EditTravelPlanPlaceAddLayout";
import { resolveRegionView } from "../travel_plan/components/regionMapView";
import type { MapMarker } from "../travel_plan/components/mapTypes";

// 공통 UI
import StoragePlaceCard from "./components/StoragePlaceCard";
import PlaceStoragePanel from "../travl_plan_edit/components/PlaceStoragePanel";

/** -------------------- 타입 -------------------- */
interface Place {
  contentId: string;
  name: string;
  category: string; // A01/A02/A03/B01
  description: string; // 주소
  rating: number;
  likes: number;
  imageUrl: string;
  isLiked: boolean;
  longitude?: number;
  latitude?: number;
}
interface NavState {
  label?: string;
  travelPlanId?: string | number;
}

/** -------------------- 상수 -------------------- */
const UI_TO_TYPE: Record<"장소" | "식당" | "카페" | "숙소", "A01" | "A02" | "A03" | "B01"> = {
  장소: "A01",
  식당: "A02",
  카페: "A03",
  숙소: "B01",
};

const CATEGORY_META: Record<string, { label: string; text: string }> = {
  A01: { label: "명소", text: "text-blue-600" },
  A02: { label: "음식점", text: "text-red-600" },
  A03: { label: "카페", text: "text-orange-600" },
  B01: { label: "숙소", text: "text-purple-600" },
};
function CategoryTag({ code }: { code: string }) {
  const meta = CATEGORY_META[code] ?? { label: "기타", text: "text-gray-600" };
  return <span className={`text-xs font-medium ${meta.text} mr-2`}>{meta.label}</span>;
}

const api = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

/** -------------------- 유틸 -------------------- */
const byIdSet = (arr: { contentId: string }[]) => new Set(arr.map((p) => p.contentId));
const areSetsEqual = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

/** -------------------- 정렬용 래퍼 -------------------- */
function SortableStorageRow({
  place,
  onRemove,
}: {
  place: Place;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: place.contentId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <StoragePlaceCard
        place={place}
        dragHandleProps={{ ...attributes, ...listeners }}
        onRemove={onRemove}
      />
    </div>
  );
}

/** -------------------- 컴포넌트 -------------------- */
const EditTravelPlanPlaceAdd: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = (location.state ?? {}) as NavState;
  const label = nav.label ?? "여행지";
  const travelPlanId = nav.travelPlanId;

  /** 검색 / 목록 상태 */
  const [searchTerm, setSearchTerm] = useState("");
  const [activeKeyword, setActiveKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"장소" | "식당" | "카페" | "숙소">("장소");
  const [places, setPlaces] = useState<Place[]>([]);

  /** 보관함(우측) 상태 */
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [initialSavedIds, setInitialSavedIds] = useState<Set<string> | null>(null);
  const [hadServerStorages, setHadServerStorages] = useState<boolean>(false);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  /** dnd-kit */
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  /** 페이지네이션 */
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  /** 지역 기본 뷰 */
  const regionView = useMemo(() => resolveRegionView(label), [label]);

  /** ---------- 보관함 초기 GET ---------- */
  useEffect(() => {
    if (!travelPlanId) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingStorage(true);
        const res = await api.get(`/travel-plans/${travelPlanId}/storages`, {
          params: { page: 0, size: 1000 },
        });
        const content: any[] = res?.data?.content ?? [];
        const mapped: Place[] = content.map((item: any) => ({
          contentId: item.contentId,
          name: item.title ?? item.name ?? "",
          category: item.placeType ?? "A01",
          description: item.addr ?? "",
          rating: item.averageRating ?? 0,
          likes: item.likeCount ?? 0,
          imageUrl: item.image ?? "/placeholder.jpg",
          isLiked: false,
          longitude: item.longitude,
          latitude: item.latitude,
        }));

        if (!mounted) return;
        setSavedPlaces(mapped);
        setInitialSavedIds(byIdSet(mapped));
        setHadServerStorages(mapped.length > 0);
      } catch (e) {
        console.error("❌ 보관함 로드 실패", e);
      } finally {
        if (mounted) setLoadingStorage(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [travelPlanId]);

  /** ---------- 목록/검색 로드 ---------- */
  useEffect(() => {
    setPlaces([]);
    setPage(0);
    setHasMore(true);
  }, [selectedCategory, activeKeyword]);

  useEffect(() => {
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, activeKeyword]);

  const loadPlaces = async () => {
    if (loading || !hasMore) return;
    if (!label) return;

    setLoading(true);
    try {
      let url: string;
      if (activeKeyword && activeKeyword.trim()) {
        const params = new URLSearchParams({
          label,
          keyword: activeKeyword.trim(),
          page: String(page),
          size: "20",
        });
        url = `/places/search?${params.toString()}`;
      } else {
        const type = UI_TO_TYPE[selectedCategory];
        url = `/places/${encodeURIComponent(label)}/${type}/paged?page=${page}&size=20`;
      }

      const res = await api.get(url);
      const content: any[] = res.data?.content ?? [];
      const newData: Place[] = content.map((item: any) => ({
        contentId: item.contentId,
        name: item.title,
        category: item.placeType,
        description: item.addr || "",
        rating: item.averageRating ?? 0,
        likes: item.likeCount ?? 0,
        imageUrl: item.image || "/placeholder.jpg",
        isLiked: false,
        longitude: item.longitude,
        latitude: item.latitude,
      }));
      setPlaces((prev) => [...prev, ...newData]);
      setHasMore(!res.data?.last);
    } catch (e) {
      console.error("❌ 장소 로드 실패", e);
    } finally {
      setLoading(false);
    }
  };

  /** 무한 스크롤 관찰자 */
  const lastPlaceRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  /** 액션들 */
  const handleSearch = useCallback(() => {
    setPlaces([]);
    setPage(0);
    setHasMore(true);
    setActiveKeyword(searchTerm.trim());
  }, [searchTerm]);

  const toggleLike = (id: string) =>
    setPlaces((prev) => prev.map((p) => (p.contentId === id ? { ...p, isLiked: !p.isLiked } : p)));

  const addToSaved = (p: Place) =>
    !savedPlaces.find((s) => s.contentId === p.contentId) && setSavedPlaces((prev) => [...prev, p]);

  const removeFromSaved = (id: string) =>
    setSavedPlaces((prev) => prev.filter((p) => p.contentId !== id));

  /** 초기화(DELETE) */
  const handleResetStorage = async () => {
    if (!travelPlanId) return;
    const ok = confirm("보관함을 초기화할까요?");
    if (!ok) return;
    try {
      await api.delete(`/travel-plans/${travelPlanId}/storages`);
      setSavedPlaces([]);
      setInitialSavedIds(new Set());
      setHadServerStorages(false);
    } catch (e) {
      console.error("❌ 보관함 초기화 실패", e);
    }
  };

  /** 완료(POST/PUT 판단) → 항상 일정 화면으로 이동 */
  const handleComplete = async () => {
    const currentIds = byIdSet(savedPlaces);
    const body = savedPlaces.map((p) => p.contentId);
    try {
      if (travelPlanId) {
        if (hadServerStorages) {
          const changed = !(initialSavedIds && areSetsEqual(initialSavedIds, currentIds));
          if (changed) {
            await api.put(`/travel-plans/${travelPlanId}/storages`, body);
            setInitialSavedIds(currentIds);
          }
        } else {
          if (body.length > 0) {
            await api.post(`/travel-plans/${travelPlanId}/storages`, body);
            setInitialSavedIds(currentIds);
            setHadServerStorages(true);
          }
        }
      }
    } catch (e) {
      console.error("❌ 보관함 저장/수정 실패", e);
    } finally {
      navigate("/edit-travel-plan", { state: { travelPlanId, label } });
    }
  };

  /** dnd 이벤트 */
  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setSavedPlaces((prev) => {
      const oldIdx = prev.findIndex((p) => p.contentId === active.id);
      const newIdx = prev.findIndex((p) => p.contentId === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };
  const handleDragCancel = () => setActiveId(null);

  /** 지도 마커 (보관함만) */
  const mapMarkers: MapMarker[] = useMemo(
    () =>
      savedPlaces
        .filter((p) => p.latitude && p.longitude)
        .map((p, idx) => ({
          id: p.contentId,
          title: p.name,
          position: { lat: p.latitude!, lng: p.longitude! },
          category: p.category as "A01" | "A02" | "A03" | "B01",
          order: idx + 1,
        })),
    [savedPlaces]
  );

  /** -------------------- 사이드바 -------------------- */
  const sidebarContent = (
    <button className="w-12 h-8 rounded flex items-center justify-center text-sm font-semibold bg-black text-white cursor-default">
      전체
    </button>
  );
  const sidebarButtons = (
    <div className="flex flex-col gap-2 mt-3">
      <button
        onClick={() => navigate(-1)}
        className="py-3 px-4 rounded-xl text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        취소
      </button>
      <button onClick={handleComplete} className="py-3 px-4 rounded-xl text-base bg-gray-800 text-white hover:bg-black">
        적용
      </button>
      <button disabled className="py-3 px-4 rounded-xl text-base bg-red-100 text-red-300 cursor-not-allowed">
        저장
      </button>
    </div>
  );

  /** -------------------- 렌더 -------------------- */
  return (
    <EditTravelPlanPlaceAddLayout
      sidebarContent={sidebarContent}
      sidebarButtons={sidebarButtons}
      selectedPanel={
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="px-4 pt-3 pb-3 flex items-center justify-between border-b bg-white">
            <div>
              <div className="text-base font-semibold">장소 보관함</div>
              <div className="text-sm text-gray-600 mt-1">
                포함되지 않은 장소: <b>{savedPlaces.length}개</b>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetStorage}
                disabled={loadingStorage}
                className="rounded-xl px-3 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                title="보관함 초기화"
              >
                초기화
              </button>
              <button
                onClick={handleComplete}
                disabled={loadingStorage}
                className="rounded-xl bg-black text-white px-4 py-2 text-sm"
                title="완료"
              >
                완료
              </button>
            </div>
          </div>

          {/* 리스트 패널 */}
          <div className="mt-3 flex-1 px-4">
            <PlaceStoragePanel>
              <DndContext
                sensors={sensors}
                modifiers={[
                  restrictToVerticalAxis,
                  restrictToFirstScrollableAncestor,
                  restrictToParentElement,
                  restrictToWindowEdges,
                ]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext items={savedPlaces.map((p) => p.contentId)} strategy={verticalListSortingStrategy}>
                  {savedPlaces.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-12">
                      아직 보관한 장소가 없습니다. 왼쪽 목록에서 <b>+</b>를 눌러 추가하세요.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedPlaces.map((p) => (
                        <SortableStorageRow key={p.contentId} place={p} onRemove={removeFromSaved} />
                      ))}
                    </div>
                  )}
                </SortableContext>

                <DragOverlay dropAnimation={{ duration: 140 }}>
                  {activeId ? (
                    <StoragePlaceCard
                      place={savedPlaces.find((p) => p.contentId === activeId)!}
                      dragging
                      showActions={false}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </PlaceStoragePanel>
          </div>
        </div>
      }
      mapCenter={regionView.center}
      mapZoom={9}
      mapMarkers={mapMarkers}
      selectedMarkerId={selectedMarkerId}
      onMarkerClick={(id) => setSelectedMarkerId(id)}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{label}</h2>

        {/* 🔍 검색창 */}
        <div className="relative">
          <button
            type="button"
            onClick={handleSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="검색"
            title="검색"
          >
            <Search className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="장소명을 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 카테고리 버튼 */}
        <div className="flex gap-2">
          {(["장소", "식당", "카페", "숙소"] as const).map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setPlaces([]);
                setPage(0);
                setHasMore(true);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 장소 카드 (검색/목록) */}
        <div className="space-y-4">
          {places.map((p, idx) => (
            <div
              key={p.contentId}
              ref={idx === places.length - 1 ? lastPlaceRef : null}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <img src={p.imageUrl} alt={p.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{p.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <CategoryTag code={p.category} />
                  <span className="align-middle">{p.description}</span>
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div
                    className="flex items-center gap-1 cursor-pointer text-gray-500 hover:text-red-500"
                    onClick={() => toggleLike(p.contentId)}
                    title="좋아요"
                  >
                    <Heart className={`w-4 h-4 ${p.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{p.likes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{p.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addToSaved(p)}
                disabled={savedPlaces.some((s) => s.contentId === p.contentId)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                  savedPlaces.some((s) => s.contentId === p.contentId)
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
                title="보관함에 추가"
              >
                {savedPlaces.some((s) => s.contentId === p.contentId) ? (
                  <div className="w-2 h-2 bg-white rounded-full" />
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          ))}
          {loading && <div className="text-center py-6 text-gray-400">불러오는 중...</div>}
          {!loading && places.length === 0 && (
            <div className="text-center py-10 text-gray-400">검색/필터 결과가 없습니다.</div>
          )}
        </div>
      </div>
    </EditTravelPlanPlaceAddLayout>
  );
};

export default EditTravelPlanPlaceAdd;
