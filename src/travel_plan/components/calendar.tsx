import React from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';

interface CalendarModalProps {
  from?: Date;
  to?: Date;
  onSelect: (range: DateRange) => void;
  onConfirm: () => void;
}

/** 시간(시/분/초/ms)을 0으로 만들어 날짜 비교를 안정화 */
function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ from, to, onSelect, onConfirm }) => {
  /**
   * DayPicker가 주는 range를 그대로 쓰지 않고
   * 현재 상태(from/to)와 클릭한 day를 기준으로 “항상 from ≤ to”가 되게 강제한다.
   */
  const handleSelect = (_range: DateRange | undefined, selectedDay?: Date) => {
    if (!selectedDay) {
      // 비정상 케이스: 범위 초기화
      onSelect({ from: undefined, to: undefined });
      return;
    }

    const day = atMidnight(selectedDay);
    const f = from ? atMidnight(from) : undefined;
    const t = to ? atMidnight(to) : undefined;

    // 1) 아무것도 없는 첫 클릭 → from 설정
    if (!f && !t) {
      onSelect({ from: day, to: undefined });
      return;
    }

    // 2) from만 있는 상태 → 두 번째 클릭으로 구간 완성 (항상 from ≤ to)
    if (f && !t) {
      if (day < f) {
        onSelect({ from: day, to: f });
      } else {
        onSelect({ from: f, to: day });
      }
      return;
    }

    // 3) from/to가 모두 있는 상태에서 클릭 → 새 범위 시작
    if (f && t) {
      onSelect({ from: day, to: undefined });
      return;
    }

    // 안전망
    onSelect({ from: undefined, to: undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-[700px] max-w-[90%]">
        <div className="mb-4">
          <div className="text-xl font-bold mb-1">여행 기간이 어떻게 되시나요?</div>
          <div className="text-gray-500 text-sm">여행 시작일과 종료일을 선택해 주세요.</div>
        </div>

        <div className="flex justify-center mb-6">
          <DayPicker
            mode="range"
            /** 부모 상태를 그대로 컨트롤드로 바인딩 */
            selected={{ from, to }}
            /** 선택은 항상 handleSelect에서만 처리 */
            onSelect={(range, selectedDay) => handleSelect(range, selectedDay)}
            numberOfMonths={2}
            locale={ko}
            captionLayout="dropdown"
            showOutsideDays
          />
        </div>

        <div className="flex justify-end">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold disabled:bg-gray-300"
            onClick={onConfirm}
            disabled={!from || !to}
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
