import { POLICY_DOCUMENT_MAP } from './policyDocuments';
import { ROUTE_PATHS } from './routes';
import { SERVICE_FAQ_ITEMS } from './seoContent';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALE_CODES,
  buildLocalizedPath,
  getLocaleFromPathname,
  isSupportedLocale,
  stripLocaleFromPathname
} from '../i18n/locales';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const configuredSiteUrl = trimTrailingSlash(process.env.REACT_APP_SITE_URL);
export const SITE_URL = configuredSiteUrl || 'https://www.bridgework.cloud';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';
export const SITE_NAME = 'BridgeWork';

const DEFAULT_DESCRIPTION =
  'BridgeWork는 장애인 구직자의 직무 적합도와 접근성 정보를 함께 확인할 수 있는 일자리 추천 서비스입니다.';

export const DEFAULT_PAGE_METADATA = Object.freeze({
  title: 'BridgeWork | 장애인 맞춤 일자리 추천 플랫폼',
  description: DEFAULT_DESCRIPTION,
  path: ROUTE_PATHS.root,
  imagePath: DEFAULT_OG_IMAGE_PATH,
  type: 'website',
  robots: 'index,follow'
});

const PAGE_METADATA = Object.freeze({
  [ROUTE_PATHS.root]: {
    title: 'BridgeWork | 장애인 맞춤 일자리 추천 플랫폼',
    description:
      'BridgeWork는 장애 유형, 근무 조건, 출퇴근 접근성을 고려해 장애인 구직자에게 적합한 일자리를 추천하는 서비스입니다.',
    structuredData: getWebSiteStructuredData
  },
  [ROUTE_PATHS.about]: {
    title: '서비스 소개 | BridgeWork',
    description:
      'BridgeWork가 장애인 구직자의 추천 이유, 접근성 정보, 데이터 부족 상황을 어떻게 안전하게 안내하는지 확인하세요.',
    structuredData: getOrganizationStructuredData
  },
  [ROUTE_PATHS.faq]: {
    title: '자주 묻는 질문 | BridgeWork',
    description:
      'BridgeWork의 맞춤 일자리 추천, 접근성 점수, 개인정보 입력, 채용 공고 색인 정책에 대한 답변을 확인하세요.',
    structuredData: getFaqStructuredData
  },
  [ROUTE_PATHS.accessibilityMap]: {
    title: '지역 접근성 지도 | BridgeWork',
    description: '관심 공고 주변의 이동 경로, 접근성 점수, 확인이 필요한 요소를 지도와 목록으로 함께 확인하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.quickJobs]: {
    title: '퀵공고 | BridgeWork',
    description: '로그인 후 내 프로필 기준으로 미리 계산된 퀵 맞춤 일자리 추천을 확인하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.notices]: {
    title: '공지사항 | BridgeWork',
    description: 'BridgeWork 서비스 안내와 변경 사항을 확인하세요.'
  },
  [ROUTE_PATHS.adminNotices]: {
    title: '공지사항 관리 | BridgeWork',
    description: '관리자가 BridgeWork 서비스 공지사항을 생성, 수정, 공개 전환하는 화면입니다.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.jobs]: {
    title: '스크랩한 공고 | BridgeWork',
    description: '로그인 후 저장한 공고를 접근성 점수, 추천 이유, 마감 상태 기준으로 다시 비교하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.signup]: {
    title: '회원가입 | BridgeWork',
    description: 'BridgeWork 가입 후 직무 선호도, 근무 조건, 접근성 정보를 반영한 맞춤 일자리 추천을 시작하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.profile]: {
    title: '내 프로필 | BridgeWork',
    description: '희망 직무, 경력, 근무 조건, 접근성 관련 선택 정보를 관리하고 추천 기준을 업데이트하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.myProfile]: {
    title: '내 프로필 | BridgeWork',
    description: '희망 직무, 경력, 근무 조건, 접근성 관련 선택 정보를 관리하고 추천 기준을 업데이트하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.settings]: {
    title: '환경설정 | BridgeWork',
    description: '계정 정보, 접근성 환경, 알림, 약관 및 개인정보 설정을 한곳에서 확인하고 관리하세요.',
    robots: 'noindex,nofollow'
  },
  [ROUTE_PATHS.terms]: {
    title: '서비스 이용약관 | BridgeWork',
    description: POLICY_DOCUMENT_MAP.terms.summary
  },
  [ROUTE_PATHS.privacy]: {
    title: '개인정보 처리방침 | BridgeWork',
    description: POLICY_DOCUMENT_MAP['privacy-policy'].summary
  }
});

const NOT_FOUND_METADATA = Object.freeze({
  title: '페이지를 찾을 수 없습니다 | BridgeWork',
  description: '요청하신 페이지를 찾을 수 없습니다. BridgeWork의 일자리 추천과 접근성 정보는 홈에서 다시 확인할 수 있습니다.',
  robots: 'noindex,nofollow'
});

function getOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: buildAbsoluteUrl(ROUTE_PATHS.root),
    logo: buildAbsoluteUrl('/logo.png'),
    description: DEFAULT_DESCRIPTION
  };
}

function getWebSiteStructuredData() {
  return [
    getOrganizationStructuredData(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: buildAbsoluteUrl(ROUTE_PATHS.root),
      inLanguage: 'ko-KR',
      description: DEFAULT_DESCRIPTION
    }
  ];
}

function getFaqStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SERVICE_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

// TODO: 공개 /jobs/:id 라우트가 추가되면 실제 Spring Backend 공고 데이터의 title,
// hiringOrganization, jobLocation, employmentType, datePosted, validThrough 매핑을 확인한 뒤
// JobPosting JSON-LD를 추가한다. 현재 스크랩 관리용 /jobs에는 임의 공고 데이터를 만들지 않는다.

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
    title: `${policy.title} | BridgeWork`,
    description: policy.summary
  };
}

function getNoticeMetadata(pathname) {
  if (!pathname.startsWith(`${ROUTE_PATHS.notices}/`)) {
    return null;
  }

  return {
    title: '공지사항 상세 | BridgeWork',
    description: 'BridgeWork 서비스 공지사항 상세 내용을 확인하세요.'
  };
}

export function getPageMetadata(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  const routeMetadata = PAGE_METADATA[normalizedPathname]
    || getPolicyMetadata(normalizedPathname)
    || getNoticeMetadata(normalizedPathname)
    || NOT_FOUND_METADATA;

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
