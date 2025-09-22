// src/components/Settlement.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Pencil, X } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import BottomSheet from '../components/SettlementBottomSheet';

/* ===== Types ===== */
type Expense = { id: string; label: string; amount: number };

interface SettlementProps {
  isAuthenticated: boolean;
  onRequireLogin?: () => void;
  initialBudget?: number;
  initialExpenses?: Expense[];
  /** 레이아웃에서 시트를 열 때 쓰는 커스텀 이벤트 이름 */
  openSignal?: string;
}

interface ApiSettlementItem {
  id: number;
  participant: string;
  category: string; // e.g. "CAFE"
  paid: number;
  paidAt: string;
}
interface ApiSettlementResponse {
  settlementId: number;
  budget: number | string | null;
  totalPaid: number;
  items: ApiSettlementItem[];
}

/* ===== 정산 결과 타입 ===== */
interface ApiSettlementResult {
  budget: number;
  people: number;
  participants: {
    name: string;
    paidTotal: number; // 낸 총액
    share: number;     // 부담액
    diff: number;      // 정산금(+)더내기 / (-)돌려받기
  }[];
}

/* ===== ENUM ↔ 라벨 ===== */
const CATEGORY_KO = {
  TRANSPORT: '교통',
  CAFE: '카페',
  RESTAURANT: '식비',
  ACCOMMODATION: '숙박',
  SHOPPING: '쇼핑',
  ETC: '기타',
} as const;
const KO_TO_ENUM = Object.fromEntries(
  Object.entries(CATEGORY_KO).map(([en, ko]) => [ko, en])
) as Record<string, keyof typeof CATEGORY_KO>;
const CATEGORY_ORDER = ['식비', '카페', '교통', '숙박', '쇼핑', '기타'];

/* ===== Utils ===== */
const fmt = (v: number) => v.toLocaleString('ko-KR');
const parseBudget = (b: number | string | null | undefined): number => {
  if (b === null || b === undefined) return 0;
  if (typeof b === 'number') return Number.isFinite(b) ? b : 0;
  const n = Number(String(b).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/* ===== Budget Modal (Portal) ===== */
interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
  pendingBudget: string;
  onChangePendingBudget: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => Promise<void> | void;
  confirming?: boolean;
}
const BudgetModal: React.FC<BudgetModalProps> = ({
  open,
  onClose,
  pendingBudget,
  onChangePendingBudget,
  onConfirm,
  confirming = false,
}) => {
  if (!open || typeof document === 'undefined') return null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 bg-black/30 z-[1000]" onClick={onClose} />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center">
        <div
          className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
            title="닫기"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <h3 className="text-lg font-bold mb-3">예산 설정</h3>
          <p className="text-sm text-gray-600 mb-3">이번 여행에서 사용할 예산을 입력하세요.</p>

          <label className="block text-sm text-gray-600 mb-1">예산(원)</label>
          <input
            value={pendingBudget}
            onChange={onChangePendingBudget}
            inputMode="numeric"
            placeholder="예: 1,000,000"
            className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-violet-300"
          />

          <div className="mt-4">
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="w-full px-4 py-2 rounded-md bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-60"
            >
              {confirming ? '저장 중…' : '예산 확정'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ===== 정산 결과 모달 ===== */
const SettlementResultModal: React.FC<{
  open: boolean;
  onClose: () => void;
  result: ApiSettlementResult | null;
}> = ({ open, onClose, result }) => {
  if (!open || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 bg-black/30 z-[1000]" onClick={onClose} />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center">
        <div
          className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <h3 className="text-xl font-bold mb-4">정산 결과</h3>

          {result ? (
            <>
              <div className="mb-4 flex items-center justify-between text-sm text-gray-700">
                <span>총 예산 <b>{fmt(result.budget)}</b>원</span>
                <span>참여 인원 <b>{result.people}</b>명</span>
              </div>

              <div className="space-y-3">
                {result.participants.map((p, idx) => (
                  <div key={idx} className="rounded-xl border bg-gray-50 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{p.name}</span>
                      <span
                        className={`font-semibold ${
                          p.diff > 0 ? 'text-red-500' : p.diff < 0 ? 'text-green-600' : 'text-gray-700'
                        }`}
                        title="정산금(양수: 더 내야 함 / 음수: 돌려받음)"
                      >
                        {p.diff > 0 ? `+${fmt(p.diff)}원` : `${fmt(p.diff)}원`}
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-white px-3 py-2 border">
                        <p className="text-gray-500">낸 금액</p>
                        <p className="mt-0.5 font-medium text-gray-800">{fmt(p.paidTotal)}원</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2 border">
                        <p className="text-gray-500">부담액</p>
                        <p className="mt-0.5 font-medium text-gray-800">{fmt(p.share)}원</p>
                      </div>
                      <div className="rounded-md bg-white px-3 py-2 border">
                        <p className="text-gray-500">정산금</p>
                        <p className="mt-0.5 font-medium">
                          <span className={p.diff > 0 ? 'text-red-500' : p.diff < 0 ? 'text-green-600' : 'text-gray-800'}>
                            {p.diff > 0 ? `+${fmt(p.diff)}` : fmt(p.diff)}원
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center py-6">정산 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

/* ===== Component ===== */
const Settlement: React.FC<SettlementProps> = ({
  isAuthenticated,
  onRequireLogin,
  initialBudget = 0,
  initialExpenses = [],
  openSignal = 'wego:open-settlement-sheet',
}) => {
  // 라우트: /check/:travelPlanId 또는 /check/t/:token
  const { travelPlanId, token } = useParams<{ travelPlanId?: string; token?: string }>();
  const isShare = !!token;

  // 엔드포인트 빌더
  const basePath = isShare
    ? `http://localhost:8080/travel-share-plans/${token}/settlements`
    : `http://localhost:8080/travel-plans/${travelPlanId}/settlements`;
  const url = (suffix = '') => `${basePath}${suffix}`;

  const [budget, setBudget] = useState<number>(initialBudget);
  const [pendingBudget, setPendingBudget] = useState<string>(initialBudget.toLocaleString('ko-KR'));
  const [isBudgetConfirmed, setIsBudgetConfirmed] = useState<boolean>(false);

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loading, setLoading] = useState<boolean>(false);

  // 서버 메타
  const [settlementId, setSettlementId] = useState<number | null>(null);
  const [serverTotalPaid, setServerTotalPaid] = useState<number>(0);

  // 바텀시트
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCategoryKo, setSheetCategoryKo] = useState<string>(CATEGORY_ORDER[1]);
  const [sheetAmount, setSheetAmount] = useState('1,000');
  const [sheetPayer, setSheetPayer] = useState('@홍길동');

  // 예산 모달
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [confirmingBudget, setConfirmingBudget] = useState(false);

  // 정산 결과 모달
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [settlementResult, setSettlementResult] = useState<ApiSettlementResult | null>(null);

  // 버튼 클릭 후 예산 저장 성공 시 시트를 자동으로 열기 위한 플래그
  const openSheetAfterBudget = useRef(false);

  /* ---------- 최초 데이터 조회 ---------- */
  const fetchSettlement = async () => {
    if (!isAuthenticated) return;
    if (!isShare && !travelPlanId) return;
    if (isShare && !token) return;

    try {
      setLoading(true);
      const { data } = await axios.get<ApiSettlementResponse>(url(''), { withCredentials: true });

      const parsed = parseBudget(data.budget);
      setSettlementId(data.settlementId ?? null);
      setBudget(parsed);
      setPendingBudget(parsed.toLocaleString('ko-KR'));
      setIsBudgetConfirmed(parsed > 0);
      setServerTotalPaid(Number.isFinite(data.totalPaid) ? data.totalPaid : 0);

      const mapped: Expense[] =
        (data.items || []).map((it) => ({
          id: String(it.id),
          label: `${CATEGORY_KO[it.category as keyof typeof CATEGORY_KO] ?? it.category} · ${it.participant}`,
          amount: it.paid,
        })) ?? [];
      setExpenses(mapped);
    } catch (err) {
      console.error('[Settlement] GET 실패:', err);
      setSettlementId(null);
      setBudget(0);
      setPendingBudget('0');
      setIsBudgetConfirmed(false);
      setServerTotalPaid(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, travelPlanId, token]);

  /* ---------- 외부 버튼(정산 내역 입력) ---------- */
  useEffect(() => {
    const onOpen = () => {
      if (!isAuthenticated) {
        onRequireLogin?.();
        return;
      }
      if (budget > 0) {
        setSheetOpen(true);
      } else {
        openSheetAfterBudget.current = true;
        setBudgetModalOpen(true);
      }
    };
    window.addEventListener(openSignal, onOpen as EventListener);
    return () => window.removeEventListener(openSignal, onOpen as EventListener);
  }, [openSignal, budget, isAuthenticated, onRequireLogin]);

  /* ---------- 게이지 ---------- */
  const percent = useMemo(() => {
    if (!budget || budget <= 0) return 0;
    return Math.min(100, Math.round((serverTotalPaid / budget) * 100));
  }, [budget, serverTotalPaid]);

  /* ---------- 예산 입력/확정 ---------- */
  const onChangePendingBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/[^\d]/g, '');
    const withComma = onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setPendingBudget(withComma);
  };

  const confirmBudget = async () => {
    const n = Number(pendingBudget.replace(/[,]/g, ''));
    if (!Number.isFinite(n) || n <= 0) {
      alert('올바른 예산 금액을 입력하세요.');
      return;
    }
    try {
      setConfirmingBudget(true);
      if (settlementId == null) {
        await axios.post(url(''), n, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
      } else {
        await axios.patch(url(''), n, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
      }
      await fetchSettlement();
      setBudgetModalOpen(false);
      if (openSheetAfterBudget.current) {
        openSheetAfterBudget.current = false;
        setSheetOpen(true);
      }
    } catch (err) {
      console.error('[Settlement] 예산 저장 실패:', err);
      alert('예산 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setConfirmingBudget(false);
    }
  };

  /* ---------- 사용 내역 추가 ---------- */
  const onChangeSheetAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    const withComma = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setSheetAmount(withComma);
  };

  const onSubmitSheet = async () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    const amount = Number(sheetAmount.replace(/[,]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('금액을 올바르게 입력하세요.');
      return;
    }
    const categoryEnum = KO_TO_ENUM[sheetCategoryKo] ?? 'ETC';

    try {
      await axios.post(
        url('/items'),
        { category: categoryEnum, paid: amount },
        { withCredentials: true }
      );
      await fetchSettlement();
      setSheetOpen(false);
    } catch (err) {
      console.error('[Settlement] 항목 추가 실패:', err);
      alert('항목 추가에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  /* ---------- 가드 ---------- */
  if (!isAuthenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
        <button
          className="px-6 py-2 rounded-md bg-violet-500 text-white hover:bg-violet-600"
          onClick={onRequireLogin}
        >
          로그인
        </button>
      </div>
    );
  }
  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-400">불러오는 중…</div>;
  }

  /* ---------- 렌더 ---------- */
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <p className="text-sm text-gray-700 mb-3">
        이번 여행에서는 우리는 <span className="font-semibold">{fmt(budget)}원</span>을 사용할 수 있어요!
      </p>

      <div className="mb-6">
        {/* ✅ 상단 라인: 왼쪽 사용액, 오른쪽 예산 + 수정 */}
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-gray-500 text-sm">
            <b>{fmt(serverTotalPaid)}</b>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{fmt(budget)}</span>
            <button
              className="p-1 rounded hover:bg-gray-100"
              title="예산 수정"
              onClick={() => setBudgetModalOpen(true)}
            >
              <Pencil className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="w-full bg-violet-100 rounded-full h-2 overflow-hidden">
          <div className="h-2 bg-violet-500 transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* 사용 내역 */}
      <h4 className="font-medium mb-2">사용 내역</h4>
      <div className="flex-1 overflow-auto rounded-md border border-gray-100 p-3">
        {expenses.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-300">사용 내역이 없습니다.</div>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                <span className="text-sm text-gray-700">{e.label}</span>
                <span className="text-sm font-medium">{fmt(e.amount)}원</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 하단 정산하기 / 이전 정산 보기 */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          className={`w-full rounded-lg py-3 text-base font-semibold ${
            isBudgetConfirmed ? 'bg-violet-500 hover:bg-violet-600 text-white' : 'bg-violet-300 text-white cursor-not-allowed'
          }`}
          disabled={!isBudgetConfirmed}
          onClick={async () => {
            if (!isBudgetConfirmed) return;
            try {
              if (isShare) {
                // 공유 모드: 현재 백엔드가 GET만 구현됨
                const { data } = await axios.post<ApiSettlementResult>(url('/result'), {
                  withCredentials: true,
                });
                setSettlementResult(data);
                setResultModalOpen(true);
              } else {
                // 회원 모드: POST로 생성
                const { data } = await axios.post<ApiSettlementResult>(url('/result'), {}, { withCredentials: true });
                setSettlementResult(data);
                setResultModalOpen(true);
              }
            } catch (err) {
              console.error('[Settlement] 정산하기 실패:', err);
              alert('정산하기에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
          }}
        >
          정산하기
        </button>

        <button
          className="w-full rounded-lg py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
          onClick={async () => {
            try {
              const { data } = await axios.get<ApiSettlementResult>(url('/result'), {
                withCredentials: true,
              });
              setSettlementResult(data);
              setResultModalOpen(true);
            } catch (err: any) {
              if (err?.response?.status === 404) {
                alert('이전에 저장된 정산 내역이 없습니다.');
              } else {
                console.error('[Settlement] 정산 내역 조회 실패:', err);
                alert('정산 내역 조회에 실패했습니다. 잠시 후 다시 시도해주세요.');
              }
            }
          }}
        >
          이전 정산 내역 보기
        </button>
      </div>

      {/* 항목 추가 바텀시트 */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categoryKo={sheetCategoryKo}
        setCategoryKo={setSheetCategoryKo}
        amount={sheetAmount}
        onChangeAmount={onChangeSheetAmount}
        payer={sheetPayer}
        setPayer={setSheetPayer}
        onSubmit={onSubmitSheet}
      />

      {/* 예산 설정 모달 */}
      <BudgetModal
        open={budgetModalOpen}
        onClose={() => {
          setBudgetModalOpen(false);
          openSheetAfterBudget.current = false;
        }}
        pendingBudget={pendingBudget}
        onChangePendingBudget={onChangePendingBudget}
        onConfirm={confirmBudget}
        confirming={confirmingBudget}
      />

      {/* 정산 결과 모달 */}
      <SettlementResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={settlementResult}
      />
    </div>
  );
};

export default Settlement;
