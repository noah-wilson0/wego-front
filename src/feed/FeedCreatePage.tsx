// src/pages/FeedCreatePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Send,
  Info as InfoIcon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import AppHeader from "../components/header/AppHeader"; // ✅ 헤더 추가

/** ───────── 타입 ───────── */
type Visibility = "PUBLIC" | "PRIVATE";

type DayCourse = { id: string; date: string; items: any[] };
type FeedDraft = {
  title: string;
  regionSlug: string; // read-only (server)
  startDate: string;  // read-only (server)
  endDate: string;    // read-only (server)
  people: number;
  chemiIds: number[]; // ✅ id로 관리
  visibility: Visibility;
  days: DayCourse[];
  coverFile?: File | null;
  coverPreview?: string;
  content: string;    // 후기 본문(서버의 description)
};

type FeedInitResponse = { slug: string; startDate: string; endDate: string };

// 서버에서 받아올 케미 레이블
type ChemiLabel = { id: number; name: string; description: string };
type ChemiListResponse = { chemiDtoList: ChemiLabel[] };

const uid = () => Math.random().toString(36).slice(2, 9);

/** ───────── 유틸 ───────── */
const calcSummary = (days: DayCourse[]) => {
  const totalStops = days.reduce((acc, d) => acc + d.items.length, 0);
  const km = totalStops * 5;
  const minutes = totalStops * 25;
  return { km, minutes };
};
const nightDays = (start: string, end: string) => {
  if (!start || !end) return "—박 —일";
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.max(
    0,
    Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const nights = Math.max(0, diff - 1);
  return `${nights}박 ${diff}일`;
};

/** ───────── 메인 ───────── */
const FeedCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // /feed/:id/new

  /** 서버에서 내려온 읽기 전용 값 */
  const [serverDefaults, setServerDefaults] = useState({
    regionSlug: "",
    startDate: "",
    endDate: "",
  });
  const [loadingInit, setLoadingInit] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  /** 케미 레이블 로딩 상태 */
  const [chemiOptions, setChemiOptions] = useState<ChemiLabel[]>([]);
  const [loadingChemi, setLoadingChemi] = useState(false);
  const [chemiError, setChemiError] = useState<string | null>(null);

  /** /feed/init/{travelPlanId} (localhost:8080) */
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      if (!id) return;
      setLoadingInit(true);
      setInitError(null);
      try {
        const res = await fetch(
          `http://localhost:8080/feed/init/${encodeURIComponent(id)}`,
          {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }
        );
        if (!res.ok) throw new Error(`init failed: ${res.status}`);
        const data: FeedInitResponse = await res.json();
        if (aborted) return;
        setServerDefaults({
          regionSlug: data.slug ?? "",
          startDate: data.startDate ?? "",
          endDate: data.endDate ?? "",
        });
      } catch (e: any) {
        if (!aborted) setInitError(e?.message || "초기화 실패");
      } finally {
        if (!aborted) setLoadingInit(false);
      }
    };
    run();
    return () => {
      aborted = true;
    };
  }, [id]);

  /** /chemi/labels (localhost:8080) */
  useEffect(() => {
    let aborted = false;
    const run = async () => {
      setLoadingChemi(true);
      setChemiError(null);
      try {
        const res = await fetch(`http://localhost:8080/chemi/labels`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`chemi fetch failed: ${res.status}`);
        const data: ChemiListResponse = await res.json();
        if (aborted) return;
        setChemiOptions(data.chemiDtoList ?? []);
      } catch (e: any) {
        if (!aborted) setChemiError(e?.message || "케미 목록을 불러오지 못했어요.");
      } finally {
        if (!aborted) setLoadingChemi(false);
      }
    };
    run();
    return () => { aborted = true; };
  }, []);

  /** 초안 상태 */
  const [draft, setDraft] = useState<FeedDraft>({
    title: "",
    regionSlug: "",
    startDate: "",
    endDate: "",
    people: 2,
    chemiIds: [],
    visibility: "PUBLIC",
    days: [{ id: uid(), date: "", items: [] }],
    coverFile: null,
    coverPreview: undefined,
    content: "",
  });

  // 서버 초기값을 읽기전용 필드에 반영
  useEffect(() => {
    setDraft((d) => ({
      ...d,
      regionSlug: serverDefaults.regionSlug,
      startDate: serverDefaults.startDate,
      endDate: serverDefaults.endDate,
    }));
  }, [serverDefaults]);

  /** 파생값 & 발행 가능 여부 */
  const { km, minutes } = useMemo(() => calcSummary(draft.days), [draft.days]);
  const isPublishable = useMemo(() => {
    const hasTitle = draft.title.trim().length > 0;
    const hasDates = !!draft.startDate && !!draft.endDate;
    const hasBody = draft.content.trim().length >= 10;
    return hasTitle && hasDates && hasBody;
  }, [draft]);

  /** 표지 */
  const handleCover = (file?: File) => {
    if (!file) {
      setDraft((d) => ({ ...d, coverFile: null, coverPreview: undefined }));
      return;
    }
    const url = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, coverFile: file, coverPreview: url }));
  };

  /** 케미 선택 (id 기준) */
  const toggleChemi = (chemiId: number) =>
    setDraft((d) => {
      const exists = d.chemiIds.includes(chemiId);
      return {
        ...d,
        chemiIds: exists ? d.chemiIds.filter((v) => v !== chemiId) : [...d.chemiIds, chemiId],
      };
    });

  /** 케미 설명 팝업(포털) */
  const [openChemi, setOpenChemi] = useState<{ name: string; desc: string } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenChemi(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /** 발행 — 멀티파트 전송 */
  const [posting, setPosting] = useState(false);
  const onPublish = async () => {
    if (!isPublishable || posting) return;

    const travelPlanIdNum = Number(id);
    if (!Number.isFinite(travelPlanIdNum)) {
      alert("잘못된 여행 계획 ID 입니다.");
      return;
    }

    try {
      setPosting(true);

      // payload JSON
      const payload = {
        title: draft.title,
        description: draft.content,
        people: draft.people,
        travelPlanId: travelPlanIdNum,
        chemiIds: draft.chemiIds, // ✅ 서버 요구 형식
      };

      const form = new FormData();
      // JSON을 Blob으로 만들어 'payload' 파트에 담기
      form.append(
        "payload",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      // 표지 이미지가 있으면 coverImage로 추가
      if (draft.coverFile) {
        form.append("coverImage", draft.coverFile);
      }

      // POST /feed (localhost:8080)
      const res = await axios.post("http://localhost:8080/feed", form, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[피드 생성 성공]", res.data);
      alert("발행 완료!");
      navigate("/mypage/feed");
    } catch (err: any) {
      console.error("[피드 생성 실패]", err);
      alert(`발행에 실패했어요.\n${err?.response?.data?.message ?? err.message}`);
    } finally {
      setPosting(false);
    }
  };

  /** 선택된 케미의 표시용 이름 목록 (미리보기 배지용) */
  const selectedChemiNames = useMemo(() => {
    if (!chemiOptions.length || !draft.chemiIds.length) return [];
    const map = new Map(chemiOptions.map((c) => [c.id, c.name]));
    return draft.chemiIds.map((cid) => map.get(cid)).filter(Boolean) as string[];
  }, [chemiOptions, draft.chemiIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ 고정 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AppHeader activeMenu="mypage" />
      </div>

      {/* 본문은 헤더 높이만큼 패딩 */}
      <div className="pt-[64px] mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">피드 생성</h1>
          <div className="flex items-center gap-3 text-sm">
            {loadingInit && <span className="text-gray-500">여행계획 불러오는 중…</span>}
            {initError && <span className="text-red-500">초기화 실패: {initError}</span>}
            <button
              onClick={onPublish}
              disabled={!isPublishable || posting}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-white ${
                isPublishable && !posting ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-300"
              }`}
            >
              <Send className="h-4 w-4" />
              {posting ? "발행 중…" : "발행"}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* 좌측 폼 */}
          <div className="space-y-8 min-w-0">
            {/* 기본 정보 */}
            <section className="rounded-2xl border p-4">
              <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

              {/* 표지 이미지 */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">대표 이미지</label>
                <div className="flex items-center gap-4">
                  <div className="h-28 w-44 overflow-hidden rounded-xl border bg-gray-50">
                    {draft.coverPreview ? (
                      <img src={draft.coverPreview} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleCover(e.target.files?.[0])} />
                  {draft.coverPreview && (
                    <button onClick={() => handleCover(undefined)} className="rounded-xl border px-3 py-1 text-xs">
                      제거
                    </button>
                  )}
                </div>
              </div>

              {/* 제목 */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">제목 *</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="예) 제주도 힐링 여행"
                  className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* 읽기 전용: 지역/기간/슬러그 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <label className="mb-1 block text-sm font-medium">지역(슬러그, 서버 제공)</label>
                  <input value={draft.regionSlug} readOnly disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-gray-700" />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-sm font-medium">인원수</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.people}
                    onChange={(e) => setDraft((d) => ({ ...d, people: Number(e.target.value) || 1 }))}
                    className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">시작일(서버 제공)</label>
                  <input value={draft.startDate} readOnly disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-gray-700" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">종료일(서버 제공)</label>
                  <input value={draft.endDate} readOnly disabled className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-gray-700" />
                </div>
              </div>

              {/* 케미 태그: 서버 목록 (id 기반 선택) */}
              <div className="mt-4 min-w-0">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    케미 태그 (선택 {draft.chemiIds.length}개)
                  </label>
                  {loadingChemi && <span className="text-xs text-gray-500">불러오는 중…</span>}
                </div>

                {chemiError ? (
                  <div className="text-sm text-red-600">{chemiError}</div>
                ) : (
                  <div className="w-full max-w-full overflow-x-auto rounded-xl border p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="inline-flex whitespace-nowrap gap-2">
                      {chemiOptions.map((t) => {
                        const active = draft.chemiIds.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleChemi(t.id)}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                              active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-medium">{t.name}</span>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenChemi({ name: t.name, desc: t.description });
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:text-gray-600"
                              title="설명 보기"
                            >
                              <InfoIcon className="h-4 w-4" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 후기 작성 */}
            <section className="rounded-2xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">후기 작성</h2>
                <div className="text-xs text-gray-500">{draft.content.length.toLocaleString()}자</div>
              </div>
              <textarea
                value={draft.content}
                onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
                placeholder={`여행에서 느낀 점, 좋았던 장소, 팁 등을 자유롭게 작성해 주세요.`}
                className="min-h-[260px] w-full resize-y rounded-xl border px-3 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </section>
          </div>

          {/* 우측 미리보기 */}
          <aside className="h-fit rounded-2xl border p-4">
            <h3 className="mb-3 text-base font-semibold">미리보기</h3>
            <div className="overflow-hidden rounded-2xl border">
              <div className="h-36 w-full bg-gray-100">
                {draft.coverPreview ? (
                  <img src={draft.coverPreview} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <div className="text-sm text-gray-500">{draft.regionSlug || "지역"}</div>
                <div className="flex items-center justify-between">
                  <div className="truncate text-base font-semibold">{draft.title || "제목"}</div>
                  <span className="rounded-full border px-2 py-0.5 text-xs">{nightDays(draft.startDate, draft.endDate)}</span>
                </div>
                {/* 필요 시 이 줄을 "인원 {draft.people}명"만 남기고 쓰세요 */}
                <div className="text-xs text-gray-500">
                  총 {km}km · 약 {Math.round(minutes / 60)}시간 {minutes % 60}분 · 인원 {draft.people}명
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedChemiNames.slice(0, 3).map((name) => (
                    <span key={name} className="rounded-full border px-2 py-0.5 text-xs">
                      {name}
                    </span>
                  ))}
                  {draft.chemiIds.length > 3 && (
                    <span className="rounded-full border px-2 py-0.5 text-xs">+{draft.chemiIds.length - 3}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">후기 미리보기</h4>
              <div className="rounded-2xl border p-3 text-sm text-gray-700">
                {draft.content ? draft.content.slice(0, 280) + (draft.content.length > 280 ? "…" : "") : "작성된 후기가 없습니다."}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== 케미 설명 팝업 (포털) ===== */}
      {openChemi &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setOpenChemi(null)} />
            <div className="fixed left-1/2 top-1/2 z-[101] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-2xl">
              <div className="mb-2 text-sm font-semibold">{openChemi.name}</div>
              <div className="text-sm text-gray-700">{openChemi.desc}</div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setOpenChemi(null)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                  닫기
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default FeedCreatePage;
