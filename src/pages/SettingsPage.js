import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authStorage } from '../auth/authStorage';
import basicProfileImage from '../assets/settings/img.png';
import kakaoLogo from '../assets/settings/kakao-logo.png';
import naverLogo from '../assets/settings/naver-logo.png';
import {
  SettingsRadioGroup,
  SettingsSection,
  SettingsStatusBadge,
  SettingsToggle
} from '../components/settings/SettingsControls';
import { WithdrawalConfirmDialog } from '../components/settings/WithdrawalConfirmDialog';
import {
  applyAccessibilityPreferences,
  readAccessibilityPreferences,
  saveAccessibilityPreferences
} from '../config/accessibilityPreferences';
import { POLICY_DOCUMENTS, getPolicyPath } from '../config/policyDocuments';

const settingsMenu = [
  { id: 'account', label: '계정', group: '자주 사용' },
  { id: 'accessibility', label: '접근성', group: '자주 사용' },
  { id: 'notifications', label: '알림', group: '자주 사용' },
  { id: 'privacy', label: '내 데이터', group: '개인정보' },
  { id: 'support', label: '고객센터', group: '도움말' },
  { id: 'policies', label: '약관', group: '정보' },
  { id: 'danger', label: '회원탈퇴', group: '위험' }
];

const notificationGroups = [
  {
    title: '중요 알림',
    description: '계정 보안, 서비스 공지, 인증 관련 알림입니다.',
    items: [
      ['emailNotification', '이메일 알림', '보안 및 계정 알림'],
      ['smsNotification', '문자 알림', '인증과 긴급 안내'],
      ['kakaoNotification', '카카오 알림톡', '주요 서비스 안내'],
      ['serviceNoticeNotification', '서비스 공지', '장애, 보안, 약관 변경']
    ]
  },
  {
    title: '추천 알림',
    description: '프로필과 관심 공고를 기준으로 받는 알림입니다.',
    items: [
      ['recommendationNotification', '추천 공고', '선택 프로필 기준 새 공고'],
      ['deadlineNotification', '공고 마감', '관심 공고 마감 전 안내'],
      ['accessibilityUpdateNotification', '접근성 정보 업데이트', '지도 및 공공데이터 갱신']
    ]
  },
  {
    title: '선택 수신',
    description: '서비스 소식과 이벤트성 안내입니다. 언제든 철회할 수 있습니다.',
    items: [['marketingConsent', '마케팅 정보 수신', '선택 동의 항목']]
  }
];

const privacyItems = [
  ['개인정보 수집·이용 동의', '동의 완료', 'success', '계정 생성과 서비스 제공에 필요한 동의입니다.'],
  ['민감정보 수집·이용 동의', '동의 완료', 'success', '추천 품질 개선을 위해 사용되며 기본 공개되지 않습니다.'],
  ['제3자 제공 동의', '확인 필요', 'warning', '지원 또는 기업 공개 설정 시 제공 범위를 확인합니다.'],
  ['마케팅 수신 동의', '선택 미동의', 'neutral', '선택 동의이며 서비스 이용에 필수는 아닙니다.'],
  ['개인정보 다운로드 요청', '신청 가능', 'neutral', '내 계정 데이터를 파일로 요청할 수 있습니다.'],
  ['열람/수정/삭제 요청', '신청 가능', 'neutral', '개인정보 처리 요청 절차를 확인합니다.']
];

const highlightedPolicyIds = ['privacy-consent', 'sensitive-consent'];
const highlightedPolicyItems = highlightedPolicyIds
  .map((policyId) => POLICY_DOCUMENTS.find((policy) => policy.id === policyId))
  .filter(Boolean);

const getUserField = (user, keys, fallback = '로그인 후 확인') => {
  for (const key of keys) {
    if (user?.[key]) {
      return user[key];
    }
  }

  return fallback;
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

  return null;
};

function AccountField({ id, label, type, value, readOnly = false }) {
  return (
    <label className="settings-field settings-field--compact" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type={type} value={value} readOnly={readOnly} aria-readonly={readOnly} />
    </label>
  );
}

function SettingsSummaryCard({ title, value, description, href, provider, logo }) {
  return (
    <a className="settings-summary-card" href={href}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{description}</small>
      {logo ? (
        <span className={`settings-summary-card__provider settings-summary-card__provider--${provider.toLowerCase()}`} aria-hidden="true">
          <img src={logo} alt="" />
        </span>
      ) : null}
    </a>
  );
}

export function SettingsPage() {
  const { currentUser, isAuthenticated, isInitializing, tokens } = useAuth();
  const [preferences, setPreferences] = useState(readAccessibilityPreferences);
  const [savedPreferences, setSavedPreferences] = useState(readAccessibilityPreferences);
  const account = useMemo(
    () => ({
      name: getUserField(currentUser, ['name', 'nickname', 'username'], isAuthenticated ? '이름 확인 필요' : '로그인 필요'),
      email: getUserField(currentUser, ['email'], isAuthenticated ? '이메일 확인 필요' : '로그인 필요'),
      phone: getUserField(currentUser, ['phone', 'phoneNumber', 'mobile'], isAuthenticated ? '연락처 확인 필요' : '로그인 필요'),
      provider:
        findProviderInObject(currentUser) ||
        normalizeProvider(authStorage.readAuthProvider()) ||
        findProviderInObject(decodeJwtPayload(tokens?.accessToken))
    }),
    [currentUser, isAuthenticated, tokens]
  );
  const accountSummary = isAuthenticated ? '로그인됨' : '로그인 필요';
  const accountProvider = account.provider || 'SOCIAL';
  const accountProviderLogo = account.provider === 'KAKAO' ? kakaoLogo : account.provider === 'NAVER' ? naverLogo : null;
  const accountDescription = isAuthenticated ? `${accountProvider} 계정` : '계정 정보는 로그인 후 표시';
  const accessibilitySummary = preferences.showMapList ? '목록 함께 보기' : '지도 중심 보기';
  const accessibilityDescription = preferences.screenReaderMode ? '스크린리더 최적화 사용' : '지도 대체 정보 설정 가능';
  const [saveState, setSaveState] = useState('idle');
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [isWithdrawalConfirmed, setIsWithdrawalConfirmed] = useState(false);

  const hasChanges = useMemo(() => {
    return JSON.stringify(preferences) !== JSON.stringify(savedPreferences);
  }, [preferences, savedPreferences]);

  const updatePreference = (key, value) => {
    setSaveState('idle');
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const savePreferences = () => {
    try {
      saveAccessibilityPreferences(preferences);
      setSavedPreferences(preferences);
      setSaveState('success');
    } catch (error) {
      setSaveState('error');
    }
  };

  useEffect(() => {
    applyAccessibilityPreferences(preferences);
  }, [preferences]);

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
    window.history.replaceState(null, '', `#${targetId}`);
  };

  useEffect(() => {
    if (saveState !== 'success') {
      return undefined;
    }

    const timer = window.setTimeout(() => setSaveState('idle'), 2400);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  return (
    <main className="settings-page settings-page--refined" aria-labelledby="settings-page-title">
      <header className="settings-page__header settings-hero">
        <div>
          <span className="settings-eyebrow">Settings</span>
          <h1 id="settings-page-title">환경설정</h1>
          <p>자주 쓰는 계정, 접근성, 알림 설정을 먼저 관리하고 개인정보와 고객센터 정보를 한곳에서 확인합니다.</p>
        </div>
      </header>

      <div className="settings-page__layout settings-page__layout--refined">
        <aside className="settings-page__menu settings-page__menu--refined" aria-label="설정 카테고리">
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
        </aside>

        <div className="settings-page__content settings-page__content--refined">
          <section className="settings-overview" aria-label="주요 설정 요약">
            <SettingsSummaryCard
              title="계정"
              value={accountSummary}
              description={accountDescription}
              href="#account"
              provider={accountProvider}
              logo={accountProviderLogo}
            />
            <SettingsSummaryCard title="접근성" value={accessibilitySummary} description={accessibilityDescription} href="#accessibility" />
          </section>

          <SettingsSection
            id="account"
            title="계정 설정"
            description="로그인, 연락처, 기본 프로필로 이어지는 핵심 계정 정보입니다."
            tone="primary"
            actions={
              <button
                type="button"
                className="settings-button settings-button--primary"
                disabled={!hasChanges || saveState === 'success'}
                onClick={savePreferences}
              >
                {saveState === 'success' ? '저장 완료' : saveState === 'error' ? '저장 실패' : '변경사항 저장'}
              </button>
            }
          >
            <div className="settings-account-layout">
              <div className="settings-profile-card" aria-label="계정 요약">
                <img className="settings-profile-card__avatar" src={basicProfileImage} alt="" aria-hidden="true" />
                <div className="settings-profile-card__copy">
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                  <div className="settings-profile-card__badges">
                    <SettingsStatusBadge tone={isAuthenticated ? 'success' : 'neutral'}>
                      {isAuthenticated ? '로그인 확인' : '로그인 필요'}
                    </SettingsStatusBadge>
                    {currentUser?.signupCompleted === false ? (
                      <SettingsStatusBadge tone="warning">가입 완료 필요</SettingsStatusBadge>
                    ) : (
                      <SettingsStatusBadge tone="neutral">기본 프로필</SettingsStatusBadge>
                    )}
                  </div>
                </div>
              </div>

              <div className="settings-account-panel">
                <div className="settings-grid settings-grid--three">
                  <AccountField
                    id="settings-name"
                    label="이름"
                    type="text"
                    value={account.name}
                    readOnly
                  />
                  <AccountField
                    id="settings-email"
                    label="이메일"
                    type="email"
                    value={account.email}
                    readOnly
                  />
                  <AccountField
                    id="settings-phone"
                    label="연락처"
                    type="tel"
                    value={account.phone}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="settings-device-row">
              <div>
                <strong>최근 로그인 기기</strong>
                <span>{isInitializing ? '로그인 상태 확인 중' : isAuthenticated ? '현재 브라우저 세션' : '로그인 후 확인할 수 있습니다.'}</span>
              </div>
              <button type="button" className="settings-button settings-button--secondary">
                로그인 기록 보기
              </button>
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
                    onChange={(value) => updatePreference('fontSize', value)}
                    options={[
                      { value: 'default', label: '기본' },
                      { value: 'large', label: '크게' },
                      { value: 'xlarge', label: '아주 크게' }
                    ]}
                  />
                  <SettingsRadioGroup
                    legend="점수 표시"
                    name="score-display"
                    value={preferences.scoreDisplay}
                    onChange={(value) => updatePreference('scoreDisplay', value)}
                    options={[
                      { value: 'text-color', label: '색상+문자' },
                      { value: 'text-first', label: '문자 중심' }
                    ]}
                  />
                </div>
                <div className="settings-toggle-list settings-toggle-list--compact">
                  <SettingsToggle
                    id="contrast"
                    label="고대비 모드"
                    description="텍스트와 카드 경계를 더 뚜렷하게 표시"
                    checked={preferences.contrast}
                    onChange={(value) => updatePreference('contrast', value)}
                  />
                  <SettingsToggle
                    id="reduce-motion"
                    label="애니메이션 줄이기"
                    description="전환과 지도 움직임을 줄임"
                    checked={preferences.reduceMotion}
                    onChange={(value) => updatePreference('reduceMotion', value)}
                  />
                  <SettingsToggle
                    id="map-color-assist"
                    label="지도 색상 보조"
                    description="마커에 텍스트와 패턴을 함께 표시"
                    checked={preferences.mapColorAssist}
                    onChange={(value) => updatePreference('mapColorAssist', value)}
                  />
                  <SettingsToggle
                    id="show-map-list"
                    label="지도 정보를 목록으로 함께 보기"
                    description="공고, 기업, 수행기관을 목록으로 제공"
                    checked={preferences.showMapList}
                    onChange={(value) => updatePreference('showMapList', value)}
                  />
                  <SettingsToggle
                    id="screen-reader-mode"
                    label="스크린리더 최적화"
                    description="추천 이유와 지도 요약을 읽기 순서로 제공"
                    checked={preferences.screenReaderMode}
                    onChange={(value) => updatePreference('screenReaderMode', value)}
                  />
                </div>
              </div>
            </div>

            <div className="settings-info-strip">
              <span>장애/접근성 정보는 추천 목적으로만 사용됩니다.</span>
              <span>AI 추천은 확정 판단이 아닌 참고 정보입니다.</span>
              <a href="#policies">“확인 필요” 표시 기준 보기</a>
            </div>
          </SettingsSection>

          <SettingsSection id="notifications" title="알림 설정" description="알림은 중요도와 사용 목적에 따라 나누어 관리합니다." tone="primary">
            <div className="settings-notification-groups">
              {notificationGroups.map((group) => (
                <section key={group.title} className="settings-notification-group" aria-labelledby={`${group.title}-title`}>
                  <div className="settings-notification-group__header">
                    <h3 id={`${group.title}-title`}>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                  <div className="settings-toggle-list settings-toggle-list--rows">
                    {group.items.map(([key, label, description]) => (
                      <SettingsToggle
                        key={key}
                        id={key}
                        label={label}
                        description={description}
                        checked={preferences[key]}
                        onChange={(value) => updatePreference(key, value)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection id="privacy" title="내 데이터 관리" description="동의 상태와 데이터 요청을 한곳에서 확인합니다.">
            <div className="settings-data-layout">
              <div className="settings-consent-grid">
                {privacyItems.map(([title, status, tone, description]) => (
                  <button key={title} type="button" className="settings-consent-card">
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <SettingsStatusBadge tone={tone}>{status}</SettingsStatusBadge>
                  </button>
                ))}
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
                  카톡 상담채널
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
                <Link key={policy.id} to={getPolicyPath(policy.id)} className="settings-policy-featured">
                  <strong>{policy.title}</strong>
                  <span>{policy.summary}</span>
                  <small>마지막 수정일 {policy.updatedAt}</small>
                </Link>
              ))}
            </div>
            <details className="settings-policy-accordion">
              <summary>전체 약관 및 정책 보기</summary>
              <div className="settings-policy-list">
                {POLICY_DOCUMENTS.map((policy) => (
                  <Link key={policy.id} to={getPolicyPath(policy.id)} className="settings-policy-row">
                    <span>{policy.title}</span>
                    <small>마지막 수정일 {policy.updatedAt}</small>
                    <span aria-hidden="true">›</span>
                  </Link>
                ))}
              </div>
            </details>
          </SettingsSection>

          <SettingsSection id="danger" title="회원탈퇴" description="계정 삭제는 복구와 보관 범위를 확인한 뒤 진행합니다." tone="danger">
            <div className="settings-danger-card settings-danger-card--refined">
              <div>
                <h3>탈퇴 전 확인할 내용</h3>
                <p>탈퇴 시 일부 정보는 즉시 삭제되고, 법정 보관 정보와 처리 로그는 정해진 기간 동안 분리 보관됩니다.</p>
                <ul className="settings-danger-checklist">
                  <li>계정, 프로필, 저장 공고 삭제 범위 확인</li>
                  <li>지원 이력과 법정 보관 정보 분리 보관 안내</li>
                  <li>탈퇴 후 복구 가능 여부 및 재가입 제한 확인</li>
                  <li>개인정보 파기/분리보관 처리 로그 안내</li>
                </ul>
              </div>
              <button
                type="button"
                className="settings-button settings-button--danger"
                onClick={() => setIsWithdrawalOpen(true)}
              >
                회원탈퇴
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
            setIsWithdrawalOpen(false);
            setIsWithdrawalConfirmed(false);
          }}
        />
      ) : null}
    </main>
  );
}
