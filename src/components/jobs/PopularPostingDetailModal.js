import { memo, useEffect, useRef } from 'react';
import { AccessibilityScoreHelpButton } from '../accessibility-map/AccessibilityMapDetailPanel';
import { LlmExplanationProgress } from '../common/LlmExplanationProgress';
import { DefinitionGrid } from './JobDetailPanel';
import { PostingMapPreview } from './PostingMapPreview';
import { ScoreRing } from '../quick-jobs/QuickScoreRing';
import {
  formatRecommendationExplanationList,
  formatRecommendationExplanationText,
  formatRecommendationNextStepSummary
} from '../../utils/recommendationExplanationText';
import {
  getPostingMapPreview,
  getQuickScoreTone,
  getRegionFromAddress,
  parseDateText,
  toSafeText
} from '../../utils/quickJobs';

function PostingDetailInfoSection({ title, description, className = '', children }) {
  const sectionClassName = ['scrap-detail-card', 'posting-detail-modal__info-section', className].filter(Boolean).join(' ');

  return (
    <section className={sectionClassName}>
      <div className="posting-detail-modal__section-heading">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const getPostingStatusMeta = (postingStatus) => (
  postingStatus === 'ACTIVE'
    ? {
      label: '진행중',
      tone: 'active',
      description: '현재 지원 가능한 공고입니다. 급여와 근무 환경, 지원 요건을 아래에서 차례대로 확인해보세요.'
    }
    : {
      label: '마감',
      tone: 'closed',
      description: '모집 종료 또는 상태 확인이 필요한 공고입니다. 등록 정보와 연락처를 먼저 확인해 주세요.'
    }
);

const getPhoneHref = (value) => {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};

export const PopularPostingDetailModal = memo(function PopularPostingDetailModal({
  detail,
  loading,
  error,
  quickFitScore = null,
  quickExplainState = { status: 'idle', error: '', data: null },
  onClose,
  onScrap
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const scrapButtonLabel = !detail?.postingId ? '스크랩 불가' : detail?.scrappedByMe ? '스크랩 완료' : '공고 스크랩';
  const isScrapDisabled = !detail?.postingId || detail?.scrappedByMe || detail?.postingStatus !== 'ACTIVE';
  const hasQuickFitScore = typeof quickFitScore === 'number';
  const deadlineText = detail ? parseDateText(detail.termDate) || '없음' : '';
  const registeredText = detail ? detail.offerRegisteredAt || detail.registeredAt || '없음' : '';
  const contactText = detail ? toSafeText(detail.contactNumber) : '없음';
  const contactHref = detail ? getPhoneHref(detail.contactNumber) : '';
  const agencyText = detail ? toSafeText(detail.agencyName) : '없음';
  const matchedAddressText = detail ? toSafeText(detail.geoMatchedAddress) : '없음';
  const workAddressText = detail ? toSafeText(detail.workAddress) : '없음';
  const salaryText = detail ? toSafeText(detail.salaryText) : '없음';
  const regionText = detail ? getRegionFromAddress(detail.workAddress) : '없음';
  const statusMeta = getPostingStatusMeta(detail?.postingStatus);
  const summaryItems = detail ? [
    ['근무지', workAddressText],
    ['임금', salaryText],
    ['고용형태', toSafeText(detail.employmentType)],
    ['모집마감일', deadlineText]
  ] : [];
  const contactItems = detail ? [
    ['연락처', contactText],
    ['담당기관', agencyText],
    ['공고등록일', registeredText],
    ['매칭 주소', matchedAddressText]
  ] : [];
  const workConditionItems = detail ? [
    ['고용형태', toSafeText(detail.employmentType)],
    ['입사유형', toSafeText(detail.enterType)],
    ['급여', salaryText],
    ['근무지', workAddressText]
  ] : [];
  const workEnvironmentItems = detail ? [
    ['양손 사용', toSafeText(detail.envBothHands)],
    ['시력', toSafeText(detail.envEyesight)],
    ['듣기·말하기', toSafeText(detail.envLstnTalk)],
    ['손작업', toSafeText(detail.envHandWork)],
    ['들어올리기', toSafeText(detail.envLiftPower)],
    ['서기·걷기', toSafeText(detail.envStndWalk)]
  ] : [];
  const requirementItems = detail ? [
    ['요구경력', toSafeText(detail.requiredCareer)],
    ['요구학력', toSafeText(detail.requiredEducation)],
    ['요구전공', toSafeText(detail.requiredMajor)],
    ['요구자격증', toSafeText(detail.requiredLicenses)]
  ] : [];
  const mapPreview = detail ? getPostingMapPreview(detail) : null;
  const formattedQuickSummary = formatRecommendationExplanationText(quickExplainState.data?.shortSummary, quickFitScore);
  const formattedQuickNextStepSummary = formatRecommendationNextStepSummary(quickExplainState.data?.nextStepSummary, quickFitScore);
  const formattedQuickChecklist = formatRecommendationExplanationList(quickExplainState.data?.checklist, quickFitScore);
  const formattedQuickCautionPoints = formatRecommendationExplanationList(quickExplainState.data?.cautionPoints, quickFitScore);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousActiveElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = Array.from(dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []).filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');

      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, []);

  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section
        ref={dialogRef}
        className="login-modal posting-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popular-posting-detail-title"
        aria-describedby={detail ? 'popular-posting-detail-description' : undefined}
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="공고 상세 창 닫기"
        >
          닫기
        </button>
        <div className="login-modal__body posting-detail-modal__body">
          {loading ? <div className="jobs-feedback" role="status">공고 상세를 불러오는 중입니다.</div> : null}
          {error ? <div className="jobs-feedback is-error" role="alert">{error}</div> : null}

          {detail ? (
            <>
              <div className="posting-detail-modal__hero">
                <div className="posting-detail-modal__hero-copy">
                  <div className="posting-detail-modal__hero-badges" aria-label="공고 상태 정보">
                    <span className={`posting-detail-modal__hero-badge is-${statusMeta.tone}`}>{statusMeta.label}</span>
                    {detail.dueLabel ? <span className="posting-detail-modal__hero-badge is-deadline">{detail.dueLabel}</span> : null}
                    {regionText !== '없음' ? <span className="posting-detail-modal__hero-badge is-region">{regionText}</span> : null}
                  </div>
                  <div className="login-modal__heading posting-detail-modal__heading">
                    <p className="posting-detail-modal__eyebrow">채용공고 상세</p>
                    <h2 id="popular-posting-detail-title" className="login-modal__title" data-i18n-skip>{detail.jobTitle}</h2>
                    <p data-i18n-skip>{detail.companyName}</p>
                  </div>
                  <p id="popular-posting-detail-description" className="posting-detail-modal__hero-description">
                    {statusMeta.description}
                  </p>
                  <div className="posting-detail-modal__hero-links">
                    {contactHref ? (
                      <a className="posting-detail-modal__hero-link" href={contactHref} aria-label={`채용 문의 전화 ${contactText}`}>
                        <span>채용 문의</span>
                        <strong data-i18n-skip>{contactText}</strong>
                        <small>터치하거나 클릭하면 바로 전화할 수 있습니다.</small>
                      </a>
                    ) : (
                      <div className="posting-detail-modal__hero-link" aria-label={`채용 문의 ${contactText}`}>
                        <span>채용 문의</span>
                        <strong data-i18n-skip>{contactText}</strong>
                        <small>연락처 정보가 등록된 경우 전화 연결이 가능합니다.</small>
                      </div>
                    )}
                    <div className="posting-detail-modal__hero-link" aria-label={`등록 기관 ${agencyText}`}>
                      <span>등록 기관</span>
                      <strong data-i18n-skip>{agencyText}</strong>
                      <small data-i18n-skip>{registeredText !== '없음' ? `공고 등록일 ${registeredText}` : '공고 등록일 정보가 없습니다.'}</small>
                    </div>
                  </div>
                </div>
                <aside className="posting-detail-modal__summary" aria-label="공고 상태 및 스크랩 정보">
                  <strong className="posting-detail-modal__summary-title">관심 공고</strong>
                  <div className="posting-detail-modal__scrap-panel">
                    <span className="posting-detail-modal__scrap-caption">현재 스크랩</span>
                    <span className="posting-detail-modal__scrap-count" aria-label={`스크랩 ${detail.scrapCount}건`}>
                      <span>스크랩</span>
                      <strong>{detail.scrapCount}</strong>
                      <span>건</span>
                    </span>
                    <p>
                      {isScrapDisabled
                        ? '이미 저장했거나 접수가 마감된 공고입니다.'
                        : '저장하면 스크랩 공고에서 다시 확인할 수 있습니다.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary-button posting-detail-modal__scrap-button"
                    disabled={isScrapDisabled}
                    onClick={onScrap}
                  >
                    {scrapButtonLabel}
                  </button>
                </aside>
              </div>
              <div className="posting-detail-modal__content">
                <section className="jobs-detail__summary posting-detail-modal__key-summary" aria-label="공고 핵심 요약">
                  {summaryItems.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong data-i18n-skip>{value}</strong>
                    </div>
                  ))}
                </section>
                {(hasQuickFitScore || quickExplainState.status !== 'idle') ? (
                  <section className="jobs-detail__section posting-detail-modal__ai-section" aria-label="직무 적합도 및 추천 설명">
                    <div className="jobs-detail__section-title">
                      <h3>AI 직무 적합도 및 추천 설명</h3>
                      <AccessibilityScoreHelpButton />
                    </div>
                    {(hasQuickFitScore || quickExplainState.status !== 'idle') ? (
                      <div className="jobs-detail__score-card">
                        <ScoreRing className={`jobs-detail__score-ring is-${getQuickScoreTone(quickFitScore)}`} score={quickFitScore} />
                        <div className="jobs-detail__score-summary">
                          <span>직무 적합도 점수</span>
                          <em>{hasQuickFitScore ? `${quickFitScore}점` : '확인 필요'}</em>
                          <p>
                            {hasQuickFitScore
                              ? (quickFitScore >= 70 ? '프로필 직무와 공고 조건이 유사합니다.' : '지원 전 직무 조건 확인이 필요합니다.')
                              : '추천 설명을 기준으로 공고 조건을 확인해 주세요.'}
                          </p>
                        </div>
                      </div>
                    ) : null}
                    {quickExplainState.status === 'loading' ? (
                      <LlmExplanationProgress description="공고 조건과 선택한 프로필 기준으로 추천 이유를 생성하고 있습니다." />
                    ) : null}
                    {quickExplainState.status === 'error' ? <div className="jobs-feedback is-error" role="alert">{quickExplainState.error}</div> : null}
                    {quickExplainState.status === 'success' && quickExplainState.data ? (
                      <>
                        {formattedQuickSummary ? (
                          <div className="jobs-detail__notice jobs-detail__notice--quick">
                            <span className="jobs-detail__eyebrow">추천 요약</span>
                            <strong>{formattedQuickSummary}</strong>
                          </div>
                        ) : null}
                        {Array.isArray(quickExplainState.data.recommendedPrograms) && quickExplainState.data.recommendedPrograms.length ? (
                          <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                            <h3>이런 준비가 도움이 될 수 있어요</h3>
                            {formattedQuickNextStepSummary ? <p>{formattedQuickNextStepSummary}</p> : null}
                            <strong className="jobs-detail__subheading">교육·취업역량 추천</strong>
                            <ul className="jobs-detail__program-list">
                              {quickExplainState.data.recommendedPrograms.map((program, index) => (
                                <li key={`${program.sourceType || program.source_type}-${program.recordId || program.record_id}-${program.title}-${index}`}>
                                  <strong>{program.title}</strong>
                                  {program.reason ? <p>{program.reason}</p> : null}
                                  {program.providerName || program.provider_name || program.startDate || program.start_date ? (
                                    <span>
                                      {[program.providerName || program.provider_name, program.startDate || program.start_date].filter(Boolean).join(' · ')}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {formattedQuickChecklist.length ? (
                          <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                            <h3>지원 전에 확인해보면 좋아요</h3>
                            <ul className="jobs-detail__bullet-list">
                              {formattedQuickChecklist.map((item) => (
                                <li key={`check-${item}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {formattedQuickCautionPoints.length ? (
                          <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                            <h3>참고해주세요</h3>
                            <ul className="jobs-detail__bullet-list">
                              {formattedQuickCautionPoints.map((item) => (
                                <li key={`caution-${item}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </section>
                ) : null}
                <div className="posting-detail-modal__info-stack">
                  <PostingDetailInfoSection
                    title="연락 및 위치"
                    description="지원 전에 먼저 확인하면 좋은 기본 정보입니다."
                  >
                    <DefinitionGrid items={contactItems} skipValues />
                  </PostingDetailInfoSection>
                  <PostingDetailInfoSection
                    title="근무 조건"
                    description="근무 방식과 기본 채용 조건을 빠르게 확인하세요."
                  >
                    <DefinitionGrid items={workConditionItems} skipValues />
                  </PostingDetailInfoSection>
                  <PostingDetailInfoSection
                    title="작업 환경"
                    description="현장 업무 특성과 신체 부담 정보를 정리했습니다."
                  >
                    <DefinitionGrid items={workEnvironmentItems} skipValues />
                  </PostingDetailInfoSection>
                  <PostingDetailInfoSection
                    title="지원 요건"
                    description="경력, 학력, 자격 관련 조건을 확인할 수 있습니다."
                  >
                    <DefinitionGrid items={requirementItems} skipValues />
                  </PostingDetailInfoSection>
                  {mapPreview ? (
                    <PostingDetailInfoSection
                      title="지도 미리보기"
                      description="스크랩 공고 상세와 동일한 방식으로 근무지 위치를 미리 확인할 수 있습니다."
                    >
                      <PostingMapPreview mapPreview={mapPreview} title={detail.jobTitle} />
                    </PostingDetailInfoSection>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
});
