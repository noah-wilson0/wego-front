import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

// 🔹 공통 레이아웃 컴포넌트
interface TwoColumnLayoutProps {
  children: React.ReactNode;
  activeStep: number;
  onNext?: () => void;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  activeStep,
  onNext,
}) => {
  const stepLabels = [
    { number: 1, title: '시간 선택' },
    { number: 2, title: '생성 방식 선택' },
    { number: 3, title: '장소 선택' },
    { number: 4, title: '숙소 선택' },
  ];

  return (
    <div className="flex h-screen w-full">
      {/* 좌측 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            {stepLabels.map((step) => (
              <div
                key={step.number}
                className={`select-none transition-colors ${
                  activeStep === step.number
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-400'
                }`}
              >
                Step {step.number}.<br />
                {step.title}
              </div>
            ))}
          </nav>
        </div>
        <button
          className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base hover:bg-gray-800 transition-colors"
          onClick={onNext}
        >
          다음
        </button>
      </aside>

      {/* 본문 영역 */}
      <main className="flex-1 bg-white overflow-auto">{children}</main>
    </div>
  );
};

// 🔹 생성 방식 선택 UI 컴포넌트
interface GenerationMethodSelectionProps {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
}

const GenerationMethodSelection: React.FC<GenerationMethodSelectionProps> = ({
  selectedMethod,
  setSelectedMethod,
}) => {
  const methods = [
    {
      id: 'camera',
      title: '캐미를 기반으로\n여행 일정을 전부 짜줌',
      emoji: '🪄',
    },
    {
      id: 'manual',
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
              ${
                selectedMethod === method.id
                  ? 'bg-gray-800 text-white transform scale-105'
                  : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-102'
              }`}
            onClick={() => setSelectedMethod(method.id)}
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
            {selectedMethod === method.id && (
              <div className="absolute inset-0 border-4 border-blue-500 rounded-3xl" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 🔹 메인 페이지 컴포넌트
const GenerationMethodPage = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const activeStep = 2;
  const navigate = useNavigate();

  const handleNext = async () => {
    const uuid = Cookies.get('travelPlanUUID');
    if (!selectedMethod) {
      alert('생성 방식을 선택해주세요!');
      return;
    }

    if (!uuid) {
      alert('UUID 쿠키가 없습니다.');
      return;
    }

    if (selectedMethod === 'camera') {
      try {
        await axios.post(
          `http://localhost:8080/travel_plan/recommend/temp/sechedule/auto/${uuid}`
        );
        alert('자동 여행 일정 생성 요청이 완료되었습니다!');
        // TODO: 다음 페이지 이동
      } catch (error) {
        console.error('서버 요청 실패:', error);
        alert('요청 중 문제가 발생했습니다.');
      }
    } else if (selectedMethod === 'manual') {
      navigate('/place'); // ✅ 이렇게 해야 정상 동작
    }
  };

  return (
    <TwoColumnLayout activeStep={activeStep} onNext={handleNext}>
      <GenerationMethodSelection
        selectedMethod={selectedMethod}
        setSelectedMethod={setSelectedMethod}
      />
    </TwoColumnLayout>
  );
};

export default GenerationMethodPage;
