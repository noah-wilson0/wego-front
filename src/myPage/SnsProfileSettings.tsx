import React, { useEffect, useState } from 'react';
import axios from 'axios';

// 서버 응답 타입 (스프링 record와 동일)
type MemberDetailResponse = {
  username: string; // 이메일
  name: string;     // 닉네임/표시 이름
};

// 쿠키 포함 axios 인스턴스
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

/** ✅ 컨텐츠만 렌더 (Header는 ProfileSwitcher에서 렌더) */
const SnsProfileSettings: React.FC = () => {
  // 서버 데이터로 채울 상태들
  const [displayName, setDisplayName] = useState(''); // 상단 보라 그라데이션 카드에 표시
  const [nickname, setNickname] = useState('');       // 폼 - 닉네임
  const [email, setEmail] = useState('');             // 폼 - 이메일(읽기 전용)
  const [loading, setLoading] = useState(true);

  const handleCancel = () => {
    console.log('취소 클릭됨');
  };

  const handleSave = () => {
    console.log('저장 클릭됨', { nickname, email });
    // TODO: 저장 API 연결 (PUT/PATCH)
  };

  const handleWithdraw = () => {
    console.log('회원 탈퇴 클릭됨');
  };

  // 마운트 시 프로필 불러오기
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get<MemberDetailResponse>('/profile/me');
        if (!mounted) return;

        const { username, name } = res.data || { username: '', name: '' };
        setDisplayName(name || '');
        setNickname(name || '');
        setEmail(username || '');
      } catch (e) {
        console.error('프로필 조회 실패:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* 프로필 헤더 (보라 그라데이션 카드) */}
      <div className="bg-gradient-to-r from-purple-400 to-purple-500 text-white py-20 rounded-lg mt-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {loading ? '불러오는 중...' : (displayName || '—')}
          </h1>
        </div>
      </div>

      {/* 프로필 설정 폼 */}
      <div className="bg-white p-12 shadow-sm rounded-lg -mt-4">
        <h2 className="text-2xl font-bold mb-10">프로필 설정</h2>

        <div className="space-y-8">
          {/* 닉네임 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">
              이메일
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-md bg-gray-200 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* 회원 탈퇴 버튼 */}
          <div className="pt-6">
            <button
              onClick={handleWithdraw}
              className="w-full py-3 text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              회원 탈퇴
            </button>
          </div>

          {/* 하단 버튼들 */}
          <div className="flex space-x-6 pt-6">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 text-base border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 text-base bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors font-medium disabled:opacity-60"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnsProfileSettings;
