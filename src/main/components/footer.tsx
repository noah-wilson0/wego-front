import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-lg mr-3 flex items-center justify-center">
                <span className="text-white font-bold text-xl">🌍</span>
              </div>
              <span className="text-2xl font-bold">WEGO</span>
            </div>
            <p className="text-gray-300 mb-6 text-lg leading-relaxed">
              여행 경로 설계 및 공유 플랫폼
              <br />
              당신의 여행 성향에 맞는 완벽한 일정을
            </p>
            <p className="text-gray-400 text-sm mb-6">케미 테스트부터 일정 설계, 경로 공유까지 모든 여행 준비를 한 곳에서 해결하세요.</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">서비스</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-purple-400 transition-colors">여행 일정 설계</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">케미 테스트</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">여행 피드</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">경로 공유</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">고객지원</h3>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#" className="hover:text-purple-400 transition-colors">자주묻는질문</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">고객센터</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">1:1 문의</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">공지사항</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-gray-700">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-3">지금 다운로드하세요</h3>
            <div className="flex space-x-4">
              <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center">
                <span className="mr-2">📱</span> App Store
              </button>
              <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center">
                <span className="mr-2">🤖</span> Google Play
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">팔로우하세요</h3>
            <div className="flex space-x-4">
              <button className="w-10 h-10 bg-gray-700 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors">
                <span className="text-sm">📘</span>
              </button>
              <button className="w-10 h-10 bg-gray-700 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors">
                <span className="text-sm">📷</span>
              </button>
              <button className="w-10 h-10 bg-gray-700 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors">
                <span className="text-sm">🐦</span>
              </button>
              <button className="w-10 h-10 bg-gray-700 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors">
                <span className="text-sm">💼</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              <span className="mr-6">© 2024 WEGO. All rights reserved.</span>
              <span className="mr-4">|</span>
              <a href="#" className="hover:text-purple-400 transition-colors mr-4">개인정보처리방침</a>
              <span className="mr-4">|</span>
              <a href="#" className="hover:text-purple-400 transition-colors mr-4">이용약관</a>
              <span className="mr-4">|</span>
              <a href="#" className="hover:text-purple-400 transition-colors">사업자정보</a>
            </div>
            <div className="text-sm text-gray-400">개발자: WEGO Team | 문의: contact@wego.com</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;