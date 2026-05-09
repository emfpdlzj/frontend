import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/httpClient';
import { STORAGE_KEYS } from '../config/appConfig';
import { AuthProvider, useAuth } from './AuthContext';
import { authStorage } from './authStorage';

jest.mock('../api/authApi', () => ({
  authApi: {
    socialLogin: jest.fn(),
    completeSignup: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getMe: jest.fn()
  }
}));

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

function AuthAction({ onReady }) {
  const auth = useAuth();

  useEffect(() => {
    onReady(auth);
  }, [auth, onReady]);

  return <span data-testid="auth-state">{auth.isAuthenticated ? 'authenticated' : 'anonymous'}</span>;
}

const renderAuth = async () => {
  let authContext;
  const onReady = jest.fn((auth) => {
    authContext = auth;
  });

  render(
    <AuthProvider>
      <AuthAction onReady={onReady} />
    </AuthProvider>
  );

  await waitFor(() => expect(onReady).toHaveBeenCalled());

  return () => authContext;
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  jest.clearAllMocks();
  authApi.getMe.mockResolvedValue({ id: 1, name: '테스트 사용자' });
  authApi.logout.mockResolvedValue({});
});

test('does not persist login tokens when fetching the current user fails', async () => {
  authApi.socialLogin.mockResolvedValue({
    data: {
      accessToken: 'login-access-token',
      refreshToken: 'login-refresh-token'
    }
  });
  authApi.getMe.mockRejectedValue(new ApiError('사용자 정보를 확인할 수 없습니다.', 401, 'UNAUTHORIZED'));

  const getAuth = await renderAuth();

  await act(async () => {
    await expect(getAuth().loginWithSocialCode({ provider: 'KAKAO', code: 'code' })).rejects.toThrow(
      '사용자 정보를 확인할 수 없습니다.'
    );
  });

  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous');
});

test('clears stale access token when refresh token is missing', async () => {
  authStorage.writeTokens({ accessToken: 'stale-access-token' });

  const getAuth = await renderAuth();

  await act(async () => {
    await expect(getAuth().refreshTokens()).rejects.toMatchObject({ errorCode: 'MISSING_REFRESH_TOKEN' });
  });

  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
});

test('ignores refresh result that finishes after logout', async () => {
  authStorage.writeTokens({
    accessToken: 'old-access-token',
    refreshToken: 'old-refresh-token'
  });
  const refreshDeferred = createDeferred();
  authApi.refreshToken.mockReturnValue(refreshDeferred.promise);

  const getAuth = await renderAuth();
  const refreshPromise = getAuth().refreshTokens();

  await act(async () => {
    await getAuth().logout();
    refreshDeferred.resolve({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });
    await expect(refreshPromise).rejects.toMatchObject({ errorCode: 'STALE_SESSION_RESULT' });
  });

  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));
});
