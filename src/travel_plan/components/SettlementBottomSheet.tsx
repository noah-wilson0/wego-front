import React, { useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  categoryKo: string;
  setCategoryKo: (v: string) => void;
  amount: string;
  onChangeAmount: (e: React.ChangeEvent<HTMLInputElement>) => void;
  payer: string;
  setPayer: (v: string) => void;
  onSubmit: () => void;
}

const CATEGORY_ORDER = ['식비', '카페', '교통', '숙박', '쇼핑', '기타'];

const BottomSheet: React.FC<SheetProps> = ({
  open,
  onClose,
  categoryKo,
  setCategoryKo,
  amount,
  onChangeAmount,
  payer,
  setPayer,
  onSubmit,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleClickAway = (e: MouseEvent) => {
      if (sheetRef.current && sheetRef.current.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [open, onClose]);

  return (
    <>
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        } z-40`}
      />
      {/* sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 transform-gpu transition-transform duration-500 ease-out z-50 ${
          open ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
      >
        <div
          ref={sheetRef}
          className="mx-auto w-full max-w-md rounded-t-3xl bg-white shadow-2xl border max-h-[85vh] overflow-hidden relative"
        >
          {/* header */}
          <div className="sticky top-0 z-10 bg-white border-b px-5 pt-3 pb-2 flex items-center justify-between">
            <h3 className="text-lg font-bold">정산 내역 입력</h3>
            <div className="flex items-center gap-2">
              <button
                className="text-xs px-3 py-1 rounded-full border bg-gray-50 hover:bg-gray-100 flex items-center gap-1"
                onClick={() => alert('영수증 스캔은 다음 단계에서 연결 예정입니다.')}
              >
                <Camera className="w-4 h-4" />
                영수증 스캔
              </button>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* body */}
          <div className="p-5 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">사용 항목</label>
              <select
                value={categoryKo}
                onChange={(e) => setCategoryKo(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300"
              >
                {CATEGORY_ORDER.map((ko) => (
                  <option key={ko}>{ko}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">금액</label>
              <input
                value={amount}
                onChange={onChangeAmount}
                inputMode="numeric"
                placeholder="1,000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-violet-300"
              />
            </div>



            <button
              className="w-full rounded-lg bg-violet-500 py-3 text-white font-semibold hover:bg-violet-600"
              onClick={onSubmit}
            >
              추가하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
