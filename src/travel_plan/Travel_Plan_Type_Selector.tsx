// src/travel_plan/GenerationMethodPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

/** axios 인스턴스 */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/** 로그인 필요 모달 */
interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}
const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ open, onClose, onLogin }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">로그인이 필요합니다</h3>
        <p className="text-sm text-gray-600 mb-6">
          자동 여행 일정 추천은 회원 전용 기능입니다. 로그인 후 이용해 주세요.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
};

/** 생성 방식 선택 카드 */
interface GenerationMethodSelectionProps {
  onSelect: (method: 'camera' | 'manual') => void;
  disabled?: boolean;
}
const GenerationMethodSelection: React.FC<GenerationMethodSelectionProps> = ({
  onSelect,
  disabled,
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
          <button
            key={method.id}
            className={`relative w-80 h-96 rounded-3xl transition-all duration-300 select-none
              bg-gray-900 text-white 
              hover:bg-gray-800 hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={() => onSelect(method.id)}
            disabled={disabled}
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
            <div className="pointer-events-none absolute inset-0 rounded-3xl border-4 border-transparent hover:border-blue-500 transition-colors duration-300" />
          </button>
        ))}
      </div>
    </div>
  );
};

/** 메인 페이지 */
const GenerationMethodPage: React.FC = () => {
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectToLogin = () => {
    const cur = new URL(window.location.href);
    const redirect = encodeURIComponent(cur.pathname + cur.search);
    navigate(`/login?redirect=${redirect}`);
  };

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

    setLoading(true);

    // 1) 로그인 상태 확인: 실패하면 모달 띄우고 종료
    try {
      await api.get('/auth/me'); // 200이면 로그인 상태
    } catch (err) {
      console.debug('[auth/me] not authenticated or failed:', err);
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    // 2) 자동 일정 생성 호출 (로그인 상태에서만)
    try {
      await api.post(`/draft-plans/${uuid}/auto-schedule`);
      navigate('/check');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.group('[auto-schedule] 실패');
        console.log('status:', err.response?.status);
        console.log('headers:', err.response?.headers);
        console.log('data:', err.response?.data); // ← 서버에서 보낸 에러메시지/stack/trace
        console.groupEnd();
    
        // 사용자에게도 서버 메시지를 그대로 노출
        const msg =
          (err.response?.data as any)?.message ||
          (err.response?.data as any)?.detail ||
          JSON.stringify(err.response?.data) ||
          '알 수 없는 오류';
        alert(`서버 오류 (${err.response?.status})\n${msg}`);
      } else {
        console.error(err);
        alert('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeStep={2} />
      <main className="relative flex-1 bg-white overflow-auto">
        <GenerationMethodSelection onSelect={handleSelect} disabled={loading} />

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-40">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
              <span className="text-sm text-gray-700">요청 처리 중...</span>
            </div>
          </div>
        )}

        {/* 로그인 필요 모달 */}
        <LoginRequiredModal
          open={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={redirectToLogin}
        />
      </main>
    </div>
  );
};

export default GenerationMethodPage;
