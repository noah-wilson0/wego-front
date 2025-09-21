// src/travel_plan/travel_plan_accommodation.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Plus, Trash2, RotateCcw, Heart, Star } from "lucide-react";
import Cookies from "js-cookie";
import axios from "axios";

import UnifiedFourColumnLayout from "./components/UnifiedFourColumnLayout";

import { getDraftPlanMeta } from "./components/draftPlanMetaApi";
import type { DraftPlanMetaResponse } from "./components/draftPlanMetaApi";

import { resolveRegionView } from "./components/regionMapView";
import type { MapMarker } from "./components/mapTypes";

import AccommodationSelectModal from "./components/AccommodationSelectModal";
import type { Accommodation } from "./components/AccommodationSelectModal";

import TravelPlanRoute from "./travel_plan_route";

import { addDays, differenceInCalendarDays, format } from "date-fns";
import { ko } from "date-fns/locale";

interface TravelInfo {
  destination: string;
  startDate: string;     // yyyy-MM-dd
  endDate: string;       // yyyy-MM-dd
  totalDays: number;     // 포함 일수
  nights: number;        // 박 수 (= totalDays - 1)
  durationText: string;  // "YYYY-MM-DD ~ YYYY-MM-DD"
}

type AccommWithMeta = Accommodation & {
  likes?: number;
  rating?: number;
  latitude?: number | null;
  longitude?: number | null;
};

type MinimalPlace = {
  id: string;
  name: string;
  addr?: string;
  lat?: number | null;
  lng?: number | null;
  imageUrl?: string;
  category?: "A01" | "A02" | "A03"; // 명소/식당/카페
};

// 카테고리 라벨(숙소 고정)
const CategoryTag = () => (
  <span className="mr-2 align-middle text-xs font-medium text-red-600">숙소</span>
);

const TravelPlanAccommodation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [accommodations, setAccommodations] = useState<AccommWithMeta[]>([]);
  const [selectedByNight, setSelectedByNight] = useState<(Accommodation | null)[]>([]);

  const [travelInfo, setTravelInfo] = useState<TravelInfo>({
    destination: "",
    startDate: "",
    endDate: "",
    totalDays: 0,
    nights: 0,
    durationText: "",
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentAccommodation, setCurrentAccommodation] = useState<Accommodation | null>(null);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // 장소 선택(이전 단계) 결과
  const [savedPlaces, setSavedPlaces] = useState<MinimalPlace[]>([]);

  // 진행 제어/모달
  const [showRoutePopup, setShowRoutePopup] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const getUuidFromCookie = () => Cookies.get("travelPlanUUID");

  // 메타 + 저장된 장소 로드
  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) return;

    (async () => {
      try {
        const { regionName, startDate, endDate }: DraftPlanMetaResponse =
          await getDraftPlanMeta(uuid);

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const totalDays = differenceInCalendarDays(end, start) + 1; // 포함
          const nights = Math.max(totalDays - 1, 0);

          setTravelInfo({
            destination: regionName,
            startDate,
            endDate,
            totalDays,
            nights,
            durationText: `${startDate} ~ ${endDate}`,
          });

          setSelectedByNight(Array(nights).fill(null));
        } else {
          setTravelInfo({
            destination: regionName || "",
            startDate: "",
            endDate: "",
            totalDays: 0,
            nights: 0,
            durationText: "",
          });
          setSelectedByNight([]);
        }

        // 저장된 장소(서버 → 실패 시 로컬)
        try {
          const res = await axios.get(
            `http://localhost:8080/draft-plans/${encodeURIComponent(uuid)}/places/selected`
          );
          const list: MinimalPlace[] = (res.data || []).map((p: any) => ({
            id: p.contentId,
            name: p.title,
            addr: p.addr,
            lat: p.latitude,
            lng: p.longitude,
            imageUrl: p.image,
            category: p.placeType as "A01" | "A02" | "A03",
          }));
          setSavedPlaces(list);
        } catch {
          const raw = localStorage.getItem(`selectedPlaces:${uuid}`);
          if (raw) {
            setSavedPlaces(JSON.parse(raw));
          }
        }
      } catch (err) {
        console.error("❌ 여행 meta 정보 불러오기 실패", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 목록 초기화
  useEffect(() => {
    setAccommodations([]);
    setPage(0);
    setHasMore(true);
  }, []);

  // 페이지 변경 시 로드
  useEffect(() => {
    loadAccommodations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadAccommodations = async () => {
    if (!hasMore || loading) return;

    const uuid = getUuidFromCookie();
    if (!uuid) {
      console.warn("⚠️ uuid 쿠키가 없습니다. 요청 건너뜀");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8080/draft-plans/${encodeURIComponent(uuid)}/B01/paged?page=${page}&size=20`
      );

      const newData: AccommWithMeta[] = res.data.content.map((item: any) => ({
        id: item.contentId,
        name: item.title,
        addr: item.addr || "",
        imageUrl: item.image || "/placeholder.jpg",
        likes: item.likeCount ?? 0,
        rating: item.averageRating ?? 0,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
      }));

      setAccommodations((prev) => [...prev, ...newData]);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error("❌ 숙소 불러오기 실패", err);
    } finally {
      setLoading(false);
    }
  };

  // 무한 스크롤 옵저버
  const lastAccommodationRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // 리스트 카드 클릭 → 모달 오픈
  const openSelectModal = (a: AccommWithMeta) => {
    if (travelInfo.nights <= 0) return;
    setCurrentAccommodation({
      id: a.id,
      name: a.name,
      addr: a.addr,
      imageUrl: a.imageUrl,
    });
    setModalOpen(true);
  };

  // 오른쪽 패널 유틸
  const resetAll = () => {
    setSelectedByNight(Array(travelInfo.nights).fill(null));
    setShowValidationError(false);
  };
  const removeNight = (idx: number) => {
    setSelectedByNight((prev) => prev.map((v, i) => (i === idx ? null : v)));
    setShowValidationError(false);
  };

  // 한 박의 구간 텍스트
  const renderNightRange = (idx: number) => {
    if (!travelInfo.startDate) return "";
    const start = new Date(travelInfo.startDate);
    const s = addDays(start, idx);
    const e = addDays(start, idx + 1);
    const sTxt = format(s, "MM.dd(EEE)", { locale: ko });
    const eTxt = format(e, "MM.dd(EEE)", { locale: ko });
    return `${sTxt} ~ ${eTxt}`;
  };

  // 지역 기본 뷰
  const regionView = useMemo(
    () => resolveRegionView(travelInfo.destination),
    [travelInfo.destination]
  );

  // 선택된 숙소 마커(보라색) — order 전달(숫자는 표시하지 않고 아이콘만 사용)
  const accommodationMarkers: MapMarker[] = useMemo(() => {
    const idToCoord = new Map(
      accommodations.map((a) => [
        a.id,
        { lat: a.latitude, lng: a.longitude, name: a.name, addr: a.addr },
      ])
    );

    return selectedByNight
      .map((sel, idx) => ({ sel, idx }))
      .filter(({ sel }) => !!sel)
      .map(({ sel, idx }) => {
        const s = sel as Accommodation;
        const meta = idToCoord.get(s.id);
        return meta && typeof meta.lat === "number" && typeof meta.lng === "number"
          ? ({
              id: `acc-${s.id}`,
              title: meta.name,
              position: { lat: meta.lat as number, lng: meta.lng as number },
              category: "B01",
              order: idx + 1, // 전달만(숫자 렌더링은 Map에서 아이콘 처리)
              infoHtml: `
                <div style="max-width:200px">
                  <div style="font-weight:600;margin-bottom:4px">${meta.name}</div>
                  <div style="font-size:12px;color:#555">${meta.addr || ""}</div>
                </div>
              `,
            } as MapMarker)
          : null;
      })
      .filter((m): m is MapMarker => !!m);
  }, [selectedByNight, accommodations]);

  // 이전 단계에서 고른 장소 마커(카테고리 반영) + 선택 순서(order) 유지
  const placeMarkers: MapMarker[] = useMemo(() => {
    return savedPlaces
      .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
      .map((p, idx) => ({
        id: `place-${p.id}`,
        title: p.name,
        position: { lat: p.lat as number, lng: p.lng as number },
        category: (p.category ?? "A01") as "A01" | "A02" | "A03",
        order: idx + 1, // 선택 순서 번호(1..N)
        infoHtml: `
          <div style="max-width:200px">
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div style="font-size:12px;color:#555">${p.addr || ""}</div>
          </div>
        `,
      }));
  }, [savedPlaces]);

  // 두 종류 마커 합치기
  const allMarkers: MapMarker[] = useMemo(() => {
    return [...placeMarkers, ...accommodationMarkers];
  }, [placeMarkers, accommodationMarkers]);

  // ✅ 다음 버튼: 모든 Night 채움 검증 + 서버 저장 + 라우트 모달
  const handleNext = async () => {
    const allFilled =
      selectedByNight.length === travelInfo.nights && selectedByNight.every(Boolean);

    if (!allFilled) {
      setShowValidationError(true);
      return;
    }

    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert("UUID가 없습니다.");
      return;
    }

    try {
      // Night 수만큼 날짜 배열 생성 (체크인 기준)
      const dates: string[] = [];
      const base = new Date(travelInfo.startDate);
      for (let i = 0; i < travelInfo.nights; i++) {
        const d = addDays(base, i);
        dates.push(d.toISOString().split("T")[0]);
      }

      // 각 Night에 선택된 숙소 id 매핑
      const requestBody = dates.map((date, idx) => ({
        date,
        contentId: (selectedByNight[idx] as Accommodation).id,
      }));

      await axios.post(
        `http://localhost:8080/draft-plans/${encodeURIComponent(uuid)}/accommodations`,
        requestBody
      );

      setShowValidationError(false);
      setShowRoutePopup(true);
    } catch (err) {
      alert("숙소 선택 저장 실패");
      console.error(err);
    }
  };

  // 선택된 숙소 패널
  const SelectedPanel = (
    <div className="space-y-4">
      {showValidationError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          일정에 모든 Night의 숙소를 지정해 주세요.
        </div>
      )}

      <div className="flex items-center justify-end text-sm">
        <button
          onClick={resetAll}
          className="flex items-center gap-1 text-red-500 hover:text-red-600"
          title="초기화"
        >
          초기화 <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {travelInfo.nights === 0 && (
          <div className="text-sm text-gray-500">숙소가 필요 없는 일정입니다.</div>
        )}

        {Array.from({ length: travelInfo.nights }).map((_, idx) => {
          const sel = selectedByNight[idx];
          const highlightEmpty = showValidationError && !sel;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700">
                {idx + 1}
              </div>

              <div
                className={`flex-1 rounded-xl border p-3 transition hover:shadow-sm ${
                  highlightEmpty ? "border-red-300" : "border-gray-200"
                }`}
              >
                <div className="mb-2 text-xs text-gray-400">{renderNightRange(idx)}</div>

                {sel ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={sel.imageUrl || "/placeholder.jpg"}
                      alt={sel.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{sel.name}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{sel.addr}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        className="text-xs text-blue-600 hover:underline"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        예약하기
                      </a>
                      <button
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                        onClick={() => removeNight(idx)}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">숙소를 추가해주세요</div>
                      <div className="mt-0.5 text-xs text-gray-400">
                        숙소 목록에서 선택 후 모달에서 Night를 지정하세요
                      </div>
                    </div>

                    <a
                      className="text-xs text-blue-600 hover:underline"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                    >
                      예약하기
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <UnifiedFourColumnLayout
        mode="accommodation"
        activeStep={4}
        setActiveStep={() => {}}
        onNext={handleNext}
        selectedPanel={SelectedPanel}
        mapCenter={regionView.center}
        mapZoom={regionView.zoom}
        mapMarkers={allMarkers}
        selectedMarkerId={selectedMarkerId}
        onMarkerClick={(id) => setSelectedMarkerId(id)}
      >
        {/* 가운데: 숙소 목록 */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              {travelInfo.destination || "여행지"}
            </h2>
            <div className="mb-4 space-y-1 text-sm text-gray-600">
              <div>{travelInfo.durationText}</div>
              <div>
                총 여행 일:{" "}
                {travelInfo.totalDays > 1
                  ? `${travelInfo.totalDays - 1}박 ${travelInfo.totalDays}일`
                  : travelInfo.totalDays === 1
                  ? "당일여행"
                  : "-"}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="숙소명을 검색해보세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            {accommodations.length === 0 && loading && (
              <div className="py-8 text-center">숙소 데이터를 불러오는 중입니다...</div>
            )}

            {accommodations
              .filter((a) =>
                searchTerm.trim()
                  ? a.name.toLowerCase().includes(searchTerm.toLowerCase())
                  : true
              )
              .map((a, index) => (
                <div
                  key={a.id}
                  ref={index === accommodations.length - 1 ? lastAccommodationRef : null}
                  className="flex cursor-pointer gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                  onClick={() => openSelectModal(a)}
                >
                  <img
                    src={a.imageUrl || "/placeholder.jpg"}
                    alt={a.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold text-gray-800">{a.name}</h4>

                    <p className="mb-2 text-sm text-gray-600">
                      <CategoryTag />
                      <span className="align-middle">{a.addr}</span>
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span>{a.likes ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{a.rating ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </UnifiedFourColumnLayout>

      {/* 모달: 슬롯 수 = 총 박수 */}
      <AccommodationSelectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        slotCount={travelInfo.nights}
        selected={selectedByNight}
        onChange={(arr) => {
          setSelectedByNight(arr);
          if (arr.every(Boolean)) setShowValidationError(false);
        }}
        currentAccommodation={currentAccommodation}
      />

      {/* 라우트 설정 모달 */}
      {showRoutePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <TravelPlanRoute onClose={() => setShowRoutePopup(false)} />
        </div>
      )}
    </>
  );
};

export default TravelPlanAccommodation;
