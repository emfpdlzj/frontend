import { oauthUtils } from './oauth';

beforeEach(() => {
  sessionStorage.clear();
});

test('clears transient oauth state left after returning from provider', () => {
  sessionStorage.setItem('bridgework.oauth.pending', 'NAVER');
  sessionStorage.setItem('bridgework.oauth.returnTo', '/ko/quick-jobs');
  sessionStorage.setItem('bridgework.oauth.state:NAVER', 'state-value');
  sessionStorage.setItem('bridgework.oauth.naver.state', 'legacy-state');

  expect(oauthUtils.hasPendingAuthorization()).toBe(true);

  oauthUtils.clearTransientAuthState();

  expect(oauthUtils.hasPendingAuthorization()).toBe(false);
  expect(sessionStorage.getItem('bridgework.oauth.returnTo')).toBeNull();
  expect(sessionStorage.getItem('bridgework.oauth.state:NAVER')).toBeNull();
  expect(sessionStorage.getItem('bridgework.oauth.naver.state')).toBeNull();
});

test('consumeReturnTo clears pending oauth marker after callback navigation', () => {
  sessionStorage.setItem('bridgework.oauth.pending', 'KAKAO');
  sessionStorage.setItem('bridgework.oauth.returnTo', '/ko/jobs');

  expect(oauthUtils.consumeReturnTo()).toBe('/ko/jobs');
  expect(oauthUtils.hasPendingAuthorization()).toBe(false);
});
