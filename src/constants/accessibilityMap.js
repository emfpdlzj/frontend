export const FILTER_ALL_VALUE = '전체';
export const VALID_ACCESSIBILITY_MAP_TABS = Object.freeze(['accessibility', 'job']);

export const ACCESSIBILITY_MAP_PERSONAS = Object.freeze({
  wheelchair: { label: '지체' },
  vision: { label: '시각' },
  hearing: { label: '청각' }
});

export const ACCESSIBILITY_MAP_LEGEND = Object.freeze([
  ['A', '80 이상', 'good'],
  ['B', '60 ~ 79', 'warning'],
  ['C', '60 미만', 'danger']
]);

export const ACCESSIBILITY_MAP_DEFAULT_VIEWPORT = Object.freeze({
  center: { lat: 37.498095, lng: 127.02761 },
  zoom: 16
});

export const ACCESSIBILITY_MAP_RADIUS_METERS = 850;
export const COMMUTABLE_FILTER_ID = 'commutableOnly';
export const DEFAULT_COMMUTABLE_DISTANCE_KM = 25;
export const DEFAULT_COMMUTABLE_MINUTES = 75;
export const MAX_DISPLAY_COMMUTE_MINUTES = 75 * 60;

export const REGION_ALIASES = Object.freeze({
  서울: ['서울', '서울특별시'],
  부산: ['부산', '부산광역시'],
  대구: ['대구', '대구광역시'],
  인천: ['인천', '인천광역시'],
  광주: ['광주', '광주광역시'],
  대전: ['대전', '대전광역시'],
  울산: ['울산', '울산광역시'],
  세종: ['세종', '세종특별자치시'],
  경기: ['경기', '경기도'],
  강원: ['강원', '강원도', '강원특별자치도'],
  충북: ['충북', '충청북도'],
  충남: ['충남', '충청남도'],
  전북: ['전북', '전라북도', '전북특별자치도'],
  전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'],
  경남: ['경남', '경상남도'],
  제주: ['제주', '제주특별자치도']
});

export const ACCESSIBILITY_MAP_DATE_PATTERN = /(\d{4})\D?(\d{2})\D?(\d{2})/g;
