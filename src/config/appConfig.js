import { AUTH_PROVIDER_ROUTES } from './routes';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL || 'https://api.bridgework.cloud/api/v1'
);

export const STORAGE_KEYS = {
  accessToken: 'bridgework.accessToken',
  refreshToken: 'bridgework.refreshToken',
  tokenType: 'bridgework.tokenType',
  accessTokenExpiresAt: 'bridgework.accessTokenExpiresAt',
  refreshTokenExpiresAt: 'bridgework.refreshTokenExpiresAt',
  signupSession: 'bridgework.signupSession',
  signupOptionsCache: 'bridgework.signupOptionsCache',
  jobFilterOptionsCache: 'bridgework.jobFilterOptionsCache',
  profileDraftAutosave: 'bridgework.profileDraftAutosave',
  authProvider: 'bridgework.authProvider',
  selectedProfile: 'bridgework:selected-profile-id',
  oauthReturnTo: 'bridgework.oauth.returnTo',
  oauthState: 'bridgework.oauth.state',
  naverState: 'bridgework.oauth.naver.state'
};

export const SOCIAL_PROVIDER = {
  KAKAO: 'KAKAO',
  NAVER: 'NAVER'
};

export const GENDER_OPTIONS = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '기타' },
  { value: 'NOT_DISCLOSED', label: '미응답' }
];

export const BOOLEAN_OPTIONS = [
  { value: 'true', label: '예' },
  { value: 'false', label: '아니오' }
];

const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
const withOrigin = (path) => `${origin}${path}`;

export const OAUTH_CONFIG = {
  KAKAO: {
    clientId: process.env.REACT_APP_KAKAO_CLIENT_ID || '',
    redirectUri:
      process.env.REACT_APP_KAKAO_REDIRECT_URI || withOrigin(AUTH_PROVIDER_ROUTES.KAKAO.callbackPath),
    authorizeUrl: 'https://kauth.kakao.com/oauth/authorize'
  },
  NAVER: {
    clientId: process.env.REACT_APP_NAVER_CLIENT_ID || '',
    redirectUri:
      process.env.REACT_APP_NAVER_REDIRECT_URI || withOrigin(AUTH_PROVIDER_ROUTES.NAVER.callbackPath),
    authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize'
  }
};

export const NAVER_STATE_KEY = STORAGE_KEYS.naverState;

export const NAVER_MAP_CONFIG = {
  clientId: process.env.REACT_APP_NAVER_MAP_CLIENT_ID || ''
};
