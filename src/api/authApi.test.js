import { authApi } from './authApi';
import { httpRequest } from './httpClient';

jest.mock('./httpClient', () => ({
  httpRequest: jest.fn()
}));

beforeEach(() => {
  httpRequest.mockReset();
  httpRequest.mockResolvedValue({});
});

test('adminLogin sends credentials to admin login endpoint', async () => {
  const signal = new AbortController().signal;

  await authApi.adminLogin({ loginId: 'admin01', password: 'password' }, signal);

  expect(httpRequest).toHaveBeenCalledWith('/auth/admin/login', {
    method: 'POST',
    token: null,
    body: { loginId: 'admin01', password: 'password' },
    signal
  });
});

test('completeSignup does not send the social account email field', async () => {
  await authApi.completeSignup({
    signupToken: 'signup-token',
    email: null,
    profile: {
      fullName: '홍길동',
      contactEmail: 'hong@example.com'
    }
  });

  expect(httpRequest).toHaveBeenCalledWith('/auth/social/signup/complete', {
    method: 'POST',
    token: null,
    body: {
      signupToken: 'signup-token',
      profile: {
        fullName: '홍길동',
        contactEmail: 'hong@example.com'
      }
    },
    signal: undefined
  });
});

test('refreshToken forwards expected error statuses for anonymous bootstrap', async () => {
  const signal = new AbortController().signal;

  await authApi.refreshToken(signal, { expectedErrorStatuses: [400, 401] });

  expect(httpRequest).toHaveBeenCalledWith('/auth/token/refresh', {
    method: 'POST',
    token: null,
    signal,
    expectedErrorStatuses: [400, 401]
  });
});

test('logout relies on the HttpOnly refresh cookie', async () => {
  const signal = new AbortController().signal;

  await authApi.logout(signal);

  expect(httpRequest).toHaveBeenCalledWith('/auth/logout', {
    method: 'POST',
    token: null,
    signal
  });
});

test('getMe unwraps api result payload', async () => {
  httpRequest.mockResolvedValueOnce({
    code: 'SUCCESS',
    result: {
      userId: 1,
      role: 'ADMIN'
    }
  });

  await expect(authApi.getMe('access-token')).resolves.toEqual({
    userId: 1,
    role: 'ADMIN'
  });
});
