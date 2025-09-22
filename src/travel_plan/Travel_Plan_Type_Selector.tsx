// src/travel_plan/GenerationMethodPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

/** 생성 방식 선택 카드 */
interface GenerationMethodSelectionProps {
  onSelect: (method: 'camera' | 'manual') => void;
}
const GenerationMethodSelection: React.FC<GenerationMethodSelectionProps> = ({
  onSelect,
}) => {
  const methods = [
    {
      id: 'camera' as const,
      title: '캐미를 기반으로\n여행 일정을 전부 짜줌',
      emoji: '🪄',
    },
    {
      id: 'manual' as const,
      title: '내가 직접\n여행 일정 짜기',
      emoji: '👌',
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="flex gap-8 max-w-4xl">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`relative w-80 h-96 rounded-3xl cursor-pointer transition-all duration-300 select-none
              bg-gray-900 text-white 
              hover:bg-gray-800 hover:scale-105`}
            onClick={() => onSelect(method.id)}
          >
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="mb-8 relative">
                <span className="text-7xl select-none">{method.emoji}</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold leading-tight whitespace-pre-line select-none">
                  {method.title}
                </h3>
              </div>
            </div>
            {/* hover 시 외곽선 효과 */}
            <div className="absolute inset-0 rounded-3xl border-4 border-transparent hover:border-blue-500 transition-colors duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
};

/** 메인 페이지 */
const GenerationMethodPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = async (method: 'camera' | 'manual') => {
    if (method === 'manual') {
      // 수동 생성 → 장소 선택 페이지 이동
      navigate('/place');
      return;
    }

    // 자동 생성
    const uuid = Cookies.get('travelPlanUUID');
    if (!uuid) {
      alert('UUID 쿠키가 없습니다.');
      return;
    }

    try {
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/auto-schedule`);
      alert('자동 여행 일정 생성 요청이 완료되었습니다!');
      // TODO: 필요 시 다음 화면으로 이동
    } catch (error) {
      console.error('서버 요청 실패:', error);
      alert('요청 중 문제가 발생했습니다.');
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeStep={2} />
      <main className="flex-1 bg-white overflow-auto">
        <GenerationMethodSelection onSelect={handleSelect} />
      </main>
    </div>
  );
};

export default GenerationMethodPage;
