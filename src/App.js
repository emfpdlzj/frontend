import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { applyAccessibilityPreferences, readAccessibilityPreferences } from './config/accessibilityPreferences';
import { ROUTE_PATHS } from './config/routes';

function App() {
  const location = useLocation();
  const isMapPage = location.pathname === ROUTE_PATHS.accessibilityMap;
  const isJobsPage = location.pathname === ROUTE_PATHS.jobs;
  const isWorkspacePage = isMapPage || isJobsPage;

  useEffect(() => {
    applyAccessibilityPreferences(readAccessibilityPreferences());
  }, []);

  return (
    <div className="app-frame">
      <AppHeader showMapSearch={isMapPage} />
      <div className="app-frame__body">
        <AppTabNavigation />
        <div className="app-frame__content">
          <div className="app-frame__main">
            <AppRouter />
          </div>
          {isWorkspacePage ? null : <AppFooter />}
        </div>
      </div>
    </div>
  );
}

export default App;
