import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapSearchProvider } from './accessibility/MapSearchContext';
import { AppRouter } from './app/AppRouter';
import { useAuth } from './auth/AuthContext';
import { WithdrawalRestoredModal } from './components/auth/WithdrawalRestoredModal';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { StatusMessage } from './components/common/StatusMessage';
import { AccessibilityPreferencesProvider } from './accessibility/AccessibilityPreferencesContext';
import { AUTH_PROVIDER_ROUTES, ROUTE_PATHS } from './config/routes';
import { usePageMetadata } from './hooks/usePageMetadata';
import { LocaleProvider } from './i18n/LocaleContext';
import { UiTextTranslator } from './i18n/UiTextTranslator';
import { getLocaleFromPathname, stripLocaleFromPathname } from './i18n/locales';
import { createLogger } from './utils/logger';
import { oauthUtils } from './utils/oauth';

const logger = createLogger('app');

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = getLocaleFromPathname(location.pathname);
  const currentPathname = stripLocaleFromPathname(location.pathname);
  const isMapPage = currentPathname === ROUTE_PATHS.accessibilityMap;
  const isOAuthCallbackPage = Object.values(AUTH_PROVIDER_ROUTES).some(
    (route) => route.callbackPath === currentPathname
  );
  const [isWithdrawalRestoredOpen, setIsWithdrawalRestoredOpen] = useState(false);
  const { authNotice, dismissAuthNotice } = useAuth();

  usePageMetadata();

  useEffect(() => {
    if (location.state?.withdrawalRestored) {
      setIsWithdrawalRestoredOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (isOAuthCallbackPage) {
      return undefined;
    }

    const clearReturnedOAuthState = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') {
        return;
      }

      if (oauthUtils.hasPendingAuthorization()) {
        oauthUtils.clearTransientAuthState();
      }
    };

    clearReturnedOAuthState();
    window.addEventListener('pageshow', clearReturnedOAuthState);
    window.addEventListener('focus', clearReturnedOAuthState);

    return () => {
      window.removeEventListener('pageshow', clearReturnedOAuthState);
      window.removeEventListener('focus', clearReturnedOAuthState);
    };
  }, [isOAuthCallbackPage]);

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
          {authNotice ? (
            <div className="app-frame__notice">
              <StatusMessage kind="error">{authNotice}</StatusMessage>
              <button type="button" onClick={dismissAuthNotice} aria-label="인증 안내 닫기">
                닫기
              </button>
            </div>
          ) : null}
          <div className="app-frame__body">
            <AppTabNavigation />
            <div className="app-frame__content">
              <div className="app-frame__main">
                <AppErrorBoundary
                  resetKey={`${location.pathname}${location.search}${location.hash}`}
                  onError={(error, info) => {
                    logger.error('Application render failed.', {
                      message: error?.message,
                      componentStack: info?.componentStack
                    });
                  }}
                >
                  <AppRouter />
                </AppErrorBoundary>
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
