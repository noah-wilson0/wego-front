// src/auth/AuthProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

type AuthState = {
  isLoggedIn: boolean;
  name: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const lastRouteCheckAt = useRef<number>(0);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<string>('/auth/me', { responseType: 'text' });
      setIsLoggedIn(true);
      setName((res.data || '').trim());
    } catch {
      setIsLoggedIn(false);
      setName(null);
    }
  }, []);

  // 로그아웃 → 홈으로
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/sign-out');
    } catch {}
    setIsLoggedIn(false);
    setName(null);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await refresh();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // 포커스/탭 전환 시 조용히 재확인
  useEffect(() => {
    const onFocusOrVisible = () => {
      refresh().catch(() => {});
    };
    window.addEventListener('visibilitychange', onFocusOrVisible);
    window.addEventListener('focus', onFocusOrVisible);
    return () => {
      window.removeEventListener('visibilitychange', onFocusOrVisible);
      window.removeEventListener('focus', onFocusOrVisible);
    };
  }, [refresh]);

  // 라우트 이동 시(5초 쿨다운) 조용히 재확인
  useEffect(() => {
    const now = Date.now();
    if (now - lastRouteCheckAt.current < 5000) return;
    lastRouteCheckAt.current = now;
    refresh().catch(() => {});
  }, [location.pathname, refresh]);

  // ✅ 변경 포인트: 401 인터셉터에서 "네비게이션"을 제거하고 상태만 초기화
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        if (status === 401) {
          // 세션 만료/비로그인 → 상태만 정리
          setIsLoggedIn(false);
          setName(null);
          // ❌ 여기서 navigate('/login?...') 하지 않음
          // 보호 페이지로 접근했을 때는 RequireAuth가 대신 리다이렉트합니다.
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  return (
    <AuthCtx.Provider value={{ isLoggedIn, name, loading, refresh, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// 필요하면 외부에서 같은 axios를 쓰도록 export 가능
export { api };
