import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAuth } from '../auth/AuthContext';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function LoginPage() {
  const { currentUser, isAuthenticated, isInitializing } = useAuth();
  const { localizePath } = useLocale();
  const [error, setError] = useState('');

  if (!isInitializing && isAuthenticated) {
    return (
      <Navigate
        to={localizePath(currentUser?.signupCompleted === false ? ROUTE_PATHS.signup : ROUTE_PATHS.accessibilityMap)}
        replace
      />
    );
  }

  return (
    <PageShell
      title="BridgeWork 로그인"
      description="카카오 또는 네이버 계정으로 로그인 후 온보딩을 진행하세요."
    >
      <SocialLoginButtons onError={setError} />
      <StatusMessage kind="error">{error}</StatusMessage>
      <StatusMessage>
        OAuth 클라이언트 정보는 `.env.local`의 `REACT_APP_KAKAO_CLIENT_ID`, `REACT_APP_NAVER_CLIENT_ID`로 설정합니다.
      </StatusMessage>
    </PageShell>
  );
}
