// src/pages/LocalProfileSettings.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Lock, Check, X, Shield } from 'lucide-react';

// 서버 응답 타입
type MemberDetailResponse = {
  username: string; // 이메일
  name: string;     // 닉네임/표시 이름
};

// 쿠키 포함 axios 인스턴스
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
});

const LocalProfileSettings: React.FC = () => {
  // 상단 배너/폼 데이터
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // 비밀번호 입력/상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedCurrent, setVerifiedCurrent] = useState<boolean | null>(null); // null=미확인, true/false
  const [busy, setBusy] = useState(false);

  // 비밀번호 표시/숨김
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 초기 프로필 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<MemberDetailResponse>('/me');
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

  // 현재 비밀번호 확인 (POST /me/check-password) — body: text/plain
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      setVerifiedCurrent(false);
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }
    try {
      setBusy(true);
      await api.post('/me/check-password', currentPassword, {
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      });
      setVerifiedCurrent(true);
    } catch (err: any) {
      setVerifiedCurrent(false);
      const msg = err?.response?.data || '현재 비밀번호가 올바르지 않습니다.';
      alert(String(msg));
    } finally {
      setBusy(false);
    }
  };

  // 비밀번호 변경 (POST /me/change-password)
  const handleChangePassword = async () => {
    if (!verifiedCurrent) {
      alert('현재 비밀번호 확인이 필요합니다.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      alert('새 비밀번호와 확인을 모두 입력해주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setBusy(true);
      await api.post('/me/change-password', {
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      alert('비밀번호가 변경되었어요. 보안을 위해 다시 로그인해주세요.');
      // 서버가 토큰 쿠키를 삭제하므로 새로고침/로그인 페이지 이동 권장
      window.location.href = '/login';
    } catch (err: any) {
      const msg = err?.response?.data || '비밀번호 변경에 실패했어요.';
      alert(String(msg));
    } finally {
      setBusy(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerifiedCurrent(null);
    }
  };

  // 회원 탈퇴 (DELETE /me)
  const handleWithdraw = async () => {
    if (!confirm('정말로 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      setBusy(true);
      await api.delete('/me');
      alert('회원 탈퇴가 완료되었어요.');
      window.location.href = '/';
    } catch (err: any) {
      const msg = err?.response?.data || '회원 탈퇴에 실패했어요.';
      alert(String(msg));
    } finally {
      setBusy(false);
    }
  };

  // 닉네임 저장 (PATCH /me/change-info)
  const handleSave = async () => {
    try {
      setBusy(true);
      await api.patch('/me/change-info', { name: nickname });
      setDisplayName(nickname);
      alert('프로필이 저장되었어요.');
    } catch (err: any) {
      const msg = err?.response?.data || '프로필 저장에 실패했어요.';
      alert(String(msg));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    setNickname(displayName);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerifiedCurrent(null);
  };

  const matchState =
    newPassword && confirmPassword
      ? newPassword === confirmPassword
        ? 'match'
        : 'mismatch'
      : 'idle';

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* 상단 배너 */}
      <div className="bg-purple-400 text-white py-16 rounded-lg mt-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            {loading ? '불러오는 중...' : (displayName || '—')}
          </h1>
        </div>
      </div>

      {/* 본문 카드 */}
      <div className="bg-white p-10 shadow-sm rounded-lg -mt-3 border border-gray-200">
        <h2 className="text-2xl font-bold mb-8">프로필 설정</h2>

        <div className="space-y-6">
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading || busy}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-200 text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* 비밀번호 섹션 */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">비밀번호 변경</h3>
            </div>

            {/* 현재 비밀번호 */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                현재 비밀번호 확인
              </label>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="현재 비밀번호를 입력하세요"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyCurrentPassword}
                  disabled={!currentPassword || busy}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    verifiedCurrent === true
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50'
                  }`}
                >
                  {verifiedCurrent === true ? (
                    <span className="inline-flex items-center gap-2">
                      <Check size={16} /> 확인됨
                    </span>
                  ) : (
                    '확인'
                  )}
                </button>
              </div>

              {verifiedCurrent === false && (
                <div className="flex items-center gap-2 mt-3 text-red-600">
                  <X size={16} />
                  <span className="text-sm">현재 비밀번호가 올바르지 않습니다.</span>
                </div>
              )}
              {verifiedCurrent === true && (
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <Check size={16} />
                  <span className="text-sm">현재 비밀번호가 확인되었습니다.</span>
                </div>
              )}
            </div>

            {/* 새 비밀번호 */}
            <div
              className={`p-5 rounded-xl border transition-all duration-300 ${
                verifiedCurrent === true ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                새 비밀번호 설정
              </label>

              <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="새 비밀번호를 입력하세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={verifiedCurrent !== true || busy}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={verifiedCurrent !== true}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={verifiedCurrent !== true || busy}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={verifiedCurrent !== true}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={
                    !verifiedCurrent ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    busy
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                >
                  변경
                </button>
              </div>

              {/* 일치/불일치 메시지 */}
              {newPassword && confirmPassword && (
                <div
                  className={`flex items-center gap-2 mt-3 ${
                    newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {newPassword === confirmPassword ? <Check size={16} /> : <X size={16} />}
                  <span className="text-sm">
                    {newPassword === confirmPassword
                      ? '비밀번호가 일치합니다.'
                      : '비밀번호가 일치하지 않습니다.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 회원 탈퇴 */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleWithdraw}
              disabled={busy}
              className="w-full py-3 border-2 border-red-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 transition-all font-medium"
            >
              회원 탈퇴
            </button>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleCancel}
              disabled={busy}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all font-medium"
            >
              돌아가기
            </button>
            <button
              onClick={handleSave}
              disabled={loading || busy}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-60 transition-all font-medium shadow-md"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalProfileSettings;
