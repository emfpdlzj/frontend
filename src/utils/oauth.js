import { NAVER_STATE_KEY, OAUTH_CONFIG } from '../config/appConfig';

const OAUTH_RETURN_TO_KEY = 'bridgework.oauth.returnTo';

const readProviderConfig = (provider) => OAUTH_CONFIG[provider];

const toQueryString = (params) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  return query.toString();
};

const generateState = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const oauthUtils = {
  saveReturnTo(path) {
    const fallbackPath = '/';
    const safePath = typeof path === 'string' && path.startsWith('/') ? path : fallbackPath;
    sessionStorage.setItem(OAUTH_RETURN_TO_KEY, safePath);
  },

  consumeReturnTo() {
    const path = sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
    sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);

    if (!path || !path.startsWith('/') || path.startsWith('/auth/')) {
      return '/';
    }

    return path === '/login' ? '/' : path;
  },

  getRedirectUri(provider) {
    return readProviderConfig(provider)?.redirectUri || '';
  },

  buildAuthorizeUrl(provider) {
    const config = readProviderConfig(provider);
    if (!config?.clientId || !config?.redirectUri || !config?.authorizeUrl) {
      throw new Error(`${provider} OAuth 환경변수가 누락되었습니다.`);
    }

    if (provider === 'KAKAO') {
      return `${config.authorizeUrl}?${toQueryString({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri
      })}`;
    }

    if (provider === 'NAVER') {
      const state = generateState();
      sessionStorage.setItem(NAVER_STATE_KEY, state);

      return `${config.authorizeUrl}?${toQueryString({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state
      })}`;
    }

    throw new Error(`지원하지 않는 provider 입니다: ${provider}`);
  },

  verifyNaverState(returnedState) {
    const expected = sessionStorage.getItem(NAVER_STATE_KEY);
    sessionStorage.removeItem(NAVER_STATE_KEY);

    if (!expected || !returnedState) {
      return false;
    }

    return expected === returnedState;
  }
};
