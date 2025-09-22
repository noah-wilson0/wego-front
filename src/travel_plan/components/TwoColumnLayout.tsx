import React from 'react';
import Sidebar from './Sidebar';

interface TwoColumnLayoutProps {
  children: React.ReactNode;
  activeStep: number;
  setActiveStep: (step: number) => void;
  onNext?: () => void;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  children,
  activeStep,
  setActiveStep,
  onNext,
}) => {
  return (
    <div className="flex h-screen w-full">
      {/* 공통 사이드바 (스텝 모드) */}
      <Sidebar
        activeStep={activeStep}
        onStepChange={setActiveStep}
        footer={
          <button
            className="mt-10 bg-black text-white py-2 px-4 rounded-md text-base hover:bg-gray-800 transition-colors"
            onClick={onNext}
          >
            다음
          </button>
        }
      />

      {/* 본문 */}
      <main className="flex-1 bg-white overflow-auto p-6 max-w-[900px]">
        {children}
      </main>
    </div>
  );
};

export default TwoColumnLayout;
