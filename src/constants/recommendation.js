export const RECOMMEND_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
export const RECOMMEND_TASK_POLL_INTERVAL_MS = 500;

export const QUICK_RECOMMENDATION = Object.freeze({
  activeTaskScope: 'quick',
  pageSize: 100,
  maxResults: 1000,
  incrementalAppendDelayMs: 220
});

export const MAP_RECOMMENDATION = Object.freeze({
  activeTaskScope: 'accessibility-map',
  pageSize: 100,
  maxResults: 1000,
  incrementalAppendDelayMs: 220
});
