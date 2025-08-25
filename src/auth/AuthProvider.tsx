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
  
  /* ------------------------------------------------------------------ */
  /* 1) 공용 axios 인스턴스
        - withCredentials: HttpOnly 쿠키(AT/RT) 자동 포함
        - 모든 API 호출이 이 인스턴스를 쓰면 401 인터셉터가 적용됨
  /* ------------------------------------------------------------------ */
  const api = axios.create({
    baseURL: 'http://localhost:8080',
    withCredentials: true,
  });
  
  /* ------------------------------------------------------------------ */
  /* 2) 컨텍스트 타입
        ⚠ 현재는 /auth/me 가 "문자열 name"만 반환하므로 단순 상태만 둠
        🌟 [소셜 로그인 확장 가이드]
           - 향후 /auth/me 가 { name, loginType } JSON을 반환한다면:
             1) AuthState에 loginType 추가 (LOCAL | KAKAO | NAVER | GOOGLE | APPLE | UNKNOWN)
             2) 아래 refresh()에서 JSON 파싱 로직으로 전환
             3) (선택) ProfileSwitcher에서 loginType으로 화면 분기
  /* ------------------------------------------------------------------ */
  type AuthState = {
    isLoggedIn: boolean;           // 로그인 여부
    name: string | null;           // 표시 이름(현재는 문자열만 받음)
    loading: boolean;              // 초기 부트스트랩 로딩 상태
    refresh: () => Promise<void>;  // 서버에 현재 로그인인지 재확인
    logout: () => Promise<void>;   // 로그아웃(쿠키 삭제 + 상태 초기화 + 로그인 화면 이동)
  };
  
  const AuthCtx = createContext<AuthState | null>(null);
  
  /* ------------------------------------------------------------------ */
  /* 3) Provider
  /* ------------------------------------------------------------------ */
  export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [name, setName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    const navigate = useNavigate();
    const location = useLocation();
  
    // 라우트 변경 시 재검증 쿨다운(불필요한 과도한 호출 방지)
    const lastRouteCheckAt = useRef<number>(0);
  
    /* ---------------------------------------------------------------- */
    /* A) 현재 로그인 상태 재확인
         - 지금: /auth/me 가 200이면 "문자열 name"만 돌려줌 → 로그인 유지
         - 401/403/에러면 비로그인 처리
         - 토큰 "재발급"은 하지 않고, 오직 "확인"만 함
         
         🌟 [소셜 로그인 확장 가이드]
         - 백엔드가 /auth/me 를 JSON으로 확장했다면:
           type AuthMeResponse = { name: string; loginType: 'LOCAL'|'KAKAO'|'NAVER'|'GOOGLE'|'APPLE' };
           1) 여기서 responseType: 'text' 제거
           2) const res = await api.get<AuthMeResponse>('/auth/me');
           3) setName(res.data.name);
           4) setLoginType(res.data.loginType);   // (AuthState/상태에 추가 필요)
    /* ---------------------------------------------------------------- */
    const refresh = useCallback(async () => {
      try {
        // 현재 서버는 "문자열"만 주므로 text로 받음
        const res = await api.get<string>('/auth/me', { responseType: 'text' });
        setIsLoggedIn(true);
        setName((res.data || '').trim());
      } catch {
        setIsLoggedIn(false);
        setName(null);
      }
    }, []);
  
    /* ---------------------------------------------------------------- */
    /* B) 로그아웃
         - 서버에 로그아웃 요청(쿠키 삭제 + RT/AT 블랙리스트 처리)
         - 클라이언트 상태 초기화 후, 현재 경로를 redirect 쿼리로 달아 로그인 페이지로
    /* ---------------------------------------------------------------- */
    const logout = useCallback(async () => {
      try {
        await api.post('/members/logout');
      } catch {
        // 네트워크 실패여도 클라이언트 상태는 정리
      }
      setIsLoggedIn(false);
      setName(null);
  
      const redirect = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${redirect}`, { replace: true });
    }, [location.pathname, location.search, navigate]);
  
    /* ---------------------------------------------------------------- */
    /* C) 첫 진입(앱 부트스트랩) 때 1회 검증 + 로딩 플래그
         - 앱 시작 시 헤더/화면 상태가 로그인 기준으로 정확히 보이게 함
    /* ---------------------------------------------------------------- */
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
  
    /* ---------------------------------------------------------------- */
    /* D) 탭 전환/포커스 때 조용히 재확인
         - 다른 탭에서 로그아웃/비번변경하여 쿠키가 바뀐 경우를 즉시 반영
         - loading 플래그는 건드리지 않아 화면 깜빡임 없음
    /* ---------------------------------------------------------------- */
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
  
    /* ---------------------------------------------------------------- */
    /* E) (선택) 라우트 이동 시 “조용한” 재확인
         - UX 안정용 옵션. 과도한 호출을 막기 위해 5초 쿨다운.
         - 필요 없다면 이 useEffect 자체를 지워도 됨.
         
         💡 로그인 직후에 헤더가 바로 안 바뀌는 경우가 있었다면
            - (1) 로그인 성공 직후 Login 페이지에서 useAuth().refresh() 한번 호출
            - (2) 또는 아래 라우트 재검증(useEffect)이 해결해줌
    /* ---------------------------------------------------------------- */
    useEffect(() => {
      const now = Date.now();
      if (now - lastRouteCheckAt.current < 5000) return; // 5초 이내면 스킵
      lastRouteCheckAt.current = now;
      refresh().catch(() => {});
    }, [location.pathname, refresh]);
  
    /* ---------------------------------------------------------------- */
    /* F) 401 중앙 처리(강력 추천)
         - 어떤 API든 401이 떨어지면 바로 비로그인 상태로 전환하고
           로그인 화면으로 redirect. 헤더 메뉴도 즉시 바뀜.
         
         🌟 [소셜 로그인 확장 가이드]
         - 백엔드 OAuth 콜백에서 쿠키를 세팅하고 프론트로 redirect만 해주면,
           이 인터셉터 + 부트 스트랩/재검증 로직 덕분에 헤더 상태가 자동 반영됨.
    /* ---------------------------------------------------------------- */
    useEffect(() => {
      const id = api.interceptors.response.use(
        (res) => res,
        (err) => {
          const status = err?.response?.status;
          if (status === 401) {
            // 인증 만료/로그아웃/비번변경 등 → 즉시 상태 초기화
            setIsLoggedIn(false);
            setName(null);
  
            // 이미 로그인 페이지면 또 밀지 않음
            if (location.pathname !== '/login') {
              const redirect = encodeURIComponent(location.pathname + location.search);
              navigate(`/login?redirect=${redirect}`, { replace: true });
            }
          }
          return Promise.reject(err);
        }
      );
      return () => api.interceptors.response.eject(id);
    }, [location.pathname, location.search, navigate]);
  
    return (
      <AuthCtx.Provider value={{ isLoggedIn, name, loading, refresh, logout }}>
        {children}
      </AuthCtx.Provider>
    );
  };
  
  /* ------------------------------------------------------------------ */
  /* 4) 훅: 컨텍스트 안전하게 사용
  /* ------------------------------------------------------------------ */
  export const useAuth = () => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
  };
  
  /* (선택) 이 인스턴스를 다른 곳에서도 쓰고 싶으면 export 해두세요. */
  // export { api as authApi };
  
  /* ================================================================== */
  /* 🌟 [소셜 로그인 도입 시 체크리스트 — 어떤 파일을 손대나?]
     1) 백엔드
        - /auth/me : 문자열 → JSON { name, loginType } 형태로 확장 권장
        - OAuth 시작/콜백 엔드포인트 추가 (permitAll)
        - 콜백에서 AT/RT 쿠키 세팅 후 프론트 redirect=... 로 돌려보내기
  
     2) 이 파일(AuthProvider.tsx)
        - refresh(): responseType:'text' 삭제
        - (선택) AuthState에 loginType 추가
        - /auth/me JSON 파싱하여 name, loginType 세팅
  
     3) ProfileSwitcher.tsx (이미 있다면)
        - loginType === 'LOCAL' ? <LocalProfileSettings/> : <SnsProfileSettings/>
  
     4) Login.tsx
        - SNS 버튼은 SPA 내부 이동이 아니라 window.location.href 로
          http://localhost:8080/oauth2/authorization/{provider}?redirect=...
        - 로컬 로그인 성공 직후 useAuth().refresh() 한 번 호출하면
          헤더가 즉시 “마이페이지/로그아웃”으로 바뀌어 UX 좋아짐
  
     5) Header/AppHeader
        - isLoggedIn만 보면 되니 보통 수정 불필요
  ================================================================== */
  