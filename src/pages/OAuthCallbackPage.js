import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingView } from '../components/common/LoadingView';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAuth } from '../auth/AuthContext';
import { oauthUtils } from '../utils/oauth';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';
import { buildLocalizedPath, getLocaleFromPathname } from '../i18n/locales';

export function getCallbackLocale(pathname, returnTo, fallbackLocale) {
  const returnToLocale = getLocaleFromPathname(returnTo);
  if (returnToLocale && returnToLocale !== 'ko') {
    return returnToLocale;
  }

  return getLocaleFromPathname(pathname) || fallbackLocale;
}

export function getPostLoginPath({ pathname, returnTo, fallbackLocale, signupRequired }) {
  const targetLocale = getCallbackLocale(pathname, returnTo, fallbackLocale);
  const targetPath = signupRequired ? ROUTE_PATHS.signup : returnTo;
  return buildLocalizedPath(targetPath, targetLocale);
}

export function OAuthCallbackPage({ provider }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { isAuthenticated, isInitializing, loginWithSocialCode } = useAuth();
  const hasCallbackResult =
    searchParams.has('code') || searchParams.has('error') || searchParams.has('error_description');
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
      oauthUtils.clearTransientAuthState();
      setError(`소셜 인증에 실패했습니다: ${oauthError}`);
      return;
    }

    if (!code) {
      oauthUtils.clearTransientAuthState();
      setError('인가 코드가 누락되었습니다.');
      return;
    }

    if (!oauthUtils.verifyState(provider, state)) {
      oauthUtils.clearTransientAuthState();
      setError('소셜 로그인 state 검증에 실패했습니다. 다시 로그인해 주세요.');
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

        const returnTo = oauthUtils.consumeReturnTo();

        navigate(getPostLoginPath({
          pathname: location.pathname,
          returnTo,
          fallbackLocale: locale,
          signupRequired: result.signupRequired
        }), {
          replace: true,
          state: result.withdrawalCanceled ? { withdrawalRestored: true } : null
        });
      } catch (authError) {
        setError(authError.message || '소셜 로그인 처리에 실패했습니다.');
      }
    };

    run();

    return () => {
      controller.abort();
    };
  }, [locale, location.pathname, loginWithSocialCode, navigate, provider, searchParams]);

  if (!isInitializing && isAuthenticated && !hasCallbackResult) {
    const returnTo = oauthUtils.consumeReturnTo();
    return (
      <Navigate
        to={getPostLoginPath({
          pathname: location.pathname,
          returnTo,
          fallbackLocale: locale,
          signupRequired: false
        })}
        replace
      />
    );
  }

  return (
    <PageShell title="소셜 로그인 처리" description="인가 코드를 검증하고 있습니다.">
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : <LoadingView label={status} />}
    </PageShell>
  );
}
