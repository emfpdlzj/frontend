import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/onboardingApi';
import { useAuth } from '../auth/AuthContext';
import { OnboardingProfileForm } from '../components/onboarding/OnboardingProfileForm';
import { LoadingView } from '../components/common/LoadingView';
import { PageShell } from '../components/common/PageShell';
import { StatusMessage } from '../components/common/StatusMessage';
import { ApiError } from '../api/httpClient';

export function OnboardingPage() {
  const { currentUser, callWithAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [initialProfile, setInitialProfile] = useState(null);
  const [aiTags, setAiTags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const profile = await callWithAuth(
          (accessToken, signal) => onboardingApi.getProfile(accessToken, signal),
          controller.signal
        );

        setInitialProfile(profile);
        setAiTags({
          aiJobTags: profile.aiJobTags,
          aiEnvironmentTags: profile.aiEnvironmentTags,
          aiSupportTags: profile.aiSupportTags
        });
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 404) {
          setInitialProfile(null);
          setAiTags(null);
        } else if (!(loadError instanceof DOMException)) {
          setError(loadError.message || '온보딩 정보를 불러오지 못했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, [callWithAuth]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setStatus('');
    setError('');

    try {
      const saved = await callWithAuth((accessToken, signal) => onboardingApi.upsertProfile(accessToken, payload, signal));
      setInitialProfile(saved);
      setAiTags({
        aiJobTags: saved.aiJobTags,
        aiEnvironmentTags: saved.aiEnvironmentTags,
        aiSupportTags: saved.aiSupportTags
      });
      setStatus('온보딩 정보가 저장되었습니다.');
    } catch (submitError) {
      setError(submitError.message || '온보딩 저장 중 오류가 발생했습니다.');
      throw submitError;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="온보딩 프로필"
      description="입력한 정보로 맞춤 공공 일자리 추천 품질을 높입니다."
      actions={
        <button
          type="button"
          className="secondary-button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
        >
          로그아웃
        </button>
      }
    >
      {currentUser ? (
        <StatusMessage>
          {currentUser.name || '사용자'} 님, 필수 항목을 모두 입력하면 프로필을 저장할 수 있습니다.
        </StatusMessage>
      ) : null}

      {status ? <StatusMessage kind="success">{status}</StatusMessage> : null}
      {error ? <StatusMessage kind="error">{error}</StatusMessage> : null}

      {loading ? (
        <LoadingView label="온보딩 정보를 불러오는 중..." />
      ) : (
        <OnboardingProfileForm
          key={initialProfile?.updatedAt || 'empty-profile'}
          initialValue={initialProfile}
          onSubmit={handleSubmit}
          submitting={submitting}
          aiTags={aiTags}
        />
      )}
    </PageShell>
  );
}
