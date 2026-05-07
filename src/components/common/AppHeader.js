import { useLocation } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import { accessibilityMapMockData } from '../../config/accessibilityMapMockData';

const BRIDGEWORK_HOME_URL = 'https://www.bridgework.cloud/';

export function AppHeader() {
  const { pathname } = useLocation();
  const showMapSearch = pathname === '/accessibility-map';

  return (
    <header className="app-header">
      <a className="app-header__brand" href={BRIDGEWORK_HOME_URL} aria-label="Bridgework 홈페이지로 이동">
        <img className="app-header__logo" src={logo} alt="" aria-hidden="true" />
        <img className="app-header__logo-text" src={logoText} alt="Bridgework" />
      </a>

      {showMapSearch ? (
        <form className="app-header__map-search" role="search" aria-label="접근성 지도 출발지 검색">
          <span className="app-header__map-search-label" aria-hidden="true">
            출발지
          </span>
          <label className="sr-only" htmlFor="app-header-map-search">
            접근성 지도 출발지 입력
          </label>
          <input
            id="app-header-map-search"
            type="search"
            placeholder={accessibilityMapMockData.searchPlaceholder}
          />
        </form>
      ) : null}
    </header>
  );
}
