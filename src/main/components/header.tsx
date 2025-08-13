import React, { useState } from 'react';

interface HeaderProps {
  activeMenu?: string;
  onMenuClick?: (menu: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeMenu = '', onMenuClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { key: 'trip', label: '여행지' },
    { key: 'guide', label: '가이드' },
    { key: 'feed', label: '피드' },
    { key: 'login', label: '로그인' }
  ];

  const handleMenuClick = (menuKey: string) => {
    if (onMenuClick) {
      onMenuClick(menuKey);
    }
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

        {/* 데스크톱 네비게이션 메뉴 */}
        <nav className="hidden sm:flex items-center">
          <div className="flex items-center space-x-8 lg:space-x-12">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="text-base font-medium text-black hover:text-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* 모바일 햄버거 메뉴 버튼 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden flex flex-col items-center justify-center w-6 h-6 space-y-1"
        >
          <span 
            className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${
              isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span 
            className={`block w-5 h-0.5 bg-gray-600 transition-opacity duration-200 ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span 
            className={`block w-5 h-0.5 bg-gray-600 transition-transform duration-200 ${
              isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 shadow-lg z-50">
          <nav className="px-6 py-4 space-y-4">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.key)}
                className="block w-full text-left text-base font-medium text-black hover:text-blue-600 transition-colors py-2"
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

// 사용 예시를 보여주는 메인 컴포넌트
const MainPageWithHeader: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const handleMenuClick = (menu: string) => {
    setCurrentPage(menu);
    console.log(`${menu} 페이지로 이동`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단바 */}
      <Header 
        activeMenu={currentPage} 
        onMenuClick={handleMenuClick}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            현재 페이지: {currentPage}
          </h1>
          <p className="text-gray-600">
            상단 메뉴를 클릭하여 페이지를 변경해보세요.
          </p>
        </div>
      </main>
    </div>
  );
};

export default MainPageWithHeader;