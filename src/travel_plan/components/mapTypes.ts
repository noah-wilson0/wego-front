// src/travel_plan/components/mapTypes.ts
export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  title?: string;
  position: LatLng;
  infoHtml?: string;
  /** 카테고리: 명소(A01) | 식당(A02) | 카페(A03) | 숙소(B01) */
  category?: 'A01' | 'A02' | 'A03' | 'B01';
  /** 선택 순서(1..N). 있으면 번호가 보이는 SVG 마커로 렌더링 */
  order?: number;
};

export type MapPolyline = {
  id: string;
  path: LatLng[];
  /** react-google-maps PolylineOptions 그대로 */
  options?: google.maps.PolylineOptions;
};
