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

const AuthContext = createContext(null);
const logger = createLogger('auth');

const normalizeTokenPair = (tokenPair) => ({
  accessToken: tokenPair.accessToken,
  refreshToken: tokenPair.refreshToken,
  tokenType: tokenPair.tokenType || 'Bearer'
});

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => authStorage.readTokens());
  const [pendingSignup, setPendingSignupState] = useState(() => authStorage.readSignupSession());
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const tokensRef = useRef(tokens);
  const refreshingRef = useRef(null);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  const saveTokens = useCallback((tokenPair) => {
    const normalized = normalizeTokenPair(tokenPair);
    authStorage.writeTokens(normalized);
    setTokens(normalized);
    return normalized;
  }, []);

  const clearSession = useCallback(() => {
    authStorage.clearTokens();
    authStorage.clearSignupSession();
    setTokens(null);
    setPendingSignupState(null);
    setCurrentUser(null);
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

  const refreshTokens = useCallback(async () => {
    if (!tokensRef.current?.refreshToken) {
      throw new ApiError('리프레시 토큰이 없습니다.', 401, 'MISSING_REFRESH_TOKEN');
    }

    if (refreshingRef.current) {
      return refreshingRef.current;
    }

    refreshingRef.current = authApi
      .refreshToken(tokensRef.current.refreshToken)
      .then((tokenPair) => {
        logger.info('Access token refreshed.');
        return saveTokens(tokenPair);
      })
      .catch((error) => {
        logger.warn('Token refresh failed. Clearing session.', {
          status: error?.status,
          errorCode: error?.errorCode
        });
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshingRef.current = null;
      });

    return refreshingRef.current;
  }, [clearSession, saveTokens]);

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
        const refreshed = await refreshTokens();
        return operation(refreshed.accessToken, signal);
      }
    },
    [refreshTokens]
  );

  const loginWithSocialCode = useCallback(
    async (payload, signal) => {
      const result = await authApi.socialLogin(payload, signal);

      if (result.signupRequired) {
        setPendingSignup({
          signupToken: result.signupToken,
          provider: result.provider,
          email: result.email,
          name: result.name
        });
        return result;
      }

      setPendingSignup(null);
      saveTokens(result.tokenPair);
      await fetchMe(result.tokenPair.accessToken, signal);
      return result;
    },
    [fetchMe, saveTokens, setPendingSignup]
  );

  const completeSignup = useCallback(
    async (payload, signal) => {
      const tokenPair = await authApi.completeSignup(payload, signal);
      setPendingSignup(null);
      saveTokens(tokenPair);
      await fetchMe(tokenPair.accessToken, signal);
      return tokenPair;
    },
    [fetchMe, saveTokens, setPendingSignup]
  );

  const logout = useCallback(async () => {
    const accessToken = tokensRef.current?.accessToken;
    const refreshToken = tokensRef.current?.refreshToken;

    try {
      if (accessToken && refreshToken) {
        await authApi.logout(accessToken, refreshToken);
      }
    } catch (error) {
      // 로그아웃 요청이 실패해도 로컬 세션은 즉시 폐기한다.
      logger.warn('Logout request failed. Proceeding with local session cleanup.', {
        status: error?.status,
        errorCode: error?.errorCode
      });
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    const controller = new AbortController();

    const bootstrap = async () => {
      if (!tokensRef.current?.accessToken) {
        setIsInitializing(false);
        return;
      }

      try {
        await callWithAuth((accessToken, signal) => authApi.getMe(accessToken, signal), controller.signal)
          .then((me) => setCurrentUser(me));
      } catch (error) {
        logger.warn('Session bootstrap failed. Clearing session.', {
          status: error?.status,
          errorCode: error?.errorCode
        });
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

  const value = useMemo(
    () => ({
      tokens,
      currentUser,
      isInitializing,
      isAuthenticated: Boolean(tokens?.accessToken),
      pendingSignup,
      loginWithSocialCode,
      completeSignup,
      setPendingSignup,
      callWithAuth,
      fetchMe,
      refreshTokens,
      logout,
      clearSession
    }),
    [
      tokens,
      currentUser,
      isInitializing,
      pendingSignup,
      loginWithSocialCode,
      completeSignup,
      setPendingSignup,
      callWithAuth,
      fetchMe,
      refreshTokens,
      logout,
      clearSession
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
