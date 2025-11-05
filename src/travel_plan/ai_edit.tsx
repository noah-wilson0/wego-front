// src/travel_plan/ai_edit.tsx (또는 AiEditPage.tsx)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Send, Mic, Square } from "lucide-react";
import AiEditLayout from "./components/AiEditLayout";
import type { LatLng, MapMarker, MapPolyline } from "./components/mapTypes";

interface Place {
  content_id: string;
  placeType: "A01" | "A02" | "A03" | "B01";
  title: string;
  latitude: number;
  longitude: number;
}
interface TravelData {
  slug: string;
  start_date: string;
  end_date: string;
  places: Place[];
}

const mockTravel: TravelData = {
  slug: "제주",
  start_date: "2025-06-30",
  end_date: "2025-07-01",
  places: [
    { content_id: "p1", placeType: "A01", title: "제주공항", latitude: 33.506, longitude: 126.495 },
    { content_id: "p2", placeType: "A02", title: "동문시장", latitude: 33.513, longitude: 126.531 },
    { content_id: "p3", placeType: "A03", title: "카페거리", latitude: 33.45,  longitude: 126.56  },
    { content_id: "p4", placeType: "A01", title: "협재해변", latitude: 33.394, longitude: 126.238 },
  ],
};

const AiEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 쿼리스트링
  const params = new URLSearchParams(location.search);
  const travelPlanId = params.get("travelPlanId"); // ← 전달받은 id
  const mode = params.get("mode");
  const id = params.get("id");
  const token = params.get("token");
  const uuid = params.get("uuid");

  // 콘솔 확인
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[AI Edit] travelPlanId:", travelPlanId, "| mode:", mode, "| id:", id, "| token:", token, "| uuid:", uuid);
  }, [travelPlanId, mode, id, token, uuid]);

  // 더미 데이터/메시지
  const [travel, setTravel] = useState<TravelData | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "user", text: "2박 3일로 바꾸고, 1일차 저녁을 해산물로 바꿔줘." },
    { role: "assistant", text: "좋아요! 1일차 저녁을 동문시장 근처 해산물 식당으로 교체했습니다." },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ‘적용’ 상태 → 저장 버튼 활성화
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    setTravel(mockTravel);
  }, []);

  /** 지도 */
  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!travel) return [];
    return travel.places.map((p, i) => ({
      id: p.content_id,
      position: { lat: p.latitude, lng: p.longitude },
      title: p.title,
      category: p.placeType,
      order: i + 1,
      infoHtml: `<div>${p.title}</div>`,
    }));
  }, [travel]);
  const mapCenter: LatLng = mapMarkers[0]?.position ?? { lat: 36.5, lng: 127.9 };
  const mapZoom = 9;
  const polylines: MapPolyline[] = [];

  /** 더미 전송 */
  const handleSend = () => {
    const txt = input.trim();
    if (!txt) return;
    setMessages((prev) => [...prev, { role: "user", text: txt }]);
    setInput("");
    // 더미 응답
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "요청을 반영했어요. 1일차 이동 시간을 10분 단축했습니다. (더미 응답)" },
      ]);
    }, 300);
  };

  /** 음성 입력(토글만) */
  const startVoice = () => setRecording(true);
  const stopVoice = () => setRecording(false);

  /** 뒤로 이동 경로 */
  const backToCheck = () => {
    if (travelPlanId) navigate(`/check/${encodeURIComponent(travelPlanId)}`);
    else navigate("/check");
  };

  /** 사이드바 */
  const sidebarContent = (
    <button className="w-12 h-8 rounded bg-black text-white text-sm font-semibold">전체</button>
  );

  const sidebarButtons = (
    <div className="flex flex-col gap-2">
      {/* 취소 → /check/{travelPlanId} */}
      <button
        onClick={backToCheck}
        className="py-2 px-4 rounded-md text-base bg-gray-100 text-gray-700 hover:bg-gray-200"
      >
        취소
      </button>

      {/* 적용 → 저장 활성화 */}
      <button
        onClick={() => setIsApplied(true)}
        className={`py-2 px-4 rounded-md text-base ${
          isApplied ? "bg-gray-900 text-white hover:bg-black" : "bg-gray-800 text-white"
        }`}
        title="AI 적용 결과를 임시 반영합니다."
      >
        적용
      </button>

      {/* 저장 → 적용 후에만 활성화, 저장 누르면 /check/{id}로 복귀 */}
      <button
        disabled={!isApplied}
        onClick={backToCheck}
        className={`py-2 px-4 rounded-md text-base ${
          isApplied
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-red-100 text-red-300 cursor-not-allowed"
        }`}
        title={isApplied ? "일정 저장 후 돌아갑니다." : "먼저 적용을 눌러주세요."}
      >
        저장
      </button>
    </div>
  );

  /** 본문(대화 + 입력창) */
  const main = (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold">{travel?.slug ?? "여행"} · AI 편집</h1>
        <p className="text-sm text-gray-500">
          {travel?.start_date} ~ {travel?.end_date}
        </p>
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
          placeholder="AI에게 수정 요청을 입력하세요. 예) 1일차 저녁을 해산물로 바꿔줘"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
        />
        {!recording ? (
          <button
            onClick={startVoice}
            className="h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            title="음성으로 입력"
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={stopVoice}
            className="h-11 w-11 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center"
            title="녹음 중지"
          >
            <Square className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={handleSend}
          className="h-11 px-4 rounded-xl bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap inline-flex items-center justify-center"
          title="AI에게 전송"
        >
          <Send className="h-5 w-5 mr-1" />
          보내기
        </button>
      </div>
    </div>
  );

  return (
    <AiEditLayout
      sidebarContent={sidebarContent}
      sidebarButtons={sidebarButtons}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
      mapMarkers={mapMarkers}
      polylines={polylines}
    >
      {main}
    </AiEditLayout>
  );
};

export default AiEditPage;
