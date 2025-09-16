// src/data/feed.ts
// 서버 DTO들을 한곳에 모아두고 재사용합니다.

  
  // ---------- Feed (GET /me/feed) ----------
  export type FeedResponse = {
    feed_id: number;
    title: string;
    body: string;
    people: number;
    like_count: number;
    view_count: number;
    created_at: string; // LocalDate → 'yyyy-MM-dd'
  
    slug: string;
    start_date: string; // 'yyyy-MM-dd'
    end_date: string;   // 'yyyy-MM-dd'
  
    chemis: ChemiItem[];
    days: DaySchedule[];
    routes: RouteInfo[];
  };
  
  export type ChemiItem = {
    id: number;
    name: string;
    image: string;
    description: string;
  };
  
  export type DaySchedule = {
    date: string;        // LocalDate → 'yyyy-MM-dd'
    start_time: string;  // 'HH:mm'
    end_time: string;    // 'HH:mm'
    places: PlaceItem[];
    accommodation: AccommodationItem | null;
  };
  
  export type PlaceItem = {
    content_id: string;
    placeType: string;  // 서버 enum code string
    title: string;
    image: string;
    sequence: number;
    start_time: string; // 'HH:mm'
    end_time: string;   // 'HH:mm'
  };
  
  export type AccommodationItem = PlaceItem;
  
  export type RouteInfo = {
    route_type: string; // 예: "CAR", "Transit"
    // 일자별 경로 상세: { "2025-01-02": [{...}, ...] }
    daily_route: Record<string, RouteDetail[]>;
  };
  
  export type RouteDetail = {
    sequence: number;
    origin: string;      // content_id
    destination: string; // content_id
    duration: number;    // minutes
  };
  