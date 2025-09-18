// src/travel_plan/travel_plan_time.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import ThreeColumnLayout from './components/ThreeColumnLayout';
import TimeInputRow from './components/TimeInputRow';
import type { ScheduleDay } from './components/TimeInputRow';
import Cookies from 'js-cookie';
import axios from 'axios';
import { eachDayOfInterval, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CalendarModal from './components/calendar';

import { getDraftPlanMeta } from './components/draftPlanMetaApi';
import type { DraftPlanMetaResponse } from './components/draftPlanMetaApi';
import { resolveRegionView } from './components/regionMapView';

// 시간 문자열을 24시간제 "HH:mm"으로 변환
function to24Hour(str: string) {
  const match = str.match(/(오전|오후)\s*(\d{1,2})시\s*(\d{2})분/);
  if (!match) return "00:00";
  let hour = parseInt(match[2], 10);
  const min = match[3];
  if (match[1] === "오후" && hour !== 12) hour += 12;
  if (match[1] === "오전" && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, "0")}:${min}`;
}
function extractDate(dateStr: string) {
  return dateStr.split(" ")[0];
}
function parseKoreanTime(str: string) {
  const match = str.match(/(오전|오후)\s*(\d{1,2})시\s*(\d{2})분/);
  if (!match) return { hour: 0, min: 0 };
  let hour = parseInt(match[2], 10);
  const min = parseInt(match[3], 10);
  if (match[1] === '오후' && hour !== 12) hour += 12;
  if (match[1] === '오전' && hour === 12) hour = 0;
  return { hour, min };
}
function getTotalTravelMinutes(scheduleData: ScheduleDay[]) {
  return scheduleData.reduce((sum, d) => {
    const start = parseKoreanTime(d.startTime);
    const end = parseKoreanTime(d.endTime);
    let diff = (end.hour * 60 + end.min) - (start.hour * 60 + start.min);
    if (diff < 0) diff = 0;
    return sum + diff;
  }, 0);
}

const travelPlanTime: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [regionName, setRegionName] = useState<string>(''); // ✅ 지역명 상태
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.9780 });
  const [mapZoom, setMapZoom] = useState(11);
  const navigate = useNavigate();

  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  // ✅ 일정 데이터 불러오기 (meta 사용)
  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      setLoading(false);
      return;
    }
    getDraftPlanMeta(uuid)
      .then((res: DraftPlanMetaResponse) => {
        const { regionName, startDate, endDate } = res;
        setRegionName(regionName);

        // ✅ 지도 중심 업데이트
        const view = resolveRegionView(regionName);
        setMapCenter(view.center);
        setMapZoom(view.zoom);

        if (startDate && endDate) {
          const days = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate),
          }).map(date => ({
            date: format(date, 'yyyy-MM-dd (E)', { locale: ko }),
            startTime: '오전 10시 00분',
            endTime: '오후 10시 00분',
          }));
          setScheduleData(days);
        } else {
          setScheduleData([]);
        }
      })
      .catch(err => {
        console.error('❌ 메타 데이터 불러오기 실패', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateSchedule = (idx: number, field: keyof ScheduleDay, value: string) => {
    setScheduleData(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const handleSaveTimes = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }
    const travelDayTimes = scheduleData.map(d => ({
      date: extractDate(d.date),
      startTime: to24Hour(d.startTime),
      endTime: to24Hour(d.endTime),
    }));
    try {
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/times`, { travelDayTimes });
      navigate('/select');
    } catch (err) {
      alert('시간 설정 저장 실패');
      console.error(err);
    }
  };

  // ✅ 캘린더 아이콘 클릭 시에도 meta 사용
  const handleCalendarClick = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      setCalendarOpen(true);
      return;
    }
    try {
      const { startDate, endDate } = await getDraftPlanMeta(uuid);
      setDateRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      });
      setCalendarOpen(true);
    } catch (err) {
      alert('이전 일정을 불러오지 못했습니다.');
      setCalendarOpen(true);
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
  };

  const handleCalendarConfirm = async () => {
    if (dateRange.from && dateRange.to) {
      const uuid = getUuidFromCookie();
      if (!uuid) return;
      const payload = {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      };
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/dates`, payload);
      const days = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to,
      }).map(date => ({
        date: format(date, 'yyyy-MM-dd (E)', { locale: ko }),
        startTime: '오전 10시 00분',
        endTime: '오후 8시 00분',
      }));
      setScheduleData(days);
      setCalendarOpen(false);
    }
  };

  const totalMinutes = getTotalTravelMinutes(scheduleData);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <ThreeColumnLayout
      activeStep={1}
      setActiveStep={() => {}}
      onNext={handleSaveTimes}
      mapCenter={mapCenter}
      mapZoom={mapZoom}
    >
      <div className={calendarOpen ? 'blur-sm pointer-events-none' : ''}>
        {/* ✅ 서버 regionName 표시 */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{regionName}</h2>
        <div className="text-sm text-gray-600 space-y-1 mb-6">
          <div className="flex items-center">
            <span>
              {scheduleData.length > 0
                ? `${scheduleData[0].date} ~ ${scheduleData[scheduleData.length - 1].date}`
                : ''}
            </span>
            <Calendar className="w-4 h-4 ml-2 cursor-pointer" onClick={handleCalendarClick} />
          </div>
          <div>
            총 여행 일: {scheduleData.length > 1 ? `${scheduleData.length - 1}박 ${scheduleData.length}일` : '1박 2일'}
          </div>
          <div>총 여행 시간: {hours}시간 {minutes.toString().padStart(2, '0')}분</div>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">시간 선택</h3>
        {loading ? (
          <div>일정 데이터를 불러오는 중입니다...</div>
        ) : (
          scheduleData.map((d, idx) => (
            <TimeInputRow
              key={idx}
              day={d.date}
              data={d}
              onUpdate={(day, field, value) => updateSchedule(idx, field, value)}
            />
          ))
        )}
      </div>
      {calendarOpen && (
        <div className="absolute inset-0 z-50">
          <CalendarModal
            from={dateRange.from}
            to={dateRange.to}
            onSelect={handleCalendarSelect}
            onConfirm={handleCalendarConfirm}
          />
        </div>
      )}
    </ThreeColumnLayout>
  );
};

export default travelPlanTime;
