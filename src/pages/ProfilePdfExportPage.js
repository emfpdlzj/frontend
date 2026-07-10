import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { useAuth } from '../auth/AuthContext';
import { LoadingView } from '../components/common/LoadingView';
import { StatusMessage } from '../components/common/StatusMessage';
import { ProfilePdfDocument } from '../components/profile/ProfilePdfDocument';
import {
  normalizeProfileDocumentData,
  PROFILE_PDF_EXPORT_DATA_EVENT,
  PROFILE_PDF_EXPORT_READY_EVENT
} from '../components/profile/profileDocumentUtils';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';

export function ProfilePdfExportPage() {
  const { profileId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { callWithAuth } = useAuth();
  const { localizePath } = useLocale();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const hasPrintedRef = useRef(false);
  const channelId = searchParams.get('channel') || '';

  const fetchSavedProfile = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const result = await callWithAuth((accessToken) => profileApi.getProfile(accessToken, profileId));
      setProfile(normalizeProfileDocumentData(result));
      setStatus('success');
    } catch (fetchError) {
      setError(fetchError.message || '프로필 PDF 내보내기 데이터를 불러오지 못했습니다.');
      setStatus('error');
    }
  }, [callWithAuth, profileId]);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer = null;
    const origin = window.location.origin;

    const handleExportData = (event) => {
      if (event.origin !== origin) {
        return;
      }

      const message = event.data;
      if (message?.type !== PROFILE_PDF_EXPORT_DATA_EVENT || message?.channelId !== channelId) {
        return;
      }

      if (cancelled) {
        return;
      }

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }

      setProfile(normalizeProfileDocumentData(message.profile));
      setStatus('success');
      setError('');
    };

    if (channelId && window.opener && !window.opener.closed) {
      setStatus('loading');
      window.addEventListener('message', handleExportData);

      try {
        window.opener.postMessage({ type: PROFILE_PDF_EXPORT_READY_EVENT, channelId }, origin);
      } catch {
        // opener 통신이 실패하면 저장된 프로필 데이터를 다시 조회한다.
      }

      fallbackTimer = window.setTimeout(() => {
        if (!cancelled) {
          fetchSavedProfile();
        }
      }, 1200);
    } else {
      fetchSavedProfile();
    }

    return () => {
      cancelled = true;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
      window.removeEventListener('message', handleExportData);
    };
  }, [channelId, fetchSavedProfile]);

  useEffect(() => {
    if (status !== 'success' || !profile) {
      return;
    }

    document.title = `${profile.profileName || profile.fullName || '브릿지워크 프로필'} PDF`;
  }, [profile, status]);

  useEffect(() => {
    if (status !== 'success' || !profile || hasPrintedRef.current) {
      return;
    }

    hasPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 360);

    return () => {
      window.clearTimeout(timer);
    };
  }, [profile, status]);

  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    window.location.assign(localizePath(ROUTE_PATHS.profile));
  };

  const toolbarTitle = useMemo(
    () => profile?.profileName || profile?.fullName || '브릿지워크 프로필 PDF',
    [profile?.fullName, profile?.profileName]
  );

  return (
    <main className="profile-pdf-page">
      <div className="profile-pdf-toolbar" data-i18n-skip>
        <div className="profile-pdf-toolbar__meta">
          <p>PDF 미리보기</p>
          <strong>{toolbarTitle}</strong>
        </div>
        <div className="profile-pdf-toolbar__actions">
          <button type="button" className="profile-secondary-action" onClick={() => window.print()}>
            인쇄하기
          </button>
          <button type="button" className="profile-primary-action" onClick={handleClose}>
            닫기
          </button>
        </div>
      </div>

      <div className="profile-pdf-page__canvas">
        {status === 'loading' ? (
          <div className="profile-pdf-status">
            <LoadingView label="PDF로 내보낼 프로필 문서를 준비하고 있습니다." />
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="profile-pdf-status">
            <StatusMessage kind="error">{error}</StatusMessage>
            <button type="button" className="profile-inline-action" onClick={fetchSavedProfile}>
              다시 시도
            </button>
          </div>
        ) : null}

        {status === 'success' && profile ? <ProfilePdfDocument profile={profile} /> : null}
      </div>
    </main>
  );
}
