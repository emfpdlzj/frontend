export const accessibilityMapMockData = {
  searchPlaceholder: '출발지: [지하철역/주소 입력]',
  jobs: [
    {
      id: 'job-1',
      company: '한국장애인고용공단 서울지사',
      title: '상담원 (취업지원)',
      badges: ['공공', 'A등급', '표준사업장'],
      dueLabel: 'D-3',
      dueDateText: '2026.04.25 마감',
      commuteMinutes: 28,
      payText: '월 230만원',
      employmentType: '정규직',
      score: 95,
      jobInfo: [
        ['모집직종', '상담원 (취업지원)'],
        ['고용형태', '정규직'],
        ['임금', '월 265만원'],
        ['임금형태', '월급제'],
        ['요구경력', '경력1년 이상'],
        ['요구학력', '전문대졸 이상'],
        ['모집기간', '2026.04.15 ~ 2026.04.25'],
        ['담당기관', '한국장애인고용공단 서울지사'],
        ['연락처', '박서연 과장 · 02-6320-1120']
      ],
      companyInfo: {
        name: '서울특별시 시설관리공단',
        type: '공공기관',
        address: '서울 중구 서소문로 124',
        workplaceType: '인증 기업',
        hiringRate: '4.8%',
        legalRate: '3.1%',
        hiringSummary: '법정 의무고용률을 초과 달성하고 있는 기업입니다.'
      },
      accessibilityByPersona: {
        wheelchair: {
          panelBadge: 'A등급 · 지체 기준',
          headline: '출퇴근 가능',
          description: '큰 어려움 없이 출근할 수 있어요.',
          commuteStats: ['총 49분', '환승 1회', '도보 620m'],
          detailItems: [
            ['엘리베이터', '지하철 2개역, 역사 내 엘리베이터 이용 가능', '접근 양호'],
            ['환승 구간', '환승 거리 약 180m로 다소 길어요', '주의 필요'],
            ['경사 구간', '매장 입구 경사가 있어 휠체어 이용 시 주의가 필요해요', '접근 어려움'],
            ['저상버스 노선', '근처에 저상버스 노선이 있어 대체 이동이 가능해요', '접근 양호'],
            ['계단 없는 출입', '매장 출입구는 계단이 없어요', '접근 양호']
          ],
          source: '데이터 출처 · 서울시 엘리베이터광장 (엘리베이터 운영현황, 저상버스 노선)'
        },
        vision: {
          panelBadge: 'A등급 · 시각 기준',
          headline: '안내 정보 양호',
          description: '주요 동선의 안내 정보가 비교적 잘 갖춰져 있어요.',
          commuteStats: ['총 49분', '환승 1회', '도보 620m'],
          detailItems: [
            ['점자블록', '역 출구부터 근무지 인근까지 점자블록 연속성이 보여요', '접근 양호'],
            ['음향신호기', '주요 횡단보도에 음향신호기가 확인돼요', '접근 양호'],
            ['환승 안내', '환승 동선이 길어 추가 안내가 필요할 수 있어요', '주의 필요'],
            ['건물 출입 안내', '건물 입구의 음성 안내 여부는 추가 확인이 필요해요', '데이터 미확인'],
            ['대체 이동수단', '버스 노선 안내판이 커서 대체 동선 파악이 쉬워요', '접근 양호']
          ],
          source: '데이터 출처 · 서울시 보행접근성 정보 (음향신호기, 점자블록, 버스 노선)'
        },
        hearing: {
          panelBadge: 'A등급 · 청각 기준',
          headline: '시각 안내 충분',
          description: '시각 중심 안내가 있어 이동 중 정보 확인이 쉬워요.',
          commuteStats: ['총 49분', '환승 1회', '도보 620m'],
          detailItems: [
            ['전광판 안내', '지하철 환승 구간 전광판이 명확하게 보여요', '접근 양호'],
            ['시각안내 설비', '버스정류장과 역사 내 시각안내 설비가 확인돼요', '접근 양호'],
            ['수어 응대', '지원 전 수어 응대 가능 여부는 확인을 권장해요', '데이터 미확인'],
            ['필담 가능성', '공공기관 상담직 특성상 문자 응대 체계가 있을 가능성이 높아요', '주의 필요'],
            ['비상 알림', '근무지 내 비상 시각경보 장치는 기업 확인이 필요해요', '데이터 미확인']
          ],
          source: '데이터 출처 · 서울시 교통약자 이동정보 (시각안내 설비, 역사 안내 체계)'
        }
      }
    },
    {
      id: 'job-2',
      company: '한국장애인고용공단 서울지사',
      title: '상담원 (취업지원)',
      badges: ['공공', 'A등급', '표준사업장'],
      dueLabel: 'D-7',
      dueDateText: '2026.04.29 마감',
      commuteMinutes: 28,
      payText: '월 230만원',
      employmentType: '정규직'
    },
    {
      id: 'job-3',
      company: '한국장애인고용공단 서울지사',
      title: '상담원 (취업지원)',
      badges: ['공공', 'A등급', '표준사업장'],
      dueLabel: 'D-2',
      dueDateText: '2026.04.24 마감',
      commuteMinutes: 28,
      payText: '월 230만원',
      employmentType: '정규직'
    },
    {
      id: 'job-4',
      company: '한국장애인고용공단 서울지사',
      title: '상담원 (취업지원)',
      badges: ['공공', 'A등급', '표준사업장'],
      dueLabel: 'D-1',
      dueDateText: '2026.04.23 마감',
      commuteMinutes: 28,
      payText: '월 230만원',
      employmentType: '정규직'
    }
  ],
  personas: {
    wheelchair: {
      label: '지체',
      description: '휠체어',
      filterLabel: '지체 맞춤',
      filterChips: ['휠체어 접근 +', '저상버스 노선 +']
    },
    vision: {
      label: '시각',
      description: '저시력·전맹',
      filterLabel: '시각 맞춤',
      filterChips: ['점자블록 연속성 +', '음성안내 +']
    },
    hearing: {
      label: '청각',
      description: '농·난청',
      filterLabel: '청각 맞춤',
      filterChips: ['시각안내 설비 +', '수어 응대 +']
    }
  },
  navItems: [
    ['home', '홈'],
    ['map', '지도'],
    ['document', '공고'],
    ['briefcase', '지원'],
    ['user', '마이페이지'],
    ['settings', '설정']
  ],
  filterGroups: [
    ['통근시간', ['30분 이내', '60분 이내', '제한 없음'], 1],
    ['교통수단', ['지하철', '버스', '도보'], 2],
    ['환승 선호도', ['환승 없음', '1회 이내', '제한 없음'], 3]
  ],
  mapLegend: [
    ['A', '80 이상', 'good'],
    ['B', '60 ~ 79', 'warning'],
    ['C', '60 미만', 'danger']
  ],
  mapViewport: {
    center: { lat: 37.498095, lng: 127.02761 },
    zoom: 16
  },
  mapRadiusMeters: 850,
  mapRoutes: [
    {
      id: 'line-green',
      color: '#17a34a',
      weight: 5,
      path: [
        { lat: 37.49888, lng: 127.02144 },
        { lat: 37.49862, lng: 127.02321 },
        { lat: 37.49828, lng: 127.02577 },
        { lat: 37.49798, lng: 127.02775 },
        { lat: 37.49771, lng: 127.02989 },
        { lat: 37.49744, lng: 127.03234 }
      ]
    },
    {
      id: 'line-red',
      color: '#c6254d',
      weight: 8,
      path: [
        { lat: 37.50029, lng: 127.02482 },
        { lat: 37.49926, lng: 127.02579 },
        { lat: 37.49796, lng: 127.02697 },
        { lat: 37.49664, lng: 127.02811 },
        { lat: 37.49535, lng: 127.02926 }
      ]
    },
    {
      id: 'line-blue',
      color: '#3b82f6',
      weight: 5,
      path: [
        { lat: 37.49909, lng: 127.02216 },
        { lat: 37.49862, lng: 127.02347 },
        { lat: 37.49816, lng: 127.02488 },
        { lat: 37.49778, lng: 127.02601 }
      ]
    }
  ],
  mapMarkers: [
    { id: 'm1', label: '역', lat: 37.49972, lng: 127.02415, type: 'station' },
    { id: 'm2', label: '버스', lat: 37.50008, lng: 127.03056, type: 'bus' },
    { id: 'm3', label: '사무실', lat: 37.49819, lng: 127.03132, type: 'office' },
    { id: 'm4', label: '승강', lat: 37.49666, lng: 127.02719, type: 'lift' },
    { id: 'm5', label: '횡단', lat: 37.49573, lng: 127.03194, type: 'crosswalk' },
    { id: 'm6', label: '정류', lat: 37.49488, lng: 127.02459, type: 'bus' }
  ]
};
