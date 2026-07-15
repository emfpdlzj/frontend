import { Link } from 'react-router-dom';
import kakaoLogo from '../assets/settings/kakao-logo.png';
import { StatusMessage } from '../components/common/StatusMessage';
import {
  SettingsRadioGroup,
  SettingsSection,
  SettingsStatusBadge,
  SettingsToggle
} from '../components/settings/SettingsControls';
import { WithdrawalConfirmDialog } from '../components/settings/WithdrawalConfirmDialog';
import {
  highlightedPolicyItems,
  settingsMenu,
  withdrawalRetentionItems
} from '../constants/settingsPage';
import { POLICY_DOCUMENTS, getPolicyPath } from '../config/policyDocuments';
import { useSettingsController } from '../hooks/useSettingsController';

function AccountField({ id, label, type, value, readOnly = false }) {
  return (
    <label className="settings-field settings-field--compact" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type={type} value={value ?? ''} readOnly={readOnly} aria-readonly={readOnly} />
    </label>
  );
}

export function SettingsPage() {
  const {
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
  } = useSettingsController();

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
