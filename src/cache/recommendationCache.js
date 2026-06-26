import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from './dailyCacheExpiry';

const RECOMMENDATION_CACHE_TTL_MS = 5 * 60 * 1000;
const RECOMMENDATION_CACHE_MAX_SIZE = 80;
const ACTIVE_RECOMMENDATION_TASK_TTL_MS = 10 * 60 * 1000;
const recommendationCache = new Map();
const activeRecommendationTasks = new Map();
const getActiveRecommendationTaskStorageKey = (scope) => `bridgework.activeRecommendationTask:${scope}`;

const getActiveRecommendationTaskStorages = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  return [window.sessionStorage, window.localStorage].filter(Boolean);
};

const isActiveRecommendationTaskRecordValid = (record) =>
  Boolean(record?.payload) &&
  Date.now() <= Number(record.expiresAt || 0) &&
  !isDailyCacheExpired(record.expiresAt);

export const getRecommendationCacheKey = ({ profileId, aiEnabled = true, scope = 'list', profileSignature = '' }) =>
  `recommendation:${scope}:${aiEnabled ? 'ai' : 'basic'}:${profileId || 'default'}:${profileSignature || 'current'}`;

export const getRecommendationExplanationCacheKey = ({ profileId, externalId, jobId, score, profileSignature = '' }) =>
  `recommendation:explanation:${profileId || 'default'}:${externalId || jobId || 'unknown'}:${score ?? 'no-score'}:${profileSignature || 'current'}`;

export function getCachedRecommendation(cacheKey) {
  const cached = recommendationCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.cachedAt > RECOMMENDATION_CACHE_TTL_MS || isDailyCacheExpired(cached.expiresAt)) {
    recommendationCache.delete(cacheKey);
    return null;
  }

  recommendationCache.delete(cacheKey);
  recommendationCache.set(cacheKey, cached);
  return cached.payload;
}

export function setCachedRecommendation(cacheKey, payload) {
  const timeBasedExpiryAt = Date.now() + RECOMMENDATION_CACHE_TTL_MS;
  if (recommendationCache.has(cacheKey)) {
    recommendationCache.delete(cacheKey);
  }
  recommendationCache.set(cacheKey, {
    cachedAt: Date.now(),
    expiresAt: Math.min(timeBasedExpiryAt, getNextDailyCacheExpiryAt()),
    payload
  });

  while (recommendationCache.size > RECOMMENDATION_CACHE_MAX_SIZE) {
    const oldestKey = recommendationCache.keys().next().value;
    recommendationCache.delete(oldestKey);
  }
}

export function clearRecommendationCache() {
  recommendationCache.clear();
}

export function setActiveRecommendationTask(scope, payload) {
  if (!scope || !payload) {
    return;
  }

  const record = {
    savedAt: Date.now(),
    expiresAt: Math.min(Date.now() + ACTIVE_RECOMMENDATION_TASK_TTL_MS, getNextDailyCacheExpiryAt()),
    payload
  };
  activeRecommendationTasks.set(scope, record);

  for (const storage of getActiveRecommendationTaskStorages()) {
    try {
      storage.setItem(getActiveRecommendationTaskStorageKey(scope), JSON.stringify(record));
    } catch (error) {
      // 진행 복원 정보 저장 실패는 추천 계산을 막지 않는다.
    }
  }
}

export function getActiveRecommendationTask(scope) {
  if (!scope) {
    return null;
  }

  const storageKey = getActiveRecommendationTaskStorageKey(scope);
  const memoryRecord = activeRecommendationTasks.get(scope);
  if (isActiveRecommendationTaskRecordValid(memoryRecord)) {
    return memoryRecord.payload;
  }
  activeRecommendationTasks.delete(scope);

  for (const storage of getActiveRecommendationTaskStorages()) {
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw);
      if (!isActiveRecommendationTaskRecordValid(parsed)) {
        storage.removeItem(storageKey);
        continue;
      }

      activeRecommendationTasks.set(scope, parsed);
      return parsed.payload;
    } catch (error) {
      try {
        storage.removeItem(storageKey);
      } catch (removeError) {
        // 삭제 실패는 무시한다.
      }
    }
  }

  return null;
}

export function clearActiveRecommendationTask(scope) {
  if (!scope) {
    return;
  }

  activeRecommendationTasks.delete(scope);
  for (const storage of getActiveRecommendationTaskStorages()) {
    try {
      storage.removeItem(getActiveRecommendationTaskStorageKey(scope));
    } catch (error) {
      // 삭제 실패는 무시한다.
    }
  }
}
