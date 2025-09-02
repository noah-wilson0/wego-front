// src/components/header.tsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';

interface HeaderProps {
  activeMenu?: string;
  onMenuClick?: (menu: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeMenu = '', onMenuClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, loading, logout } = useAuth();

  const menuItems = useMemo(() => {
    const base = [
      { key: 'trip', label: '여행지' },
      { key: 'guide', label: '가이드' },
      { key: 'feed', label: '피드' },
    ];
    if (loading) return base;
    return isLoggedIn
      ? [...base, { key: 'mypage', label: '마이페이지' }, { key: 'logout', label: '로그아웃' }]
      : [...base, { key: 'login', label: '로그인' }];
  }, [isLoggedIn, loading]);

  const handleMenuClick = async (menuKey: string) => {
    if (menuKey === 'logout') {
      await logout();
      // 🔸 이전: onMenuClick?.('login')  → 로그인 페이지로 이동시킴
      // 🔸 변경: AuthProvider.logout 이 이미 "/"로 이동하므로 추가 네비게이션 불필요
      // onMenuClick?.('home'); // (원하면 명시적으로 홈 클릭 신호를 보낼 수도 있음)
      setIsMenuOpen(false);
      return;
    }
    onMenuClick?.(menuKey);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border border-gray-300 px-8 py-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center">
          <button
            onClick={() => handleMenuClick('home')}
            className="text-xl font-bold text-black"
          >
            LOGO
          </button>
        </div>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden sm:flex items-center">
          <div className="flex items-center space-x-8 lg:space-x-12">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className={`text-base font-medium transition-colors ${
                  activeMenu === item.key ? 'text-blue-600' : 'text-black hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* 모바일 버튼 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center w-6 h-6 space-y-1"
        >
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 shadow-lg z-50">
          <nav className="px-6 py-4 space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className={`block w-full text-left text-base font-medium transition-colors py-2 ${
                  activeMenu === item.key ? 'text-blue-600' : 'text-black hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
