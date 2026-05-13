import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from './dailyCacheExpiry';

test('returns today 02:00 as cache expiry before daily boundary', () => {
  const expiresAt = getNextDailyCacheExpiryAt(new Date('2026-05-14T01:30:00+09:00'));

  expect(new Date(expiresAt).toISOString()).toBe(new Date('2026-05-14T02:00:00+09:00').toISOString());
});

test('returns tomorrow 02:00 as cache expiry after daily boundary', () => {
  const expiresAt = getNextDailyCacheExpiryAt(new Date('2026-05-14T02:00:00+09:00'));

  expect(new Date(expiresAt).toISOString()).toBe(new Date('2026-05-15T02:00:00+09:00').toISOString());
});

test('treats missing or passed expiry as expired', () => {
  expect(isDailyCacheExpired(undefined, Date.now())).toBe(true);
  expect(isDailyCacheExpired(1000, 1000)).toBe(true);
  expect(isDailyCacheExpired(1001, 1000)).toBe(false);
});
