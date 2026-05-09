import { STORAGE_KEYS } from '../config/appConfig';

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

const readTokenSnapshot = (storage) => {
  const accessToken = storage.get(STORAGE_KEYS.accessToken);
  const refreshToken = storage.get(STORAGE_KEYS.refreshToken);
  const tokenType = storage.get(STORAGE_KEYS.tokenType) || 'Bearer';

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    tokenType,
    accessTokenExpiresAt: storage.get(STORAGE_KEYS.accessTokenExpiresAt),
    refreshTokenExpiresAt: storage.get(STORAGE_KEYS.refreshTokenExpiresAt)
  };
};

export const authStorage = {
  readTokens() {
    const storedTokens = readTokenSnapshot(persistentStorage);
    if (storedTokens) {
      return storedTokens;
    }

    const legacySessionTokens = readTokenSnapshot(sessionFallbackStorage);
    if (legacySessionTokens) {
      this.writeTokens(legacySessionTokens);
      sessionFallbackStorage.remove(STORAGE_KEYS.accessToken);
      sessionFallbackStorage.remove(STORAGE_KEYS.refreshToken);
      sessionFallbackStorage.remove(STORAGE_KEYS.tokenType);
      sessionFallbackStorage.remove(STORAGE_KEYS.accessTokenExpiresAt);
      sessionFallbackStorage.remove(STORAGE_KEYS.refreshTokenExpiresAt);
    }

    return legacySessionTokens;
  },

  writeTokens(tokenPair) {
    persistentStorage.set(STORAGE_KEYS.accessToken, tokenPair.accessToken);
    if (tokenPair.refreshToken) {
      persistentStorage.set(STORAGE_KEYS.refreshToken, tokenPair.refreshToken);
    } else {
      persistentStorage.remove(STORAGE_KEYS.refreshToken);
    }
    persistentStorage.set(STORAGE_KEYS.tokenType, tokenPair.tokenType || 'Bearer');
    if (tokenPair.accessTokenExpiresAt) {
      persistentStorage.set(STORAGE_KEYS.accessTokenExpiresAt, tokenPair.accessTokenExpiresAt);
    } else {
      persistentStorage.remove(STORAGE_KEYS.accessTokenExpiresAt);
    }
    if (tokenPair.refreshTokenExpiresAt) {
      persistentStorage.set(STORAGE_KEYS.refreshTokenExpiresAt, tokenPair.refreshTokenExpiresAt);
    } else {
      persistentStorage.remove(STORAGE_KEYS.refreshTokenExpiresAt);
    }
  },

  clearTokens() {
    [persistentStorage, sessionFallbackStorage].forEach((storage) => {
      storage.remove(STORAGE_KEYS.accessToken);
      storage.remove(STORAGE_KEYS.refreshToken);
      storage.remove(STORAGE_KEYS.tokenType);
      storage.remove(STORAGE_KEYS.accessTokenExpiresAt);
      storage.remove(STORAGE_KEYS.refreshTokenExpiresAt);
      storage.remove(STORAGE_KEYS.authProvider);
    });
  },

  readAuthProvider() {
    return persistentStorage.get(STORAGE_KEYS.authProvider);
  },

  writeAuthProvider(provider) {
    if (!provider) {
      return;
    }

    persistentStorage.set(STORAGE_KEYS.authProvider, provider);
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
