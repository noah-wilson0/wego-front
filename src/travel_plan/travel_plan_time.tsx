import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import ThreeColumnLayout from './components/ThreeColumnLayout';
import TimeInputRow from './components/TimeInputRow';
import type { ScheduleDay } from './components/TimeInputRow';
import Cookies from 'js-cookie';
import axios from 'axios';
import { eachDayOfInterval, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CalendarModal from './components/calendar';

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
// date에서 "yyyy-MM-dd"만 추출
function extractDate(dateStr: string) {
  return dateStr.split(" ")[0];
}
// 시간 문자열을 24시간제 시, 분으로 변환 (총 여행 시간 계산용)
function parseKoreanTime(str: string) {
  const match = str.match(/(오전|오후)\s*(\d{1,2})시\s*(\d{2})분/);
  if (!match) return { hour: 0, min: 0 };
  let hour = parseInt(match[2], 10);
  const min = parseInt(match[3], 10);
  if (match[1] === '오후' && hour !== 12) hour += 12;
  if (match[1] === '오전' && hour === 12) hour = 0;
  return { hour, min };
}
// 총 여행 시간(분) 계산
function getTotalTravelMinutes(scheduleData: ScheduleDay[]) {
  return scheduleData.reduce((sum, d) => {
    const start = parseKoreanTime(d.startTime);
    const end = parseKoreanTime(d.endTime);
    let diff = (end.hour * 60 + end.min) - (start.hour * 60 + start.min);
    if (diff < 0) diff = 0;
    return sum + diff;
  }, 0);
}

const JejuTravelBooking: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // 쿠키에서 uuid 읽기
  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  // 일정 데이터 불러오기
  useEffect(() => {
    const uuid = getUuidFromCookie();
    console.log('쿠키에서 읽은 uuid:', uuid);
    if (!uuid) {
      setLoading(false);
      return;
    }
    axios.get(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`)
      .then(res => {
        // res.data: { startDate: "2025-06-30", endDate: "2025-07-01" }
        const { startDate, endDate } = res.data;
        if (startDate && endDate) {
          const days = eachDayOfInterval({
            start: new Date(startDate),
            end: new Date(endDate)
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
        console.error('❌ 일정 데이터 불러오기 실패', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // 시간 변경 핸들러
  const updateSchedule = (idx: number, field: keyof ScheduleDay, value: string) => {
    setScheduleData(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  // 왼쪽 사이드바의 다음 버튼 클릭 시 시간 설정 저장
  const handleSaveTimes = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }
    // 변환
    const travelDayTimes = scheduleData.map(d => ({
      date: extractDate(d.date),
      startTime: to24Hour(d.startTime),
      endTime: to24Hour(d.endTime),
    }));
    try {
      console.log({ travelDayTimes });
      await axios.post(
        `http://localhost:8080/travel_plan/date/temp/schedule/times/${uuid}`,
        { travelDayTimes }
      );
      alert('시간 설정이 저장되었습니다!');
      // 이후 페이지 이동 등 추가 동작 가능
    } catch (err) {
      alert('시간 설정 저장 실패');
      console.error(err);
    }
  };

  // 아이콘 클릭 핸들러
  const handleCalendarClick = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      setCalendarOpen(true);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`);
      const { startDate, endDate } = res.data;
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

  // 날짜 range 선택 핸들러
  const handleCalendarSelect = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
  };

  // 날짜 range 확정(선택 버튼 클릭)
  const handleCalendarConfirm = async () => {
    if (dateRange.from && dateRange.to) {
      const uuid = getUuidFromCookie();
      if (!uuid) return;
      const payload = {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd')
      };
      await axios.post(`http://localhost:8080/travel_plan/date/temp/schedule/${uuid}`, payload);
      // scheduleData 새로 생성
      const days = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      }).map(date => ({
        date: format(date, 'yyyy-MM-dd (E)', { locale: ko }),
        startTime: '오전 10시 00분',
        endTime: '오후 8시 00분',
      }));
      setScheduleData(days);
      setCalendarOpen(false);
    }
  };

  // 총 여행 시간 계산
  const totalMinutes = getTotalTravelMinutes(scheduleData);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <ThreeColumnLayout activeStep={1} setActiveStep={() => {}} onNext={handleSaveTimes}>
      <div className={calendarOpen ? 'blur-sm pointer-events-none' : ''}>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">제주</h2>
        <div className="text-sm text-gray-600 space-y-1 mb-6">
          <div className="flex items-center">
            <span>{scheduleData.length > 0 ? `${scheduleData[0].date} ~ ${scheduleData[scheduleData.length-1].date}` : ''}</span>
            <Calendar className="w-4 h-4 ml-2 cursor-pointer" onClick={handleCalendarClick} />
          </div>
          <div>총 여행 일: {scheduleData.length > 1 ? `${scheduleData.length - 1}박 ${scheduleData.length}일` : '1박 2일'}</div>
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
      {/* 캘린더 모달 */}
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

export default JejuTravelBooking;
