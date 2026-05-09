export const ROUTE_PATHS = Object.freeze({
  root: '/',
  login: '/login',
  accessibilityMap: '/accessibility-map',
  jobs: '/jobs',
  profile: '/profile',
  signup: '/signup',
  myProfile: '/my/profile',
  settings: '/settings',
  policyDetail: '/settings/policies/:policyId',
  terms: '/terms',
  privacy: '/privacy'
});

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
