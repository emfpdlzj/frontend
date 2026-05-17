import { getPostLoginPath } from './OAuthCallbackPage';

describe('OAuthCallbackPage navigation', () => {
  it('keeps the locale from the saved return path when callback route has no locale', () => {
    expect(getPostLoginPath({
      pathname: '/auth/kakao/callback',
      returnTo: '/en/accessibility-map',
      fallbackLocale: 'ko',
      signupRequired: false
    })).toBe('/en/accessibility-map');
  });

  it('uses the saved locale for signup when onboarding is required', () => {
    expect(getPostLoginPath({
      pathname: '/auth/naver/callback',
      returnTo: '/ja/jobs',
      fallbackLocale: 'ko',
      signupRequired: true
    })).toBe('/ja/signup');
  });

  it('keeps the callback route locale when return path has no locale prefix', () => {
    expect(getPostLoginPath({
      pathname: '/zh-CN/auth/kakao/callback',
      returnTo: '/',
      fallbackLocale: 'ko',
      signupRequired: false
    })).toBe('/zh-CN');
  });
});
