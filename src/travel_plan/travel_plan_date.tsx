import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarModal from './components/calendar';
import JejuTravelBooking from './jeju_travel_react'; // 시간 선택 화면 (배경에 표시)

const TravelPlanDate: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  const navigate = useNavigate();

  const handleSelect = (selected: { from: Date | undefined; to: Date | undefined }) => {
    setRange(selected);
  };

  const handleConfirm = () => {
    setOpen(false);
    if (range.from && range.to) {
      navigate('/jeju', { state: { from: range.from, to: range.to } });
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* 배경에 흐리게 JejuTravelBooking 표시 */}
      <div className={`${open ? 'blur-sm pointer-events-none' : ''}`}>
        <JejuTravelBooking />
      </div>

      {/* Calendar 모달 */}
      {open && (
        <div className="absolute inset-0 z-50">
          <CalendarModal
            from={range.from}
            to={range.to}
            onSelect={handleSelect}
            onConfirm={handleConfirm}
          />
        </div>
      )}
    </div>
  );
};

export default TravelPlanDate;
