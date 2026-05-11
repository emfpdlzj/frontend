import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasRequiredRole } from '../auth/authorization';
import { LoadingView } from '../components/common/LoadingView';
import { PageShell } from '../components/common/PageShell';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function ProtectedRoute({ requiredRole }) {
  const { currentUser, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const { localizePath } = useLocale();

  if (isInitializing) {
    return (
      <PageShell title="세션 확인" description="로그인 상태를 확인하고 있습니다.">
        <LoadingView label="세션 검증 중..." />
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={localizePath(ROUTE_PATHS.login)} replace state={{ from: location }} />;
  }

  if (!hasRequiredRole(currentUser, requiredRole)) {
    return <Navigate to={localizePath(ROUTE_PATHS.root)} replace />;
  }

  return <Outlet />;
}
