import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapSearchProvider } from './accessibility/MapSearchContext';
import { AppRouter } from './app/AppRouter';
import { WithdrawalRestoredModal } from './components/auth/WithdrawalRestoredModal';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { AccessibilityPreferencesProvider } from './accessibility/AccessibilityPreferencesContext';
import { ROUTE_PATHS } from './config/routes';
import { usePageMetadata } from './hooks/usePageMetadata';
import { LocaleProvider } from './i18n/LocaleContext';
import { UiTextTranslator } from './i18n/UiTextTranslator';
import { getLocaleFromPathname, stripLocaleFromPathname } from './i18n/locales';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = getLocaleFromPathname(location.pathname);
  const currentPathname = stripLocaleFromPathname(location.pathname);
  const isMapPage = currentPathname === ROUTE_PATHS.accessibilityMap;
  const [isWithdrawalRestoredOpen, setIsWithdrawalRestoredOpen] = useState(false);

  usePageMetadata();

  useEffect(() => {
    if (location.state?.withdrawalRestored) {
      setIsWithdrawalRestoredOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    // 라우트 전환 시 이전 화면 스크롤 위치가 남지 않도록 주요 스크롤 컨테이너를 초기화한다.
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const selectors = [
      '.app-frame__main',
      '.accessibility-map__results-body',
      '.accessibility-map__detail-content',
      '.jobs-list-panel__list'
    ];

    selectors.forEach((selector) => {
      const node = document.querySelector(selector);
      if (node) {
        node.scrollTop = 0;
      }
    });
  }, [location.pathname, location.search, location.hash]);

  const closeWithdrawalRestoredModal = () => {
    setIsWithdrawalRestoredOpen(false);
    if (location.state?.withdrawalRestored) {
      navigate(`${location.pathname}${location.search}${location.hash}`, {
        replace: true,
        state: null
      });
    }
  };

  return (
    <AccessibilityPreferencesProvider>
      <MapSearchProvider>
        <UiTextTranslator locale={locale} />
        <div className="app-frame">
          <AppHeader showMapSearch={isMapPage} />
          <div className="app-frame__body">
            <AppTabNavigation />
            <div className="app-frame__content">
              <div className="app-frame__main">
                <AppRouter />
              </div>
              {isMapPage ? null : <AppFooter />}
            </div>
          </div>
          {isWithdrawalRestoredOpen ? <WithdrawalRestoredModal onClose={closeWithdrawalRestoredModal} /> : null}
        </div>
      </MapSearchProvider>
    </AccessibilityPreferencesProvider>
  );
}

function App() {
  return (
    <LocaleProvider>
      <AppLayout />
    </LocaleProvider>
  );
}

export default App;
