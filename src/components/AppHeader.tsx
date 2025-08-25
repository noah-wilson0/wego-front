import React from 'react';
import Header from '../main/components/header';
import { useAuth } from '../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';

type Props = {
  activeMenu?: string;
  onMenuClick?: (menu: string) => void; // 기존 페이지에서 쓰던 핸들러 재사용
};

const AppHeader: React.FC<Props> = ({ activeMenu, onMenuClick }) => {
  const { isLoggedIn, name, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = async (menu: string) => {
    if (menu === 'logout') {
      await logout();
      return;
    }
    if (menu === 'mypage') {
      navigate('/mypage');
      return;
    }
    onMenuClick?.(menu);
  };

  return (
    <Header
      activeMenu={activeMenu}
      onMenuClick={handleMenuClick}
      isLoggedIn={isLoggedIn}
      userName={name || undefined}
    />
  );
};

export default AppHeader;
