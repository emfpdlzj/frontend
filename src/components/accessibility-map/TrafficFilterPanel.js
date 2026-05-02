const STATUS_CLASS_BY_BADGE = {
  공공: 'public',
  A등급: 'grade',
  표준사업장: 'workplace'
};

export function TrafficFilterPanel({
  filterGroups,
  jobs,
  persona,
  selectedJobId,
  viewState,
  onSelectJob
}) {
  const resultCount = viewState === 'empty' ? 0 : jobs.length;

  return (
    <aside className="accessibility-map__filter-panel" aria-label="교통 필터">
      <header className="accessibility-map__filter-header">
        <h2>교통 필터</h2>
        <p>
          <span className="accessibility-map__info-badge" aria-hidden="true">
            i
          </span>
          드래그하여 검색 우선순위를 설정해보세요.
        </p>
      </header>

      <div className="accessibility-map__filter-list">
        {filterGroups.map(([title, chips, priority]) => (
          <section key={title} className="accessibility-map__filter-group">
            <div className="accessibility-map__filter-title-row">
              <span className="accessibility-map__filter-priority">{priority}</span>
              <div>
                <h3>{title}</h3>
                <div className="accessibility-map__chip-row">
                  {chips.map((chip, chipIndex) => (
                    <button
                      key={chip}
                      type="button"
                      className={`accessibility-map__chip${chipIndex === 1 ? ' is-selected' : ''}`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="accessibility-map__drag-handle" aria-label={`${title} 우선순위 조정`}>
                <span />
                <span />
                <span />
              </button>
            </div>
          </section>
        ))}

        <section className="accessibility-map__filter-group">
          <div className="accessibility-map__filter-title-row">
            <span className="accessibility-map__filter-priority">4</span>
            <div>
              <h3>{persona.filterLabel}</h3>
              <div className="accessibility-map__chip-row">
                {persona.filterChips.map((chip) => (
                  <button key={chip} type="button" className="accessibility-map__chip accessibility-map__chip-dashed">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="accessibility-map__drag-handle" aria-label={`${persona.filterLabel} 우선순위 조정`}>
              <span />
              <span />
              <span />
            </button>
          </div>
        </section>
      </div>

      <div className="accessibility-map__results-header">
        <h3>검색 결과 {resultCount}개</h3>
        <button type="button" className="accessibility-map__sort-button">
          접근성 점수 높은순
        </button>
      </div>

      {viewState === 'empty' ? (
        <div className="accessibility-map__empty-panel" role="status">
          현재 조건에 맞는 공고가 없습니다.
          <br />
          필터 조건을 완화해보세요.
        </div>
      ) : (
        <div className="accessibility-map__job-list" aria-label="공고 목록">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              className={`accessibility-map__job-card${selectedJobId === job.id ? ' is-selected' : ''}`}
              onClick={() => onSelectJob(job.id)}
            >
              <div className="accessibility-map__job-card-top">
                <div className="accessibility-map__badge-row">
                  {job.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`accessibility-map__mini-badge ${
                        STATUS_CLASS_BY_BADGE[badge] ? `is-${STATUS_CLASS_BY_BADGE[badge]}` : ''
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <strong className="accessibility-map__dday">{job.dueLabel}</strong>
              </div>
              <strong className="accessibility-map__job-company">{job.company}</strong>
              <p className="accessibility-map__job-title">{job.title}</p>
              <div className="accessibility-map__job-meta">
                <span>통근 <strong>{job.commuteMinutes}분</strong></span>
                <span>고용 <strong>{job.employmentType}</strong></span>
              </div>
              <div className="accessibility-map__job-pay">임금 <strong>{job.payText}</strong></div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
