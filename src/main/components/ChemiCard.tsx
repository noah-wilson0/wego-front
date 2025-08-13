// 케미카드.tsx
import React from "react";

export type ChemiCardProps = {
  title: string;
  image?: string;         // /src/assets/chemi/<id>.png 경로 등
  onClick?: () => void;   // 카드 클릭 핸들러 (선택)
  className?: string;     // 추가 스타일이 필요하면 전달 (선택)
};

const ChemiCard: React.FC<ChemiCardProps> = ({ title, image, onClick, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className={[
        "flex-shrink-0 w-32 h-40 p-3 rounded-2xl border-2 border-gray-200 bg-white",
        "hover:border-blue-400 hover:shadow-lg transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        className || ""
      ].join(" ")}
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-16 h-16 mb-3 rounded-2xl object-cover shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 mb-3 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-gray-700">{title.slice(0, 2)}</span>
          </div>
        )}
        <h3 className="text-xs font-semibold text-gray-800 leading-tight">{title}</h3>
      </div>
    </button>
  );
};

export default ChemiCard;
