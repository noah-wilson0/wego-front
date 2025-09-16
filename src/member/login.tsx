// src/pages/Login.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider'; // 경로는 프로젝트 구조에 맞춰 조정

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true, // HttpOnly 쿠키 포함
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth(); // ★ 로그인 직후 컨텍스트 갱신용

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Enter 키로도 로그인되게끔
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // ✅ 꼭 슬래시 포함: '/auth/sign-in'
      await api.post('/auth/sign-in', {
        username: email, // 서버는 username 필드 사용
        password,
      });

      // ✅ 쿠키가 세팅된 직후 컨텍스트 최신화 → 헤더 즉시 반영
      await refresh();

      // ✅ redirect 있을 때만 이동, 없으면 홈으로
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam), { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      alert('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSNSLogin = (provider: string) => {
    console.log(`${provider} 로그인`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">logo</h1>
        </div>

        {/* 로그인 입력 필드들 */}
        <div className="space-y-6">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onKeyDown={onKeyDown}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이메일을 입력하세요"
              autoComplete="username"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onKeyDown={onKeyDown}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>

          {/* 비밀번호 찾기 */}
          <div className="text-right">
            <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              비밀번호를 잊으셨나요?
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center mt-6">
          <span className="text-sm text-gray-500">아직 회원이 아니신가요? </span>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
            회원가입
          </button>
        </div>

        {/* 구분선 */}
        <div className="my-8 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">SNS 간편 로그인</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* SNS 로그인 버튼들 */}
        <div className="flex justify-center space-x-4">
          {/* 카카오톡 */}
          <button
            onClick={() => handleSNSLogin('카카오톡')}
            className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center hover:bg-yellow-500 transition-colors"
          >
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
          </button>

          {/* 네이버 */}
          <button
            onClick={() => handleSNSLogin('네이버')}
            className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <span className="text-white font-bold text-lg">N</span>
          </button>

          {/* 구글 */}
          <button
            onClick={() => handleSNSLogin('구글')}
            className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
