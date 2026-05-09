import { useLocation } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { AppFooter } from './components/common/AppFooter';
import { AppHeader } from './components/common/AppHeader';
import { AppTabNavigation } from './components/common/AppTabNavigation';
import { ROUTE_PATHS } from './config/routes';

function App() {
  const location = useLocation();
  const isMapPage = location.pathname === ROUTE_PATHS.accessibilityMap;
  const isProfilePage = location.pathname === ROUTE_PATHS.profile || location.pathname === ROUTE_PATHS.myProfile;

  return (
    <div className="app-frame">
      <AppHeader hideLoginButton={isProfilePage} showMapSearch={isMapPage} />
      <div className="app-frame__body">
        <AppTabNavigation />
        <div className="app-frame__content">
          <div className="app-frame__main">
            <AppRouter />
          </div>
          {isMapPage ? null : <AppFooter />}
        </div>
      </div>
    </div>
  );
}

export default App;
