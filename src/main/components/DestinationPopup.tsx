import React from 'react';
import { X, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // ✅ 라우팅 훅 추가

interface TravelAreaData {
  id: string;
  englishName: string;
  koreanName: string;
  image: string;
  description: string;
}

interface DestinationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  destination: TravelAreaData | null;
}

// ✅ localStorage 키 상수 (다른 화면에서도 동일 키로 읽으면 됨)
const SELECTED_AREA_STORAGE_KEY = 'wego:selectedAreaId';

const DestinationPopup: React.FC<DestinationPopupProps> = ({
  isOpen,
  onClose,
  destination
}) => {
  const navigate = useNavigate(); // ✅ 라우터 훅 사용

  if (!isOpen || !destination) return null;

  const handlePlanItinerary = () => {
    // ✅ [localStorage 저장] travelData.ts에서 찾을 수 있도록 'id'만 저장
    try {
      localStorage.setItem(SELECTED_AREA_STORAGE_KEY, destination.id);
      console.log(`[localStorage] ${SELECTED_AREA_STORAGE_KEY} = ${destination.id} 저장`);
    } catch (e) {
      console.error('선택 지역 저장 실패:', e);
    }

    console.log(`${destination.koreanName} 일정 만들기 클릭됨`);
    onClose();            // ✅ 오버레이 닫기
    navigate('/date');    // ✅ /date로 라우팅
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // koreanName에서 지역명만 추출 (예: "대한 민국 서울" -> "서울")
  const getRegionName = (koreanName: string): string => {
    const parts = koreanName.split(' ');
    return parts[parts.length - 1];
  };

  // koreanName에서 국가/지역 정보 추출 (예: "대한 민국 경기 가평" -> "대한민국 경기")
  const getLocationInfo = (koreanName: string): string => {
    const parts = koreanName.split(' ');
    if (parts.length <= 2) {
      return parts.slice(0, -1).join(' ');
    }
    return parts.slice(0, -1).join(' ');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 헤더 */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* 이미지 섹션 */}
          <div className="relative h-48 bg-gradient-to-br from-blue-400 to-green-500 overflow-hidden">
            <img
              src={destination.image || "/api/placeholder/400/200"}
              alt={destination.koreanName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>

        {/* 컨텐츠 섹션 */}
        <div className="p-6">
          {/* 제목 */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{getRegionName(destination.koreanName)}</h2>
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{getLocationInfo(destination.koreanName)}</span>
            </div>
          </div>

          {/* 설명 */}
          <div className="mb-6">
            <p className="text-gray-600 leading-relaxed text-sm">
              {destination.description}
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            {/* 일정 만들기 버튼 */}
            <button
              onClick={handlePlanItinerary}
              className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              일정 만들기
            </button>

            {/* 공유 버튼 */}
            <button className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>

            {/* 저장 버튼 */}
            <button className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationPopup;
