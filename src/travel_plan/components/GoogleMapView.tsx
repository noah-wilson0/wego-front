// src/travel_plan/components/GoogleMapView.tsx
import React, { memo, useMemo, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, Polyline, useLoadScript } from "@react-google-maps/api";
import type { MapMarker, LatLng, MapPolyline, CenterMarkerOptions } from "./mapTypes";

type Props = {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  selectedMarkerId?: string | null;
  onMarkerClick?: (id: string | null) => void;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  className?: string;

  /** ✅ 센터 마커 표시 옵션 */
  centerMarker?: boolean | CenterMarkerOptions;
};

const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };

const CAT_COLOR: Record<NonNullable<MapMarker["category"]>, string> = {
  A01: "#3B82F6",
  A02: "#EF4444",
  A03: "#F59E0B",
  B01: "#8B5CF6",
};

function numberedPinDataUrl(opts: {
  color: string;
  number?: number;
  selected?: boolean;
  category?: MapMarker["category"];
}) {
  const { color, number, selected, category } = opts;
  const bedIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="${selected ? color : "#111827"}">
      <path d="M3 12V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v5h9V6a1 1 0 0 1 2 0v12h-2v-3H5v3H3v-6Z"/>
    </svg>
  `;
  const inner =
    category === "B01"
      ? `<g transform="translate(14,20)">${bedIcon}</g>`
      : typeof number === "number"
      ? `<text x="22" y="32" text-anchor="middle" font-family="Inter, Arial" font-size="14" font-weight="700" fill="${
          selected ? color : "#111827"
        }">${number}</text>`
      : "";
  const pin = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.3 0"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path filter="url(#shadow)" d="M22 54c9.941 0 18-13.431 18-24S31.941 6 22 6 4 16.569 4 30s8.059 24 18 24Z" fill="${selected ? "#111827" : color}"/>
      <circle cx="22" cy="28" r="12" fill="#ffffff"/>
      ${inner}
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pin)}`;
}

/** ✅ 센터 마커용 심플 타겟 아이콘 */
function centerTargetIcon(): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="9" fill="#ffffff" stroke="#7C3AED" stroke-width="2"/>
      <circle cx="14" cy="14" r="3" fill="#7C3AED"/>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(28, 28),
    anchor: new google.maps.Point(14, 14),
  };
}

const GoogleMapView: React.FC<Props> = ({
  center,
  zoom = 11,
  markers = [],
  polylines = [],
  selectedMarkerId = null,
  onMarkerClick,
  onMapClick,
  className,
  centerMarker = false,
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const selected = useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) || null,
    [markers, selectedMarkerId]
  );

  const mapRef = useRef<google.maps.Map | null>(null);

  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className || ""}`}>
        <span className="text-gray-500">지도를 불러오는 중...</span>
      </div>
    );
  }

  const hasAnyGeometry = markers.length > 0 || polylines.length > 0;
  const centerMarkerEnabled =
    typeof centerMarker === "boolean" ? centerMarker : Boolean(centerMarker?.enabled);
  const centerMarkerTitle =
    typeof centerMarker === "object" && centerMarker?.title ? centerMarker.title : "중심 위치";

  return (
    <div className={`w-full h-full ${className || ""}`}>
      <GoogleMap
        key={`${center.lat}-${center.lng}-${zoom}-${markers.length}-${polylines.length}`}
        onLoad={(map) => {
          mapRef.current = map;
          if (hasAnyGeometry) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach((m) => bounds.extend(m.position));
            polylines.forEach((pl) => pl.path.forEach((p) => bounds.extend(p)));
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { top: 24, right: 24, bottom: 24, left: 24 });
            } else {
              map.setCenter(center);
              map.setZoom(zoom);
            }
          } else {
            map.setCenter(center);
            map.setZoom(zoom);
          }
        }}
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
        {/* 폴리라인 */}
        {polylines.map((pl) => (
          <Polyline
            key={pl.id}
            path={pl.path}
            options={{
              strokeOpacity: 0.9,
              strokeWeight: 4,
              strokeColor: "#7C3AED",
              geodesic: true,
              ...pl.options,
            }}
          />
        ))}

        {/* 마커들 */}
        {markers.map((m) => {
          const color = CAT_COLOR[m.category ?? "A01"];
          const isSel = m.id === selectedMarkerId;
          const url = numberedPinDataUrl({
            color,
            number: m.order,
            selected: isSel,
            category: m.category,
          });
          const icon: google.maps.Icon = {
            url,
            scaledSize: new google.maps.Size(44, 56),
            anchor: new google.maps.Point(22, 54),
          };
          return (
            <Marker
              key={m.id}
              position={m.position}
              title={m.title}
              onClick={() => onMarkerClick?.(m.id)}
              icon={icon}
              zIndex={isSel ? 99 : undefined}
            />
          );
        })}

        {/* ✅ 센터 마커 */}
        {centerMarkerEnabled && (
          <Marker position={center} title={centerMarkerTitle} icon={centerTargetIcon()} zIndex={100} />
        )}

        {selected && selected.infoHtml && (
          <InfoWindow position={selected.position} onCloseClick={() => onMarkerClick?.(null)}>
            <div dangerouslySetInnerHTML={{ __html: selected.infoHtml }} />
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default memo(GoogleMapView);
