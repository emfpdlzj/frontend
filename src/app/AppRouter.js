import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';
import { SignupPage } from '../pages/SignupPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AccessibilityMapPage } from '../pages/AccessibilityMapPage';
import { NaverMapSmokeTestPage } from '../pages/NaverMapSmokeTestPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accessibility-map" element={<AccessibilityMapPage />} />
      <Route path="/naver-map-test" element={<NaverMapSmokeTestPage />} />
      <Route path="/auth/:provider/callback" element={<OAuthCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
