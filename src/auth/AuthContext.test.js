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
    withdraw: jest.fn(),
    cancelWithdraw: jest.fn(),
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
  authStorage.clearTokens();
  authApi.getMe.mockResolvedValue({ id: 1, name: '테스트 사용자' });
  authApi.refreshToken.mockRejectedValue(new ApiError('세션이 없습니다.', 401, 'UNAUTHORIZED'));
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

test('cancels pending withdrawal during social login and keeps reissued refresh token for tab restore', async () => {
  authApi.socialLogin.mockResolvedValue({
    result: {
      signupRequired: false,
      provider: 'KAKAO',
      accountStatus: 'PENDING_DELETION',
      withdrawalCancelToken: 'withdraw-cancel-token'
    }
  });
  authApi.cancelWithdraw.mockResolvedValue({
    result: {
      accessToken: 'reactivated-access-token',
      refreshToken: 'reactivated-refresh-token'
    }
  });

  const getAuth = await renderAuth();

  await act(async () => {
    const result = await getAuth().loginWithSocialCode({ provider: 'KAKAO', code: 'code' });
    expect(result.withdrawalCanceled).toBe(true);
  });

  expect(authApi.cancelWithdraw).toHaveBeenCalledWith('withdraw-cancel-token', undefined);
  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('reactivated-refresh-token');
  expect(authStorage.readTokens()).toMatchObject({
    accessToken: 'reactivated-access-token',
    refreshToken: 'reactivated-refresh-token'
  });
  await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated'));
});

test('clears stale access token when cookie refresh fails', async () => {
  authStorage.writeTokens({ accessToken: 'stale-access-token', refreshToken: 'stale-refresh-token' });

  const getAuth = await renderAuth();

  await act(async () => {
    await expect(getAuth().refreshTokens()).rejects.toMatchObject({ errorCode: 'UNAUTHORIZED' });
  });

  expect(authApi.refreshToken).toHaveBeenCalledWith('stale-refresh-token');
  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
});

test('clears session and reports session expiration when authorized request refresh fails', async () => {
  authApi.socialLogin.mockResolvedValue({
    data: {
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    }
  });
  authApi.refreshToken.mockRejectedValue(new ApiError('리프레시 토큰이 만료되었습니다.', 401, 'UNAUTHORIZED'));

  const getAuth = await renderAuth();

  await act(async () => {
    await getAuth().loginWithSocialCode({ provider: 'KAKAO', code: 'code' });
  });

  await act(async () => {
    await expect(
      getAuth().callWithAuth(() => {
        throw new ApiError('인증이 만료되었습니다.', 401, 'UNAUTHORIZED');
      })
    ).rejects.toMatchObject({
      status: 401,
      errorCode: 'SESSION_EXPIRED',
      message: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
    });
  });

  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));
});

test('treats missing refresh session during bootstrap as anonymous state', async () => {
  const getAuth = await renderAuth();

  await waitFor(() => expect(getAuth().isInitializing).toBe(false));

  expect(authApi.refreshToken).not.toHaveBeenCalled();
  expect(authApi.getMe).not.toHaveBeenCalled();
  expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous');
});

test('refreshes from session refresh token during bootstrap', async () => {
  window.sessionStorage.setItem(STORAGE_KEYS.refreshToken, 'stored-refresh-token');
  authApi.refreshToken.mockResolvedValueOnce({
    accessToken: 'bootstrapped-access-token',
    refreshToken: 'bootstrapped-refresh-token'
  });

  const getAuth = await renderAuth();

  await waitFor(() => expect(getAuth().isInitializing).toBe(false));

  expect(authApi.refreshToken).toHaveBeenCalledWith('stored-refresh-token', expect.any(AbortSignal), {
    expectedErrorStatuses: [400, 401]
  });
  expect(authApi.getMe).toHaveBeenCalledWith('bootstrapped-access-token', expect.any(AbortSignal));
  expect(window.sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('bootstrapped-refresh-token');
  expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
});

test('ignores refresh result that finishes after logout', async () => {
  authApi.socialLogin.mockResolvedValue({
    data: {
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token'
    }
  });
  const refreshDeferred = createDeferred();

  const getAuth = await renderAuth();

  await act(async () => {
    await getAuth().loginWithSocialCode({ provider: 'KAKAO', code: 'code' });
  });

  authApi.refreshToken.mockReturnValue(refreshDeferred.promise);

  let refreshPromise;
  await act(async () => {
    refreshPromise = getAuth().refreshTokens();
  });

  await act(async () => {
    await getAuth().logout();
    refreshDeferred.resolve({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token'
    });
    await expect(refreshPromise).rejects.toMatchObject({ errorCode: 'STALE_SESSION_RESULT' });
  });

  expect(authApi.refreshToken).toHaveBeenCalledWith('old-refresh-token');
  expect(authApi.logout).toHaveBeenCalledWith('old-access-token', 'old-refresh-token');
  expect(window.localStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.localStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.accessToken)).toBeNull();
  expect(window.sessionStorage.getItem(STORAGE_KEYS.refreshToken)).toBeNull();
  await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anonymous'));
});
