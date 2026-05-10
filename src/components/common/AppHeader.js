import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import searchIcon from '../../assets/header/search.png';
import { accessibilityMapMockData } from '../../config/accessibilityMapMockData';
import { useLocale } from '../../i18n/LocaleContext';

const BRIDGEWORK_HOME_URL = 'https://www.bridgework.cloud/';

export function AppHeader({ showMapSearch = false }) {
  const { locale, supportedLocales, switchLocale, t } = useLocale();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <header className="app-header">
      <a className="app-header__brand" href={BRIDGEWORK_HOME_URL} aria-label={t('header.brandLabel')}>
        <img className="app-header__logo" src={logo} alt="Bridgework 로고 아이콘" />
        <img className="app-header__logo-text" src={logoText} alt="Bridgework" />
      </a>

      {showMapSearch ? (
        <form
          className="app-header__map-search"
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
            placeholder={accessibilityMapMockData.searchPlaceholder}
          />
          <button className="app-header__search-button" type="submit" aria-label={t('header.searchButtonLabel')}>
            <img src={searchIcon} alt="검색 아이콘" />
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
          onChange={(event) => switchLocale(event.target.value)}
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
