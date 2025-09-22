import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Star, Plus, X } from 'lucide-react';
import UnifiedFourColumnLayout from './components/UnifiedFourColumnLayout';
import Cookies from 'js-cookie';
import axios from 'axios';

// meta API (공통)
import { getDraftPlanMeta } from './components/draftPlanMetaApi';
import type { DraftPlanMetaResponse } from './components/draftPlanMetaApi';

import { resolveRegionView } from './components/regionMapView';
import type { MapMarker } from './components/mapTypes';

interface Place {
  contentId: string;
  name: string;
  category: string;      // A01/A02/A03/B01
  description: string;   // 주소
  rating: number;
  likes: number;
  imageUrl: string;
  isLiked: boolean;
  longitude?: number;    // 지도용
  latitude?: number;     // 지도용
}

interface TravelInfo {
  destination: string;   // regionName
  duration: string;      // "YYYY-MM-DD ~ YYYY-MM-DD"
  totalDays: number;     // 총 일수(포함)
}

const categoryMap: Record<string, string> = {
  '장소': 'A01',
  '식당': 'A02',
  '카페': 'A03',
};

// 카테고리 텍스트 스타일/라벨
const CATEGORY_META: Record<string, { label: string; text: string }> = {
  A01: { label: '명소',   text: 'text-blue-600' },
  A02: { label: '음식점', text: 'text-red-600' },
  A03: { label: '카페',   text: 'text-orange-600' },
  B01: { label: '숙소',   text: 'text-purple-600' },
};

function CategoryTag({ code }: { code: string }) {
  const meta = CATEGORY_META[code] ?? { label: '기타', text: 'text-gray-600' };
  return <span className={`text-xs font-medium ${meta.text} mr-2 align-middle`}>{meta.label}</span>;
}

/** 카테고리별 동그라미 인덱스 색상 */
const INDEX_BADGE_CLASS: Record<string, string> = {
  A01: 'bg-blue-100 text-blue-700',
  A02: 'bg-red-100 text-red-700',
  A03: 'bg-orange-100 text-orange-700',
  B01: 'bg-purple-100 text-purple-700',
  default: 'bg-gray-200 text-gray-700',
};

// ✅ 검색 시 항상 보낼 전체 장소 타입
const ALL_PLACE_TYPES = ['A01', 'A02', 'A03'] as const;

const travelPlanPlace: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  // 🔹 실제 API 검색에 사용하는 키워드 (Enter/아이콘 클릭 시 확정)
  const [activeKeyword, setActiveKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'장소' | '식당' | '카페'>('장소');
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo>({ destination: '', duration: '', totalDays: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const categories: Array<'장소'|'식당'|'카페'> = ['장소', '식당', '카페'];
  const getUuidFromCookie = () => Cookies.get('travelPlanUUID');

  // 여행 meta 로드
  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) return;

    (async () => {
      try {
        const { regionName, startDate, endDate }: DraftPlanMetaResponse = await getDraftPlanMeta(uuid);
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          setTravelInfo({
            destination: regionName,
            duration: `${startDate} ~ ${endDate}`,
            totalDays: diffDays,
          });
        } else {
          setTravelInfo({ destination: regionName || '', duration: '', totalDays: 0 });
        }
      } catch (err) {
        console.error('❌ 여행 meta 정보 불러오기 실패', err);
      }
    })();
  }, []);

  // 카테고리 바뀌면 초기화
  useEffect(() => {
    setPlaces([]);
    setPage(0);
    setHasMore(true);
    // 카테고리 바꿔도 현재 activeKeyword는 유지 → 같은 키워드로 해당 카테고리 재검색
  }, [selectedCategory]);

  // 페이지/카테고리/검색키워드 변할 때 로드
  useEffect(() => {
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, activeKeyword]);

  // 🔹 공통 로드 함수 (목록 또는 검색)
  const loadPlaces = async () => {
    if (!hasMore || loading) return;

    const uuid = getUuidFromCookie();
    if (!uuid) {
      console.warn('⚠️ uuid 쿠키가 없습니다. 요청을 건너뜁니다.');
      return;
    }

    setLoading(true);
    try {
      const type = categoryMap[selectedCategory];

      let url: string;
      if (activeKeyword && activeKeyword.trim().length > 0) {
        // ✅ 검색 모드: /places/search (항상 A01,A02,A03 모두 전송)
        const params = new URLSearchParams({
          uuid: uuid,
          keyword: activeKeyword,
          page: String(page),
          size: '20',
        });
        params.append('sort', 'averageRating,desc');
        params.append('sort', 'likeCount,desc');
        ALL_PLACE_TYPES.forEach(pt => params.append('placeTypes', pt)); // 🔸 여기!

        url = `http://localhost:8080/places/search?${params.toString()}`;
      } else {
        // 📃 목록 모드: 기존 엔드포인트(선택 탭만)
        url = `http://localhost:8080/draft-plans/${encodeURIComponent(uuid)}/${type}/paged?page=${page}&size=20`;
      }

      const res = await axios.get(url);

      const newData: Place[] = res.data.content.map((item: any) => ({
        contentId: item.contentId,
        name: item.title,
        category: item.placeType,
        description: item.addr || '',
        rating: item.averageRating ?? 0,
        likes: item.likeCount ?? 0,
        imageUrl: item.image || '/placeholder.jpg',
        isLiked: false,
        longitude: item.longitude,
        latitude: item.latitude,
      }));

      setPlaces(prev => [...prev, ...newData]);
      setHasMore(!res.data.last);
    } catch (err) {
      console.error('❌ 장소 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  };

  // 무한 스크롤 옵저버
  const lastPlaceRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const toggleLike = (placeId: string) => {
    setPlaces(prev =>
      prev.map(place =>
        place.contentId === placeId ? { ...place, isLiked: !place.isLiked } : place
      )
    );
  };

  const addPlace = (place: Place) => {
    if (!selectedPlaces.find(p => p.contentId === place.contentId)) {
      setSelectedPlaces(prev => [...prev, place]);
      // setSelectedMarkerId(place.contentId); // 선택 시 마커 강조하려면 사용
    }
  };

  const removePlace = (placeId: string) => {
    setSelectedPlaces(prev => prev.filter(p => p.contentId !== placeId));
    setSelectedMarkerId(prev => (prev === placeId ? null : prev));
  };

  // ✅ 선택 목록이 바뀔 때 로컬에도 동일 스키마로 저장(카테고리 포함)
  useEffect(() => {
    const uuid = getUuidFromCookie();
    if (!uuid) return;
    const minimal = selectedPlaces.map(p => ({
      id: p.contentId,
      name: p.name,
      addr: p.description,
      lat: p.latitude,
      lng: p.longitude,
      imageUrl: p.imageUrl,
      category: p.category as 'A01' | 'A02' | 'A03',
    }));
    localStorage.setItem(`selectedPlaces:${uuid}`, JSON.stringify(minimal));
  }, [selectedPlaces]);

  // 저장 + 서버로 전송
  const handleNext = async () => {
    const uuid = getUuidFromCookie();
    if (!uuid) {
      alert('UUID가 없습니다.');
      return;
    }

    const requestBody = selectedPlaces.map(p => ({ contentId: p.contentId }));

    try {
      await axios.post(`http://localhost:8080/draft-plans/${uuid}/places`, requestBody);
      navigate('/accommodation');
    } catch (err) {
      alert('장소 선택 저장 실패');
      console.error(err);
    }
  };

  // ✅ 지도 마커(선택한 장소만) — 순번(sequence) 추가
  const mapMarkers: MapMarker[] = useMemo(() => {
    return selectedPlaces
      .filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p, idx) => ({
        id: p.contentId,
        title: p.name,
        position: { lat: p.latitude as number, lng: p.longitude as number },
        category: p.category as 'A01' | 'A02' | 'A03',
        order: idx + 1,
        infoHtml: `
          <div style="max-width:200px">
            <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div style="font-size:12px;color:#555">${p.description || ''}</div>
          </div>
        `,
      }));
  }, [selectedPlaces]);

  // 지역 기본 뷰
  const regionView = useMemo(() => resolveRegionView(travelInfo.destination), [travelInfo.destination]);

  /** 🔍 검색 트리거: Enter/아이콘 클릭 시 호출 */
  const handleSearch = useCallback(() => {
    const kw = searchTerm.trim();
    setPlaces([]);
    setPage(0);
    setHasMore(true);
    setActiveKeyword(kw); // 빈 문자열이면 목록 모드로 자동 전환
  }, [searchTerm]);

  /** ---------------- 선택된 장소 패널 (동그라미 인덱스 배지: 카드 바깥) ---------------- */
  const selectedPlacesComponent = (
    <div className="space-y-3">
      {selectedPlaces.length === 0 ? (
        <div className="text-center text-gray-500 text-sm mt-8">
          <div>아직 선택된 장소가 없습니다.</div>
          <div className="mt-2">장소를 추가해보세요!</div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">총 {selectedPlaces.length}개 장소 선택됨</div>

          {selectedPlaces.map((place, index) => {
            const badgeClass =
              INDEX_BADGE_CLASS[place.category] || INDEX_BADGE_CLASS.default;

            return (
              <div key={place.contentId} className="flex items-start gap-3">
                <div className={`mt-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${badgeClass}`}>
                  {index + 1}
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex-1">
                  <div className="flex items-start gap-3">
                    <img src={place.imageUrl} alt={place.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 text-sm truncate">{place.name}</h4>
                        <button onClick={() => removePlace(place.contentId)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        <CategoryTag code={place.category} />
                        <span className="align-middle">{place.description}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className={`w-3 h-3 ${place.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{place.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{place.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  return (
    <UnifiedFourColumnLayout
      mode="place"
      activeStep={3}
      setActiveStep={() => {}}
      onNext={handleNext}
      selectedPanel={selectedPlacesComponent}
      mapCenter={regionView.center}
      mapZoom={regionView.zoom}
      mapMarkers={mapMarkers}
      selectedMarkerId={selectedMarkerId}
      onMarkerClick={(id) => setSelectedMarkerId(id)}
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{travelInfo.destination || '여행지'}</h2>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>{travelInfo.duration}</div>
            <div>총 여행 일: {travelInfo.totalDays > 1 ? `${travelInfo.totalDays - 1}박 ${travelInfo.totalDays}일` : '당일여행'}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-800">장소 선택</span>
            <button className="text-blue-600 text-sm hover:text-blue-800 transition-colors" onClick={() => setSelectedPlaces([])}>초기화 ↻</button>
          </div>
        </div>

        {/* 🔍 검색영역: 아이콘 클릭/Enter로 검색 */}
        <div className="relative">
          <button
            type="button"
            onClick={handleSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="검색"
            title="검색"
          >
            <Search className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder="장소명을 검색해보세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                // 카테고리 변경 시 리스트 초기화 (activeKeyword는 유지 → 같은 키워드로 새 카테고리 검색)
                setPlaces([]);
                setPage(0);
                setHasMore(true);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {places.length === 0 && loading && <div className="text-center py-8">장소 데이터를 불러오는 중입니다...</div>}
          {places.map((place, index) => (
            <div
              key={place.contentId}
              ref={index === places.length - 1 ? lastPlaceRef : null}
              className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <img src={place.imageUrl} alt={place.name} className="w-20 h-20 object-cover rounded-lg" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">{place.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <CategoryTag code={place.category} />
                  <span className="align-middle">{place.description}</span>
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart
                      className={`w-4 h-4 cursor-pointer transition-colors ${place.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'}`}
                      onClick={() => toggleLike(place.contentId)}
                    />
                    <span className="text-gray-600">{place.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-gray-600">{place.rating}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => addPlace(place)}
                disabled={selectedPlaces.some(p => p.contentId === place.contentId)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border rounded-lg transition-colors ${
                  selectedPlaces.some(p => p.contentId === place.contentId) ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {selectedPlaces.some(p => p.contentId === place.contentId) ? (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                ) : (
                  <Plus className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </UnifiedFourColumnLayout>
  );
};

export default travelPlanPlace;
