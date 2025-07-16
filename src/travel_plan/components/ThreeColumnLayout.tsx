import React from 'react';

interface ThreeColumnLayoutProps {
  children: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  children,
  activeStep,
  setActiveStep,
  onNext,
}) => {
  return (
    <div className="flex h-screen w-full">
      {/* 왼쪽 사이드바 */}
      <aside className="w-[125px] bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold mb-10">LOGO</div>
          <nav className="flex flex-col gap-4 text-sm">
            <div className={activeStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 1. 시간 선택
            </div>
            <div className={activeStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 2. 생성 방식 선택
            </div>
            <div className={activeStep === 3 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 3. 장소 선택
            </div>
            <div className={activeStep === 4 ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
              Step 4. 숙소 선택
            </div>
          </nav>
        </div>
        <button
          className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base"
          onClick={onNext}
        >
          다음
        </button>
      </aside>

      {/* 가운데 본문 - 비율 60% */}
      <main className="flex-[6] max-w-[620px] bg-white border-r border-gray-200 overflow-auto p-6">
        {children}
      </main>

      {/* 오른쪽 지도 영역 - 비율 40% */}
      <section className="flex-[4] bg-blue-50 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-lg font-medium mb-2">지도 영역</div>
          <div className="text-sm">지도 API 연동 예정</div>
        </div>
      </section>
    </div>
  );
};

export default ThreeColumnLayout;
