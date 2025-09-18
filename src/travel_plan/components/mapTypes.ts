// src/travel_plan/components/mapTypes.ts
export type LatLng = { lat: number; lng: number };

export type MapMarker = {
  id: string;
  title?: string;
  position: LatLng;
  infoHtml?: string;
  /** 'A01'(명소) | 'A02'(식당) | 'A03'(카페) | 'B01'(숙소) */
  category?: 'A01' | 'A02' | 'A03' | 'B01';
};
