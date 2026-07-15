import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/httpClient';
import { authStorage } from './authStorage';
import { createLogger } from '../utils/logger';
import { clearRecommendationCache } from '../cache/recommendationCache';

const AuthContext = createContext(null);
const logger = createLogger('auth');

const unwrapApiPayload = (payload) => payload?.data || payload?.result || payload;

const extractTokenPair = (payload) => {
  const unwrapped = unwrapApiPayload(payload);
  return unwrapped?.tokenPair || unwrapped?.tokens || unwrapped;
};

const readAuthField = (payload, camelKey, snakeKey) => {
  const unwrapped = unwrapApiPayload(payload);
  return unwrapped?.[camelKey] ?? unwrapped?.[snakeKey];
};

const isPendingDeletionAccount = (payload) => {
  const status = String(readAuthField(payload, 'accountStatus', 'account_status') || '').toUpperCase();
  return status === 'PENDING_DELETION';
};

const getTokenPairShape = (tokenPair) => {
  if (!tokenPair || typeof tokenPair !== 'object') {
    return { receivedType: typeof tokenPair };
  }

  return {
    receivedKeys: Object.keys(tokenPair),
    hasAccessToken: Boolean(tokenPair.accessToken || tokenPair.access_token || tokenPair.jwt || tokenPair.token),
    hasRefreshToken: Boolean(tokenPair.refreshToken || tokenPair.refresh_token)
  };
};

const normalizeTokenPair = (tokenPair) => {
  const normalized = {
    accessToken: tokenPair?.accessToken || tokenPair?.access_token || tokenPair?.jwt || tokenPair?.token,
    refreshToken: tokenPair?.refreshToken || tokenPair?.refresh_token || null,
    tokenType: tokenPair?.tokenType || tokenPair?.token_type || 'Bearer',
    accessTokenExpiresAt:
      tokenPair?.accessTokenExpiresAt || tokenPair?.access_token_expires_at || tokenPair?.expiresAt || null,
    refreshTokenExpiresAt: tokenPair?.refreshTokenExpiresAt || tokenPair?.refresh_token_expires_at || null
  };

  if (!normalized.accessToken) {
    throw new ApiError('로그인 응답에 액세스 토큰이 없습니다.', 500, 'MISSING_ACCESS_TOKEN', getTokenPairShape(tokenPair));
  }

  return normalized;
};

const isAnonymousBootstrapFailure = (error) => error?.status === 400 || error?.status === 401;
const isDefinitiveSessionFailure = (error) => error?.status === 400 || error?.status === 401;
const createSessionExpiredError = (payload) =>
  new ApiError('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.', 401, 'SESSION_EXPIRED', payload);
const requestTokenRefresh = async (signal, options) => {
  const execute = async () => {
    try {
      return await authApi.refreshToken(signal, options);
    } catch (error) {
      if (error?.errorCode !== 'REFRESH_TOKEN_ROTATION_IN_PROGRESS') {
        throw error;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return authApi.refreshToken(signal, options);
    }
  };

  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('bridgework-token-refresh', execute);
  }
  return execute();
};

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => authStorage.readTokens());
  const [pendingSignup, setPendingSignupState] = useState(() => authStorage.readSignupSession());
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authNotice, setAuthNotice] = useState('');

  const tokensRef = useRef(tokens);
  const refreshingRef = useRef(null);
  const sessionVersionRef = useRef(0);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const saveTokens = useCallback((tokenPair) => {
    const normalized = normalizeTokenPair(extractTokenPair(tokenPair));
    authStorage.writeTokens(normalized);
    tokensRef.current = normalized;
    setTokens(normalized);
    setAuthNotice('');
    return normalized;
  }, []);

  const clearSession = useCallback((noticeMessage = '') => {
    sessionVersionRef.current += 1;
    refreshingRef.current = null;
    authStorage.clearUserScopedStorage();
    clearRecommendationCache();
    setTokens(null);
    setPendingSignupState(null);
    setCurrentUser(null);
    setAuthNotice(noticeMessage);
  }, []);

  const dismissAuthNotice = useCallback(() => {
    setAuthNotice('');
  }, []);

  const setPendingSignup = useCallback((value) => {
    if (!value) {
      authStorage.clearSignupSession();
      setPendingSignupState(null);
      return;
    }

    authStorage.writeSignupSession(value);
    setPendingSignupState(value);
  }, []);

  const fetchMe = useCallback(async (accessToken, signal) => {
    const me = await authApi.getMe(accessToken, signal);
    setCurrentUser(me);
    return me;
  }, []);

  const isStaleSessionResult = useCallback((error) => error?.errorCode === 'STALE_SESSION_RESULT', []);

  const refreshTokens = useCallback(async () => {
    if (refreshingRef.current) {
      return refreshingRef.current;
    }

    const refreshSessionVersion = sessionVersionRef.current;

    let refreshRequest;
    refreshRequest = requestTokenRefresh()
      .then((tokenPair) => {
        if (sessionVersionRef.current !== refreshSessionVersion) {
          throw new ApiError('이미 종료된 세션의 토큰 갱신 결과입니다.', 401, 'STALE_SESSION_RESULT');
        }

        logger.info('Access token refreshed.');
        return saveTokens(tokenPair);
      })
      .catch((error) => {
        if (isStaleSessionResult(error)) {
          throw error;
        }

        logger.warn('Token refresh failed. Clearing session.', {
          status: error?.status,
          errorCode: error?.errorCode
        });
        if (isDefinitiveSessionFailure(error)) {
          clearSession();
        }
        throw error;
      })
      .finally(() => {
        if (refreshingRef.current === refreshRequest) {
          refreshingRef.current = null;
        }
      });
    refreshingRef.current = refreshRequest;

    return refreshingRef.current;
  }, [clearSession, isStaleSessionResult, saveTokens]);

  const callWithAuth = useCallback(
    async (operation, signal) => {
      if (!tokensRef.current?.accessToken) {
        throw new ApiError('로그인이 필요합니다.', 401, 'UNAUTHORIZED');
      }

      try {
        return await operation(tokensRef.current.accessToken, signal);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        logger.warn('Authorized request returned 401. Retrying with refreshed token.', {
          status: error.status,
          errorCode: error.errorCode
        });
        try {
          const refreshed = await refreshTokens();
          return await operation(refreshed.accessToken, signal);
        } catch (refreshError) {
          if (refreshError?.status === 401) {
            const sessionExpiredError = createSessionExpiredError(refreshError.payload);
            clearSession(sessionExpiredError.message);
            throw sessionExpiredError;
          }

          throw refreshError;
        }
      }
    },
    [clearSession, refreshTokens]
  );

  const loginWithSocialCode = useCallback(
    async (payload, signal) => {
      const response = await authApi.socialLogin(payload, signal);
      const result = unwrapApiPayload(response);

      if (readAuthField(result, 'signupRequired', 'signup_required')) {
        setPendingSignup({
          signupToken: readAuthField(result, 'signupToken', 'signup_token'),
          provider: result.provider,
          email: result.email,
          name: result.name
        });
        return { ...result, signupRequired: true };
      }

      const withdrawalCancelToken = readAuthField(result, 'withdrawalCancelToken', 'withdrawal_cancel_token');

      if (isPendingDeletionAccount(result) || withdrawalCancelToken) {
        if (!withdrawalCancelToken) {
          throw new ApiError('탈퇴 신청 취소 토큰이 없습니다. 고객센터에 문의해 주세요.', 409, 'MISSING_WITHDRAWAL_CANCEL_TOKEN', result);
        }

        const cancelResponse = await authApi.cancelWithdraw(withdrawalCancelToken, signal);
        const tokenPair = normalizeTokenPair(extractTokenPair(cancelResponse));
        await fetchMe(tokenPair.accessToken, signal);
        setPendingSignup(null);
        authStorage.writeAuthProvider(payload.provider || result.provider);
        saveTokens(tokenPair);
        return { ...result, withdrawalCanceled: true, tokenPair };
      }

      const tokenPair = normalizeTokenPair(extractTokenPair(result));
      await fetchMe(tokenPair.accessToken, signal);
      setPendingSignup(null);
      authStorage.writeAuthProvider(payload.provider || result.provider);
      saveTokens(tokenPair);
      return result;
    },
    [fetchMe, saveTokens, setPendingSignup]
  );

  const loginAsAdmin = useCallback(
    async (payload, signal) => {
      const response = await authApi.adminLogin(payload, signal);
      const tokenPair = normalizeTokenPair(extractTokenPair(response));
      const me = await fetchMe(tokenPair.accessToken, signal);
      saveTokens(tokenPair);
      setPendingSignup(null);
      authStorage.writeAuthProvider('ADMIN');
      return me;
    },
    [fetchMe, saveTokens, setPendingSignup]
  );

  const completeSignup = useCallback(
    async (payload, signal) => {
      const response = await authApi.completeSignup(payload, signal);
      const tokenPair = normalizeTokenPair(extractTokenPair(response));
      await fetchMe(tokenPair.accessToken, signal);
      authStorage.writeAuthProvider(payload.provider || pendingSignup?.provider);
      saveTokens(tokenPair);
      setPendingSignup(null);
      return tokenPair;
    },
    [fetchMe, pendingSignup?.provider, saveTokens, setPendingSignup]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      logger.warn('Logout request failed. Keeping the session so the user can retry.', {
        status: error?.status,
        errorCode: error?.errorCode
      });
      throw error;
    }
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const controller = new AbortController();

    const bootstrap = async () => {
      const hadAccessToken = Boolean(tokensRef.current?.accessToken);

      try {
        if (!hadAccessToken && authStorage.hasSessionHint()) {
          const tokenPair = await requestTokenRefresh(controller.signal, {
            expectedErrorStatuses: [400, 401]
          });
          saveTokens(tokenPair);
        }

        if (!tokensRef.current?.accessToken) {
          setCurrentUser(null);
          return;
        }

        await callWithAuth((accessToken, signal) => authApi.getMe(accessToken, signal), controller.signal)
          .then((me) => setCurrentUser(me));
      } catch (error) {
        if (!hadAccessToken && isAnonymousBootstrapFailure(error)) {
          authStorage.clearTokens();
          setTokens(null);
          setCurrentUser(null);
          return;
        }

        if (tokensRef.current?.accessToken || error?.status !== 401) {
          logger.warn('Session bootstrap failed. Clearing session.', {
            status: error?.status,
            errorCode: error?.errorCode
          });
        }
        clearSession();
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, clearSession]);

  useEffect(() => {
    const expiresAt = Date.parse(tokens?.accessTokenExpiresAt || '');
    if (!Number.isFinite(expiresAt) || !tokens?.accessToken) {
      return undefined;
    }

    const refreshDelay = Math.max(0, expiresAt - Date.now() - 60_000);
    let disposed = false;
    let timeoutId;
    const attemptRefresh = () => {
      refreshTokens().catch((error) => {
        if (!isDefinitiveSessionFailure(error) && !disposed) {
          logger.warn('Proactive token refresh was deferred.', {
            status: error?.status,
            errorCode: error?.errorCode
          });
          timeoutId = window.setTimeout(attemptRefresh, 30_000);
        }
      });
    };
    timeoutId = window.setTimeout(attemptRefresh, refreshDelay);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [refreshTokens, tokens?.accessToken, tokens?.accessTokenExpiresAt]);

  const value = useMemo(
    () => ({
      tokens,
      currentUser,
      authNotice,
      isInitializing,
      isAuthenticated: Boolean(tokens?.accessToken),
      pendingSignup,
      loginAsAdmin,
      loginWithSocialCode,
      completeSignup,
      setPendingSignup,
      callWithAuth,
      fetchMe,
      refreshTokens,
      logout,
      clearSession,
      dismissAuthNotice
    }),
    [
      tokens,
      currentUser,
      authNotice,
      isInitializing,
      pendingSignup,
      loginAsAdmin,
      loginWithSocialCode,
      completeSignup,
      setPendingSignup,
      callWithAuth,
      fetchMe,
      refreshTokens,
      logout,
      clearSession,
      dismissAuthNotice
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  return context;
}
