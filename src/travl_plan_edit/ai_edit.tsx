// src/travel_plan/ai_edit.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Mic, Square } from "lucide-react";
import AiEditLayout from "../travel_plan/components/AiEditLayout";
import TravelPlanAiEditSchedulePlaceCard from "./components/TravelPlanAiEditSchedulePlaceCard";
import type { LatLng, MapMarker, MapPolyline } from "../travel_plan/components/mapTypes";
import axios from "axios";

/** -------------------- API -------------------- */
const api = axios.create({ baseURL: "http://localhost:8080", withCredentials: true });

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
  start_time: string;
  end_time: string;
}
interface ServerDay {
  date: string;
  start_time: string;
  end_time: string;
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
  routes: { route_type: string | null; dailyRoutes: Record<string, ServerRouteLeg[]> }[];
}

/** -------------------- 상수 (칩/여백/열폭) -------------------- */
const COL_W = 236; // 타임라인 열 너비
const BADGE_W = 24; // 번호칩 가로폭
const GUTTER_GAP = 6; // 번호칩과 카드 사이 간격(px)

/** 번호칩 */
function NumBadge({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold mt-1">
      {n}
    </span>
  );
}

/** 이동시간 행(콤팩트) */
function CompactTravelTimeRowAligned({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center px-1 select-none" style={{ gap: GUTTER_GAP }}>
      <div style={{ width: BADGE_W }} />
      <div className="w-3 flex justify-center">
        <span className="h-4 border-l-2 border-dotted border-gray-300" />
      </div>
      <span className="text-[11px] text-gray-500">이동</span>
      <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-2 rounded-md font-semibold bg-gray-100 text-gray-800 text-[12px]">
        {minutes}
      </span>
      <span className="text-[11px] text-gray-500">분</span>
    </div>
  );
}

/** -------------------- 페이지 -------------------- */
const AiEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const st = (location.state ?? {}) as {
    mode?: "member" | "share" | "draft";
    id?: string;
    travelPlanId?: string;
    token?: string;
    uuid?: string;
  };
  const qs = new URLSearchParams(location.search);
  const travelPlanId =
    st.travelPlanId ?? st.id ?? qs.get("travelPlanId") ?? qs.get("id") ?? undefined;

  const [plan, setPlan] = useState<ServerTravelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [persisting, setPersisting] = useState(false); // 저장/취소 중 여부

  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "user", text: "2박 3일로 바꾸고, 1일차 저녁을 해산물로 바꿔줘." },
    { role: "assistant", text: "좋아요! 1일차 저녁을 동문시장 근처 해산물 식당으로 교체했습니다." },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [rightView, setRightView] = useState<"map" | "timeline">("timeline");

  /** -------------------- 초기 로드 -------------------- */
  useEffect(() => {
    if (!travelPlanId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<ServerTravelData>(`/api/v1/app/revise-plans/${travelPlanId}/me`);
        if (mounted) setPlan(res.data);
      } catch (e) {
        console.error("[AI Edit] 일정 불러오기 실패", e);
        alert("일정을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [travelPlanId]);

  /** -------------------- 이동시간 매핑 -------------------- */
  const travelTimes = useMemo(() => {
    if (!plan) return {} as Record<string, Record<number, number>>;
    const map: Record<string, Record<number, number>> = {};
    for (const r of plan.routes ?? []) {
      for (const date of Object.keys(r.dailyRoutes || {})) {
        const segs = r.dailyRoutes[date] || [];
        if (!map[date]) map[date] = {};
        for (const seg of segs) map[date][seg.sequence] = Math.ceil((seg.duration ?? 0) / 60);
      }
    }
    return map;
  }, [plan]);

  /** -------------------- 지도 데이터 -------------------- */
  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!plan || rightView !== "map") return [];
    let order = 1;
    return plan.days
      .flatMap((d) => (d.places || []).map((p) => ({ ...p, date: d.date })))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
      .map((p) => ({
        id: p.content_id,
        position: { lat: p.latitude, lng: p.longitude },
        title: p.title,
        category: p.placeType,
        order: order++,
        infoHtml: `<div>${p.title}<br/>${p.start_time ?? ""} ~ ${p.end_time ?? ""}</div>`,
      }));
  }, [plan, rightView]);

  const polylines: MapPolyline[] = useMemo(() => {
    if (!plan || rightView !== "map") return [];
    const lines: MapPolyline[] = [];
    for (const day of plan.days) {
      const pts = day.places.filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
      );
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i],
          b = pts[i + 1];
        lines.push({
          id: `${day.date}-${i}`,
          path: [
            { lat: a.latitude, lng: a.longitude },
            { lat: b.latitude, lng: b.longitude },
          ],
        });
      }
    }
    return lines;
  }, [plan, rightView]);

  const mapCenter: LatLng = useMemo(
    () => mapMarkers[0]?.position ?? { lat: 36.5, lng: 127.9 },
    [mapMarkers]
  );
  const mapZoom = 9;

  /** -------------------- AI 편집 요청 -------------------- */
  const handleSend = async () => {
    const txt = input.trim();
    if (!txt || !travelPlanId || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: txt }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.post<ServerTravelData>(
        `/api/v1/app/revise-plans/${travelPlanId}/generate`,
        { prompt: txt }
      );

      // 채팅 메시지
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "AI가 제안을 반영했어요. 타임라인을 확인해 주세요." },
      ]);

      // 타임라인 데이터 교체
      setPlan(res.data);

      // 필요 시 자동 전환
      // setRightView("timeline");
    } catch (e) {
      console.error("[AI Edit] 요청 실패:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ AI 편집 요청 중 오류가 발생했습니다." },
      ]);
    } finally {
      setSending(false);
    }
  };

  /** -------------------- 저장/취소 동작 연결 -------------------- */
  const saveChanges = async () => {
    if (!travelPlanId || persisting) return;
    try {
      setPersisting(true);
      await api.patch(`/api/v1/app/revise-plans/${travelPlanId}/me`);
      alert("변경사항이 저장되었습니다.");
      navigate(`/check/${travelPlanId}`);
    } catch (error) {
      console.error("변경사항 저장 실패", error);
      alert("변경사항을 저장하는 데 실패했습니다.");
    } finally {
      setPersisting(false);
    }
  };

  const cancelChanges = async () => {
    if (!travelPlanId || persisting) return;
    try {
      setPersisting(true);
      await api.delete(`/api/v1/app/revise-plans/${travelPlanId}/me`);
      alert("변경사항이 취소되었습니다.");
      navigate(`/check/${travelPlanId}`);
    } catch (error) {
      console.error("변경사항 취소 실패", error);
      alert("변경사항을 취소하는 데 실패했습니다.");
    } finally {
      setPersisting(false);
    }
  };

  /** -------------------- 사이드바 -------------------- */
  const sidebarContent = (
    <button className="w-12 h-8 rounded bg-black text-white text-sm font-semibold">전체</button>
  );
  const sidebarButtons = (
    <div className="flex flex-col gap-2">
      <button
        onClick={cancelChanges}
        className={`py-2 px-4 rounded-md text-base ${
          persisting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        disabled={persisting}
      >
        {persisting ? "취소 중..." : "취소"}
      </button>
      <button
        onClick={saveChanges}
        className={`py-2 px-4 rounded-md text-base text-white ${
          persisting ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:opacity-90"
        }`}
        disabled={persisting}
      >
        {persisting ? "저장 중..." : "저장"}
      </button>
    </div>
  );

  /** -------------------- 왼쪽 채팅 -------------------- */
  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{plan?.label ?? "여행"} · AI 편집</h1>
            <p className="text-sm text-gray-500">
              {loading ? "불러오는 중..." : `${plan?.start_date ?? ""} ~ ${plan?.end_date ?? ""}`}
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              className={`px-3 py-1.5 text-sm rounded-lg ${
                rightView === "map" ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setRightView("map")}
              disabled={sending || persisting}
            >
              지도
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-lg ${
                rightView === "timeline"
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setRightView("timeline")}
              disabled={sending || persisting}
            >
              타임라인
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-3 py-2 rounded-2xl whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-auto bg-violet-600 text-white rounded-br-sm"
                : "mr-auto bg-gray-100 text-gray-800 rounded-bl-sm"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="AI에게 수정 요청을 입력하세요"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
          disabled={sending || persisting}
        />
        {!recording ? (
          <button
            onClick={() => setRecording(true)}
            className="h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            title="음성으로 입력"
            disabled={sending || persisting}
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => setRecording(false)}
            className="h-11 w-11 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center"
            title="녹음 중지"
            disabled={sending || persisting}
          >
            <Square className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={handleSend}
          className={`h-11 px-4 rounded-xl text-white flex items-center justify-center ${
            sending || persisting ? "bg-gray-400 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"
          }`}
          title="AI에게 전송"
          disabled={sending || persisting}
        >
          <Send className="h-5 w-5 mr-1" />
          {sending ? "반영 중..." : "보내기"}
        </button>
      </div>
    </div>
  );

  /** -------------------- 오른쪽 타임라인 -------------------- */
  const rightTimeline = (
    <div className="h-full w-full bg-white overflow-hidden">
      {loading || !plan ? (
        <div className="text-gray-400 text-sm p-6">일정을 불러오는 중...</div>
      ) : (
        <div className="h-full w-full overflow-auto">
          <div className="min-w-max px-4 py-4 flex gap-6">
            {plan.days.map((day, idx) => (
              <div
                key={day.date}
                className="shrink-0 bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-100"
                style={{ width: COL_W }}
              >
                <div className="flex items-end justify-between mb-2 pb-1 border-b border-gray-200">
                  <div className="text-base font-semibold">{idx + 1}일차</div>
                  <div className="text-xs text-gray-400">{day.date}</div>
                </div>

                <div className="relative">
                  <div
                    className="absolute top-0 bottom-2 border-l border-dashed border-gray-200"
                    style={{ left: BADGE_W + 4 }}
                  />

                  <div className="space-y-3">
                    {(day.places ?? []).map((p, i) => {
                      const seq = i + 1;
                      const minutes = travelTimes?.[day.date]?.[seq];
                      const time =
                        p.start_time && p.end_time ? `${p.start_time}-${p.end_time}` : undefined;

                      return (
                        <React.Fragment key={`${day.date}-${p.content_id}`}>
                          <div className="flex items-stretch" style={{ gap: GUTTER_GAP }}>
                            <NumBadge n={seq} />
                            <div className="flex-1 min-w-0">
                              <TravelPlanAiEditSchedulePlaceCard
                                place={{
                                  id: p.content_id,
                                  name: p.title,
                                  category: p.placeType,
                                  imageUrl: p.image?.trim() ? p.image : "/placeholder.jpg",
                                  time,
                                }}
                              />
                            </div>
                          </div>

                          {i < (day.places?.length ?? 0) - 1 &&
                            Number.isFinite(Number(minutes)) && (
                              <CompactTravelTimeRowAligned minutes={Number(minutes)} />
                            )}
                        </React.Fragment>
                      );
                    })}

                    {(day.places ?? []).length === 0 && (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-gray-400 text-sm">
                        일정이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /** -------------------- 렌더링 -------------------- */
  return (
    <AiEditLayout
      sidebarContent={sidebarContent}
      sidebarButtons={sidebarButtons}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      mapMarkers={mapMarkers}
      polylines={polylines}
      rightContent={rightView === "timeline" ? rightTimeline : undefined}
    >
      {leftPanel}
    </AiEditLayout>
  );
};

export default AiEditPage;
