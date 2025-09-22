// src/mypage/components/TravelPlanItem.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Link as LinkIcon, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export interface TravelPlanData {
  id: number;                 // 서버 Long -> number
  title: string;
  destination: string;        // 예: slug 라벨
  dDay: string;
  startDate: string;
  endDate: string;
  lastModified: string;
  image: string;
  tags: string[];
}

/** 공통 드롭다운 액션 타입 — 모든 화면에서 동일하게 사용 */
export type TravelPlanMenuAction = 'view' | 'share' | 'print' | 'writeFeed' | 'delete';

interface TravelPlanItemProps {
  plan: TravelPlanData;

  /** (선택) 클릭 시 실행할 커스텀 핸들러.
   *  반환값과 관계없이 실행 후 기본 네비게이션도 수행됩니다.
   *  기본 네비를 막고 싶다면 disableNavigate를 true로.
   */
  onClick?: (plan: TravelPlanData) => void;

  /** (선택) 이동 경로를 커스텀.
   *  문자열 혹은 plan을 받아 경로를 만드는 함수.
   *  미지정 시 기본값은 `/check/${plan.id}`.
   */
  to?: string | ((plan: TravelPlanData) => string);

  /** (선택) true면 기본 네비게이션을 하지 않음(온전히 onClick만 수행). */
  disableNavigate?: boolean;

  /** (선택) 드롭다운 메뉴 공통 액션 핸들러 — 모든 페이지에서 통일된 이벤트 진입점 */
  onMenuAction?: (action: TravelPlanMenuAction, plan: TravelPlanData) => void;
}

const TravelPlanItem: React.FC<TravelPlanItemProps> = ({
  plan,
  onClick,
  to,
  disableNavigate = false,
  onMenuAction,
}) => {
  const { id, title, destination, dDay, startDate, endDate, lastModified, image, tags } = plan;
  const navigate = useNavigate();

  // ----- 드롭다운 상태 & 참조 -----
  const [openMenu, setOpenMenu] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ----- 공유 모달 상태 -----
  const [openShare, setOpenShare] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resolvePath = () => {
    if (typeof to === 'function') return to(plan);
    if (typeof to === 'string') return to;
    if (id != null) return `/check/${id}`;       // ✅ 기본: /check/:travelPlanId
    return undefined;
  };

  const go = () => {
    const path = resolvePath();
    if (!path) {
      console.warn('[TravelPlanItem] id 또는 to가 없어 이동할 수 없습니다.', plan);
      return;
    }
    navigate(path);
  };

  const handleClick = () => {
    onClick?.(plan);
    if (!disableNavigate) go();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // ----- 케밥 버튼 클릭: 드롭다운 열기/닫기 -----
  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 네비 방지
    setOpenMenu((prev) => !prev);
  };

  // ----- 바깥 클릭 시 닫기 -----
  useEffect(() => {
    if (!openMenu) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(target)
      ) {
        setOpenMenu(false);
      }
    };
    const onDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [openMenu]);

  // ----- 공통 액션 처리기: 모든 화면에서 동일 인터페이스 -----
  const emitMenuAction = (action: TravelPlanMenuAction) => {
    onMenuAction?.(action, plan); // 소비자 커스텀 훅 진입 지점

    switch (action) {
      case 'view':
        go();
        break;
      case 'share':
        // 공유 모달 열기
        setOpenShare(true);
        break;
      case 'print':
        window.print();setOpenShare
        break;
      case 'writeFeed':
        navigate(`/feed/${plan.id}/new`);
        break;
      case 'delete':
        // TODO: 확인 모달 → 삭제 API
        console.log('[delete] 삭제 실행', plan);
        break;
      default:
        break;
    }

    setOpenMenu(false);
  };

  // ----- 공유 토큰 생성 API 호출 -----
  const handleCreateShareLink = async () => {
    if (!id) return;
    setIsCreating(true);
    setErrorMsg(null);
    setCopyOk(false);

    try {
      // 백엔드: POST /travel-plans/{travelPlanId}/share → token(String)
      const res = await axios.post<string>(`http://localhost:8080/travel-plans/${id}/share`, null, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      const token = res.data; // 백엔드에서 순수 토큰 문자열이라고 가정
      const base = window.location.origin; // 예: http://localhost:5173
      // 임시 경로: /check/token/:token  (App.tsx에 라우트 추가해둠)
      const url = `${base}/check/t/${token}`;
      setShareUrl(url);
    } catch (err) {
      console.error('[createShareToken] 실패', err);
      setErrorMsg('공유 링크를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsCreating(false);
    }
  };

  // ----- 클립보드 복사 -----
  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1500);
    } catch {
      setErrorMsg('클립보드 복사에 실패했어요.');
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="flex items-start mb-16 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
      >
        <img src={image} alt={destination} className="w-60 h-60 rounded-2xl object-cover mr-8" />
        <div className="flex-1 pt-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <span className="bg-black text-white text-sm px-4 py-2 rounded-full mr-4 font-medium">
                {dDay}
              </span>
              <h3 className="font-bold text-3xl">{destination}</h3>
            </div>

            {/* 우측: 최근 수정일 + 케밥 메뉴 */}
            <div className="relative text-right text-gray-400">
              <div className="text-sm mb-1">최근 수정일</div>
              <div className="text-sm">{lastModified}</div>

              <button
                ref={menuBtnRef}
                onClick={handleMoreClick}
                className="mt-2 ml-auto block hover:text-gray-600 transition-colors"
                aria-haspopup="menu"
                aria-expanded={openMenu}
                aria-label={`${title} 더보기`}
                onMouseDown={(e) => e.stopPropagation()} // 드래그/포인터 시작도 카드 클릭 막기
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* 드롭다운 메뉴 */}
              {openMenu && (
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label="여행 계획 메뉴"
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg py-2 z-10"
                  onClick={(e) => e.stopPropagation()} // 카드 네비 방지
                >
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => emitMenuAction('view')}
                  >
                    일정보기
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => emitMenuAction('share')}
                  >
                    공유
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => emitMenuAction('print')}
                  >
                    프린트
                  </button>
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    onClick={() => emitMenuAction('writeFeed')}
                  >
                    피드 쓰기
                  </button>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => emitMenuAction('delete')}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-lg mb-2">{title}</h4>
            <p className="text-gray-500 text-base">
              {startDate} ~ {endDate}
            </p>
          </div>

          <div className="flex space-x-3">
            {tags.map((tag, index) => (
              <span key={index} className="bg-blue-500 text-white text-sm px-6 py-2 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 공유 모달 ===== */}
      {openShare && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpenShare(false)}>
          <div
            className="bg-white w-[520px] rounded-2xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-gray-100">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">일정의 공개 링크 공유</h2>
                <p className="text-sm text-gray-600 mt-1">
                  링크는 <b>여행 종료일 + 1일</b>까지만 유효합니다.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm text-gray-600 mb-2">공유 링크</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl ?? ''}
                  placeholder="아직 링크가 없습니다. ‘링크 만들기’를 눌러주세요."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                {shareUrl ? (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copyOk ? '복사됨' : '복사하기'}
                  </button>
                ) : (
                  <button
                    disabled={isCreating}
                    onClick={handleCreateShareLink}
                    className={`px-4 py-2 rounded-lg text-sm text-white ${isCreating ? 'bg-gray-400' : 'bg-black hover:bg-gray-900'}`}
                  >
                    {isCreating ? '만드는 중...' : '링크 만들기'}
                  </button>
                )}
              </div>

              {errorMsg && <p className="text-red-600 text-sm mt-2">{errorMsg}</p>}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setOpenShare(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TravelPlanItem;
