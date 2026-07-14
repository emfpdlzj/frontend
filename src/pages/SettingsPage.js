import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAccessibilityPreferences } from '../accessibility/AccessibilityPreferencesContext';
import { useAuth } from '../auth/AuthContext';
import { authStorage } from '../auth/authStorage';
import kakaoLogo from '../assets/settings/kakao-logo.png';
import naverLogo from '../assets/settings/naver-logo.png';
import {
  SettingsRadioGroup,
  SettingsSection,
  SettingsStatusBadge,
  SettingsToggle
} from '../components/settings/SettingsControls';
import { WithdrawalConfirmDialog } from '../components/settings/WithdrawalConfirmDialog';
import { StatusMessage } from '../components/common/StatusMessage';
import { POLICY_DOCUMENTS, getPolicyPath } from '../config/policyDocuments';
import { useProfiles } from '../hooks/useProfiles';
import { useLocale } from '../i18n/LocaleContext';

const settingsMenu = [
  { id: 'account', label: '계정', group: '자주 사용' },
  { id: 'accessibility', label: '접근성', group: '자주 사용' },
  { id: 'privacy', label: '내 데이터', group: '개인정보' },
  { id: 'support', label: '고객센터', group: '도움말' },
  { id: 'policies', label: '약관', group: '정보' },
  { id: 'danger', label: '회원탈퇴', group: '위험' }
];

const basePrivacyItems = [
  ['개인정보 수집·이용 동의', '정책 확인', 'neutral', '계정 생성과 서비스 제공에 필요한 처리 내용을 확인합니다.', 'privacy-consent'],
  ['제3자 제공 동의', '확인 필요', 'warning', '지원 또는 기업 공개 설정 시 제공 범위를 확인합니다.', 'third-party'],
  ['마케팅 정보 수신 동의', '선택 미동의', 'neutral', '선택 동의이며 서비스 이용에 필수는 아닙니다.', 'marketing-consent'],
  ['개인정보 다운로드 요청', '신청 가능', 'neutral', '내 계정 데이터를 파일로 요청할 수 있습니다.'],
  ['열람/수정/삭제 요청', '신청 가능', 'neutral', '개인정보 처리 요청 절차를 확인합니다.'],
  ['탈퇴 후 개인정보 파기/보관 안내', '확인 가능', 'neutral', '탈퇴 유예 기간, 삭제 대상, 분리 보관 대상을 확인합니다.', 'withdrawal-retention']
];

const highlightedPolicyIds = ['privacy-policy', 'privacy-consent', 'withdrawal-retention', 'marketing-consent'];
const highlightedPolicyItems = highlightedPolicyIds
  .map((policyId) => POLICY_DOCUMENTS.find((policy) => policy.id === policyId))
  .filter(Boolean);

const withdrawalRetentionItems = [
  {
    title: '탈퇴 시 삭제되는 정보',
    status: '삭제/비식별',
    description: '탈퇴 확정 후 계정 식별 정보, 프로필, 접근성 설정, 저장 공고, 추천 이력은 삭제 또는 비식별 처리 대상입니다.'
  },
  {
    title: '탈퇴 후 복구 가능 여부',
    status: '30일 내 가능',
    description: '탈퇴 신청 후 30일 안에 다시 로그인하면 계정 복구와 탈퇴 신청 취소를 진행할 수 있습니다.'
  },
  {
    title: '법정 보관 정보',
    status: '분리 보관',
    description: '법령 준수, 분쟁 대응, 보안 목적의 인증 기록, 처리 로그, 문의 이력은 일반 데이터와 분리 보관될 수 있습니다.'
  },
  {
    title: '재가입 제한 여부',
    status: '확인 필요',
    description: '재가입 제한 기간이나 동일 소셜 계정 재가입 조건은 운영 정책 확정 전까지 단정하지 않고 확인 필요로 안내합니다.'
  }
];

const getUserField = (user, keys, fallback = '로그인 후 확인') => {
  for (const key of keys) {
    if (user?.[key]) {
      return user[key];
    }
  }

  return fallback;
};

const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const getTextField = (value) => {
  const text = String(value ?? '').trim();
  return text || '';
};

const normalizeProvider = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).toUpperCase();
  if (normalized.includes('KAKAO')) {
    return 'KAKAO';
  }

  if (normalized.includes('NAVER')) {
    return 'NAVER';
  }

  return null;
};

const findProviderInText = (value) => {
  if (!value) {
    return null;
  }
  const normalized = String(value).toUpperCase();
  if (normalized.includes('KAKAO')) {
    return 'KAKAO';
  }
  if (normalized.includes('NAVER')) {
    return 'NAVER';
  }
  return null;
};

const decodeJwtPayload = (token) => {
  if (!token || !token.includes('.')) {
    return null;
  }

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch (error) {
    return null;
  }
};

const findProviderInObject = (value) => {
  const directProvider = normalizeProvider(value);
  if (directProvider) {
    return directProvider;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const providerKeys = [
    'provider',
    'socialProvider',
    'oauthProvider',
    'authProvider',
    'providerType',
    'socialType',
    'loginProvider',
    'registrationId'
  ];

  for (const key of providerKeys) {
    const provider = normalizeProvider(value[key]);
    if (provider) {
      return provider;
    }
  }

  for (const item of Object.values(value)) {
    const provider = findProviderInObject(item);
    if (provider) {
      return provider;
    }
  }

  try {
    return findProviderInText(JSON.stringify(value));
  } catch (error) {
    return null;
  }
};

function AccountField({ id, label, type, value, readOnly = false }) {
  return (
    <label className="settings-field settings-field--compact" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type={type} value={value ?? ''} readOnly={readOnly} aria-readonly={readOnly} />
    </label>
  );
}

export function SettingsPage() {
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

  return (
    <main className="settings-page settings-page--refined" aria-labelledby="settings-page-title">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {preferenceAnnouncement}
      </p>
      <header className="settings-page__header settings-hero">
        <div>
          <span className="settings-eyebrow">Settings</span>
          <h1 id="settings-page-title">환경설정</h1>
          <p>자주 쓰는 계정, 접근성, 알림 설정을 먼저 관리하고 개인정보와 고객센터 정보를 한곳에서 확인합니다.</p>
        </div>
      </header>

      <div className="settings-page__layout settings-page__layout--refined">
        <aside className="settings-page__menu settings-page__menu--refined" aria-labelledby="settings-menu-title">
          <h2 id="settings-menu-title" className="sr-only">설정 카테고리</h2>
          <nav aria-label="설정 카테고리">
            {settingsMenu.map((item, index) => {
              const shouldShowGroup = index === 0 || settingsMenu[index - 1].group !== item.group;

              return (
                <div key={item.id} className="settings-menu-item">
                  {shouldShowGroup ? <strong>{item.group}</strong> : null}
                  <a
                    href={`#${item.id}`}
                    className="settings-page__menu-link"
                    onClick={(event) => handleMenuClick(event, item.id)}
                  >
                    {item.label}
                  </a>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="settings-page__content settings-page__content--refined">
          <SettingsSection
            id="account"
            title="계정 정보"
            description="로그인, 연락처, 기본 프로필로 이어지는 핵심 계정 정보입니다."
            tone="primary"
          >
            <div className="settings-account-layout">
              <div className="settings-profile-card settings-profile-card--social" aria-label="소셜 로그인 계정">
                <div className="settings-profile-card__copy">
                  <strong>소셜 로그인 계정</strong>
                  <span className="settings-profile-card__provider">
                    {accountProviderLogo ? (
                      <span className={`settings-profile-card__provider-logo ${accountProviderLogoClass}`}>
                        <img src={accountProviderLogo} alt="" aria-hidden="true" />
                      </span>
                    ) : null}
                    {accountProviderLabel}
                  </span>
                </div>
              </div>

              <div className="settings-account-panel">
                {hasProfileLoadError ? (
                  <StatusMessage kind="error">
                    {profileDetailError || profileError || '기본 프로필 정보를 불러오지 못했습니다.'}
                    <button type="button" className="settings-inline-text-button" onClick={reloadProfiles}>
                      다시 시도
                    </button>
                  </StatusMessage>
                ) : null}
                {hasNoProfile ? (
                  <StatusMessage kind="info">등록된 기본 프로필이 없습니다. 내 정보에서 기본 프로필을 먼저 생성해 주세요.</StatusMessage>
                ) : null}
                <div className="settings-grid settings-grid--three">
                  <AccountField
                    id="settings-name"
                    label="이름"
                    type="text"
                    value={isProfileLoading || isProfileDetailLoading ? '기본 프로필 불러오는 중' : account.name}
                    readOnly
                  />
                  <AccountField
                    id="settings-email"
                    label="이메일"
                    type="email"
                    value={isProfileLoading || isProfileDetailLoading ? '기본 프로필 불러오는 중' : account.email}
                    readOnly
                  />
                  <AccountField
                    id="settings-phone"
                    label="연락처"
                    type="tel"
                    value={isProfileLoading || isProfileDetailLoading ? '기본 프로필 불러오는 중' : account.phone}
                    readOnly
                  />
                </div>
              </div>
            </div>

          </SettingsSection>

          <SettingsSection
            id="accessibility"
            title="내 접근성 환경"
            description="Bridgework 추천과 지도 화면을 내가 읽고 판단하기 쉬운 방식으로 조정합니다."
            tone="important"
          >
            <div className="settings-accessibility-layout">
              <div className="settings-accessibility-controls">
                <div className="settings-preference-grid">
                  <SettingsRadioGroup
                    legend="글자 크기"
                    name="font-size"
                    value={preferences.fontSize}
                    onChange={(value) => handlePreferenceChange('fontSize', value)}
                    options={[
                      { value: 'default', label: '기본' },
                      { value: 'large', label: '크게' },
                      { value: 'xlarge', label: '아주 크게' }
                    ]}
                  />
                </div>
                <div className="settings-toggle-list settings-toggle-list--compact">
                  <SettingsToggle
                    id="contrast"
                    label="고대비 모드"
                    description="텍스트와 카드 경계를 더 뚜렷하게 표시"
                    checked={preferences.contrast}
                    onChange={(value) => handlePreferenceChange('contrast', value)}
                  />
                  <SettingsToggle
                    id="reduce-motion"
                    label="애니메이션 끄기"
                    description="전환, 강조 효과, 자동 스크롤 애니메이션을 최소화"
                    checked={preferences.reduceMotion}
                    onChange={(value) => handlePreferenceChange('reduceMotion', value)}
                  />
                  <SettingsToggle
                    id="screen-reader-mode"
                    label="스크린리더 최적화"
                    description="페이지 이동과 주요 상태 변경을 읽기 쉬운 순서로 안내"
                    checked={preferences.screenReaderMode}
                    onChange={(value) => handlePreferenceChange('screenReaderMode', value)}
                  />
                  <SettingsToggle
                    id="color-blind-mode"
                    label="색약 모드"
                    description="상태 배지와 지도 표시를 색상 외 패턴과 윤곽선으로 함께 구분"
                    checked={preferences.colorBlindMode}
                    onChange={(value) => handlePreferenceChange('colorBlindMode', value)}
                  />
                </div>
              </div>
            </div>

          </SettingsSection>

          <SettingsSection id="privacy" title="내 데이터 관리" description="동의 상태와 데이터 요청을 한곳에서 확인합니다.">
            <div className="settings-data-layout">
              <div className="settings-consent-grid">
                {privacyItems.map(([title, status, tone, description, policyId]) => {
                  const cardContent = (
                    <>
                      <div>
                        <strong>{title}</strong>
                        <p>{description}</p>
                      </div>
                      <SettingsStatusBadge tone={tone}>{status}</SettingsStatusBadge>
                    </>
                  );

                  return policyId ? (
                    <Link key={title} to={localizePath(getPolicyPath(policyId))} className="settings-consent-card">
                      {cardContent}
                    </Link>
                  ) : (
                    <button key={title} type="button" className="settings-consent-card">
                      {cardContent}
                    </button>
                  );
                })}
              </div>
            </div>
          </SettingsSection>

          <section className="settings-secondary-grid settings-secondary-grid--support-only" aria-label="도움말">
            <SettingsSection id="support" title="고객센터" description="자주 필요한 도움말과 제보 채널입니다." tone="compact">
              <div className="settings-support-priority">
                <a
                  className="settings-support-card settings-support-card--primary"
                  href="mailto:emfpdlzj@gmail.com?subject=Bridgework%20%EB%AC%B8%EC%9D%98"
                >
                  <strong>문의하기</strong>
                  <span>계정, 추천, 프로필 문의 접수</span>
                </a>
                <a className="settings-support-card" href="#policies">
                  <strong>FAQ</strong>
                  <span>약관과 안내 항목에서 기본 정보를 확인합니다.</span>
                </a>
                <a
                  className="settings-support-card"
                  href="mailto:emfpdlzj@gmail.com?subject=Bridgework%20%EC%98%A4%EB%A5%98%20%EC%A0%9C%EB%B3%B4"
                >
                  <strong>오류 제보</strong>
                  <span>접근성, 지도, 공공데이터 오류 제보</span>
                </a>
              </div>
              <div className="settings-contact-card settings-contact-card--compact settings-contact-card--actions">
                <a
                  className="not-found-page__kakao-button settings-kakao-button"
                  href="http://pf.kakao.com/_uxoQxbX"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="카톡 상담채널 새 창으로 열기"
                >
                  <img src={kakaoLogo} alt="" aria-hidden="true" />
                  카톡상담채널
                </a>
                <span>
                  문의 메일:{' '}
                  <a href="mailto:emfpdlzj@gmail.com">emfpdlzj@gmail.com</a>
                </span>
                <span>운영 시간: 평일 10:00-18:00</span>
                <span>답변 예상 시간: 영업일 기준 1-2일</span>
              </div>
            </SettingsSection>
          </section>

          <SettingsSection id="policies" title="약관 및 정책" description="자주 확인하는 정책을 먼저 보여주고 나머지는 접어서 제공합니다." tone="compact">
            <div className="settings-policy-highlight">
              {highlightedPolicyItems.map((policy) => (
                <Link key={policy.id} to={localizePath(getPolicyPath(policy.id))} className="settings-policy-featured">
                  <strong data-i18n-skip>{policy.title}</strong>
                  <span data-i18n-skip>{policy.summary}</span>
                  <small>마지막 수정일 {policy.updatedAt}</small>
                </Link>
              ))}
            </div>
            <details className="settings-policy-accordion">
              <summary>전체 약관 및 정책 보기</summary>
              <div className="settings-policy-list">
                {POLICY_DOCUMENTS.map((policy) => (
                  <Link key={policy.id} to={localizePath(getPolicyPath(policy.id))} className="settings-policy-row">
                    <span data-i18n-skip>{policy.title}</span>
                    <small>마지막 수정일 {policy.updatedAt}</small>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </div>
            </details>
          </SettingsSection>

          <SettingsSection id="danger" title="회원탈퇴" description="계정 삭제는 복구와 보관 범위를 확인한 뒤 진행합니다.">
            <div className="settings-danger-card settings-danger-card--refined">
              <div>
                <h3>회원탈퇴 신청</h3>
                <p>탈퇴 신청은 30일 유예 기간과 개인정보 보관 범위를 확인한 뒤 진행합니다.</p>
                <details className="settings-withdrawal-accordion">
                  <summary>탈퇴 전 확인할 내용</summary>
                  <div className="settings-withdrawal-accordion__body">
                    <p>
                      탈퇴 신청 후 30일 유예 기간이 적용되며, 탈퇴 확정 시 개인정보는 삭제 또는 비식별 처리됩니다.
                      법령상 필요한 기록은 일반 서비스 데이터와 분리 보관될 수 있습니다.
                    </p>
                    <div className="settings-withdrawal-retention" aria-label="탈퇴 전 유의사항 안내">
                      {withdrawalRetentionItems.map((item) => (
                        <div key={item.title} className="settings-withdrawal-retention__item">
                          <div>
                            <strong>{item.title}</strong>
                            <SettingsStatusBadge tone={item.status === '확인 필요' ? 'warning' : 'neutral'}>
                              {item.status}
                            </SettingsStatusBadge>
                          </div>
                          <span>{item.description}</span>
                        </div>
                      ))}
                    </div>
                    <ul className="settings-danger-checklist">
                      <li>탈퇴 시 삭제되는 정보 확인</li>
                      <li>30일 내 복구 가능 여부 확인</li>
                      <li>법정 보관 정보의 분리 보관 확인</li>
                      <li>재가입 제한 여부는 확인 필요로 안내</li>
                    </ul>
                    <Link className="settings-danger-policy-link" to={localizePath(getPolicyPath('withdrawal-retention'))}>
                      탈퇴 후 개인정보 파기/보관 안내 자세히 보기
                    </Link>
                  </div>
                </details>
                {withdrawalState.message ? (
                  <StatusMessage kind={withdrawalState.status === 'error' ? 'error' : 'info'}>
                    {withdrawalState.message}
                  </StatusMessage>
                ) : null}
              </div>
              <button
                type="button"
                className="settings-button settings-button--secondary"
                disabled={!isAuthenticated || withdrawalState.status === 'loading'}
                onClick={() => {
                  setWithdrawalState({ status: 'idle', message: '' });
                  setIsWithdrawalOpen(true);
                }}
              >
                {withdrawalState.status === 'loading' ? '신청 중' : '회원탈퇴'}
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>

      {isWithdrawalOpen ? (
        <WithdrawalConfirmDialog
          isConfirmed={isWithdrawalConfirmed}
          onConfirmChange={setIsWithdrawalConfirmed}
          onClose={() => {
            resetWithdrawalDialog();
          }}
          onSubmit={handleWithdrawalSubmit}
          isSubmitting={withdrawalState.status === 'loading'}
          errorMessage={withdrawalState.status === 'error' ? withdrawalState.message : ''}
        />
      ) : null}
    </main>
  );
}
