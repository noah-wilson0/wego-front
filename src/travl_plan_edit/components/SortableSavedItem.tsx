// src/components/common/SortableSavedItem.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import SavedPlaceCard from "./StoragePlaceCard";

/** 3x3 점 아이콘 (드래그 핸들용) */
export function DotGrid9({ className = "h-4 w-4" }: { className?: string }) {
  const points = [6, 12, 18];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      {points.flatMap((x) =>
        points.map((y, i) => <circle key={`${x}-${y}-${i}`} cx={x} cy={y} r="1.6" />)
      )}
    </svg>
  );
}

interface Place {
  contentId: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface Props {
  place: Place;
  onRemove: (id: string) => void;
}

/** DnD 감싸는 Sortable Item */
const SortableSavedItem: React.FC<Props> = ({ place, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: place.contentId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SavedPlaceCard place={place}>
        <button
          {...attributes}
          {...listeners}
          className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
          title="순서 변경"
        >
          <DotGrid9 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(place.contentId)}
          className="h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900"
          title="삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </SavedPlaceCard>
    </div>
  );
};

export default SortableSavedItem;
