import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

import AppHeader from '../components/header/AppHeader';
import LocalProfileSettings from './LocalProfileSettings';

import SnsProfileSettings from './SnsProfileSettings';
// SNS 화면이 이미 있다면 주석 해제
// import SnsProfileSettings from './SnsProfileSettings';

/** /auth/me 응답: 현재는 문자열(name)만 오지만
 *  향후 { name, loginType } 형태가 올 수 있음에 대비 */
type AuthMeResponse =
  | string
  | {
      name?: string;
      loginType?: 'local' | 'sns' | string;
    };

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

const ProfileSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [authLoading, setAuthLoading] = useState(true);
  const [authName, setAuthName] = useState<string>('');
  const [loginType, setLoginType] = useState<'local' | 'sns' | 'unknown'>('unknown');

  const activeMenu = useMemo(() => 'profile', []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setAuthLoading(true);
        const res = await api.get<AuthMeResponse>('/auth/me');

        if (!mounted) return;

        const data = res.data;

        if (typeof data === 'string') {
          // 현재 서버: 이름 문자열만 반환
          setAuthName(data);
          setLoginType('local'); // SNS 미구현이므로 기본 local 가정
        } else if (data && typeof data === 'object') {
          setAuthName(data.name ?? '');
          const t = (data.loginType ?? 'local') as 'local' | 'sns' | 'unknown';
          setLoginType(t);
        } else {
          setAuthName('');
          setLoginType('local');
        }
      } catch (err) {
        // 미로그인 → 로그인 페이지로 보냄
        const redirect = encodeURIComponent(location.pathname + location.search);
        navigate(`/login?redirect=${redirect}`);
        return;
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search, navigate]);

  const handleTopMenuClick = (menuKey: string) => {
    if (menuKey === 'home') navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 공통 상단 헤더: 여기서만 렌더 */}
      <AppHeader activeMenu={activeMenu} onMenuClick={handleTopMenuClick} />

      {authLoading ? (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600">
          로그인 확인 중...
        </div>
      ) : (
        <>
          {/* 추후 SNS 로그인 타입 오면 아래 분기 사용 */}
          {loginType === 'sns'
            ? (
              // <SnsProfileSettings />  // SNS 구현 시 사용
              <LocalProfileSettings />   // 현재는 로컬 화면 고정
            )
            : <LocalProfileSettings />
          }
        </>
      )}
    </div>
  );
};

export default ProfileSwitcher;
