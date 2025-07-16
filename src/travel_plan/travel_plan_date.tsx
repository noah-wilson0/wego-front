import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Cookies from 'js-cookie'; // 쿠키 관리 라이브러리 추가

import CalendarModal from './components/calendar';
import Travel_plan_time from './travel_plan_time'; // 시간 선택 화면 (배경에 표시)

const TravelPlanDate: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  const navigate = useNavigate();

  // 쿠키에서 UUID를 불러오는 함수
  const getUuidFromCookie = () => {
    console.log(Cookies.get('travelPlanUUID'))
    return Cookies.get('travelPlanUUID');
  };

  // UUID를 쿠키에 저장하는 함수 (6시간 TTL 설정)
  const setUuidToCookie = (uuid: string) => {
    Cookies.set('travelPlanUUID', uuid, { expires: 0.25, path: '/' }); // 6시간 후 만료
  };

  // 페이지가 로드될 때 쿠키에서 UUID를 확인하고, 있으면 자동으로 로드
  useEffect(() => {
    const uuidFromCookie = getUuidFromCookie();
    if (uuidFromCookie) {
      console.log('📥 쿠키에서 UUID 불러옴:', uuidFromCookie);
      // UUID가 있을 경우, 서버에서 해당 UUID로 데이터를 불러오는 로직을 추가할 수 있음
    }
  }, []);

  const handleSelect = (selected: { from: Date | undefined; to: Date | undefined }) => {
    setRange(selected);
  };

  const handleConfirm = async () => {
    if (range.from && range.to) {
      const uuid = crypto.randomUUID(); // UUID 생성
      const payload = {
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd')
      };

      try {
        await axios.post(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`, payload);
        console.log('✅ Redis 저장 성공');

        // UUID를 쿠키에 저장
        setUuidToCookie(uuid);

        setOpen(false);
        navigate('/jeju', {
          state: {
            from: range.from,
            to: range.to,
            uuid
          }
        });
      } catch (err) {
        console.error('❌ Redis 저장 실패', err);
      }
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* 배경 흐림 처리 */}
      <div className={`${open ? 'blur-sm pointer-events-none' : ''}`}>
        <Travel_plan_time />
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
