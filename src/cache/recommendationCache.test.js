import { clearRecommendationCache, getCachedRecommendation, setCachedRecommendation } from './recommendationCache';

beforeEach(() => {
  clearRecommendationCache();
  jest.useRealTimers();
});

afterEach(() => {
  clearRecommendationCache();
  jest.useRealTimers();
});

test('expires recommendation cache at the next 02:00 boundary', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-05-14T01:59:00+09:00'));

  setCachedRecommendation('recommendation:test', { results: [1] });
  expect(getCachedRecommendation('recommendation:test')).toEqual({ results: [1] });

  jest.setSystemTime(new Date('2026-05-14T02:00:00+09:00'));

  expect(getCachedRecommendation('recommendation:test')).toBeNull();
});

test('expires recommendation cache by short ttl before daily boundary', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-05-14T03:00:00+09:00'));

  setCachedRecommendation('recommendation:test', { results: [1] });

  jest.advanceTimersByTime(5 * 60 * 1000 + 1);

  expect(getCachedRecommendation('recommendation:test')).toBeNull();
});

test('keeps shared recommendation cache bounded with least recently used eviction', () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-05-14T03:00:00+09:00'));

  for (let index = 0; index < 80; index += 1) {
    setCachedRecommendation(`recommendation:${index}`, { index });
  }

  expect(getCachedRecommendation('recommendation:0')).toEqual({ index: 0 });
  setCachedRecommendation('recommendation:80', { index: 80 });

  expect(getCachedRecommendation('recommendation:0')).toEqual({ index: 0 });
  expect(getCachedRecommendation('recommendation:1')).toBeNull();
});
