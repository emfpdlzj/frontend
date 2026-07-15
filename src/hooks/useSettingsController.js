import { useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { useAccessibilityPreferences } from '../accessibility/AccessibilityPreferencesContext';
import { useAuth } from '../auth/AuthContext';
import { authStorage } from '../auth/authStorage';
import kakaoLogo from '../assets/settings/kakao-logo.png';
import naverLogo from '../assets/settings/naver-logo.png';
import { basePrivacyItems } from '../constants/settingsPage';
import { useProfiles } from './useProfiles';
import { useLocale } from '../i18n/LocaleContext';
import {
  decodeJwtPayload,
  findProviderInObject,
  findProviderInText,
  getProfileId,
  getTextField,
  getUserField,
  normalizeProvider
} from '../utils/settingsAccount';

export function useSettingsController() {

  const { callWithAuth, clearSession, currentUser, isAuthenticated, tokens } = useAuth();
  const { localizePath } = useLocale();
  const {
    preferences,
    updatePreference
  } = useAccessibilityPreferences();
  const {
    status: profileStatus,
    detailStatus: profileDetailStatus,
    error: profileError,
    detailError: profileDetailError,
    profiles,
    selectedProfile,
    reload: reloadProfiles
  } = useProfiles();
  const defaultProfileSummary = useMemo(
    () => profiles.find((profile) => profile?.isDefault) || null,
    [profiles]
  );
  const defaultProfile = useMemo(() => {
    if (!defaultProfileSummary) {
      return null;
    }

    if (getProfileId(selectedProfile) === getProfileId(defaultProfileSummary)) {
      return {
        ...defaultProfileSummary,
        ...selectedProfile
      };
    }

    return defaultProfileSummary;
  }, [defaultProfileSummary, selectedProfile]);
  const privacyItems = useMemo(() => {
    const consentedCount = profiles.filter((profile) => profile?.sensitiveInfoConsentYn === true).length;
    const sensitiveStatus = consentedCount === 0
      ? ['미동의', 'neutral']
      : consentedCount === profiles.length
        ? ['동의 완료', 'success']
        : ['일부 프로필 동의', 'warning'];

    return [
      basePrivacyItems[0],
      ['민감정보 수집·이용 동의', sensitiveStatus[0], sensitiveStatus[1], '프로필별 실제 동의 상태이며 설정에서 언제든 철회할 수 있습니다.', 'sensitive-consent'],
      ...basePrivacyItems.slice(1)
    ];
  }, [profiles]);
  const isProfileLoading = isAuthenticated && ['idle', 'loading'].includes(profileStatus);
  const isProfileDetailLoading =
    isAuthenticated &&
    Boolean(defaultProfileSummary) &&
    ['idle', 'loading'].includes(profileDetailStatus) &&
    getProfileId(selectedProfile) !== getProfileId(defaultProfileSummary);
  const hasProfileLoadError = isAuthenticated && (profileStatus === 'error' || profileDetailStatus === 'error');
  const hasNoProfile = isAuthenticated && profileStatus === 'empty';
  const account = useMemo(
    () => ({
      name:
        getTextField(defaultProfile?.fullName) ||
        getUserField(currentUser, ['name', 'nickname', 'username'], isAuthenticated ? '이름 확인 필요' : '로그인 필요'),
      email:
        getTextField(defaultProfile?.contactEmail) ||
        getUserField(currentUser, ['email'], isAuthenticated ? '이메일 확인 필요' : '로그인 필요'),
      phone:
        getTextField(defaultProfile?.contactPhone) ||
        getUserField(currentUser, ['phone', 'phoneNumber', 'mobile'], isAuthenticated ? '연락처 확인 필요' : '로그인 필요'),
      provider:
        findProviderInObject(currentUser) ||
        normalizeProvider(authStorage.readAuthProvider()) ||
        findProviderInObject(decodeJwtPayload(tokens?.accessToken)) ||
        findProviderInText(tokens?.accessToken)
    }),
    [currentUser, defaultProfile, isAuthenticated, tokens]
  );
  const accountProvider = account.provider || '확인 필요';
  const accountProviderLabel = account.provider === 'KAKAO'
    ? 'Kakao'
    : account.provider === 'NAVER'
      ? 'Naver'
      : '확인 필요';
  const accountProviderLogo = account.provider === 'KAKAO' ? kakaoLogo : account.provider === 'NAVER' ? naverLogo : null;
  const accountProviderLogoClass = account.provider === 'KAKAO'
    ? 'is-kakao'
    : account.provider === 'NAVER'
      ? 'is-naver'
      : '';
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isWithdrawalConfirmed, setIsWithdrawalConfirmed] = useState(false);
  const [preferenceAnnouncement, setPreferenceAnnouncement] = useState('');
  const [withdrawalState, setWithdrawalState] = useState({
    status: 'idle',
    message: ''
  });
  const withdrawalInFlightRef = useRef(false);

  const getPreferenceAnnouncement = (key, value) => {
    if (key === 'fontSize') {
      const nextLabel = value === 'large' ? '크게' : value === 'xlarge' ? '아주 크게' : '기본';
      return `글자 크기를 ${nextLabel}로 변경했습니다.`;
    }

    const status = value ? '켰습니다.' : '껐습니다.';
    const labels = {
      contrast: '고대비 모드를',
      reduceMotion: '애니메이션 끄기를',
      screenReaderMode: '스크린리더 최적화를',
      colorBlindMode: '색약 모드를'
    };

    return `${labels[key] || '설정을'} ${status}`;
  };

  const handlePreferenceChange = (key, value) => {
    updatePreference(key, value);
    setPreferenceAnnouncement(getPreferenceAnnouncement(key, value));
  };

  const resetWithdrawalDialog = () => {
    setIsWithdrawalOpen(false);
    setIsWithdrawalConfirmed(false);
  };

  const handleWithdrawalSubmit = async () => {
    if (withdrawalInFlightRef.current) {
      return;
    }

    if (!isAuthenticated) {
      setWithdrawalState({
        status: 'error',
        message: '회원탈퇴 신청은 로그인 후 진행할 수 있습니다.'
      });
      return;
    }

    withdrawalInFlightRef.current = true;
    setWithdrawalState({
      status: 'loading',
      message: '회원탈퇴 신청을 처리하는 중입니다.'
    });

    try {
      await callWithAuth((accessToken, signal) => authApi.withdraw(accessToken, signal));
      resetWithdrawalDialog();
      clearSession();
      setWithdrawalState({
        status: 'success',
        message: '회원탈퇴 신청이 접수되었습니다. 30일 내 다시 로그인하면 탈퇴 신청이 취소됩니다.'
      });
    } catch (error) {
      setWithdrawalState({
        status: 'error',
        message: error?.message || '회원탈퇴 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      });
    } finally {
      withdrawalInFlightRef.current = false;
    }
  };

  const handleMenuClick = (event, targetId) => {
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();
    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start'
    });
    window.requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
    });
    window.history.replaceState(null, '', `#${targetId}`);
  };

  return {
    account,
    accountProviderLabel,
    accountProviderLogo,
    accountProviderLogoClass,
    handleMenuClick,
    handlePreferenceChange,
    handleWithdrawalSubmit,
    hasNoProfile,
    hasProfileLoadError,
    isAuthenticated,
    isProfileDetailLoading,
    isProfileLoading,
    isWithdrawalConfirmed,
    isWithdrawalOpen,
    localizePath,
    preferenceAnnouncement,
    preferences,
    privacyItems,
    profileDetailError,
    profileError,
    reloadProfiles,
    resetWithdrawalDialog,
    setIsWithdrawalConfirmed,
    setIsWithdrawalOpen,
    setWithdrawalState,
    withdrawalState
  };
}
