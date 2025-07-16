import React from 'react';
import clockImg from '../../assets/clock.png'; // 경로는 프로젝트 구조에 따라 조정

// 각 날짜의 시간 입력 필드 타입
export interface ScheduleDay {
  date: string;
  startTime: string;
  endTime: string;
}

// 컴포넌트 props 정의
interface TimeInputRowProps {
  day: string;
  data: ScheduleDay;
  onUpdate: (day: string, field: keyof ScheduleDay, value: string) => void;
}

// 시간 입력 행 UI
const TimeInputRow: React.FC<TimeInputRowProps> = ({ day, data, onUpdate }) => (
  <div className="bg-gray-50 p-4 rounded-lg mb-3">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">일자</span>
      <span className="text-sm text-gray-600">시작 시간</span>
      <span className="text-sm text-gray-600">종료 시간</span>
    </div>
    <div className="flex items-center justify-between">
      <input
        type="text"
        value={data.date}
        onChange={(e) => onUpdate(day, 'date', e.target.value)}
        className="w-20 p-2 text-sm text-center bg-transparent border-none outline-none focus:border focus:border-gray-300 focus:rounded-lg"
      />
      <div className="flex items-center">
        <input
          type="text"
          value={data.startTime}
          onChange={(e) => onUpdate(day, 'startTime', e.target.value)}
          className="w-32 p-2 text-sm text-center bg-transparent border-none outline-none focus:border focus:border-gray-300 focus:rounded-lg"
        />
      </div>
      <span className="text-gray-400">~</span>
      <div className="flex items-center">
        <input
          type="text"
          value={data.endTime}
          onChange={(e) => onUpdate(day, 'endTime', e.target.value)}
          className="w-32 p-2 text-sm text-center bg-transparent border-none outline-none focus:border focus:border-gray-300 focus:rounded-lg"
        />
        <img src={clockImg} alt="clock" className="w-4 h-4 ml-1" />
      </div>
    </div>
  </div>
);

export default TimeInputRow;
