import React from 'react';
import { useNavigate } from 'react-router-dom';

type Step = { label: string; route?: string };

interface SidebarProps {
  /** 로고 텍스트 */
  logoText?: string;

  /** 활성 스텝 (1-based) */
  activeStep?: number;
  onStepChange?: (newStep: number) => void;

  /** 커스텀 모드: steps 대신 children을 넣고 싶을 때 */
  children?: React.ReactNode;

  /** 하단 버튼 영역 */
  footer?: React.ReactNode;

  /** 사이드바 너비 */
  widthClassName?: string; // default: w-[125px]

  /** 스텝 모드 비활성화 여부 (true → children 모드 강제) */
  disableSteps?: boolean;
}

/* ✅ 공통 기본 스텝/경로 */
const DEFAULT_STEPS: Step[] = [
  { label: '시간 선택', route: '/time' },
  { label: '생성 방식 선택', route: '/select' },
  { label: '장소 선택', route: '/place' },
  { label: '숙소 선택', route: '/accommodation' },
];

const Sidebar: React.FC<SidebarProps> = ({
  logoText = 'WEGO',
  activeStep,
  onStepChange,
  children,
  footer,
  widthClassName = 'w-[125px]',
  disableSteps = false,
}) => {
  const navigate = useNavigate();
  const goHome = () => navigate('/');

  const goStep = (idx: number) => {
    const step = idx + 1;
    onStepChange?.(step);
    const route = DEFAULT_STEPS[idx]?.route;
    if (route) navigate(route);
  };

  const isStepsMode = !disableSteps;

  return (
    <aside className={`${widthClassName} bg-white p-6 flex flex-col justify-between`}>
      <div>
        <button
          onClick={goHome}
          className="text-left text-2xl font-bold mb-10 hover:opacity-80"
          aria-label="홈으로 이동"
        >
          {logoText}
        </button>

        <nav className="flex flex-col gap-4 text-sm">
          {isStepsMode ? (
            DEFAULT_STEPS.map((s, i) => {
              const stepNo = i + 1;
              const active = activeStep === stepNo;
              return (
                <button
                  key={i}
                  onClick={() => goStep(i)}
                  className={`text-left transition-colors ${
                    active ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Step {stepNo}. {s.label}
                </button>
              );
            })
          ) : (
            children ?? <div className="text-gray-400">사이드바 콘텐츠가 없습니다.</div>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-3">{footer}</div>
    </aside>
  );
};

export default Sidebar;
