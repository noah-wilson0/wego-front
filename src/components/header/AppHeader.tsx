// src/components/AppHeader.tsx
import React from "react";
import Header from "./header";
import { useAuth } from "../../auth/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";

type Props = {
  /** 현재 활성화된 메뉴 키(하이라이트용). 예: 'home' | 'trip' | 'chemi' | 'feed' | 'login' | 'mypage' */
  activeMenu?: string;
  /** 페이지(부모)에서 메뉴 클릭 시 추가로 하고 싶은 일을 넘기는 콜백 */
  onMenuClick?: (menu: string) => void;
};

/**
 * AppHeader = 공통 헤더 어댑터
 * - 로그인 상태/유저명/로그아웃 같은 '공통 로직'은 여기서 처리
 * - 실제 UI는 Header 컴포넌트가 담당
 * - 메뉴 클릭 시:
 *   1) 공통 처리(로그아웃, 마이페이지, 기본 라우팅)
 *   2) 부모 콜백(onMenuClick)도 호출해서 페이지별 추가 동작 가능
 */
const AppHeader: React.FC<Props> = ({ activeMenu, onMenuClick }) => {
  const { isLoggedIn, name, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 필요하면 현재 경로로 activeMenu 자동 계산에 활용 가능

  const handleMenuClick = async (menu: string) => {
    // 1) 공통 처리 먼저 수행
    if (menu === "logout") {
      await logout();
      // 로그아웃 후 로그인 페이지나 홈으로 보내고 싶다면 아래처럼:
      // navigate("/login");
      // 혹은 현재 페이지 유지도 가능
      // 공통 처리 후에도 부모 콜백은 호출(선택)
      onMenuClick?.(menu);
      return;
    }

    if (menu === "mypage") {
      navigate("/mypage");
      onMenuClick?.(menu);
      return;
    }

    // 기본 라우팅 보강(선택): Header에서 전달한 키에 따라 이동
    switch (menu) {
      case "home":
        navigate("/");
        break;
      case "login":
        // 리다이렉트 파라미터를 붙이고 싶다면 location.pathname 사용 가능
        navigate("/login");
        break;
      case "trip":
        navigate("/areas"); // 실제 라우트에 맞게 수정하세요
        break;
      case "guide":
        navigate("/guide"); // 실제 라우트에 맞게 수정하세요
        break;
      case "feed":
        navigate("/feed");
        break;
      default:
        // 정의되지 않은 메뉴 키는 부모 콜백에만 위임
        break;
    }

    // 2) 페이지(부모)에서 추가 동작을 하고 싶을 수 있으니 항상 호출
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
