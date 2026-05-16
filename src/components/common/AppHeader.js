import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import searchIcon from '../../assets/header/search.png';
import { useMapSearch } from '../../accessibility/MapSearchContext';
import { ROUTE_PATHS } from '../../config/routes';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLocale } from '../../i18n/LocaleContext';
import { stripLocaleFromPathname } from '../../i18n/locales';

const LOCALE_PATCH_IN_PROGRESS_MESSAGE = '현재 다국어 패치 진행중입니다.';

export function AppHeader({ showMapSearch = false }) {
  const location = useLocation();
  const { locale, supportedLocales, switchLocale, localizePath, t } = useLocale();
  const { searchEnabled, submittedQuery, submitQuery } = useMapSearch();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchInput = useDebouncedValue(searchInput, 300);
  const isHomePage = stripLocaleFromPathname(location.pathname) === '/';

  useEffect(() => {
    setSearchInput(submittedQuery);
  }, [submittedQuery]);

  useEffect(() => {
    if (!searchEnabled || debouncedSearchInput === submittedQuery) {
      return;
    }

    submitQuery(debouncedSearchInput);
  }, [debouncedSearchInput, searchEnabled, submitQuery, submittedQuery]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (!searchEnabled) {
      return;
    }
    submitQuery(searchInput);
  };

  const blockLocaleSelectIfHome = (event) => {
    if (!isHomePage) {
      return false;
    }
    event.preventDefault();
    window.alert(LOCALE_PATCH_IN_PROGRESS_MESSAGE);
    return true;
  };

  const handleLocaleSelectChange = (event) => {
    if (blockLocaleSelectIfHome(event)) {
      return;
    }
    switchLocale(event.target.value);
  };

  const handleLocaleSelectMouseDown = (event) => {
    blockLocaleSelectIfHome(event);
  };

  const handleLocaleSelectKeyDown = (event) => {
    if (!isHomePage) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      blockLocaleSelectIfHome(event);
    }
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

      <div className="app-header__actions" aria-label={t('common.languageSelect')}>
        <label className="sr-only" htmlFor="app-header-locale">
          {t('common.languageSelect')}
        </label>
        <select
          id="app-header-locale"
          className="app-header__locale-select"
          value={locale}
          aria-label={t('common.languageSelect')}
          onMouseDown={handleLocaleSelectMouseDown}
          onKeyDown={handleLocaleSelectKeyDown}
          onChange={handleLocaleSelectChange}
        >
          {supportedLocales.map((item) => (
            <option key={item.code} value={item.code}>
              {item.shortLabel}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
