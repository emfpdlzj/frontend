import { STORAGE_KEYS } from '../config/appConfig';
import { TOKEN_STORAGE_POLICY } from '../config/securityPolicy';

const createSafeStorage = (storageName) => ({
  get(key) {
    try {
      return window[storageName].getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      window[storageName].setItem(key, value);
    } catch (error) {
      // 스토리지 접근 실패 시 메모리 상태를 우선 사용한다.
    }
  },
  remove(key) {
    try {
      window[storageName].removeItem(key);
    } catch (error) {
      // 스토리지 접근 실패 시 무시한다.
    }
  }
});

const persistentStorage = createSafeStorage('localStorage');
const sessionFallbackStorage = createSafeStorage('sessionStorage');
let memoryTokenSnapshot = null;

export const AUTH_TOKEN_STORAGE_POLICY = TOKEN_STORAGE_POLICY;

const removeKeysByPrefix = (storageName, prefixes) => {
  try {
    const storage = window[storageName];
    const keysToRemove = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (prefixes.some((prefix) => key?.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => storage.removeItem(key));
  } catch (error) {
    // 브라우저 저장소 접근이 차단된 환경에서는 메모리 세션 정리만 보장한다.
  }
};

const readTokenSnapshot = (storage) => {
  const accessToken = storage.get(STORAGE_KEYS.accessToken);
  const refreshToken = storage.get(STORAGE_KEYS.refreshToken);
  const tokenType = storage.get(STORAGE_KEYS.tokenType) || 'Bearer';

  if (!accessToken && !refreshToken) {
    return null;
  }

  return {
    accessToken: accessToken || null,
    refreshToken,
    tokenType,
    accessTokenExpiresAt: storage.get(STORAGE_KEYS.accessTokenExpiresAt),
    refreshTokenExpiresAt: storage.get(STORAGE_KEYS.refreshTokenExpiresAt)
  };
};

export const authStorage = {
  readTokens() {
    if (memoryTokenSnapshot) {
      return memoryTokenSnapshot;
    }

    const legacyPersistentTokens = readTokenSnapshot(persistentStorage);
    if (legacyPersistentTokens) {
      this.clearTokenStorage();
      return {
        accessToken: null,
        refreshToken: legacyPersistentTokens.refreshToken,
        tokenType: legacyPersistentTokens.tokenType,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: legacyPersistentTokens.refreshTokenExpiresAt
      };
    }

    const sessionTokens = readTokenSnapshot(sessionFallbackStorage);
    if (sessionTokens) {
      memoryTokenSnapshot = sessionTokens;
      return sessionTokens;
    }

    return memoryTokenSnapshot;
  },

  writeTokens(tokenPair) {
    memoryTokenSnapshot = {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken || null,
      tokenType: tokenPair.tokenType || 'Bearer',
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt || null,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt || null
    };
    this.clearTokenStorage();
    if (TOKEN_STORAGE_POLICY.refreshToken === 'sessionStorage' && memoryTokenSnapshot.refreshToken) {
      sessionFallbackStorage.set(STORAGE_KEYS.refreshToken, memoryTokenSnapshot.refreshToken);
      sessionFallbackStorage.set(STORAGE_KEYS.tokenType, memoryTokenSnapshot.tokenType);
    }
    if (TOKEN_STORAGE_POLICY.refreshToken === 'sessionStorage' && memoryTokenSnapshot.refreshTokenExpiresAt) {
      sessionFallbackStorage.set(STORAGE_KEYS.refreshTokenExpiresAt, memoryTokenSnapshot.refreshTokenExpiresAt);
    }
  },

  clearTokens() {
    memoryTokenSnapshot = null;
    this.clearTokenStorage();
  },

  clearTokenStorage() {
    [persistentStorage, sessionFallbackStorage].forEach((storage) => {
      storage.remove(STORAGE_KEYS.accessToken);
      storage.remove(STORAGE_KEYS.refreshToken);
      storage.remove(STORAGE_KEYS.tokenType);
      storage.remove(STORAGE_KEYS.accessTokenExpiresAt);
      storage.remove(STORAGE_KEYS.refreshTokenExpiresAt);
      storage.remove(STORAGE_KEYS.authProvider);
    });
  },

  clearUserScopedStorage() {
    this.clearTokens();
    this.clearSignupSession();
    removeKeysByPrefix('localStorage', [
      `${STORAGE_KEYS.profileDraftAutosave}:`,
      STORAGE_KEYS.selectedProfile,
      STORAGE_KEYS.authProvider
    ]);
    removeKeysByPrefix('sessionStorage', [
      `${STORAGE_KEYS.profileDraftAutosave}:`,
      STORAGE_KEYS.selectedProfile,
      STORAGE_KEYS.signupSession,
      STORAGE_KEYS.oauthReturnTo,
      `${STORAGE_KEYS.oauthState}:`,
      STORAGE_KEYS.naverState
    ]);
  },

  readAuthProvider() {
    return sessionFallbackStorage.get(STORAGE_KEYS.authProvider);
  },

  writeAuthProvider(provider) {
    if (!provider) {
      return;
    }

    sessionFallbackStorage.set(STORAGE_KEYS.authProvider, provider);
  },

  readSignupSession() {
    const raw = sessionFallbackStorage.get(STORAGE_KEYS.signupSession);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  },

  writeSignupSession(value) {
    sessionFallbackStorage.set(STORAGE_KEYS.signupSession, JSON.stringify(value));
  },

  clearSignupSession() {
    sessionFallbackStorage.remove(STORAGE_KEYS.signupSession);
  }
};
