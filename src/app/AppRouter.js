import { Navigate, Route, Routes } from 'react-router-dom';
import { MainPage } from '../pages/MainPage';
import { LoginPage } from '../pages/LoginPage';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';
import { SignupPage } from '../pages/SignupPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AccessibilityMapPage } from '../pages/AccessibilityMapPage';
import { ProfilePage } from '../pages/ProfilePage';
import { TermsPage } from '../pages/TermsPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { AUTH_PROVIDER_ROUTES, LEGACY_ROUTE_PATHS, ROUTE_PATHS } from '../config/routes';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.root} element={<MainPage />} />
      <Route path={ROUTE_PATHS.login} element={<LoginPage />} />
      <Route path={ROUTE_PATHS.accessibilityMap} element={<AccessibilityMapPage />} />
      <Route
        path={AUTH_PROVIDER_ROUTES.KAKAO.callbackPath}
        element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.KAKAO.provider} />}
      />
      <Route
        path={AUTH_PROVIDER_ROUTES.NAVER.callbackPath}
        element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.NAVER.provider} />}
      />
      <Route path={ROUTE_PATHS.signup} element={<SignupPage />} />
      <Route path={ROUTE_PATHS.myProfile} element={<ProfilePage />} />
      <Route path={LEGACY_ROUTE_PATHS.home} element={<Navigate to={ROUTE_PATHS.accessibilityMap} replace />} />
      <Route path={LEGACY_ROUTE_PATHS.profile} element={<Navigate to={ROUTE_PATHS.myProfile} replace />} />
      <Route path={LEGACY_ROUTE_PATHS.meProfile} element={<Navigate to={ROUTE_PATHS.myProfile} replace />} />
      <Route path={ROUTE_PATHS.terms} element={<TermsPage />} />
      <Route path={ROUTE_PATHS.privacy} element={<PrivacyPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
