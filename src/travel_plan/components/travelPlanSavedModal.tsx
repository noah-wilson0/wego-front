import React from 'react';

interface TravelPlanSavedModalProps {
  show: boolean;                 // 모달 표시 여부
  onClose: () => void;           // "아니오" 버튼 클릭 시
  onConfirm: () => void;         // "예" 버튼 클릭 시
}

const TravelPlanSavedModal: React.FC<TravelPlanSavedModalProps> = ({
  show,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-[360px] p-6">
        <h3 className="text-lg font-semibold mb-3">저장되었습니다</h3>
        <p className="text-sm text-gray-600 mb-6">
          마이페이지로 이동하겠습니까?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            아니오
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
};

export default TravelPlanSavedModal;