// src/routes/RequireAuth.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

/**
 * 보호가 필요한 라우트를 감싸서, 로그인 안 되어 있으면 /login 으로 보냅니다.
 * 사용법: <Route element={<RequireAuth />}><Route path="/mypage" element={<MyPage/>}/></Route>
 */
const RequireAuth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  // 아직 부트스트랩 중이면 잠깐 아무것도 안 보여주거나 스켈레톤을 보여도 됩니다.
  if (loading) return null;

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
