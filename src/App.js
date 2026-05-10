import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { WithdrawalRestoredModal } from './components/auth/WithdrawalRestoredModal';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { AccessibilityPreferencesProvider } from './accessibility/AccessibilityPreferencesContext';
import { ROUTE_PATHS } from './config/routes';
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

  useEffect(() => {
    if (location.state?.withdrawalRestored) {
      setIsWithdrawalRestoredOpen(true);
    }
  }, [location.state]);

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
