import React, { useState } from 'react';
import clockImg from '../../assets/clock.png'; // 경로는 프로젝트 구조에 따라 조정

export interface ScheduleDay {
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeInputRowProps {
  day: string;
  data: ScheduleDay;
  onUpdate: (day: string, field: keyof ScheduleDay, value: string) => void;
}

function parseTime(str: string) {
  const match = str.match(/(오전|오후)\s*(\d{1,2})시\s*(\d{2})분/);
  if (!match) return { ampm: '오전', hour: '10', min: '00' };
  return { ampm: match[1], hour: match[2], min: match[3] };
}
function buildTime(ampm: string, hour: string, min: string) {
  return `${ampm} ${hour}시 ${min}분`;
}

const TimeInputRow: React.FC<TimeInputRowProps> = ({ day, data, onUpdate }) => {
  // 인라인 에디터 상태
  const [editingField, setEditingField] = useState<null | 'startTime' | 'endTime'>(null);
  // 시작/종료 시간 상태
  const [start, setStart] = useState(() => parseTime(data.startTime));
  const [end, setEnd] = useState(() => parseTime(data.endTime));

  // 인라인 에디터 진입
  const handleEdit = (field: 'startTime' | 'endTime') => {
    setEditingField(field);
  };
  
  // 인라인 에디터 종료
  const handleBlur = (field: 'startTime' | 'endTime') => {
    if (field === 'startTime') {
      onUpdate(day, 'startTime', buildTime(start.ampm, start.hour, start.min));
    } else {
      onUpdate(day, 'endTime', buildTime(end.ampm, end.hour, end.min));
    }
    setEditingField(null);
  };

  // 시작/종료 시간 변경 핸들러
  const handleStartChange = (field: 'ampm' | 'hour' | 'min', value: string) => {
    const next = { ...start, [field]: value };
    setStart(next);
  };
  
  const handleEndChange = (field: 'ampm' | 'hour' | 'min', value: string) => {
    const next = { ...end, [field]: value };
    setEnd(next);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-3">
      {/* 라벨 */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-sm text-gray-600 w-1/3 text-center">일자</span>
        <span className="text-sm text-gray-600 w-1/3 text-center">시작 시간</span>
        <span className="text-sm text-gray-600 w-1/3 text-center">종료 시간</span>
      </div>
      <div className="flex items-center space-x-4">
        {/* 일자 입력 */}
        <div className="flex-1">
          <input
            type="text"
            value={data.date}
            onChange={(e) => onUpdate(day, 'date', e.target.value)}
            className="w-full p-2 text-sm text-center bg-transparent border-none outline-none focus:border focus:border-gray-300 focus:rounded-lg"
          />
        </div>

        {/* 시작 시간: 텍스트 or 인라인 에디터 */}
        <div className="flex-1 flex items-center justify-center">
          {editingField === 'startTime' ? (
            <div className="flex items-center space-x-1" onBlur={() => handleBlur('startTime')} tabIndex={-1}>
              <select
                value={start.ampm}
                onChange={e => handleStartChange('ampm', e.target.value)}
                className="border rounded px-1 py-1 text-sm"
              >
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <input
                type="number"
                min={1}
                max={12}
                value={start.hour}
                onChange={e => {
                  let v = e.target.value;
                  if (v === '') v = '1';
                  let n = Math.max(1, Math.min(12, Number(v)));
                  handleStartChange('hour', n.toString());
                }}
                className="w-12 p-1 text-sm text-center border border-transparent rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
              <span className="text-xs">시</span>
              <input
                type="number"
                min={0}
                max={59}
                value={start.min}
                onChange={e => {
                  let v = e.target.value;
                  if (v === '') v = '00';
                  let n = Math.max(0, Math.min(59, Number(v)));
                  handleStartChange('min', n.toString().padStart(2, '0'));
                }}
                className="w-12 p-1 text-sm text-center border border-transparent rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
              <span className="text-xs">분</span>
            </div>
          ) : (
            <span
              className="block w-full p-2 text-sm text-center cursor-pointer hover:bg-gray-100 rounded"
              onClick={() => handleEdit('startTime')}
            >
              {data.startTime}
            </span>
          )}
        </div>

        {/* 종료 시간: 텍스트 or 인라인 에디터 + 아이콘 */}
        <div className="flex-1 flex items-center justify-center">
          {editingField === 'endTime' ? (
            <div className="flex items-center space-x-1" onBlur={() => handleBlur('endTime')} tabIndex={-1}>
              <select
                value={end.ampm}
                onChange={e => handleEndChange('ampm', e.target.value)}
                className="border rounded px-1 py-1 text-sm"
              >
                <option value="오전">오전</option>
                <option value="오후">오후</option>
              </select>
              <input
                type="number"
                min={1}
                max={12}
                value={end.hour}
                onChange={e => {
                  let v = e.target.value;
                  if (v === '') v = '1';
                  let n = Math.max(1, Math.min(12, Number(v)));
                  handleEndChange('hour', n.toString());
                }}
                className="w-12 p-1 text-sm text-center border border-transparent rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
              <span className="text-xs">시</span>
              <input
                type="number"
                min={0}
                max={59}
                value={end.min}
                onChange={e => {
                  let v = e.target.value;
                  if (v === '') v = '00';
                  let n = Math.max(0, Math.min(59, Number(v)));
                  handleEndChange('min', n.toString().padStart(2, '0'));
                }}
                className="w-12 p-1 text-sm text-center border border-transparent rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              />
              <span className="text-xs">분</span>
            </div>
          ) : (
            <span
              className="block w-full p-2 text-sm text-center cursor-pointer hover:bg-gray-100 rounded"
              onClick={() => handleEdit('endTime')}
            >
              {data.endTime}
            </span>
          )}
          <img
            src={clockImg}
            alt="clock"
            className="w-4 h-4 ml-1"
            style={{ flexShrink: 0 }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeInputRow;
