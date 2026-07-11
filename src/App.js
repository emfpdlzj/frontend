import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapSearchProvider } from './accessibility/MapSearchContext';
import { AccessibilityPreferencesProvider, useAccessibilityPreferences } from './accessibility/AccessibilityPreferencesContext';
import { AppRouter } from './app/AppRouter';
import { useAuth } from './auth/AuthContext';
import { WithdrawalRestoredModal } from './components/auth/WithdrawalRestoredModal';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { SkipNavigation } from './components/common/SkipNavigation';
import { StatusMessage } from './components/common/StatusMessage';
import { AUTH_PROVIDER_ROUTES, ROUTE_PATHS } from './config/routes';
import { usePageMetadata } from './hooks/usePageMetadata';
import { LocaleProvider } from './i18n/LocaleContext';
import { UiTextTranslator } from './i18n/UiTextTranslator';
import { getLocaleFromPathname, stripLocaleFromPathname } from './i18n/locales';
import { createLogger } from './utils/logger';
import { oauthUtils } from './utils/oauth';

const logger = createLogger('app');

function focusPageContent() {
  const mainRegion = document.getElementById('page-main-region');
  const heading = mainRegion?.querySelector('main h1, [data-page-heading]');
  const fallbackTarget = mainRegion?.querySelector('main') || mainRegion;
  const focusTarget = heading || fallbackTarget;

  if (!focusTarget) {
    return '';
  }

  if (!focusTarget.hasAttribute('tabindex')) {
    focusTarget.setAttribute('tabindex', '-1');
  }

  focusTarget.focus({ preventScroll: true });
  return heading?.textContent?.trim() || document.title || '';
}

function AppLayoutFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = getLocaleFromPathname(location.pathname);
  const currentPathname = stripLocaleFromPathname(location.pathname);
  const isMapPage = currentPathname === ROUTE_PATHS.accessibilityMap;
  const isProfilePdfExportPage = currentPathname.startsWith('/profile/export/');
  const isOAuthCallbackPage = Object.values(AUTH_PROVIDER_ROUTES).some(
    (route) => route.callbackPath === currentPathname
  );
  const [isWithdrawalRestoredOpen, setIsWithdrawalRestoredOpen] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const { authNotice, dismissAuthNotice } = useAuth();
  const { preferences } = useAccessibilityPreferences();

  usePageMetadata();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

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

  useEffect(() => {
    if (isOAuthCallbackPage) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const focusedLabel = focusPageContent();

      if (focusedLabel) {
        setLiveAnnouncement(`${focusedLabel} 화면으로 이동했습니다.`);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOAuthCallbackPage, location.pathname]);

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
    <MapSearchProvider>
      <UiTextTranslator locale={locale} />
      <SkipNavigation />
      {preferences.screenReaderMode ? (
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </p>
      ) : null}
      <div
        className={`app-frame${isProfilePdfExportPage ? ' app-frame--document' : ''}${isMapPage ? ' app-frame--map' : ''}`}
      >
        {!isProfilePdfExportPage ? <AppHeader showMapSearch={isMapPage} /> : null}
        {authNotice && !isProfilePdfExportPage ? (
          <div className="app-frame__notice" role="status" aria-live="polite">
            <StatusMessage kind="error">{authNotice}</StatusMessage>
            <button type="button" onClick={dismissAuthNotice} aria-label="인증 안내 닫기">
              닫기
            </button>
          </div>
        ) : null}
        <div className="app-frame__body">
          {!isProfilePdfExportPage ? <AppTabNavigation /> : null}
          <div className="app-frame__content">
            <div
              id="page-main-region"
              className={`app-frame__main${isMapPage ? ' app-frame__main--map' : ''}`}
              tabIndex={-1}
            >
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
            {isMapPage || isProfilePdfExportPage ? null : <AppFooter />}
          </div>
        </div>
        {isWithdrawalRestoredOpen ? <WithdrawalRestoredModal onClose={closeWithdrawalRestoredModal} /> : null}
      </div>
    </MapSearchProvider>
  );
}

function AppLayout() {
  return (
    <AccessibilityPreferencesProvider>
      <AppLayoutFrame />
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
