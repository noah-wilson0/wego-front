import React from 'react';

interface ThreeColumnLayoutProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  children: React.ReactNode;
}

const steps = [
  { number: 1, title: '시간 선택' },
  { number: 2, title: '생활 방식 선택' },
  { number: 3, title: '장소 선택' },
  { number: 4, title: '숙소 선택' },
];

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({ activeStep, setActiveStep, children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="w-[125px] bg-white shadow-lg">
        <div className="p-6">
          <div className="text-2xl font-bold text-gray-800 mb-6">LOGO</div>
          <div className="space-y-8">
            {steps.map(step => (
              <div key={step.number} className="cursor-pointer" onClick={() => setActiveStep(step.number)}>
                <div className={`text-sm font-medium ${activeStep === step.number ? 'text-blue-600' : 'text-gray-400'}`}>
                  Step {step.number}.<br />{step.title}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <button
              onClick={() => setActiveStep(prev => Math.min(prev + 1, 4))}
              className="w-16 h-10 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {/* 가운데 내용 */}
      <div className="w-[480px] bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">{children}</div>
      </div>

      {/* 오른쪽 지도 */}
      <div className="flex-1 bg-blue-50 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-lg font-medium mb-2">지도 영역</div>
          <div className="text-sm">지도 API 연동 예정</div>
        </div>
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
