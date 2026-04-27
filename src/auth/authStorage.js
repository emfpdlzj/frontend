import { STORAGE_KEYS } from '../config/appConfig';

const safeStorage = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      // 스토리지 접근 실패 시 메모리 상태를 우선 사용한다.
    }
  },
  remove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      // 스토리지 접근 실패 시 무시한다.
    }
  }
};

export const authStorage = {
  readTokens() {
    const accessToken = safeStorage.get(STORAGE_KEYS.accessToken);
    const refreshToken = safeStorage.get(STORAGE_KEYS.refreshToken);
    const tokenType = safeStorage.get(STORAGE_KEYS.tokenType) || 'Bearer';

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      tokenType
    };
  },

  writeTokens(tokenPair) {
    safeStorage.set(STORAGE_KEYS.accessToken, tokenPair.accessToken);
    safeStorage.set(STORAGE_KEYS.refreshToken, tokenPair.refreshToken);
    safeStorage.set(STORAGE_KEYS.tokenType, tokenPair.tokenType || 'Bearer');
  },

  clearTokens() {
    safeStorage.remove(STORAGE_KEYS.accessToken);
    safeStorage.remove(STORAGE_KEYS.refreshToken);
    safeStorage.remove(STORAGE_KEYS.tokenType);
  },

  readSignupSession() {
    const raw = safeStorage.get(STORAGE_KEYS.signupSession);
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
    safeStorage.set(STORAGE_KEYS.signupSession, JSON.stringify(value));
  },

  clearSignupSession() {
    safeStorage.remove(STORAGE_KEYS.signupSession);
  }
};
