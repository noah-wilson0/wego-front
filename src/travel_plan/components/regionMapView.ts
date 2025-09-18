// src/travel_plan/components/regionMapView.ts
export type RegionView = {
    center: { lat: number; lng: number };
    zoom: number;
  };
  
  /**
   * 지역별 기본 뷰 매핑
   * - 키는 slug와 한글 라벨을 모두 포함 (예: "jeju" 와 "제주")
   * - 좌표는 각 지역의 시청/중심부 인근으로 설정 (대략값)
   */
  export const REGION_MAP: Record<string, RegionView> = {
    // 서울/수도권
    "seoul":        { center: { lat: 37.5665, lng: 126.9780 }, zoom: 11 },
    "서울":           { center: { lat: 37.5665, lng: 126.9780 }, zoom: 11 },
  
    "incheon":      { center: { lat: 37.4563, lng: 126.7052 }, zoom: 11 },
    "인천":           { center: { lat: 37.4563, lng: 126.7052 }, zoom: 11 },
  
    "suwon":        { center: { lat: 37.2636, lng: 127.0286 }, zoom: 12 },
    "수원":           { center: { lat: 37.2636, lng: 127.0286 }, zoom: 12 },
  
    "gapyeong":     { center: { lat: 37.8315, lng: 127.5107 }, zoom: 12 },
    "가평":           { center: { lat: 37.8315, lng: 127.5107 }, zoom: 12 },
  
    "yangpyeong":   { center: { lat: 37.4910, lng: 127.4870 }, zoom: 12 },
    "양평":           { center: { lat: 37.4910, lng: 127.4870 }, zoom: 12 },
  
    // 강원/동해권
    "gangneung":    { center: { lat: 37.7519, lng: 128.8761 }, zoom: 12 },
    "강릉":           { center: { lat: 37.7519, lng: 128.8761 }, zoom: 12 },
  
    "sokcho":       { center: { lat: 38.2070, lng: 128.5919 }, zoom: 12 },
    "속초":           { center: { lat: 38.2070, lng: 128.5919 }, zoom: 12 },
  
    "yangyang":     { center: { lat: 38.0754, lng: 128.6190 }, zoom: 12 },
    "양양":           { center: { lat: 38.0754, lng: 128.6190 }, zoom: 12 },
  
    "chuncheon":    { center: { lat: 37.8813, lng: 127.7298 }, zoom: 12 },
    "춘천":           { center: { lat: 37.8813, lng: 127.7298 }, zoom: 12 },
  
    "pyeongchang":  { center: { lat: 37.3705, lng: 128.3900 }, zoom: 11 },
    "평창":           { center: { lat: 37.3705, lng: 128.3900 }, zoom: 11 },
  
    "donghae-samcheok": { center: { lat: 37.4860, lng: 129.1400 }, zoom: 10 },
    "동해·삼척":        { center: { lat: 37.4860, lng: 129.1400 }, zoom: 10 },
  
    // 충청권
    "daejeon":      { center: { lat: 36.3504, lng: 127.3845 }, zoom: 12 },
    "대전":           { center: { lat: 36.3504, lng: 127.3845 }, zoom: 12 },
  
    "sejong":       { center: { lat: 36.4800, lng: 127.2890 }, zoom: 12 },
    "세종특별자치시":     { center: { lat: 36.4800, lng: 127.2890 }, zoom: 12 },
  
    "jecheon":      { center: { lat: 37.1599, lng: 128.1960 }, zoom: 12 },
    "제천":           { center: { lat: 37.1599, lng: 128.1960 }, zoom: 12 },
  
    "chungju":      { center: { lat: 36.9910, lng: 127.9260 }, zoom: 12 },
    "충주":           { center: { lat: 36.9910, lng: 127.9260 }, zoom: 12 },
  
    "taean":        { center: { lat: 36.7457, lng: 126.2976 }, zoom: 11 },
    "태안":           { center: { lat: 36.7457, lng: 126.2976 }, zoom: 11 },
  
    // 전라권
    "jeonju":       { center: { lat: 35.8242, lng: 127.1480 }, zoom: 12 },
    "전주":           { center: { lat: 35.8242, lng: 127.1480 }, zoom: 12 },
  
    "gunsan":       { center: { lat: 35.9677, lng: 126.7369 }, zoom: 12 },
    "군산":           { center: { lat: 35.9677, lng: 126.7369 }, zoom: 12 },
  
    "yeosu":        { center: { lat: 34.7604, lng: 127.6622 }, zoom: 12 },
    "여수":           { center: { lat: 34.7604, lng: 127.6622 }, zoom: 12 },
  
    "boseong":      { center: { lat: 34.7715, lng: 127.0807 }, zoom: 12 },
    "보성":           { center: { lat: 34.7715, lng: 127.0807 }, zoom: 12 },
  
    "mokpo":        { center: { lat: 34.8118, lng: 126.3922 }, zoom: 12 },
    "목포":           { center: { lat: 34.8118, lng: 126.3922 }, zoom: 12 },
  
    "haenam":       { center: { lat: 34.5718, lng: 126.5985 }, zoom: 11 },
    "해남":           { center: { lat: 34.5718, lng: 126.5985 }, zoom: 11 },
  
    // 경상권
    "daegu":        { center: { lat: 35.8714, lng: 128.6014 }, zoom: 12 },
    "대구":           { center: { lat: 35.8714, lng: 128.6014 }, zoom: 12 },
  
    "busan":        { center: { lat: 35.1796, lng: 129.0756 }, zoom: 12 },
    "부산":           { center: { lat: 35.1796, lng: 129.0756 }, zoom: 12 },
  
    "gyeongju":     { center: { lat: 35.8562, lng: 129.2247 }, zoom: 12 },
    "경주":           { center: { lat: 35.8562, lng: 129.2247 }, zoom: 12 },
  
    "pohang":       { center: { lat: 36.0190, lng: 129.3435 }, zoom: 12 },
    "포항":           { center: { lat: 36.0190, lng: 129.3435 }, zoom: 12 },
  
    "geoje":        { center: { lat: 34.8806, lng: 128.6217 }, zoom: 12 },
    "거제·통영":        { center: { lat: 34.8680, lng: 128.5300 }, zoom: 11 }, // 사이 중간값 느낌
    // 통일감을 위해 slug도 하나 더 추가해두면 좋음 (선택)
    "geoje-tongyeong": { center: { lat: 34.8680, lng: 128.5300 }, zoom: 11 },
  
    "namhae":       { center: { lat: 34.8373, lng: 127.8924 }, zoom: 12 },
    "남해":           { center: { lat: 34.8373, lng: 127.8924 }, zoom: 12 },
  
    // 동해/울릉
    "ulleungdo":    { center: { lat: 37.4899, lng: 130.9050 }, zoom: 11 },
    "울릉도":          { center: { lat: 37.4899, lng: 130.9050 }, zoom: 11 },
  
    // 제주
    "jeju":         { center: { lat: 33.4996, lng: 126.5312 }, zoom: 10 },
    "제주도":          { center: { lat: 33.4996, lng: 126.5312 }, zoom: 10 },
    "제주":           { center: { lat: 33.4996, lng: 126.5312 }, zoom: 10 },
  };
  
  /**
   * regionSlugOrName 으로 center/zoom 조회
   * - 없으면 서울 기본값 반환
   */
  export function resolveRegionView(regionSlugOrName?: string | null): RegionView {
    if (regionSlugOrName && REGION_MAP[regionSlugOrName]) {
      return REGION_MAP[regionSlugOrName];
    }
    return REGION_MAP["seoul"];
  }
  