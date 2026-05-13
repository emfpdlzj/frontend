import { useEffect, useState } from 'react';
import { optionsApi } from '../api/optionsApi';
import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from '../cache/dailyCacheExpiry';
import { STORAGE_KEYS } from '../config/appConfig';
import { toJobCategories } from '../utils/jobCategories';

const CACHE_VERSION = 1;
const MAX_TIMEOUT_DELAY = 2_147_483_647;

const initialState = {
  status: 'idle',
  error: '',
  employmentTypes: [],
  jobCategories: [],
  jobOptions: [],
  regions: [],
  salaryTypes: []
};

const flattenJobTree = (nodes) => {
  if (!Array.isArray(nodes)) {
    return [];
  }

  const names = [];
  const visit = (node) => {
    if (!node) {
      return;
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach(visit);
      return;
    }

    if (node.name) {
      names.push(node.name);
    }
  };

  nodes.forEach(visit);

  if (!names.length) {
    nodes.forEach((node) => {
      if (node?.name && (node.level === 3 || node.level === '3')) {
        names.push(node.name);
      }
    });
  }

  if (!names.length) {
    nodes.forEach((node) => {
      if (node?.name) {
        names.push(node.name);
      }
    });
  }

  return [...new Set(names)]
    .map((name) => ({ value: name, label: name }))
    .filter((option) => option.value && option.label);
};

const isValidCache = (cached) =>
  cached?.version === CACHE_VERSION &&
  !isDailyCacheExpired(cached?.expiresAt) &&
  Array.isArray(cached?.data?.employmentTypes) &&
  Array.isArray(cached?.data?.jobCategories) &&
  Array.isArray(cached?.data?.jobOptions) &&
  Array.isArray(cached?.data?.regions) &&
  Array.isArray(cached?.data?.salaryTypes);

const readCache = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.jobFilterOptionsCache);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    if (!isValidCache(cached)) {
      window.localStorage.removeItem(STORAGE_KEYS.jobFilterOptionsCache);
      return null;
    }

    return cached;
  } catch (error) {
    return null;
  }
};

const writeCache = (data) => {
  const expiresAt = getNextDailyCacheExpiryAt();

  try {
    window.localStorage.setItem(
      STORAGE_KEYS.jobFilterOptionsCache,
      JSON.stringify({
        version: CACHE_VERSION,
        expiresAt,
        data
      })
    );
  } catch (error) {
    // 캐시 저장 실패는 화면 동작을 막지 않는다.
  }

  return expiresAt;
};

export function useJobFilterOptions() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const controller = new AbortController();
    let refreshTimerId;

    const clearCache = () => {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.jobFilterOptionsCache);
      } catch (error) {
        // 캐시 제거 실패는 다음 API 호출 흐름을 막지 않는다.
      }
    };

    const scheduleCacheRefresh = (expiresAt) => {
      if (!expiresAt) {
        return;
      }

      const delay = expiresAt - Date.now();
      if (delay <= 0) {
        clearCache();
        loadOptions();
        return;
      }

      refreshTimerId = window.setTimeout(
        () => {
          clearCache();
          loadOptions();
        },
        Math.min(delay, MAX_TIMEOUT_DELAY)
      );
    };

    const loadOptions = async () => {
      setState((prev) => ({
        ...prev,
        status: 'loading',
        error: ''
      }));

      try {
        const [employmentTypes, jobCategoryTree, regions, salaryTypes] = await Promise.all([
          optionsApi.getEmploymentTypes(controller.signal),
          optionsApi.getJobCategoryTree(controller.signal),
          optionsApi.getRegions(controller.signal),
          optionsApi.getSalaryTypes(controller.signal)
        ]);
        const data = {
          employmentTypes,
          jobCategories: toJobCategories(jobCategoryTree),
          jobOptions: flattenJobTree(jobCategoryTree),
          regions,
          salaryTypes
        };

        const expiresAt = writeCache(data);
        setState({
          status: 'success',
          error: '',
          ...data
        });
        scheduleCacheRefresh(expiresAt);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setState({
          ...initialState,
          status: 'error',
          error: error.message || '필터 옵션을 불러오지 못했습니다.'
        });
      }
    };

    const cached = readCache();
    if (cached) {
      setState({
        status: 'success',
        error: '',
        ...cached.data
      });
      scheduleCacheRefresh(cached.expiresAt);
      return () => {
        if (refreshTimerId) {
          window.clearTimeout(refreshTimerId);
        }
        controller.abort();
      };
    }

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
