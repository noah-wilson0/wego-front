// src/travel_plan/components/GoogleMapView.tsx
import React, { memo, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import type { MapMarker, LatLng } from './mapTypes';

type Props = {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  className?: string;
};

const containerStyle: React.CSSProperties = { width: '100%', height: '100%' };

// 카테고리 → 색상 맵
const CAT_COLOR: Record<string, string> = {
  A01: '#2563eb', // 명소 파랑
  A02: '#ef4444', // 식당 빨강
  A03: '#f59e0b', // 카페 주황
  B01: '#7c3aed', // 숙소 보라
};

// 깔끔한 핀 형태의 SVG를 data URL로 만들어 반환
function buildPinDataUrl(hex: string) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24'>
      <defs>
        <filter id='s' x='-20%' y='-10%' width='140%' height='140%'>
          <feDropShadow dx='0' dy='1' stdDeviation='1' flood-opacity='0.25'/>
        </filter>
      </defs>
      <g filter='url(#s)'>
        <path d='M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z' fill='${hex}'/>
        <circle cx='12' cy='9' r='3.2' fill='white'/>
      </g>
    </svg>`;
  // encodeURIComponent 로 안전하게 인코딩
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const GoogleMapView: React.FC<Props> = ({
  center,
  zoom = 11,
  markers = [],
  selectedMarkerId = null,
  onMarkerClick,
  onMapClick,
  className
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const selected = useMemo(
    () => markers.find(m => m.id === selectedMarkerId) || null,
    [markers, selectedMarkerId]
  );

  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-500">지도를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className || ''}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          clickableIcons: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {markers.map(m => {
          const color = CAT_COLOR[m.category || ''] || '#111827'; // 기본: slate-900
          const iconUrl = buildPinDataUrl(color);
          return (
            <Marker
              key={m.id}
              position={m.position}
              title={m.title}
              onClick={() => onMarkerClick?.(m.id)}
              icon={{
                url: iconUrl,
                // 크기/앵커값으로 핀 끝이 좌표를 정확히 가리키도록 조정
                scaledSize: new google.maps.Size(36, 36),
                anchor: new google.maps.Point(18, 34),
              }}
              zIndex={m.id === selectedMarkerId ? 999 : undefined}
            />
          );
        })}

        {selected && selected.infoHtml && (
          <InfoWindow
            position={selected.position}
            onCloseClick={() => onMarkerClick?.(null)}
            options={{ maxWidth: 240 }}
          >
            <div dangerouslySetInnerHTML={{ __html: selected.infoHtml }} />
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default memo(GoogleMapView);
