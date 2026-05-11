import { POLICY_DOCUMENT_MAP } from './policyDocuments';
import { ROUTE_PATHS } from './routes';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALE_CODES,
  buildLocalizedPath,
  getLocaleFromPathname,
  isSupportedLocale,
  stripLocaleFromPathname
} from '../i18n/locales';

export const SITE_URL = 'https://www.bridgework.cloud';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
export const SITE_NAME = 'Bridge Work';

const DEFAULT_DESCRIPTION =
  'BridgeWork는 장애인 구직자의 직무 적합도와 접근성 정보를 함께 확인할 수 있는 일자리 추천 서비스입니다.';

export const DEFAULT_PAGE_METADATA = Object.freeze({
  title: '노동을 잇는 다리, Bridge Work',
  description: DEFAULT_DESCRIPTION,
  path: ROUTE_PATHS.root,
  imagePath: DEFAULT_OG_IMAGE_PATH,
  type: 'website'
});

const PAGE_METADATA = Object.freeze({
  [ROUTE_PATHS.root]: {
    title: '노동을 잇는 다리, Bridge Work',
    description: DEFAULT_DESCRIPTION
  },
  [ROUTE_PATHS.accessibilityMap]: {
    title: '지역 접근성 지도 | Bridge Work',
    description: '관심 공고 주변의 이동 경로, 접근성 점수, 확인이 필요한 요소를 지도와 목록으로 함께 확인하세요.'
  },
  [ROUTE_PATHS.jobs]: {
    title: '맞춤 일자리 공고 | Bridge Work',
    description: '프로필과 근무 조건을 기준으로 추천 공고와 접근성 정보를 함께 살펴보고 지원 판단에 참고하세요.'
  },
  [ROUTE_PATHS.signup]: {
    title: '회원가입 | Bridge Work',
    description: 'Bridge Work 가입 후 직무 선호도, 근무 조건, 접근성 정보를 반영한 맞춤 일자리 추천을 시작하세요.'
  },
  [ROUTE_PATHS.profile]: {
    title: '내 프로필 | Bridge Work',
    description: '희망 직무, 경력, 근무 조건, 접근성 관련 선택 정보를 관리하고 추천 기준을 업데이트하세요.'
  },
  [ROUTE_PATHS.myProfile]: {
    title: '내 프로필 | Bridge Work',
    description: '희망 직무, 경력, 근무 조건, 접근성 관련 선택 정보를 관리하고 추천 기준을 업데이트하세요.'
  },
  [ROUTE_PATHS.settings]: {
    title: '환경설정 | Bridge Work',
    description: '계정 정보, 접근성 환경, 알림, 약관 및 개인정보 설정을 한곳에서 확인하고 관리하세요.'
  },
  [ROUTE_PATHS.terms]: {
    title: '서비스 이용약관 | Bridge Work',
    description: POLICY_DOCUMENT_MAP.terms.summary
  },
  [ROUTE_PATHS.privacy]: {
    title: '개인정보 처리방침 | Bridge Work',
    description: POLICY_DOCUMENT_MAP['privacy-policy'].summary
  }
});

const NOT_FOUND_METADATA = Object.freeze({
  title: '페이지를 찾을 수 없습니다 | Bridge Work',
  description: '요청하신 페이지를 찾을 수 없습니다. Bridge Work의 일자리 추천과 접근성 정보는 홈에서 다시 확인할 수 있습니다.'
});

function normalizePathname(pathname) {
  const normalized = String(pathname || ROUTE_PATHS.root).split('?')[0].split('#')[0] || ROUTE_PATHS.root;
  return normalized.endsWith('/') && normalized !== ROUTE_PATHS.root ? normalized.slice(0, -1) : normalized;
}

function getPolicyMetadata(pathname) {
  const prefix = '/settings/policies/';

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  let policyId = pathname.slice(prefix.length);

  try {
    policyId = decodeURIComponent(policyId);
  } catch {
    return null;
  }

  const policy = POLICY_DOCUMENT_MAP[policyId];

  if (!policy) {
    return null;
  }

  return {
    title: `${policy.title} | Bridge Work`,
    description: policy.summary
  };
}

export function getPageMetadata(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  const routeMetadata = PAGE_METADATA[normalizedPathname] || getPolicyMetadata(normalizedPathname) || NOT_FOUND_METADATA;

  return {
    ...DEFAULT_PAGE_METADATA,
    ...routeMetadata,
    path: normalizedPathname
  };
}

export function buildAbsoluteUrl(path = ROUTE_PATHS.root) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function buildCanonicalPath(pathname = ROUTE_PATHS.root) {
  const normalizedPathname = normalizePathname(pathname);
  const locale = getLocaleFromPathname(normalizedPathname);
  const hasLocalePrefix = isSupportedLocale(String(normalizedPathname).split('/')[1]);
  const pathWithoutLocale = stripLocaleFromPathname(normalizedPathname);

  return buildLocalizedPath(pathWithoutLocale, hasLocalePrefix ? locale : DEFAULT_LOCALE);
}

export function buildCanonicalUrl(pathname = ROUTE_PATHS.root) {
  return buildAbsoluteUrl(buildCanonicalPath(pathname));
}

export function buildAlternateUrls(pathname = ROUTE_PATHS.root) {
  const pathWithoutLocale = stripLocaleFromPathname(normalizePathname(pathname));
  const alternateEntries = SUPPORTED_LOCALE_CODES.map((locale) => [
    locale,
    buildAbsoluteUrl(buildLocalizedPath(pathWithoutLocale, locale))
  ]);

  return Object.fromEntries([
    ...alternateEntries,
    ['x-default', buildAbsoluteUrl(buildLocalizedPath(pathWithoutLocale, DEFAULT_LOCALE))]
  ]);
}
