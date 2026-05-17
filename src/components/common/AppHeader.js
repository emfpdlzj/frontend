import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import searchIcon from '../../assets/header/search.png';
import { useMapSearch } from '../../accessibility/MapSearchContext';
import { ROUTE_PATHS } from '../../config/routes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLocale } from '../../i18n/LocaleContext';

export function AppHeader({ showMapSearch = false }) {
  const { locale, supportedLocales, switchLocale, localizePath, t } = useLocale();
  const { searchEnabled, submittedQuery, submitQuery } = useMapSearch();
  const [searchInput, setSearchInput] = useState('');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  const debouncedSearchInput = useDebouncedValue(searchInput, 300);
  const currentLocaleIndex = supportedLocales.findIndex((item) => item.code === locale);
  const currentLocale = supportedLocales[currentLocaleIndex] || supportedLocales[0];

  useEffect(() => {
    setSearchInput(submittedQuery);
  }, [submittedQuery]);

  useEffect(() => {
    if (!searchEnabled || debouncedSearchInput === submittedQuery) {
      return;
    }

    submitQuery(debouncedSearchInput);
  }, [debouncedSearchInput, searchEnabled, submitQuery, submittedQuery]);

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLanguageMenuOpen]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchEnabled) {
      return;
    }
    submitQuery(searchInput);
  };

  return (
    <header className="app-header">
      <Link className="app-header__brand" to={localizePath(ROUTE_PATHS.root)} aria-label={t('header.brandLabel')}>
        <img className="app-header__logo" src={logo} alt="Bridgework 로고 아이콘" decoding="async" />
        <img className="app-header__logo-text" src={logoText} alt="Bridgework" decoding="async" />
      </Link>

      {showMapSearch ? (
        <form
          className={`app-header__map-search${searchEnabled ? '' : ' is-disabled'}`}
          role="search"
          aria-label={t('header.searchLabel')}
          onSubmit={handleSearchSubmit}
        >
          <label className="sr-only" htmlFor="app-header-map-search">
            {t('header.searchInputLabel')}
          </label>
          <input
            id="app-header-map-search"
            type="search"
            placeholder={searchEnabled ? '검색 결과 내 주소/회사/직무를 검색하세요.' : '검색을 먼저 해주세요.'}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            disabled={!searchEnabled}
          />
          <button
            className="app-header__search-button"
            type="submit"
            aria-label={t('header.searchButtonLabel')}
            disabled={!searchEnabled}
          >
            <img src={searchIcon} alt="검색 아이콘" loading="lazy" decoding="async" />
          </button>
        </form>
      ) : null}

      <div className="app-header__actions" ref={languageMenuRef}>
        <button
          type="button"
          className="app-header__translate-button"
          aria-haspopup="menu"
          aria-expanded={isLanguageMenuOpen}
          aria-label={`${t('common.languageSelect')}: ${currentLocale.label}`}
          onClick={() => setIsLanguageMenuOpen((current) => !current)}
        >
          <span aria-hidden="true">{t('common.translateButton')}</span>
          <strong>{currentLocale.shortLabel}</strong>
        </button>
        {isLanguageMenuOpen ? (
          <div className="app-header__language-menu" role="menu" aria-label={t('common.languageSelect')}>
            {supportedLocales.map((item) => (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={item.code === locale}
                className={`app-header__language-option${item.code === locale ? ' is-active' : ''}`}
                onClick={() => {
                  setIsLanguageMenuOpen(false);
                  if (item.code !== locale) {
                    switchLocale(item.code);
                  }
                }}
              >
                <span>{item.label}</span>
                <strong>{item.shortLabel}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
