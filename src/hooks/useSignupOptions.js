import { useEffect, useState } from 'react';
import { optionsApi } from '../api/optionsApi';
import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from '../cache/dailyCacheExpiry';
import { STORAGE_KEYS } from '../config/appConfig';
import { toJobCategories } from '../utils/jobCategories';

const CACHE_VERSION = 3;
const MAX_TIMEOUT_DELAY = 2_147_483_647;

const initialState = {
  status: 'idle',
  error: '',
  employmentTypes: [],
  jobCategories: []
};

const isValidOptionsData = (data) =>
  Array.isArray(data?.employmentTypes) &&
  Array.isArray(data?.jobCategories);

const clearCachedSignupOptions = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.signupOptionsCache);
  } catch (error) {
    // 스토리지 접근 실패 시 무시한다.
  }
};

const readCachedSignupOptions = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.signupOptionsCache);

    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);

    if (cached?.version !== CACHE_VERSION || !isValidOptionsData(cached?.data) || isDailyCacheExpired(cached.expiresAt)) {
      window.localStorage.removeItem(STORAGE_KEYS.signupOptionsCache);
      return null;
    }

    return cached;
  } catch (error) {
    clearCachedSignupOptions();
    return null;
  }
};

const writeCachedSignupOptions = (data) => {
  const expiresAt = getNextDailyCacheExpiryAt();

  try {
    window.localStorage.setItem(
      STORAGE_KEYS.signupOptionsCache,
      JSON.stringify({
        version: CACHE_VERSION,
        expiresAt,
        data
      })
    );
  } catch (error) {
    // 캐시 저장에 실패해도 현재 화면 상태는 API 응답으로 유지한다.
  }

  return expiresAt;
};

const toSuccessState = (data) => ({
  status: 'success',
  error: '',
  ...data
});

export function useSignupOptions() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimerId;

    const scheduleCacheRefresh = (expiresAt) => {
      if (!expiresAt) {
        return;
      }

      const delay = expiresAt - Date.now();

      if (delay <= 0) {
        clearCachedSignupOptions();
        loadOptions({ preferCache: false });
        return;
      }

      refreshTimerId = window.setTimeout(
        () => {
          clearCachedSignupOptions();
          loadOptions({ preferCache: false });
        },
        Math.min(delay, MAX_TIMEOUT_DELAY)
      );
    };

    const loadOptions = async ({ preferCache = true } = {}) => {
      if (preferCache) {
        const cached = readCachedSignupOptions();

        if (cached) {
          setState(toSuccessState(cached.data));
          scheduleCacheRefresh(cached.expiresAt);
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: ''
      }));

      try {
        const [employmentTypes, jobCategoryTree] = await Promise.all([
          optionsApi.getEmploymentTypes(controller.signal),
          optionsApi.getJobCategoryTree(controller.signal)
        ]);
        const jobCategories = toJobCategories(jobCategoryTree);
        const hasRequiredOptions =
          employmentTypes.length > 0 &&
          jobCategories.length > 0;
        const successData = {
          employmentTypes,
          jobCategories
        };

        if (hasRequiredOptions) {
          const expiresAt = writeCachedSignupOptions(successData);

          setState(toSuccessState(successData));
          scheduleCacheRefresh(expiresAt);
          return;
        }

        setState({
          ...initialState,
          status: 'empty'
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setState({
          ...initialState,
          status: 'error',
          error: error.message || '회원가입 옵션을 불러오지 못했습니다.'
        });
      }
    };

    loadOptions();

    return () => {
      if (refreshTimerId) {
        window.clearTimeout(refreshTimerId);
      }
      controller.abort();
    };
  }, []);

  return state;
}
