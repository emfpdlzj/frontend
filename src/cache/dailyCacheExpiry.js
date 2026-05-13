const DAILY_CACHE_EXPIRY_HOUR = 2;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const getNextDailyCacheExpiryAt = (now = new Date()) => {
  const nowTime = now instanceof Date ? now.getTime() : Number(now);
  const kstNow = new Date(nowTime + KST_OFFSET_MS);
  const expiryAt = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
    DAILY_CACHE_EXPIRY_HOUR,
    0,
    0,
    0
  ) - KST_OFFSET_MS;

  return nowTime >= expiryAt ? expiryAt + DAY_MS : expiryAt;
};

export const isDailyCacheExpired = (expiresAt, now = Date.now()) =>
  !Number.isFinite(Number(expiresAt)) || Number(now) >= Number(expiresAt);
