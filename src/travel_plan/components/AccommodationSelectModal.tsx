// src/travel_plan/components/AccommodationSelectModal.tsx
import React, { useEffect, useState } from "react";

export interface Accommodation {
  id: string;
  name: string;
  addr: string;
  imageUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 타일 개수 = 총 박수 */
  slotCount: number;
  /** 부모의 현재 선택 상태(박수만큼) */
  selected: (Accommodation | null)[];
  /** 완료 버튼 눌렀을 때만 부모에 반영 */
  onChange: (updated: (Accommodation | null)[]) => void;
  /** 현재 리스트에서 선택한 숙소(타일에 채워질 대상) */
  currentAccommodation: Accommodation | null;
}

const CategoryTag = () => (
  <span className="mr-2 align-middle text-xs font-medium text-red-600">숙소</span>
);

const AccommodationSelectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  slotCount,
  selected,
  onChange,
  currentAccommodation,
}) => {
  const [tempSelected, setTempSelected] = useState<(Accommodation | null)[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 모달이 열릴 때마다 부모 상태를 복사해 임시 상태 초기화 (slotCount 보정 포함)
  useEffect(() => {
    if (!isOpen) return;
    const base = Array(slotCount).fill(null) as (Accommodation | null)[];
    for (let i = 0; i < Math.min(selected.length, slotCount); i++) {
      base[i] = selected[i];
    }
    setTempSelected(base);
    setIsAllSelected(
      base.length > 0 &&
        !!currentAccommodation &&
        base.every((s) => s && s.id === currentAccommodation.id)
    );
  }, [isOpen, slotCount, selected, currentAccommodation]);

  if (!isOpen) return null;

  const handleTileClick = (idx: number) => {
    if (!currentAccommodation) return;
    const next = [...tempSelected];
    // 같은 숙소면 해제, 아니면 채우기
    next[idx] = next[idx]?.id === currentAccommodation.id ? null : currentAccommodation;
    setTempSelected(next);
    setIsAllSelected(
      next.length > 0 &&
        !!currentAccommodation &&
        next.every((s) => s && s.id === currentAccommodation.id)
    );
  };

  const handleToggleAll = () => {
    if (!currentAccommodation) return;
    if (isAllSelected) {
      setTempSelected(Array(slotCount).fill(null));
      setIsAllSelected(false);
    } else {
      setTempSelected(Array(slotCount).fill(currentAccommodation));
      setIsAllSelected(true);
    }
  };

  const handleConfirm = () => {
    onChange(tempSelected); // ✅ 완료 시에만 부모 반영
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-[820px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="close"
        >
          ✕
        </button>

        {/* 본문 */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          {/* 좌측: 숙소 프리뷰 */}
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <img
              src={currentAccommodation?.imageUrl || "/placeholder.jpg"}
              alt={currentAccommodation?.name || "숙소"}
              className="h-24 w-24 rounded-lg object-cover"
            />
            <div>
              <div className="font-semibold">{currentAccommodation?.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                <CategoryTag />
                {currentAccommodation?.addr}
              </div>
            </div>
          </div>

          {/* 우측: Night 타일들 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: slotCount }).map((_, idx) => {
              const sel = tempSelected[idx];
              return (
                <div
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className={`relative h-24 cursor-pointer overflow-hidden rounded-xl border ${
                    sel ? "border-blue-300" : "border-gray-200 hover:bg-gray-50"
                  }`}
                  title={`Day ${idx + 1}`}
                >
                  {sel ? (
                    <img
                      src={sel.imageUrl || "/placeholder.jpg"}
                      alt={`Day ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-500">
                      Day {idx + 1}
                    </div>
                  )}
                  <div className="absolute left-2 top-2 rounded-full border border-blue-200 bg-white/85 px-1.5 py-0.5 text-[10px] text-blue-600">
                    Day {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleAll}
            className="h-12 flex-1 rounded-xl border border-gray-300 hover:bg-gray-50"
          >
            {isAllSelected ? "전체 해제" : "전체 선택"}
          </button>
          <button
            onClick={handleConfirm}
            className="h-12 flex-1 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccommodationSelectModal;
