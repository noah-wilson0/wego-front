import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Bus, Car } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie"; // ✅ 쿠키 사용

interface TravelPlanRouteProps {
  onClose: () => void;
}

export default function TravelPlanRoute({ onClose }: TravelPlanRouteProps) {
  const [selectedOption, setSelectedOption] = useState<"car" | "transit" | null>(null);
  const [uuid, setUuid] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUuid = Cookies.get("travelPlanUUID"); // ✅ 쿠키에서 uuid 꺼냄
    setUuid(storedUuid || null);
  }, []);

  const transportOptions = [
    { id: "transit" as const, label: "대중교통", icon: <Bus size={32} /> },
    { id: "car" as const, label: "승용차", icon: <Car size={32} /> }
  ];

  const handleOptionClick = (optionId: "car" | "transit") => {
    setSelectedOption(optionId);
  };

  const handleCreateSchedule = async () => {
    if (!selectedOption || !uuid) return;

    try {
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/${selectedOption}/route`);
      navigate("/check");
    } catch (error) {
      console.error("일정 생성 중 오류 발생:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-[768px] max-w-2xl mx-4 relative">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-12 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">이동수단 선택</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={48} />
        </button>
      </div>

      {/* 부제목 */}
      <div className="px-12 pt-8 pb-4">
        <p className="text-gray-500 text-base">여행시 이용하실 이동수단을 선택해주세요.</p>
      </div>

      {/* 옵션 */}
      <div className="p-12 grid grid-cols-2 gap-8">
        {transportOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={`
              ${selectedOption === option.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              rounded-lg p-12 flex flex-col items-center justify-center
              transition-all duration-200 transform hover:scale-105
            `}
          >
            <div className="mb-6">{option.icon}</div>
            <span className="text-base font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      {/* 버튼들 */}
      <div className="p-12 pt-4 flex gap-6">
        <button
          onClick={handleCreateSchedule}
          disabled={!selectedOption || !uuid}
          className={`flex-1 py-6 rounded-lg text-base font-medium transition-colors
            ${selectedOption && uuid ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          일정 생성
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-6 rounded-lg hover:bg-gray-400 transition-colors font-medium text-base"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
