import { useEffect, useId, useState } from 'react';
import infoIcon from '../../assets/accessibility-map/info-icon.png';
import badConvenienceIcon from '../../assets/accessibility-map/info_icon/bad_conv.png';
import badTransferIcon from '../../assets/accessibility-map/info_icon/bad_transfer.png';
import badWalkerIcon from '../../assets/accessibility-map/info_icon/bad_walker.png';
import dangerAccessibilityIcon from '../../assets/accessibility-map/info_icon/error_accessibillity.png';
import dangerLocationIcon from '../../assets/accessibility-map/info_icon/error_location..png';
import goodAccessibilityIcon from '../../assets/accessibility-map/info_icon/good_accessibility.png';
import goodConvenienceIcon from '../../assets/accessibility-map/info_icon/good_conv.png';
import goodLocationIcon from '../../assets/accessibility-map/info_icon/good_location.png';
import goodTransferIcon from '../../assets/accessibility-map/info_icon/good_transfer.png';
import goodWalkerIcon from '../../assets/accessibility-map/info_icon/good_walker.png';
import warningAccessibilityIcon from '../../assets/accessibility-map/info_icon/warning_accessibility.png';
import warningConvenienceIcon from '../../assets/accessibility-map/info_icon/warning_conv.png';
import warningLocationIcon from '../../assets/accessibility-map/info_icon/waring_location..png';
import warningTransferIcon from '../../assets/accessibility-map/info_icon/warning_transfer.png';
import warningWalkerIcon from '../../assets/accessibility-map/info_icon/warning_walker.png';
import timeIcon from '../../assets/accessibility-map/time-icon.png';
import transferIcon from '../../assets/accessibility-map/transfer-icon.svg';
import walkIcon from '../../assets/accessibility-map/walk-icon.png';
import { formatRecommendationExplanationText } from '../../utils/recommendationExplanationText';
import { LlmExplanationProgress } from '../common/LlmExplanationProgress';

const DETAIL_STATUS_TONE = {
  '접근 양호': 'good',
  '공고 제공 정보': 'good',
  '주의 필요': 'warning',
  '접근 어려움': 'danger'
};

const DETAIL_STATUS_ICON_MAP = {
  accessibility: {
    good: goodAccessibilityIcon,
    warning: warningAccessibilityIcon,
    danger: dangerAccessibilityIcon,
    neutral: warningAccessibilityIcon
  },
  location: {
    good: goodLocationIcon,
    warning: warningLocationIcon,
    danger: dangerLocationIcon,
    neutral: warningLocationIcon
  },
  transfer: {
    good: goodTransferIcon,
    warning: warningTransferIcon,
    danger: badTransferIcon,
    neutral: warningTransferIcon
  },
  walker: {
    good: goodWalkerIcon,
    warning: warningWalkerIcon,
    danger: badWalkerIcon,
    neutral: warningWalkerIcon
  },
  convenience: {
    good: goodConvenienceIcon,
    warning: warningConvenienceIcon,
    danger: badConvenienceIcon,
    neutral: warningConvenienceIcon
  }
};

function MetaIcon({ type }) {
  if (type === 'time') {
    return <img className="accessibility-map__meta-icon" src={timeIcon} alt="이동 시간 아이콘" />;
  }
  if (type === 'transfer') {
    return <img className="accessibility-map__meta-icon" src={transferIcon} alt="환승 횟수 아이콘" />;
  }
  return <img className="accessibility-map__meta-icon is-walk" src={walkIcon} alt="도보 이동 아이콘" />;
}

function FeedbackThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 21H6.8c-.99 0-1.8-.81-1.8-1.8V10c0-.99.81-1.8 1.8-1.8H10v12.8Z" fill="currentColor" opacity="0.18" />
      <path d="M10 21H6.8c-.99 0-1.8-.81-1.8-1.8V10c0-.99.81-1.8 1.8-1.8H10m0 12.8V8.2m0 12.8h7.04c.85 0 1.59-.58 1.79-1.41l1.15-4.8a1.8 1.8 0 0 0-1.75-2.22H14V6.93c0-.84-.33-1.65-.93-2.24L11.87 3.5a.9.9 0 0 0-1.53.64V8.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeedbackThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 3h3.2c.99 0 1.8.81 1.8 1.8V14c0 .99-.81 1.8-1.8 1.8H14V3Z" fill="currentColor" opacity="0.18" />
      <path d="M14 3h3.2c.99 0 1.8.81 1.8 1.8V14c0 .99-.81 1.8-1.8 1.8H14M14 3v12.8M14 3H6.96c-.85 0-1.59.58-1.79 1.41l-1.15 4.8A1.8 1.8 0 0 0 5.77 11.43H10v5.64c0 .84.33 1.65.93 2.24l1.2 1.19a.9.9 0 0 0 1.53-.64V15.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeedbackSendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 19 20 12 4 5l2.9 7L20 12 6.9 12 4 19Z" fill="currentColor" />
    </svg>
  );
}

export function DetailStatusBadge({ label }) {
  const tone = getDetailStatusTone(label);

  return <span className={`accessibility-map__status-pill is-${tone}`}>{label}</span>;
}

export function getMiniBadgeClassName(badge) {
  if (badge === '공공') {
    return 'is-public';
  }
  if (badge === 'A등급') {
    return 'is-grade is-grade-a';
  }
  if (badge === 'B등급') {
    return 'is-grade is-grade-b';
  }
  if (badge === 'C등급') {
    return 'is-grade is-grade-c';
  }
  return 'is-workplace';
}

function getDetailStatusTone(label) {
  return DETAIL_STATUS_TONE[label] || 'neutral';
}

export function getScoreGradeTone(score) {
  if (typeof score !== 'number') {
    return 'neutral';
  }
  if (score >= 80) {
    return 'good';
  }
  if (score >= 60) {
    return 'warning';
  }
  return 'danger';
}

function getDetailIconCategory(title) {
  if (title.includes('근무지') || title.includes('좌표') || title.includes('위치')) {
    return 'location';
  }
  if (title.includes('교통')) {
    return 'transfer';
  }
  if (title.includes('보행')) {
    return 'walker';
  }
  if (title.includes('휠체어') || title.includes('편의시설')) {
    return 'convenience';
  }
  return 'accessibility';
}

export function AccessibilityDetailIcon({ title, status }) {
  const category = getDetailIconCategory(title);
  const tone = getDetailStatusTone(status);
  const icon = DETAIL_STATUS_ICON_MAP[category]?.[tone] || DETAIL_STATUS_ICON_MAP.accessibility.neutral;

  return (
    <img
      className="accessibility-map__detail-status-icon"
      src={icon}
      alt={`${title} ${status} 아이콘`}
      loading="lazy"
      decoding="async"
    />
  );
}

function getVisibleCommuteStats(commuteStats = []) {
  return [
    ['time', commuteStats[0]],
    ['transfer', commuteStats[1]],
    ['walk', commuteStats[2]]
  ].filter(([, value]) => value && value !== '-');
}

function formatDurationMinutes(value) {
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) {
    return '';
  }

  const roundedMinutes = Math.max(0, Math.round(normalized));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (!hours) {
    return `${minutes}분`;
  }
  if (!minutes) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${minutes}분`;
}

function formatTransferCount(value) {
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(normalized) ? `환승 ${Math.max(0, Math.round(normalized))}회` : '';
}

function formatWalkDistance(value) {
  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) {
    return '';
  }

  return normalized >= 1000 ? `도보 ${(normalized / 1000).toFixed(1)}km` : `도보 ${Math.round(normalized)}m`;
}

function getExplanationCommuteStats(explanation) {
  const transitTime =
    explanation?.transitTime ||
    explanation?.transit_time ||
    explanation?.aiResponse?.result?.transit_time ||
    explanation?.aiResponse?.result?.transitTime;
  if (!transitTime || transitTime.error_reason || transitTime.errorReason) {
    return [];
  }

  const durationMinutes = transitTime.duration_minutes ?? transitTime.durationMinutes;
  const transferCount = transitTime.transfer_count ?? transitTime.transferCount;
  const walkDistanceMeters = transitTime.walk_distance_meters ?? transitTime.walkDistanceMeters;

  return getVisibleCommuteStats([
    durationMinutes != null ? `총 ${formatDurationMinutes(durationMinutes)}` : '',
    transferCount != null ? formatTransferCount(transferCount) : '',
    walkDistanceMeters != null ? formatWalkDistance(walkDistanceMeters) : ''
  ]);
}

function formatScoreLabel(score) {
  return typeof score === 'number' ? `${score}점` : '확인 필요';
}

function getDisplayGradeFromScore(score) {
  if (typeof score !== 'number') {
    return '확인 필요';
  }
  if (score >= 80) {
    return 'A등급';
  }
  if (score >= 60) {
    return 'B등급';
  }
  return 'C등급';
}

const ACCESSIBILITY_SCORE_HELP_SECTIONS = [
  {
    accent: '접근성 점수는',
    body: '채용공고, 회사 정보, 근무지 주변의 이동·편의 정보를 종합해 계산합니다.'
  },
  {
    accent: 'AI 스코어링을 켜면',
    body: '선택한 내 프로필을 반영해 공고별 점수를 다시 계산합니다.'
  },
  {
    accent: 'AI 스코어링을 끄면',
    body: '저장된 공고 정보를 기준으로 표시하며, 화면에서 선택한 필터만 적용됩니다.'
  },
  {
    body: '근로지원인 수행기관은 지도에 위치만 표시되며, 접근성 점수에는 반영되지 않습니다.'
  },
  {
    body: '이 점수는 공고를 비교하고 지원을 결정할 때 참고하기 위한 정보입니다. 실제 출퇴근 경로와 근무환경은 지원 전에 직접 확인해 주세요.'
  }
];

export function AccessibilityScoreHelpButton({ className = '', interactive = true }) {
  const tooltipId = useId();
  const trigger = interactive ? (
    <button
      type="button"
      className="accessibility-map__question-button"
      aria-label="접근성 점수 산정 기준 안내"
      aria-describedby={tooltipId}
    >
      ?
    </button>
  ) : (
    <span className="accessibility-map__question-button" aria-hidden="true">
      ?
    </span>
  );

  return (
    <span className={`accessibility-map__question ${className}`.trim()}>
      {trigger}
      <span id={tooltipId} className="accessibility-map__question-tooltip" role="tooltip">
        <strong className="accessibility-map__question-tooltip-title">AI 접근성 점수 안내</strong>
        {ACCESSIBILITY_SCORE_HELP_SECTIONS.map((section) => (
          <span
            key={`${section.accent || 'plain'}-${section.body}`}
            className={`accessibility-map__question-tooltip-block${section.accent ? ' is-emphasized' : ''}`}
          >
            {section.accent ? <strong>{section.accent}</strong> : null}
            <span>{section.body}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function getScoreRingOffset(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 100;
  }
  return 100 - Math.max(0, Math.min(100, score));
}

export function ScoreRing({ className, score, animationKey = 0 }) {
  return (
    <div
      className={className}
      style={{ '--score-ring-offset': String(getScoreRingOffset(score)) }}
      aria-label={typeof score === 'number' ? `${score}점` : '점수 확인 필요'}
    >
      <svg className="score-ring__chart" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="score-ring__track" cx="60" cy="60" r="52" />
        <circle key={`${animationKey}-${score ?? 'empty'}`} className="score-ring__value" cx="60" cy="60" r="52" pathLength="100" />
      </svg>
      <strong>{typeof score === 'number' ? score : '-'}</strong>
      <span>{typeof score === 'number' ? '/ 100' : ''}</span>
    </div>
  );
}

export function AccessibilityMapDetailPanel({
  job,
  selectedPersonaKey,
  selectedTab,
  isAiEnabled = true,
  explanation,
  explanationViewState,
  explanationErrorMessage,
  onChangeTab,
  onScrap,
  scrapErrorMessage = '',
  feedbackPending = false,
  feedbackErrorMessage = '',
  feedbackSuccessMessage = '',
  feedbackSubmitVersion = 0,
  onSubmitFeedback
}) {
  const accessibility = job.accessibilityByPersona[selectedPersonaKey];
  const effectiveSelectedTab = isAiEnabled ? selectedTab : 'job';
  const scoreTone = getScoreGradeTone(job.score);
  const [scoreRingAnimationKey, setScoreRingAnimationKey] = useState(0);
  const [selectedFeedbackReaction, setSelectedFeedbackReaction] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const visibleCommuteStats = getExplanationCommuteStats(explanation);
  const shortSummary = explanation?.shortSummary || explanation?.aiResponse?.result?.short_summary || '';
  const nextStepSummary = explanation?.nextStepSummary || explanation?.aiResponse?.result?.next_step_summary || '';
  const recommendedPrograms = explanation?.recommendedPrograms || explanation?.aiResponse?.result?.recommended_programs || [];
  const normalizedShortSummary = formatRecommendationExplanationText(shortSummary, job.score);
  const trimmedFeedbackComment = feedbackComment.trim();
  const isSendIconActive = Boolean(trimmedFeedbackComment);
  const canSubmitFeedback = Boolean(job.postingId && selectedFeedbackReaction && trimmedFeedbackComment && !feedbackPending);
  const scrapButtonLabel = !job.postingId ? '스크랩 불가' : job.scrappedByMe ? '스크랩 취소' : '공고 스크랩';
  const scrapButtonClassName = [
    'primary-button',
    'accessibility-map__scrap-button',
    job.scrappedByMe ? 'is-danger' : ''
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (effectiveSelectedTab !== 'accessibility') {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setScoreRingAnimationKey((key) => key + 1);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [effectiveSelectedTab, job.id, job.score]);

  useEffect(() => {
    setSelectedFeedbackReaction('');
    setFeedbackComment('');
  }, [job.id, feedbackSubmitVersion]);

  const handleFeedbackSubmit = () => {
    if (!canSubmitFeedback || typeof onSubmitFeedback !== 'function') {
      return;
    }

    onSubmitFeedback({
      reaction: selectedFeedbackReaction,
      comment: trimmedFeedbackComment
    });
  };

  return (
    <aside className="accessibility-map__detail-panel" aria-label="공고 상세 패널">
      <header className="accessibility-map__detail-header">
        <div className="accessibility-map__detail-header-top">
          {isAiEnabled ? (
            <div className="accessibility-map__badge-row">
              {job.badges.map((badge) => (
                <span
                  key={badge}
                  className={`accessibility-map__mini-badge ${getMiniBadgeClassName(badge)}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : <span />}
          {job.dueDateText ? <span>{job.dueDateText}</span> : null}
        </div>
        <div className="accessibility-map__title-row">
          <h2 data-i18n-skip>{job.title}</h2>
          {job.dueLabel ? <strong>{job.dueLabel}</strong> : null}
        </div>
        <p data-i18n-skip>{job.company}</p>
        {isAiEnabled ? (
          <div className="accessibility-map__tab-row" role="tablist" aria-label="상세 정보 탭">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveSelectedTab === 'accessibility'}
              className={`accessibility-map__tab-button${effectiveSelectedTab === 'accessibility' ? ' is-active' : ''}`}
              onClick={() => onChangeTab('accessibility')}
            >
              접근성 {formatScoreLabel(job.score)}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveSelectedTab === 'job'}
              className={`accessibility-map__tab-button${effectiveSelectedTab === 'job' ? ' is-active' : ''}`}
              onClick={() => onChangeTab('job')}
            >
              공고정보
            </button>
          </div>
        ) : null}
      </header>

      <div className="accessibility-map__detail-content">
        {effectiveSelectedTab === 'job' ? (
          <>
            <div className="accessibility-map__info-card is-highlighted">
              {job.dueLabel ? <div className="accessibility-map__highlight-badge">{job.dueLabel}</div> : null}
              <div>
                <strong>모집 마감까지</strong>
                <p data-i18n-skip>{job.dateRangeText}</p>
              </div>
            </div>
            <dl className="accessibility-map__definition-list">
              {job.jobInfo.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd data-i18n-skip>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {effectiveSelectedTab === 'accessibility' ? (
          <>
            <section className="accessibility-map__score-card">
              <div className="accessibility-map__score-header">
                <div className="accessibility-map__score-title">
                  <h3>접근성 점수</h3>
                  <AccessibilityScoreHelpButton />
                </div>
                <span className={`accessibility-map__score-badge is-${scoreTone}`}>{getDisplayGradeFromScore(job.score)}</span>
              </div>
              <div className="accessibility-map__score-body">
                <ScoreRing className={`accessibility-map__score-ring is-${scoreTone}`} score={job.score} animationKey={scoreRingAnimationKey} />
                <div className="accessibility-map__score-summary">
                  {explanationViewState === 'loading' ? (
                    <LlmExplanationProgress
                      className="llm-explanation-progress--score"
                      title="추천 요약 생성 중"
                      description="접근성 점수 근거와 지원 전 확인할 내용을 정리하고 있습니다."
                    />
                  ) : null}
                  {explanationViewState === 'error' ? (
                    <p role="alert">{explanationErrorMessage || '추천 요약을 불러오지 못했습니다.'}</p>
                  ) : null}
                  {explanationViewState === 'success' ? (
                    <>
                      <span className="jobs-detail__eyebrow">추천 요약</span>
                      <p>{normalizedShortSummary || '추천 설명을 확인했습니다.'}</p>
                    </>
                  ) : null}
                  {explanationViewState !== 'loading' && explanationViewState !== 'error' && explanationViewState !== 'success' ? (
                    <p>추천 요약을 불러오면 이곳에 표시됩니다.</p>
                  ) : null}
                </div>
              </div>
              {visibleCommuteStats.length ? (
                <div className="accessibility-map__score-stats">
                  {visibleCommuteStats.map(([type, value]) => (
                    <span key={type}><MetaIcon type={type} /> {value}</span>
                  ))}
                </div>
              ) : null}
              <div className="accessibility-map__score-legend">
                <span className="is-good">문제 없음</span>
                <span className="is-warning">주의</span>
                <span className="is-danger">불편/위험</span>
                <span className="is-neutral">데이터 미확인</span>
              </div>
            </section>

            <section className="accessibility-map__detail-section">
              <h3>상세정보 요약</h3>
              <ul className="accessibility-map__accessibility-list">
                {accessibility.detailItems.map(([title, description, status]) => (
                  <li key={`${title}-${status}`}>
                    <AccessibilityDetailIcon title={title} status={status} />
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <DetailStatusBadge label={status} />
                  </li>
                ))}
              </ul>
            </section>

            {recommendedPrograms.length ? (
              <section className="accessibility-map__detail-section">
                <div className="jobs-detail__explanation-card">
                  <section className="jobs-detail__explanation-section">
                    <h4>이런 준비가 도움이 될 수 있어요</h4>
                    {nextStepSummary ? <p>{nextStepSummary}</p> : null}
                    <strong className="jobs-detail__subheading">추천 프로그램</strong>
                    <ul className="jobs-detail__program-list">
                      {recommendedPrograms.map((program, index) => (
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
                  </section>
                </div>
              </section>
            ) : null}

            <section className="accessibility-map__feedback-card" aria-label="추천 설명 피드백">
              <div className="accessibility-map__feedback-header">
                <strong>설명이 마음에 드셨나요?</strong>
                <div className="accessibility-map__feedback-reaction-group" role="group" aria-label="피드백 반응 선택">
                  <button
                    type="button"
                    className={`accessibility-map__feedback-reaction${selectedFeedbackReaction === 'LIKE' ? ' is-selected is-like' : ''}${selectedFeedbackReaction === 'DISLIKE' ? ' is-dimmed' : ''}`}
                    aria-pressed={selectedFeedbackReaction === 'LIKE'}
                    aria-label="마음에 들어요"
                    onClick={() => setSelectedFeedbackReaction((current) => (current === 'LIKE' ? '' : 'LIKE'))}
                  >
                    <FeedbackThumbUpIcon />
                  </button>
                  <button
                    type="button"
                    className={`accessibility-map__feedback-reaction${selectedFeedbackReaction === 'DISLIKE' ? ' is-selected is-dislike' : ''}${selectedFeedbackReaction === 'LIKE' ? ' is-dimmed' : ''}`}
                    aria-pressed={selectedFeedbackReaction === 'DISLIKE'}
                    aria-label="마음에 들지 않아요"
                    onClick={() => setSelectedFeedbackReaction((current) => (current === 'DISLIKE' ? '' : 'DISLIKE'))}
                  >
                    <FeedbackThumbDownIcon />
                  </button>
                </div>
              </div>
              <div className="accessibility-map__feedback-input-row">
                <label className="accessibility-map__feedback-input-wrapper">
                  <span className="sr-only">피드백 입력</span>
                  <input
                    type="text"
                    className="accessibility-map__feedback-input"
                    value={feedbackComment}
                    maxLength={1000}
                    placeholder="생각하신 이유를 말씀해주세요"
                    onChange={(event) => setFeedbackComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        handleFeedbackSubmit();
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={`accessibility-map__feedback-send${isSendIconActive ? ' is-active' : ''}`}
                  aria-label="피드백 전송"
                  disabled={!canSubmitFeedback}
                  onClick={handleFeedbackSubmit}
                >
                  <FeedbackSendIcon />
                </button>
              </div>
              {feedbackErrorMessage ? <p className="accessibility-map__feedback-message is-error" role="alert">{feedbackErrorMessage}</p> : null}
              {feedbackSuccessMessage ? <p className="accessibility-map__feedback-message is-success" role="status">{feedbackSuccessMessage}</p> : null}
            </section>

            <div className="accessibility-map__source-note">
              <img src={infoIcon} alt="데이터 출처 안내 아이콘" loading="lazy" decoding="async" />
              <span><strong>데이터 출처</strong> · {accessibility.source.replace('데이터 출처 · ', '')}</span>
            </div>
          </>
        ) : null}
      </div>

      <footer className="accessibility-map__action-bar">
        {scrapErrorMessage ? (
          <div className="accessibility-map__scrap-error" role="alert">{scrapErrorMessage}</div>
        ) : null}
        <button
          type="button"
          className={scrapButtonClassName}
          aria-label={job.scrappedByMe ? '스크랩 취소 확인 열기' : '공고 스크랩'}
          disabled={!job.postingId}
          onClick={onScrap}
        >
          {scrapButtonLabel}
        </button>
      </footer>
    </aside>
  );
}
