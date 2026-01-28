// src/travl_plan_edit/dto/TravelPlanResponse.ts

/** ===============================
 * 서버 응답 DTO (TravelPlanResponse)
 * =============================== */

export type PlaceType = "A01" | "A02" | "A03" | "B01";

export interface PlaceItem {
  content_id: string;
  placeType: PlaceType;
  title: string;
  image: string;
  sequence: number;
  longitude: number;
  latitude: number;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
}

export interface DaySchedule {
  date: string;       // yyyy-MM-dd
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  places: PlaceItem[];
}

export interface RouteItem {
  sequence: number;
  origin: string;
  destination: string;
  duration: number; // seconds
}

export interface DayRoute {
  routeDate: string; // yyyy-MM-dd
  routes: RouteItem[];
}

export interface RouteInfo {
  routeType: string | null;
  dailyRoutes: DayRoute[];
}

export interface TravelPlanResponse {
  label: string;
  createdAt?: string;

  startDate: string;
  endDate: string;
  days: DaySchedule[];
  routes: RouteInfo;
}
