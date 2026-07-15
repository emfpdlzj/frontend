export const getUserField = (user, keys, fallback = '로그인 후 확인') => {
  for (const key of keys) {
    if (user?.[key]) {
      return user[key];
    }
  }

  return fallback;
};

export const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

export const getTextField = (value) => {
  const text = String(value ?? '').trim();
  return text || '';
};

export const normalizeProvider = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).toUpperCase();
  if (normalized.includes('KAKAO')) {
    return 'KAKAO';
  }

  if (normalized.includes('NAVER')) {
    return 'NAVER';
  }

  return null;
};

export const findProviderInText = (value) => {
  if (!value) {
    return null;
  }
  const normalized = String(value).toUpperCase();
  if (normalized.includes('KAKAO')) {
    return 'KAKAO';
  }
  if (normalized.includes('NAVER')) {
    return 'NAVER';
  }
  return null;
};

export const decodeJwtPayload = (token) => {
  if (!token || !token.includes('.')) {
    return null;
  }

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch (error) {
    return null;
  }
};

export const findProviderInObject = (value) => {
  const directProvider = normalizeProvider(value);
  if (directProvider) {
    return directProvider;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const providerKeys = [
    'provider',
    'socialProvider',
    'oauthProvider',
    'authProvider',
    'providerType',
    'socialType',
    'loginProvider',
    'registrationId'
  ];

  for (const key of providerKeys) {
    const provider = normalizeProvider(value[key]);
    if (provider) {
      return provider;
    }
  }

  for (const item of Object.values(value)) {
    const provider = findProviderInObject(item);
    if (provider) {
      return provider;
    }
  }

  try {
    return findProviderInText(JSON.stringify(value));
  } catch (error) {
    return null;
  }
};
