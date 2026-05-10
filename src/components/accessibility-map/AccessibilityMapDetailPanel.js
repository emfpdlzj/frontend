import infoIcon from '../../assets/accessibility-map/info-icon.png';
import timeIcon from '../../assets/accessibility-map/time-icon.png';
import transferIcon from '../../assets/accessibility-map/transfer-icon.svg';
import walkIcon from '../../assets/accessibility-map/walk-icon.png';
import warningIcon from '../../assets/accessibility-map/warning-icon.svg';

function MetaIcon({ type }) {
  if (type === 'time') {
    return <img className="accessibility-map__meta-icon" src={timeIcon} alt="이동 시간 아이콘" />;
  }
  if (type === 'transfer') {
    return <img className="accessibility-map__meta-icon" src={transferIcon} alt="환승 횟수 아이콘" />;
  }
  return <img className="accessibility-map__meta-icon is-walk" src={walkIcon} alt="도보 이동 아이콘" />;
}

function DetailStatusBadge({ label }) {
  const tone =
    label === '접근 양호' ? 'good' : label === '주의 필요' ? 'warning' : label === '접근 어려움' ? 'danger' : 'neutral';

  return <span className={`accessibility-map__status-pill is-${tone}`}>{label}</span>;
}

function formatScoreLabel(score) {
  return typeof score === 'number' ? `${score}점` : '확인 필요';
}

function openNaverMapSearch(address) {
  if (!address || address === '근무지 확인 필요') {
    return;
  }

  window.open(`https://map.naver.com/p/search/${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
}

export function AccessibilityMapDetailPanel({
  job,
  selectedPersonaKey,
  selectedTab,
  explanation,
  explanationViewState,
  explanationErrorMessage,
  onChangeTab
}) {
  const accessibility = job.accessibilityByPersona[selectedPersonaKey];
  const recommendationReasons = explanation?.recommendationReasons || explanation?.aiResponse?.result?.recommendation_reasons || [];
  const cautionPoints = explanation?.cautionPoints || explanation?.aiResponse?.result?.caution_points || [];
  const checklist = explanation?.checklist || explanation?.aiResponse?.result?.checklist || [];
  const shortSummary = explanation?.shortSummary || explanation?.aiResponse?.result?.short_summary || '';

  return (
    <aside className="accessibility-map__detail-panel" aria-label="공고 상세 패널">
      <header className="accessibility-map__detail-header">
        <div className="accessibility-map__detail-header-top">
          <div className="accessibility-map__badge-row">
            {job.badges.map((badge) => (
              <span
                key={badge}
                className={`accessibility-map__mini-badge ${
                  badge === '공공' ? 'is-public' : badge.includes('등급') ? 'is-grade' : 'is-workplace'
                }`}
              >
                {badge}
              </span>
            ))}
          </div>
          {job.dueDateText ? <span>{job.dueDateText}</span> : null}
        </div>
        <div className="accessibility-map__title-row">
          <h2>{job.title}</h2>
          {job.dueLabel ? <strong>{job.dueLabel}</strong> : null}
        </div>
        <p>{job.company}</p>
        <div className="accessibility-map__tab-row" role="tablist" aria-label="상세 정보 탭">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'accessibility'}
            className={`accessibility-map__tab-button${selectedTab === 'accessibility' ? ' is-active' : ''}`}
            onClick={() => onChangeTab('accessibility')}
          >
            접근성 {formatScoreLabel(job.score)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'job'}
            className={`accessibility-map__tab-button${selectedTab === 'job' ? ' is-active' : ''}`}
            onClick={() => onChangeTab('job')}
          >
            공고정보
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'company'}
            className={`accessibility-map__tab-button${selectedTab === 'company' ? ' is-active' : ''}`}
            onClick={() => onChangeTab('company')}
          >
            기업정보
          </button>
        </div>
      </header>

      <div className="accessibility-map__detail-content">
        {selectedTab === 'job' ? (
          <>
            <div className="accessibility-map__info-card is-highlighted">
              {job.dueLabel ? <div className="accessibility-map__highlight-badge">{job.dueLabel}</div> : null}
              <div>
                <strong>모집 마감까지</strong>
                <p>{job.dateRangeText}</p>
              </div>
            </div>
            <dl className="accessibility-map__definition-list">
              {job.jobInfo.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {selectedTab === 'company' ? (
          <>
            <div className="accessibility-map__company-card">
              <div className="accessibility-map__company-initial" aria-hidden="true">{job.companyInfo.initial}</div>
              <div>
                <strong>{job.companyInfo.name}</strong>
                <p>{job.companyInfo.type}</p>
              </div>
            </div>
            <section className="accessibility-map__detail-section">
              <h3>사업장 주소</h3>
              <div className="accessibility-map__muted-box">{job.companyInfo.address}</div>
            </section>
            <div className="accessibility-map__company-grid">
              <div className="accessibility-map__muted-box">
                <span>기업 형태</span>
                <strong>{job.companyInfo.type}</strong>
              </div>
              <div className="accessibility-map__muted-box is-accent">
                <span>표준사업장</span>
                <strong>{job.companyInfo.workplaceType}</strong>
              </div>
            </div>
            <section className="accessibility-map__detail-section">
              <h3>장애인 고용 현황</h3>
              <div className="accessibility-map__hiring-card">
                <div className="accessibility-map__hiring-header">
                  <strong>{job.companyInfo.hiringRate}</strong>
                  <span>법정 의무율 {job.companyInfo.legalRate}</span>
                </div>
                <p>{job.companyInfo.hiringSummary}</p>
              </div>
            </section>
          </>
        ) : null}

        {selectedTab === 'accessibility' ? (
          <>
            <section className="accessibility-map__score-card">
              <div className="accessibility-map__score-header">
                <h3>접근성 점수</h3>
                <button type="button" className="accessibility-map__question-button" aria-label="접근성 점수 안내">
                  ?
                </button>
              </div>
              <div className="accessibility-map__score-body">
                <div className="accessibility-map__score-ring">
                  <strong>{job.score}</strong>
                  <span>{typeof job.score === 'number' ? '/ 100' : ''}</span>
                </div>
                <div className="accessibility-map__score-summary">
                  <span className="accessibility-map__score-badge">{accessibility.panelBadge}</span>
                  <strong>{accessibility.headline}</strong>
                  <p>{accessibility.description}</p>
                </div>
              </div>
              <div className="accessibility-map__score-stats">
                <span><MetaIcon type="time" /> {accessibility.commuteStats[0]}</span>
                <span><MetaIcon type="transfer" /> {accessibility.commuteStats[1]}</span>
                <span><MetaIcon type="walk" /> {accessibility.commuteStats[2]}</span>
              </div>
              <div className="accessibility-map__score-legend">
                <span className="is-good">문제 없음</span>
                <span className="is-warning">주의</span>
                <span className="is-danger">불편/위험</span>
                <span className="is-neutral">데이터 미확인</span>
              </div>
            </section>

            <section className="accessibility-map__detail-section">
              <h3>추천 설명</h3>
              {explanationViewState === 'loading' ? (
                <div className="accessibility-map__muted-box" role="status">추천 이유를 불러오는 중입니다.</div>
              ) : null}
              {explanationViewState === 'error' ? (
                <div className="accessibility-map__muted-box" role="alert">
                  {explanationErrorMessage || '추천 설명을 불러오지 못했습니다.'}
                </div>
              ) : null}
              {explanationViewState === 'success' ? (
                <div className="accessibility-map__info-card">
                  <strong>{shortSummary || '추천 설명을 확인했습니다.'}</strong>
                  <ul className="accessibility-map__accessibility-list">
                    {[...recommendationReasons, ...cautionPoints, ...checklist].map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <img className="accessibility-map__warning-icon" src={warningIcon} alt="확인 필요 아이콘" />
                        <div>
                          <strong>{index < recommendationReasons.length ? '추천 이유' : index < recommendationReasons.length + cautionPoints.length ? '주의점' : '체크리스트'}</strong>
                          <p>{item}</p>
                        </div>
                        <DetailStatusBadge label={index < recommendationReasons.length ? '접근 양호' : '확인 필요'} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="accessibility-map__detail-section">
              <h3>상세정보</h3>
              <ul className="accessibility-map__accessibility-list">
                {accessibility.detailItems.map(([title, description, status]) => (
                  <li key={`${title}-${status}`}>
                    <img className="accessibility-map__warning-icon" src={warningIcon} alt="접근성 상태 아이콘" />
                    <div>
                      <strong>{title}</strong>
                      <p>{description}</p>
                    </div>
                    <DetailStatusBadge label={status} />
                  </li>
                ))}
              </ul>
            </section>

            <div className="accessibility-map__source-note">
              <img src={infoIcon} alt="데이터 출처 안내 아이콘" />
              <span><strong>데이터 출처</strong> · {accessibility.source.replace('데이터 출처 · ', '')}</span>
            </div>
          </>
        ) : null}
      </div>

      <footer className="accessibility-map__action-bar">
        <button type="button" className="accessibility-map__icon-action" aria-label="관심 공고 저장 API 확인 필요" disabled>
          ♡
        </button>
        <button
          type="button"
          className="secondary-button accessibility-map__route-button"
          disabled={!job.companyInfo.address || job.companyInfo.address === '근무지 확인 필요'}
          onClick={() => openNaverMapSearch(job.companyInfo.address)}
        >
          경로 안내
        </button>
        <button type="button" className="primary-button accessibility-map__apply-button" disabled>
          지원 정보 확인 필요
        </button>
      </footer>
    </aside>
  );
}
