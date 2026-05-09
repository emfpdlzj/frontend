import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingView } from '../components/common/LoadingView';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAuth } from '../auth/AuthContext';
import { oauthUtils } from '../utils/oauth';
import { ROUTE_PATHS } from '../config/routes';

export function OAuthCallbackPage({ provider }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, loginWithSocialCode } = useAuth();
  const [status, setStatus] = useState('소셜 로그인 검증 중...');
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error') || searchParams.get('error_description');

    if (!provider) {
      setError('지원하지 않는 소셜 로그인 경로입니다.');
      return;
    }

    if (oauthError) {
      setError(`소셜 인증에 실패했습니다: ${oauthError}`);
      return;
    }

    if (!code) {
      setError('인가 코드가 누락되었습니다.');
      return;
    }

    if (provider === 'NAVER' && !oauthUtils.verifyNaverState(state)) {
      setError('네이버 state 검증에 실패했습니다. 다시 로그인해 주세요.');
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        setStatus('서버 로그인 처리 중...');
        const result = await loginWithSocialCode(
          {
            provider,
            code,
            redirectUri: oauthUtils.getRedirectUri(provider),
            state
          },
          controller.signal
        );

        if (result.signupRequired) {
          navigate(ROUTE_PATHS.signup, { replace: true });
          return;
        }

        navigate(ROUTE_PATHS.accessibilityMap, { replace: true });
      } catch (authError) {
        setError(authError.message || '소셜 로그인 처리에 실패했습니다.');
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [loginWithSocialCode, navigate, provider, searchParams]);

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={ROUTE_PATHS.accessibilityMap} replace />;
  }

  return (
    <PageShell title="소셜 로그인 처리" description="인가 코드를 검증하고 있습니다.">
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : <LoadingView label={status} />}
    </PageShell>
  );
}
