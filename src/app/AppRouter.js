import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasRequiredRole } from '../auth/authorization';
import { LoadingView } from '../components/common/LoadingView';
import { PageShell } from '../components/common/PageShell';
import { AUTH_PROVIDER_ROUTES, LEGACY_ROUTE_PATHS, LOCALIZED_ROUTE_PATHS, ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';
import { buildLocalizedPath, DEFAULT_LOCALE, isSupportedLocale } from '../i18n/locales';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';

const MainPage = lazy(() => import('../pages/MainPage').then((module) => ({ default: module.MainPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then((module) => ({ default: module.AboutPage })));
const FaqPage = lazy(() => import('../pages/FaqPage').then((module) => ({ default: module.FaqPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then((module) => ({ default: module.SignupPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const AccessibilityMapPage = lazy(() => import('../pages/AccessibilityMapPage').then((module) => ({ default: module.AccessibilityMapPage })));
const JobsPage = lazy(() => import('../pages/JobsPage').then((module) => ({ default: module.JobsPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const TermsPage = lazy(() => import('../pages/TermsPage').then((module) => ({ default: module.TermsPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const PolicyDetailPage = lazy(() => import('../pages/PolicyDetailPage').then((module) => ({ default: module.PolicyDetailPage })));

function RouteFallback() {
  const { t } = useLocale();

  return (
    <PageShell title={t('common.loadingTitle')} description={t('common.loadingDescription')}>
      <LoadingView label={t('common.loadingLabel')} />
    </PageShell>
  );
}

function AuthRoute({ children, requiredRole }) {
  const { currentUser, isAuthenticated, isInitializing } = useAuth();
  const { localizePath } = useLocale();

  if (isInitializing) {
    return (
      <PageShell title="세션 확인" description="로그인 상태를 확인하고 있습니다.">
        <LoadingView label="세션 검증 중..." />
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={localizePath(ROUTE_PATHS.root)} replace />;
  }

  if (!hasRequiredRole(currentUser, requiredRole)) {
    return <Navigate to={localizePath(ROUTE_PATHS.root)} replace />;
  }

  return children;
}

function LocaleRoute({ children }) {
  const { locale } = useParams();
  const location = useLocation();

  if (!isSupportedLocale(locale)) {
    return <Navigate to={buildLocalizedPath(`${location.pathname}${location.search}${location.hash}`, DEFAULT_LOCALE)} replace />;
  }

  return children;
}

function LegacyRouteRedirect({ to }) {
  const location = useLocation();
  const params = useParams();
  const targetPath = Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value || ''),
    to
  );

  return <Navigate to={buildLocalizedPath(`${targetPath}${location.search}${location.hash}`, DEFAULT_LOCALE)} replace />;
}

function LocalizedNavigate({ to }) {
  const { localizePath } = useLocale();
  return <Navigate to={localizePath(to)} replace />;
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={ROUTE_PATHS.root} element={<LegacyRouteRedirect to={ROUTE_PATHS.root} />} />
        <Route path={ROUTE_PATHS.about} element={<LegacyRouteRedirect to={ROUTE_PATHS.about} />} />
        <Route path={ROUTE_PATHS.faq} element={<LegacyRouteRedirect to={ROUTE_PATHS.faq} />} />
        <Route path={ROUTE_PATHS.login} element={<LegacyRouteRedirect to={ROUTE_PATHS.root} />} />
        <Route path={ROUTE_PATHS.accessibilityMap} element={<LegacyRouteRedirect to={ROUTE_PATHS.accessibilityMap} />} />
        <Route path={ROUTE_PATHS.jobs} element={<LegacyRouteRedirect to={ROUTE_PATHS.jobs} />} />
        <Route path={ROUTE_PATHS.signup} element={<LegacyRouteRedirect to={ROUTE_PATHS.signup} />} />
        <Route path={ROUTE_PATHS.profile} element={<LegacyRouteRedirect to={ROUTE_PATHS.profile} />} />
        <Route path={ROUTE_PATHS.myProfile} element={<LegacyRouteRedirect to={ROUTE_PATHS.myProfile} />} />
        <Route path={ROUTE_PATHS.terms} element={<LegacyRouteRedirect to={ROUTE_PATHS.terms} />} />
        <Route path={ROUTE_PATHS.privacy} element={<LegacyRouteRedirect to={ROUTE_PATHS.privacy} />} />
        <Route path={ROUTE_PATHS.settings} element={<LegacyRouteRedirect to={ROUTE_PATHS.settings} />} />
        <Route path={ROUTE_PATHS.policyDetail} element={<LegacyRouteRedirect to={ROUTE_PATHS.policyDetail} />} />

        <Route path={LOCALIZED_ROUTE_PATHS.root} element={<LocaleRoute><MainPage /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.about} element={<LocaleRoute><AboutPage /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.faq} element={<LocaleRoute><FaqPage /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.login} element={<LocaleRoute><LocalizedNavigate to={ROUTE_PATHS.root} /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.accessibilityMap} element={<LocaleRoute><AuthRoute><AccessibilityMapPage /></AuthRoute></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.jobs} element={<LocaleRoute><AuthRoute><JobsPage /></AuthRoute></LocaleRoute>} />
        <Route
          path={AUTH_PROVIDER_ROUTES.KAKAO.callbackPath}
          element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.KAKAO.provider} />}
        />
        <Route
          path={AUTH_PROVIDER_ROUTES.NAVER.callbackPath}
          element={<OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.NAVER.provider} />}
        />
        <Route
          path={`/:locale${AUTH_PROVIDER_ROUTES.KAKAO.callbackPath}`}
          element={<LocaleRoute><OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.KAKAO.provider} /></LocaleRoute>}
        />
        <Route
          path={`/:locale${AUTH_PROVIDER_ROUTES.NAVER.callbackPath}`}
          element={<LocaleRoute><OAuthCallbackPage provider={AUTH_PROVIDER_ROUTES.NAVER.provider} /></LocaleRoute>}
        />
        <Route
          path={LOCALIZED_ROUTE_PATHS.signup}
          element={<LocaleRoute><SignupPage /></LocaleRoute>}
        />
        <Route path={LOCALIZED_ROUTE_PATHS.profile} element={<LocaleRoute><AuthRoute><ProfilePage /></AuthRoute></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.myProfile} element={<LocaleRoute><AuthRoute><ProfilePage /></AuthRoute></LocaleRoute>} />
        <Route path={LEGACY_ROUTE_PATHS.home} element={<LegacyRouteRedirect to={ROUTE_PATHS.root} />} />
        <Route path={LEGACY_ROUTE_PATHS.meProfile} element={<LegacyRouteRedirect to={ROUTE_PATHS.root} />} />
        <Route path={LOCALIZED_ROUTE_PATHS.terms} element={<LocaleRoute><TermsPage /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.privacy} element={<LocaleRoute><PrivacyPage /></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.settings} element={<LocaleRoute><AuthRoute><SettingsPage /></AuthRoute></LocaleRoute>} />
        <Route path={LOCALIZED_ROUTE_PATHS.policyDetail} element={<LocaleRoute><PolicyDetailPage /></LocaleRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
