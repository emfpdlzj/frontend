export const DEFAULT_LOCALE = 'ko';

export const SUPPORTED_LOCALES = Object.freeze([
  { code: 'ko', htmlLang: 'ko-KR', label: '한국어', shortLabel: 'KO' },
  { code: 'en', htmlLang: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'ja', htmlLang: 'ja', label: '日本語', shortLabel: 'JA' },
  { code: 'zh-CN', htmlLang: 'zh-CN', label: '中文简体', shortLabel: 'ZH' }
]);

export const SUPPORTED_LOCALE_CODES = SUPPORTED_LOCALES.map((locale) => locale.code);

export const LOCALE_PATTERN = SUPPORTED_LOCALE_CODES.join('|');

const SUPPORTED_LOCALE_SET = new Set(SUPPORTED_LOCALE_CODES);
const LEGACY_LOCALE_ALIASES = Object.freeze({
  zh: 'zh-CN'
});

function canonicalizeLocale(value) {
  return LEGACY_LOCALE_ALIASES[value] || value;
}

export function isSupportedLocale(value) {
  return SUPPORTED_LOCALE_SET.has(canonicalizeLocale(value));
}

export function normalizeLocale(value) {
  const canonicalLocale = canonicalizeLocale(value);
  return SUPPORTED_LOCALE_SET.has(canonicalLocale) ? canonicalLocale : DEFAULT_LOCALE;
}

export function getLocaleMeta(locale) {
  const normalizedLocale = normalizeLocale(locale);
  return SUPPORTED_LOCALES.find((item) => item.code === normalizedLocale) || SUPPORTED_LOCALES[0];
}

export function getLocaleFromPathname(pathname) {
  const [, firstSegment = ''] = String(pathname || '').split('/');
  return normalizeLocale(firstSegment);
}

export function stripLocaleFromPathname(pathname) {
  const normalizedPathname = String(pathname || '/');
  const [, firstSegment = ''] = normalizedPathname.split('/');

  if (!isSupportedLocale(firstSegment)) {
    return normalizedPathname || '/';
  }

  const stripped = normalizedPathname.slice(firstSegment.length + 1);
  return stripped.startsWith('/') ? stripped || '/' : `/${stripped}`;
}

export function buildLocalizedPath(path, locale = DEFAULT_LOCALE) {
  if (!path || path === '#') {
    return path;
  }

  if (/^(https?:|mailto:|tel:)/i.test(path)) {
    return path;
  }

  if (path.startsWith('#')) {
    return path;
  }

  const normalizedLocale = normalizeLocale(locale);
  const [pathWithoutHash, hash = ''] = path.split('#');
  const [pathname = '/', search = ''] = pathWithoutHash.split('?');
  const pathWithoutLocale = stripLocaleFromPathname(pathname || '/');
  const localizedPathname = pathWithoutLocale === '/' ? `/${normalizedLocale}` : `/${normalizedLocale}${pathWithoutLocale}`;
  const searchPart = search ? `?${search}` : '';
  const hashPart = hash ? `#${hash}` : '';

  return `${localizedPathname}${searchPart}${hashPart}`;
}
