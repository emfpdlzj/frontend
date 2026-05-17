import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildLocalizedPath,
  DEFAULT_LOCALE,
  getLocaleFromPathname,
  getLocaleMeta,
  normalizeLocale,
  stripLocaleFromPathname,
  SUPPORTED_LOCALES
} from './locales';
import { getMessage, MESSAGES } from './messages';

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  localeMeta: getLocaleMeta(DEFAULT_LOCALE),
  supportedLocales: SUPPORTED_LOCALES,
  localizePath: (path) => buildLocalizedPath(path, DEFAULT_LOCALE),
  t: (key) => getMessage(MESSAGES[DEFAULT_LOCALE], key),
  switchLocale: () => {}
});

export function LocaleProvider({ children }) {
  const location = useLocation();
  const locale = getLocaleFromPathname(location.pathname);
  const localeMeta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = localeMeta.htmlLang;
  }, [localeMeta.htmlLang]);

  const value = useMemo(
    () => ({
      locale,
      localeMeta,
      supportedLocales: SUPPORTED_LOCALES,
      localizePath: (path) => buildLocalizedPath(path, locale),
      t: (key) => getMessage(MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE], key),
      switchLocale: (nextLocale) => {
        const normalizedNextLocale = normalizeLocale(nextLocale);
        const pathnameWithoutLocale = stripLocaleFromPathname(location.pathname);
        const nextPath = buildLocalizedPath(`${pathnameWithoutLocale}${location.search}${location.hash}`, normalizedNextLocale);
        window.location.assign(nextPath);
      }
    }),
    [locale, localeMeta, location.hash, location.pathname, location.search]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useLocalizedPath(path) {
  const { localizePath } = useLocale();
  return localizePath(path);
}
