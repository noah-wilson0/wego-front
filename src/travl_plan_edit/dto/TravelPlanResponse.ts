// src/travl_plan_edit/dto/TravelPlanResponse.ts

/** ===============================
 * 서버 응답 DTO (TravelPlanResponse)
 * =============================== */
/**
 * 사용처
 * travel_plan_check.tsx,
 * EditTravelPlan.tsx,
 * ai_edit.tsx
 */

export type PlaceType = "A01" | "A02" | "A03" | "B01";

export interface PlaceItem {
  contentId: string;
  placeType: PlaceType;
  title: string;
  image: string;
  sequence: number;
  longitude: number;
  latitude: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface DaySchedule {
  date: string;       // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
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
