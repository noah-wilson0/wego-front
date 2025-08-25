import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import Cookies from 'js-cookie';

import CalendarModal from './components/calendar';
import Travel_plan_time from './travel_plan_time';

// 로컬스토리지에 저장된 지역 슬러그 키
const SELECTED_AREA_STORAGE_KEY = 'wego:selectedAreaId';

const TravelPlanDate: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  const navigate = useNavigate();

  // 쿠키에서 uuid 가져오기
  const getUuidFromCookie = () => {
    const v = Cookies.get('travelPlanUUID');
    console.log('🍪 current uuid cookie =', v);
    return v;
  };

  // 쿠키에 uuid 저장 (6시간 유효)
  const setUuidToCookie = (uuid: string) => {
    Cookies.set('travelPlanUUID', uuid, { expires: 0.25, path: '/' }); // 0.25일 ≈ 6시간
  };

  useEffect(() => {
    const uuidFromCookie = getUuidFromCookie();
    if (uuidFromCookie) {
      console.log('📥 쿠키에서 UUID 불러옴:', uuidFromCookie);
    }
  }, []);

  const handleSelect = (selected: { from: Date | undefined; to: Date | undefined }) => {
    setRange(selected);
  };

  // ⚠️ 문자열이 " \"seoul\" " 같이 저장돼 있다면 양끝 따옴표 제거
  const normalizeSlugFromStorage = (raw: string | null) => {
    if (!raw) return null;
    let s = raw.trim();
    // 만약 JSON.stringify 된 문자열이라면("seoul"처럼 따옴표 포함)
    if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
      try {
        // JSON.parse로 안전하게 복원
        s = JSON.parse(s);
      } catch {
        // 파싱 실패 시 수동으로 따옴표 제거
        s = s.substring(1, s.length - 1);
      }
    }
    // 소문자 + trim으로 정규화
    return s.trim().toLowerCase();
  };

  const handleConfirm = async () => {
    if (range.from && range.to) {
      const uuid = crypto.randomUUID();

      const payload = {
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd')
      };

      try {
        // 1) 날짜 정보 저장 (JSON 객체)
        await axios.post(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`, payload);
        console.log('✅ 날짜 Redis 저장 성공');

        // 2) uuid 쿠키에 저장
        setUuidToCookie(uuid);

        // 3) slug 읽어서 서버에 전송
        const raw = localStorage.getItem(SELECTED_AREA_STORAGE_KEY);
        const slug = normalizeSlugFromStorage(raw);

        if (slug) {
          // ✅ 핵심 변경: 문자열 하나가 아니라 { slug: "..." } 형태의 "객체"로 보냅니다.
          // axios는 자동으로 application/json으로 보냅니다.
          await axios.post(`http://localhost:8080/travel_plan/slug/${uuid}`, { slug });
          console.log('✅ slug 저장 성공:', slug);
        } else {
          console.warn('⚠️ slug 값이 없습니다. localStorage를 확인하세요.');
        }

        // 4) 다음 페이지로 이동
        setOpen(false);
        navigate('/time', {
          state: {
            from: range.from,
            to: range.to,
            uuid
          }
        });
      } catch (err) {
        console.error('❌ 저장 실패', err);
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
