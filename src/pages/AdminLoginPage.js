import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasRequiredRole } from '../auth/authorization';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { localizePath } = useLocale();
  const { currentUser, isAuthenticated, isInitializing, loginAsAdmin } = useAuth();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitializing && isAuthenticated && hasRequiredRole(currentUser, 'admin')) {
    return <Navigate to={localizePath(ROUTE_PATHS.adminNotices)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await loginAsAdmin({
        loginId: form.loginId.trim(),
        password: form.password
      });
      navigate(localizePath(ROUTE_PATHS.adminNotices), { replace: true });
    } catch (loginError) {
      setError(loginError.message || '관리자 로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="관리자 로그인" description="공지사항 관리 권한이 있는 계정으로 로그인하세요.">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <label>
          <span>관리자 ID</span>
          <input
            autoComplete="username"
            autoFocus
            value={form.loginId}
            onChange={(event) => setForm((prev) => ({ ...prev, loginId: event.target.value }))}
            required
          />
        </label>
        <label>
          <span>비밀번호</span>
          <input
            autoComplete="current-password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </label>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중' : '로그인'}
        </button>
      </form>
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}
    </PageShell>
  );
}
