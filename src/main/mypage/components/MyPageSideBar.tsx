import React from 'react';

interface MyPageSideBarProps {
  activeMenu?: string;
  onMenuClick?: (menu: string) => void;
  // ✅ 서버에서 내려받은 사용자 표시 이름(닉네임/이름)
  displayName?: string;
}

const MyPageSideBar: React.FC<MyPageSideBarProps> = ({ 
  activeMenu = 'home', 
  onMenuClick,
  displayName = '—', // 값 없을 때 대비
}) => {
  const handleMenuClick = (menu: string) => {
    onMenuClick?.(menu);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="mb-8">
        <div className="mb-4">
          {/* ✅ 하드코딩 제거: 서버에서 받은 이름 표시 */}
          <div className="font-semibold text-gray-800 mb-1">{displayName || '—'}</div>

          {/* ✅ 프로필 관리 클릭 시 상위로 'profile' 신호 보내기 (이미 구현되어 있음) */}
          <button
            type="button"
            onClick={() => handleMenuClick('profile')}
            className="flex items-center text-blue-500 text-sm hover:text-blue-600 transition-colors"
            aria-label="프로필 관리"
          >
            <span className="mr-1">프로필 관리</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="space-y-2">
        <button 
          onClick={() => handleMenuClick('home')}
          className={`w-full text-left flex items-center py-2 hover:text-gray-800 transition-colors ${
            activeMenu === 'home' ? 'text-gray-800 font-medium' : 'text-gray-500'
          }`}
        >
          <span className="mr-2">•</span>
          홈
        </button>
        <button 
          onClick={() => handleMenuClick('chemi')}
          className={`w-full text-left flex items-center py-2 ml-6 hover:text-gray-800 transition-colors ${
            activeMenu === 'chemi' ? 'text-gray-800 font-medium' : 'text-gray-500'
          }`}
        >
          <span className="mr-2">•</span>
          케미
        </button>
        <button 
          onClick={() => handleMenuClick('itinerary')}
          className={`w-full text-left flex items-center py-2 ml-6 hover:text-gray-800 transition-colors ${
            activeMenu === 'itinerary' ? 'text-gray-800 font-medium' : 'text-gray-500'
          }`}
        >
          <span className="mr-2">•</span>
          여행 일정
        </button>
        <button 
          onClick={() => handleMenuClick('review')}
          className={`w-full text-left flex items-center py-2 ml-6 hover:text-gray-800 transition-colors ${
            activeMenu === 'review' ? 'text-gray-800 font-medium' : 'text-gray-500'
          }`}
        >
          <span className="mr-2">•</span>
          리뷰
        </button>
      </nav>
    </aside>
  );
};

export default MyPageSideBar;
