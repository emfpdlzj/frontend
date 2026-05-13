import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from './dailyCacheExpiry';

const RECOMMENDATION_CACHE_TTL_MS = 5 * 60 * 1000;
const RECOMMENDATION_CACHE_MAX_SIZE = 80;
const recommendationCache = new Map();

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
