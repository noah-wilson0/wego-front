import React from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ko } from 'date-fns/locale';

interface CalendarModalProps {
  from?: Date;
  to?: Date;
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onConfirm: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ from, to, onSelect, onConfirm }) => {
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
            selected={{ from, to }}
            onSelect={onSelect}
            numberOfMonths={2}
            locale={ko}
            captionLayout="dropdown-buttons" // default: buttons-only, can be removed if you want default
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
