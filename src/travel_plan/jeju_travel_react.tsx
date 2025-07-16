import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import ThreeColumnLayout from './components/ThreeColumnLayout'; // 경로 맞게 조정
import TimeInputRow from './components/TimeInputRow'; // 분리했다면

const JejuTravelBooking = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [scheduleData, setScheduleData] = useState({
    day1: { date: '6/30 월', startTime: '오전 10시 00분', endTime: '오후 10시 00분' },
    day2: { date: '7/01 화', startTime: '오전 10시 00분', endTime: '오후 10시 00분' },
  });

  const updateSchedule = (day, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  return (
    <ThreeColumnLayout activeStep={activeStep} setActiveStep={setActiveStep}>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">제주</h2>
        <div className="text-sm text-gray-600 space-y-1 mb-6">
          <div className="flex items-center">
            <span>2025년 6월 30일 (월) - 2025년 7월 1일 (화)</span>
            <Calendar className="w-4 h-4 ml-2" />
          </div>
          <div>총 여행 일: 1박 2일</div>
          <div>총 여행 시간: 18시간 00분</div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">시간 선택</h3>
        <TimeInputRow day="day1" data={scheduleData.day1} onUpdate={updateSchedule} />
        <TimeInputRow day="day2" data={scheduleData.day2} onUpdate={updateSchedule} />
      </div>
    </ThreeColumnLayout>
  );
};

export default JejuTravelBooking;
