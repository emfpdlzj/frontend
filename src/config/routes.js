export const ROUTE_PATHS = Object.freeze({
  root: '/',
  about: '/about',
  faq: '/faq',
  login: '/login',
  accessibilityMap: '/accessibility-map',
  quickJobs: '/quick-jobs',
  notices: '/notices',
  noticeDetail: '/notices/:noticeId',
  adminLogin: '/admin/login',
  adminNotices: '/admin/notices',
  jobs: '/jobs',
  profile: '/profile',
  profilePdfExport: '/profile/export/:profileId',
  signup: '/signup',
  myProfile: '/my/profile',
  settings: '/settings',
  policyDetail: '/settings/policies/:policyId',
  terms: '/terms',
  privacy: '/privacy'
});

export const LOCALIZED_ROUTE_PATHS = Object.freeze(
  Object.fromEntries(
    Object.entries(ROUTE_PATHS).map(([key, path]) => [
      key,
      path === '/' ? '/:locale' : `/:locale${path}`
    ])
  )
);

export const LEGACY_ROUTE_PATHS = Object.freeze({
  home: '/home',
  meProfile: '/me-profile'
});

export const AUTH_PROVIDER_ROUTES = Object.freeze({
  KAKAO: {
    provider: 'KAKAO',
    callbackPath: '/auth/kakao/callback'
  },
  NAVER: {
    provider: 'NAVER',
    callbackPath: '/auth/naver/callback'
  }
});
