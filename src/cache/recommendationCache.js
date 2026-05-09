const RECOMMENDATION_CACHE_TTL_MS = 5 * 60 * 1000;
const recommendationCache = new Map();

export const getRecommendationCacheKey = ({ profileId, aiEnabled = true, scope = 'list' }) =>
  `recommendation:${scope}:${aiEnabled ? 'ai' : 'basic'}:${profileId || 'default'}`;

export function getCachedRecommendation(cacheKey) {
  const cached = recommendationCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.cachedAt > RECOMMENDATION_CACHE_TTL_MS) {
    recommendationCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
}

export function setCachedRecommendation(cacheKey, payload) {
  recommendationCache.set(cacheKey, {
    cachedAt: Date.now(),
    payload
  });
}

export function clearRecommendationCache() {
  recommendationCache.clear();
}
