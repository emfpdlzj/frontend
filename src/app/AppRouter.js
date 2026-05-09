import { Navigate, Route, Routes } from 'react-router-dom';
import { MainPage } from '../pages/MainPage';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';
import { SignupPage } from '../pages/SignupPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AccessibilityMapPage } from '../pages/AccessibilityMapPage';
import { JobsPage } from '../pages/JobsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { TermsPage } from '../pages/TermsPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { SettingsPage } from '../pages/SettingsPage';
import { PolicyDetailPage } from '../pages/PolicyDetailPage';
import { useAuth } from '../auth/AuthContext';
import { AUTH_PROVIDER_ROUTES, LEGACY_ROUTE_PATHS, ROUTE_PATHS } from '../config/routes';

function AuthRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.root} replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.root} element={<MainPage />} />
      <Route path={ROUTE_PATHS.login} element={<Navigate to={ROUTE_PATHS.root} replace />} />
      <Route path={ROUTE_PATHS.accessibilityMap} element={<AuthRoute><AccessibilityMapPage /></AuthRoute>} />
      <Route path={ROUTE_PATHS.jobs} element={<AuthRoute><JobsPage /></AuthRoute>} />
      <Route
        path={AUTH_PROVIDER_ROUTES.KAKAO.callbackPath}
        element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.KAKAO.provider} />}
      />
      <Route
        path={AUTH_PROVIDER_ROUTES.NAVER.callbackPath}
        element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.NAVER.provider} />}
      />
      <Route path={ROUTE_PATHS.signup} element={<SignupPage />} />
      <Route path={ROUTE_PATHS.profile} element={<AuthRoute><ProfilePage /></AuthRoute>} />
      <Route path={ROUTE_PATHS.myProfile} element={<AuthRoute><ProfilePage /></AuthRoute>} />
      <Route path={LEGACY_ROUTE_PATHS.home} element={<Navigate to={ROUTE_PATHS.root} replace />} />
      <Route path={LEGACY_ROUTE_PATHS.meProfile} element={<Navigate to={ROUTE_PATHS.root} replace />} />
      <Route path={ROUTE_PATHS.terms} element={<AuthRoute><TermsPage /></AuthRoute>} />
      <Route path={ROUTE_PATHS.privacy} element={<AuthRoute><PrivacyPage /></AuthRoute>} />
      <Route path={ROUTE_PATHS.settings} element={<AuthRoute><SettingsPage /></AuthRoute>} />
      <Route path={ROUTE_PATHS.policyDetail} element={<AuthRoute><PolicyDetailPage /></AuthRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
