// src/data/travelData.ts
export type ChemiItem = {
    id: string;
    title: string;
    image: string;
  };
  
  export type TravelAreaData = {
    id: string;
    englishName: string;
    koreanName: string;
    image: string;
    description: string;
  };
  
  // ===== 여기 기존 배열 그대로 붙여 넣기 =====
  export const chemiItems: ChemiItem[] = [
    { id: "goal", title: "프로 계획러", image: "/src/assets/chemi/goal.png" },
    { id: "festival", title: "페스타 러버", image: "/src/assets/chemi/festival.png" },
    { id: "planner", title: "핫플에이트", image: "/src/assets/chemi/planner.png" },
    { id: "foodie", title: "푸드 파이터", image: "/src/assets/chemi/foodie.png" },
    { id: "nature", title: "자연광", image: "/src/assets/chemi/nature.png" },
    { id: "healing", title: "릴랙셔러", image: "/src/assets/chemi/healing.png" },
    { id: "solo", title: "솔로 여행자", image: "/src/assets/chemi/solo.png" },
    { id: "thinker", title: "슬로우 트래블러", image: "/src/assets/chemi/thinker.png" },
    { id: "artist", title: "감성 여행가", image: "/src/assets/chemi/artist.png" },
    { id: "photo", title: "포토그래퍼", image: "/src/assets/chemi/photo.png" },
    { id: "active", title: "스포티 크루", image: "/src/assets/chemi/active.png" },
    { id: "budget", title: "가성비 여행러", image: "/src/assets/chemi/budget.png" },
    { id: "shopper", title: "여행 플렉서", image: "/src/assets/chemi/shopper.png" },
    { id: "nightowl", title: "로컬 레이더", image: "/src/assets/chemi/nightowl.png" },
    { id: "early", title: "로컬 여행가", image: "/src/assets/chemi/early.png" },
    { id: "culture", title: "문화 탐험가", image: "/src/assets/chemi/culture.png" },
    { id: "social", title: "대장님과 조수", image: "/src/assets/chemi/social.png" },
    { id: "random", title: "즉흥 여행가", image: "/src/assets/chemi/random.png" },
    { id: "sports", title: "오지 탐험가", image: "/src/assets/chemi/sports.png" },
  ];
  
  // travelAreas도 네가 가진 긴 배열 그대로 붙여 넣기
// 여행지 데이터
export const travelAreas: TravelAreaData[] = [
    {
      id: "seoul",
      englishName: "SEOUL",
      koreanName: "대한 민국 서울",
      image: "/src/assets/area/seoul.jpg",
      description:
        "대한민국의 수도 서울은 전통과 현대가 공존하는 도시입니다. 경복궁과 북촌 한옥마을에서 역사와 한옥의 멋을 느끼고, 한강과 남산에서 도심 속 여유를 즐길 수 있어요. 광장시장·망원시장 같은 재래시장부터 성수·연남의 감성 카페, 쇼핑과 미식까지 즐길거리가 가득합니다. 낮과 밤의 분위기가 달라 하루 종일 색다른 경험을 제공합니다.",
    },
    {
      id: "incheon",
      englishName: "INCHEON",
      koreanName: "대한 민국 인천",
      image: "/src/assets/area/incheon.png",
      description:
        "인천은 공항 도시를 넘어 바다와 도심이 어우러진 여행지입니다. 차이나타운과 개항장 거리에서 근대문화 산책을 즐기고, 송도 센트럴파크와 월미도에서 휴식과 놀이를 함께 경험해 보세요. 영종·무의도 등 섬 여행도 매력적입니다. 바다 전망 카페와 해산물 맛집이 풍성해 주말 나들이로 인기예요.",
    },
    {
      id: "sejong",
      englishName: "SEJONG",
      koreanName: "대한 민국 세종",
      image: "/src/assets/area/sejong.jpg",
      description:
        "세종은 세련된 도시계획과 풍부한 녹지가 돋보이는 행정도시입니다. 호수공원과 세종중앙공원에서 산책과 자전거를 즐기고, 현대적 건축물과 문화시설에서 여유로운 시간을 보낼 수 있어요. 인근 공주·부여의 백제 유적지로 당일 역사 여행을 떠나기에도 좋습니다. 조용하고 쾌적한 가족 여행지로 추천합니다.",
    },

    {
      id: "gapyeong",
      englishName: "GAPYEONG",
      koreanName: "대한 민국 경기 가평",
      image: "/src/assets/area/gapyeong.jpeg",
      description:
        "가평은 북한강을 따라 자연과 레저가 가득한 휴양지입니다. 남이섬·자라섬과 쁘띠프랑스, 아침고요수목원 등 감성 명소가 밀집해 있고 레일바이크와 수상 레저도 인기가 높아요. 강가 펜션과 카페가 많아 힐링 여행에 제격이며 사계절 풍경이 아름답습니다.",
    },
    {
      id: "yangpyeong",
      englishName: "YANGPYEONG",
      koreanName: "대한 민국 경기 양평",
      image: "/src/assets/area/yangpyeong.jpg",
      description:
        "양평은 두물머리와 세미원으로 대표되는 물과 정원의 도시입니다. 한적한 자전거길과 카페, 글램핑·캠핑장이 많아 주말 힐링지로 사랑받아요. 두물머리 일출·노을, 북한강 드라이브 코스가 특히 인기이며 도심과 가까워 당일치기도 좋습니다.",
    },
    {
      id: "suwon",
      englishName: "SUWON",
      koreanName: "대한 민국 경기 수원",
      image: "/src/assets/area/suwon.jpg",
      description:
        "수원은 유네스코 세계문화유산 수원화성으로 유명한 역사 도시입니다. 화성행궁과 행궁동 골목에서 전통과 현대가 어우러진 풍경을 만나고, 인계동·나혜석거리 등 먹거리와 야경 스폿도 풍부해요. 체험형 프로그램도 많아 가족 여행에 좋습니다.",
    },

    {
      id: "gangneung",
      englishName: "GANGNEUNG",
      koreanName: "대한 민국 강릉",
      image: "/src/assets/area/gangneung.jpg",
      description:
        "강릉은 파도와 커피의 도시입니다. 경포해변과 정동진에서 일출을 보고, 안목해변 커피거리에서 여유롭게 바다를 감상해 보세요. 오죽헌·선교장 같은 역사 공간과 숲길 산책도 매력적입니다. 바다·호수·도시가 가까워 코스 짜기가 편합니다.",
    },
    {
      id: "sokcho",
      englishName: "SOKCHO",
      koreanName: "대한 민국 속초",
      image: "/src/assets/area/sokcho.jpg",
      description:
        "속초는 설악산과 동해를 한 번에 즐길 수 있는 관문 도시입니다. 대포항과 영금정, 아바이마을에서 바다 감성을 느끼고 설악산 케이블카와 등산으로 산의 매력도 만끽해 보세요. 오징어순대와 생선구이 등 해산물 미식이 풍성합니다.",
    },
    {
      id: "yangyang",
      englishName: "YANGYANG",
      koreanName: "대한 민국 양양",
      image: "/src/assets/area/yangyang.jpg",
      description:
        "양양은 국내 서핑 문화를 이끄는 바다 도시입니다. 서피비치와 하조대에서 서핑과 감성 카페를 즐기고, 낙산사와 낙산해변에서 고즈넉한 풍경을 만날 수 있어요. 해안 드라이브와 일몰도 아름답습니다.",
    },
    {
      id: "chuncheon",
      englishName: "CHUNCHEON",
      koreanName: "대한 민국 춘천",
      image: "/src/assets/area/chuncheon.jpg",
      description:
        "춘천은 호수와 먹거리의 도시입니다. 소양강과 의암호를 끼고 있어 수상 레저·산책 코스가 좋고, 닭갈비·막국수로 유명한 미식 여행지예요. 남이섬·제이드가든 접근성도 뛰어나 코스 구성하기 쉽습니다.",
    },
    {
      id: "pyeongchang",
      englishName: "PYEONGCHANG",
      koreanName: "대한 민국 평창",
      image: "/src/assets/area/pyeongchang.jpg",
      description:
        "평창은 대관령을 품은 고원 휴양지입니다. 양떼목장과 푸른 초원, 겨울엔 스키 리조트로 사계절 레저가 풍부해요. 맑은 공기와 드넓은 자연 속에서 힐링하기 좋고, 한적한 카페와 로컬 먹거리도 매력입니다.",
    },
    {
      id: "donghae-samcheok",
      englishName: "DONGHAE · SAMCHEOK",
      koreanName: "대한 민국 동해·삼척",
      image: "/src/assets/area/donghae-samcheok.jpeg",
      description:
        "동해·삼척은 드라마틱한 해안 절경과 동굴 명소로 유명합니다. 추암 촛대바위와 장호항, 묵호등대길에서 바다 풍경을 즐기고, 환선굴·대금굴에서는 신비로운 지형을 체험해 보세요. 해안 철길과 레일바이크, 바다 카페가 어우러져 감성 코스가 완성됩니다.",
    },

    {
      id: "daejeon",
      englishName: "DAEJEON",
      koreanName: "대한 민국 대전",
      image: "/src/assets/area/daejeon.jpg",
      description:
        "대전은 과학과 자연이 조화를 이룬 교통 요충지입니다. 한밭수목원과 엑스포과학공원, 유성온천 등 도심 속 휴식과 체험이 가능해요. 식장산 스카이로드 야경도 인기 코스입니다. 충청권 여행의 거점으로 주변 명소를 묶어 떠나기 좋습니다.",
    },
    {
      id: "taean",
      englishName: "TAEAN",
      koreanName: "대한 민국 태안",
      image: "/src/assets/area/taean.jpeg",
      description:
        "태안은 길게 뻗은 서해안과 섬, 갯벌이 아름다운 바다 여행지입니다. 안면도 꽃지해변과 만리포, 신두리 사구에서 색다른 해안 풍경을 만날 수 있어요. 해산물 맛집과 드라이브 코스가 풍성하며 노을 명소로도 유명합니다.",
    },
    {
      id: "jecheon",
      englishName: "JECHEON",
      koreanName: "대한 민국 제천",
      image: "/src/assets/area/jecheon.jpg",
      description:
        "제천은 호수와 산이 어우러진 청정 휴양지입니다. 의림지와 청풍호, 케이블카에서 탁 트인 풍경을 감상하고, 옛길과 산책로가 잘 정비되어 있어 여유로운 여행이 가능해요. 한방·웰니스 콘텐츠도 풍부합니다.",
    },
    {
      id: "chungju",
      englishName: "CHUNGJU",
      koreanName: "대한 민국 충주",
      image: "/src/assets/area/chungju.jpeg",
      description:
        "충주는 남한강과 충주호를 품은 물의 도시입니다. 탄금호와 중앙탑, 수안보 온천 등 다양한 휴식 공간이 있고, 호반 드라이브와 유람선도 인기예요. 산과 강, 온천을 한 번에 즐길 수 있는 균형 잡힌 여행지입니다.",
    },

    {
      id: "jeonju",
      englishName: "JEONJU",
      koreanName: "대한 민국 전주",
      image: "/src/assets/area/jeonju.jpg",
      description:
        "전주는 한옥과 미식의 도시입니다. 전주한옥마을에서 한복 체험과 골목 산책을 즐기고, 비빔밥·한정식·막걸리 골목 등 먹거리가 풍성해요. 공예 체험과 서학동 예술마을 등 감성 코스도 매력입니다.",
    },
    {
      id: "gunsan",
      englishName: "GUNSAN",
      koreanName: "대한 민국 군산",
      image: "/src/assets/area/gunsan.jpeg",
      description:
        "군산은 근대 문화와 바다 풍경이 공존하는 도시입니다. 개항장 거리와 일본식 가옥, 경암동 철길마을에서 옛 정서를 느껴보세요. 선유도와 새만금 방조제로 이어지는 드라이브도 좋고, 빵·해산물 등 지역 먹거리도 유명합니다.",
    },
    {
      id: "yeosu",
      englishName: "YEOSU",
      koreanName: "대한 민국 여수",
      image: "/src/assets/area/yeosu.jpeg",
      description:
        "여수는 ‘밤바다’로 대표되는 낭만의 항구 도시입니다. 해상케이블카와 돌산공원 야경, 오동도와 향일암의 일출·일몰이 특히 아름다워요. 섬 크루즈와 해양 액티비티, 해산물 미식까지 즐길 거리가 풍성합니다.",
    },
    {
      id: "boseong",
      englishName: "BOSEONG",
      koreanName: "대한 민국 보성",
      image: "/src/assets/area/boseong.jpg",
      description:
        "보성은 초록빛 물결의 녹차밭으로 유명한 힐링 명소입니다. 대한다원 산책로와 차밭 전망대에서 탁 트인 풍경을 감상하고, 녹차 체험과 디저트도 즐겨보세요. 인근 율포 해변과의 연계 코스도 좋습니다.",
    },
    {
      id: "mokpo",
      englishName: "MOKPO",
      koreanName: "대한 민국 목포",
      image: "/src/assets/area/mokpo.jpeg",
      description:
        "목포는 다도해의 관문이자 근대문화가 살아있는 항구 도시입니다. 유달산과 목포해상케이블카에서 바다와 섬 전망을 한눈에 담을 수 있어요. 근대역사관·갓바위 등 볼거리와 해산물 미식이 풍성합니다.",
    },
    {
      id: "haenam",
      englishName: "HAENAM",
      koreanName: "대한 민국 해남",
      image: "/src/assets/area/haenam.jpeg",
      description:
        "해남은 한반도의 땅끝을 품은 자연 여행지입니다. 땅끝마을과 달마산, 미황사 등 남도 특유의 고즈넉한 풍경이 매력적이에요. 드넓은 논과 바다, 숲길이 어우러져 드라이브 코스로도 좋습니다.",
    },

    {
      id: "busan",
      englishName: "BUSAN",
      koreanName: "대한 민국 부산",
      image: "/src/assets/area/busan.jpeg",
      description:
        "부산은 활기찬 바다와 도시 문화가 공존하는 대표 해양도시입니다. 해운대·광안리·송도 해변과 감천문화마을, 자갈치시장 등 유명 명소가 가득해요. 해상 케이블카와 요트, 야경까지 즐길 거리가 풍부합니다.",
    },
    {
      id: "daegu",
      englishName: "DAEGU",
      koreanName: "대한 민국 대구",
      image: "/src/assets/area/daegu.jpeg",
      description:
        "대구는 온화한 기후와 도시 문화가 돋보이는 매력 도시입니다. 팔공산과 수성못, 이월드 83타워 등 산책·야경 명소가 많고, 서문시장 야시장 등 먹거리도 풍성해요. 카페 거리와 패션·뷰티 문화가 활발해 젊은 여행지로 인기입니다.",
    },
    {
      id: "gyeongju",
      englishName: "GYEONGJU",
      koreanName: "대한 민국 경주",
      image: "/src/assets/area/gyeongju.jpg",
      description:
        "경주는 천년 신라의 수도로 도시 전체가 박물관 같은 곳입니다. 불국사와 석굴암, 대릉원·동궁과 월지 등 세계유산과 유적이 가득하고, 황리단길의 감성 카페와 한옥 감성도 더해졌어요. 낮에는 역사 탐방, 밤에는 야경 산책이 매력입니다.",
    },
    {
      id: "pohang",
      englishName: "POHANG",
      koreanName: "대한 민국 포항",
      image: "/src/assets/area/pohang.jpeg",
      description:
        "포항은 동해의 일출과 산업 야경이 공존하는 해양 도시입니다. 호미곶 상생의 손과 영일대 해수욕장에서 일출을, 포스코 야경에서 또 다른 매력을 느낄 수 있어요. 구룡포 일본인가옥거리와 해산물 시장도 인기 코스입니다.",
    },
    {
      id: "ulleungdo",
      englishName: "ULLEUNGDO",
      koreanName: "대한 민국 울릉도",
      image: "/src/assets/area/ulleungdo.jpeg",
      description:
        "울릉도는 맑은 바다와 웅장한 절벽을 품은 신비의 섬입니다. 해안 일주도로와 선착장마다 펼쳐지는 에메랄드빛 풍경이 인상적이고, 성인봉 트레킹과 섬바디 체험도 매력적이에요. 오징어와 산채 비빔밥 등 섬 미식도 빼놓을 수 없습니다.",
    },
    {
      id: "geojetongyeong",
      englishName: "GEOJETONGYEONG",
      koreanName: "대한 민국 거제통영",
      image: "/src/assets/area/geojetongyeong.jpeg",
      description:
        "거제·통영은 한려수도의 비경을 만나는 바다 여행지입니다. 거제 바람의언덕·외도 보타니아에서 남해의 초록빛 바다를, 통영 동피랑 벽화마을과 미륵산 케이블카에서 감성 풍경을 즐겨보세요. 신선한 해산물과 항구 카페, 섬 크루즈까지 코스가 풍성합니다.",
    },
    {
      id: "namhae",
      englishName: "NAMHAE",
      koreanName: "대한 민국 남해",
      image: "/src/assets/area/namhae.jpeg",
      description:
        "남해는 에메랄드빛 바다와 아기자기한 마을이 매력적인 섬입니다. 독일마을과 원예예술촌, 보리암 일출이 특히 유명하고, 해안 드라이브 코스와 펜션·카페에서 여유를 즐기기 좋아요. 섬과 섬이 이어지는 다리 풍경도 인상적입니다.",
    },

    {
      id: "jeju",
      englishName: "JEJU",
      koreanName: "대한 민국 제주",
      image: "/src/assets/area/jeju.jpg",
      description:
        "제주도는 한국 최남단에 위치한 아름다운 섬으로, 독특한 화산 지형과 한라산으로 유명합니다. 맑은 바다와 푸른 자연, 돌하르방 같은 전통 문화 요소들이 매력을 더해요. 성산일출봉, 우도, 섭지코지 등 다양한 관광 명소가 즐비해 여행지로 사랑받고 있습니다. 제주 흑돼지, 고기국수, 한라봉 등 먹거리도 풍부해 미식 여행지로도 인기가 높습니다. 사계절 내내 색다른 풍경을 보여줘 언제 가도 만족스러운 곳입니다.",
    },
  ];

  // (선택) id로 빠르게 찾고 싶을 때 쓰는 맵
  export const travelAreasById: Record<string, TravelAreaData> =
    Object.fromEntries(travelAreas.map(a => [a.id, a])) as Record<string, TravelAreaData>;
  