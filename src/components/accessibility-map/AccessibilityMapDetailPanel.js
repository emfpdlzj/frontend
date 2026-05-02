function MetaIcon({ type }) {
  if (type === 'time') {
    return <span className="accessibility-map__meta-icon">◔</span>;
  }
  if (type === 'transfer') {
    return <span className="accessibility-map__meta-icon">⟳</span>;
  }
  return <span className="accessibility-map__meta-icon">🚶</span>;
}

function DetailStatusBadge({ label }) {
  const tone =
    label === '접근 양호' ? 'good' : label === '주의 필요' ? 'warning' : label === '접근 어려움' ? 'danger' : 'neutral';

  return <span className={`accessibility-map__status-pill is-${tone}`}>{label}</span>;
}

export function AccessibilityMapDetailPanel({ job, selectedPersonaKey, selectedTab, onChangeTab }) {
  const accessibility = job.accessibilityByPersona[selectedPersonaKey];

  return (
    <aside className="accessibility-map__detail-panel" aria-label="공고 상세 패널">
      <header className="accessibility-map__detail-header">
        <div className="accessibility-map__badge-row">
          <span className="accessibility-map__mini-badge is-public">공공</span>
          <span className="accessibility-map__mini-badge is-workplace">표준사업장</span>
        </div>
        <div className="accessibility-map__deadline-row">
          <span>{job.dueDateText}</span>
          <strong>{job.dueLabel}</strong>
        </div>
        <h2>{job.title}</h2>
        <p>{job.company}</p>
        <div className="accessibility-map__tab-row" role="tablist" aria-label="상세 정보 탭">
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'accessibility'}
            className={`accessibility-map__tab-button${selectedTab === 'accessibility' ? ' is-active' : ''}`}
            onClick={() => onChangeTab('accessibility')}
          >
            접근성 {job.score}점
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
              <div className="accessibility-map__highlight-badge">{job.dueLabel}</div>
              <div>
                <strong>모집 마감까지</strong>
                <p>2026.04.15 ~ 2026.04.25</p>
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
              <div className="accessibility-map__company-icon">서</div>
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
                <div className="accessibility-map__progress-track" aria-hidden="true">
                  <div className="accessibility-map__progress-value" />
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
                  <span>/ 100</span>
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
              <h3>상세정보</h3>
              <ul className="accessibility-map__accessibility-list">
                {accessibility.detailItems.map(([title, description, status]) => (
                  <li key={`${title}-${status}`}>
                    <span className="accessibility-map__warning-icon" aria-hidden="true">
                      △
                    </span>
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
              <strong>데이터 출처</strong> · {accessibility.source.replace('데이터 출처 · ', '')}
            </div>
          </>
        ) : null}
      </div>

      <footer className="accessibility-map__action-bar">
        <button type="button" className="accessibility-map__icon-action" aria-label="관심 공고 저장">
          ♡
        </button>
        <button type="button" className="secondary-button accessibility-map__route-button">
          경로 안내
        </button>
        <button type="button" className="primary-button accessibility-map__apply-button">
          지원하기
        </button>
      </footer>
    </aside>
  );
}
