import React from 'react';

interface TwoColumnLayoutProps {
  children: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  activeStep,
  setActiveStep, // 향후 사용될 수 있으므로 유지
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
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            {stepLabels.map((step) => (
              <div
                key={step.number}
                className={`
                  transition-colors select-none
                  ${activeStep === step.number
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-400'
                  }
                `}
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

      {/* 본문 콘텐츠 영역 */}
      <main className="flex-1 bg-white overflow-auto p-6 max-w-[900px]">
        {children}
      </main>
    </div>
  );
};

export default TwoColumnLayout;
