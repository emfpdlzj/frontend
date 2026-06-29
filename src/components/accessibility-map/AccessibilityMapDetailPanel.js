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

const ACCESSIBILITY_SCORE_HELP_TEXT = [
  '접근성 점수는 공고 정보, 회사 정보, 근무지 주변 이동 정보를 함께 보고 계산합니다.',
  'AI 스코어링을 켜면 선택한 내 프로필에 맞춰 점수를 다시 계산합니다.',
  'AI 스코어링을 끄면 저장된 공고 정보를 기준으로 보여주고, 화면에서 고른 필터만 적용합니다.',
  '근로지원인 수행기관은 지도에 위치만 표시되며 점수에는 들어가지 않습니다.',
  '이 점수는 지원을 돕는 참고 정보입니다. 실제 출퇴근 경로와 사업장 환경은 지원 전 다시 확인해주세요.'
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
        {ACCESSIBILITY_SCORE_HELP_TEXT.map((text) => (
          <span key={text}>{text}</span>
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
  scrapErrorMessage = ''
}) {
  const accessibility = job.accessibilityByPersona[selectedPersonaKey];
  const effectiveSelectedTab = isAiEnabled ? selectedTab : 'job';
  const scoreTone = getScoreGradeTone(job.score);
  const [scoreRingAnimationKey, setScoreRingAnimationKey] = useState(0);
  const visibleCommuteStats = getVisibleCommuteStats(accessibility.commuteStats);
  const shortSummary = explanation?.shortSummary || explanation?.aiResponse?.result?.short_summary || '';
  const nextStepSummary = explanation?.nextStepSummary || explanation?.aiResponse?.result?.next_step_summary || '';
  const recommendedPrograms = explanation?.recommendedPrograms || explanation?.aiResponse?.result?.recommended_programs || [];
  const normalizedShortSummary = formatRecommendationExplanationText(shortSummary, job.score);

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
          className="primary-button accessibility-map__scrap-button"
          aria-label={job.scrappedByMe ? '스크랩 취소 확인 열기' : '공고 스크랩'}
          disabled={!job.postingId}
          onClick={onScrap}
        >
          {!job.postingId ? '스크랩 불가' : job.scrappedByMe ? '스크랩 완료' : '공고 스크랩'}
        </button>
      </footer>
    </aside>
  );
}
