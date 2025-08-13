import React from 'react';

interface TravelAreaData {
  id: string;
  englishName: string;
  koreanName: string;
  image: string;
}

interface TravelAreaCardProps {
  area: TravelAreaData;
  onClick?: (area: TravelAreaData) => void;
}

const TravelAreaCard = ({ area, onClick }: TravelAreaCardProps) => {
  const handleClick = () => {
    onClick?.(area);
  };

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={handleClick}
    >
      <div className="aspect-square bg-gradient-to-br from-green-400 to-green-600 relative">
        <img 
          src={area.image} 
          alt={area.koreanName} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 기본 그라데이션 배경 유지
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="font-bold text-lg text-gray-900">{area.englishName}</h3>
        <p className="text-sm text-gray-500 mt-1">{area.koreanName}</p>
      </div>
    </div>
  );
};

export default TravelAreaCard;
export type { TravelAreaData };