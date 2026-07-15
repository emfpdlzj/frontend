export const RECOMMEND_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
export const RECOMMEND_TASK_POLL_INTERVAL_MS = 500;

export const QUICK_RECOMMENDATION = Object.freeze({
  activeTaskScope: 'quick',
  pageSize: 100,
  incrementalAppendDelayMs: 220
});

export const MAP_RECOMMENDATION = Object.freeze({
  activeTaskScope: 'accessibility-map',
  pageSize: 100,
  incrementalAppendDelayMs: 220
});

export const hasMoreRecommendationPages = ({ pageSize, loadedCount, offset = 0, totalCount }) => {
  const normalizedPageSize = Math.max(1, Number(pageSize) || 1);
  const normalizedLoadedCount = Math.max(0, Number(loadedCount) || 0);
  const normalizedOffset = Math.max(0, Number(offset) || 0);
  const normalizedTotalCount = Math.max(0, Number(totalCount) || 0);

  return normalizedLoadedCount > 0 &&
    normalizedLoadedCount % normalizedPageSize === 0 &&
    normalizedOffset + normalizedLoadedCount < normalizedTotalCount;
};
