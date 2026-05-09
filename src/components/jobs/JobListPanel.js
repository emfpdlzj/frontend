function MatchSummary({ job, isAiEnabled }) {
  if (!isAiEnabled) {
    return <div className="jobs-card__match is-off">AI 적합도 꺼짐</div>;
  }

  const hasScore = typeof job.match.score === 'number';

  return (
    <div className={`jobs-card__match ${hasScore ? 'is-scored' : 'is-unknown'}`}>
      <span className="jobs-card__match-badge">{hasScore ? job.match.grade : '확인 필요'}</span>
      <strong>
        {hasScore ? `직무 적합도 ${job.match.score}점 · ${job.match.grade}` : '정보 부족 · 확인 필요'}
      </strong>
      <p>{job.match.reasons[0]}</p>
    </div>
  );
}

export function JobListPanel({ jobs, selectedJobId, isAiEnabled, viewState, onSelectJob }) {
  const isProfileBlocked = viewState === 'noProfile';

  return (
    <section className="jobs-list-panel" aria-label="추천 공고 목록">
      <div className="jobs-list-panel__header">
        <div>
          <h2>추천 공고 {jobs.length}건</h2>
          <p>{isAiEnabled ? '기능2 API 응답의 job_fit_score를 공고별로 함께 표시합니다.' : 'AI OFF 상태로 Spring DB 최신 공고만 표시합니다.'}</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="jobs-empty" role="status">
          <strong>{isProfileBlocked ? '프로필 선택이 필요합니다.' : '조건에 맞는 공고가 없습니다.'}</strong>
          <p>
            {isProfileBlocked
              ? '로그인 후 프로필을 선택하면 기능2 퀵 맞춤 일자리 추천 API를 호출합니다.'
              : '검색어나 상세 필터를 줄이면 더 많은 공고를 확인할 수 있습니다.'}
          </p>
          {!isProfileBlocked ? <button type="button" className="secondary-button">필터 초기화</button> : null}
        </div>
      ) : (
        <div className="jobs-list-panel__list">
          {jobs.map((job) => {
            const isSelected = selectedJobId === job.id;

            return (
              <button
                key={job.id}
                type="button"
                className={`jobs-card${isSelected ? ' is-selected' : ''}`}
                aria-pressed={isSelected}
                aria-label={`${job.title}, ${job.company}, ${job.dueLabel}, ${isSelected ? '선택된 공고' : '공고 선택'}`}
                onClick={() => onSelectJob(job.id)}
              >
                <div className="jobs-card__top">
                  <span className="jobs-card__company">{job.company}</span>
                  <strong className="jobs-card__dday" aria-label={`마감까지 ${job.dueLabel.replace('D-', '')}일`}>
                    {job.dueLabel}
                  </strong>
                </div>
                <div className="jobs-card__headline">
                  <strong className="jobs-card__title">{job.title}</strong>
                  {isSelected ? <em>현재 선택됨</em> : null}
                </div>
                <div className="jobs-card__badges" aria-label="공고 배지">
                  <span>{job.occupation}</span>
                  {job.isStandardWorkplace ? <span>표준사업장</span> : null}
                  {job.prefersDisabled ? <span>장애인 우대</span> : null}
                </div>
                <dl className="jobs-card__quick-meta">
                  <div><dt>지역</dt><dd>{job.location}</dd></div>
                  <div><dt>{job.source.salaryType}</dt><dd>{job.salary}</dd></div>
                  <div><dt>입사유형</dt><dd>{job.source.enterType}</dd></div>
                </dl>
                <dl className="jobs-card__sub-meta">
                  <div><dt>고용형태</dt><dd>{job.employmentType}</dd></div>
                  <div><dt>요구경력</dt><dd>{job.experience}</dd></div>
                  <div><dt>요구학력</dt><dd>{job.education}</dd></div>
                </dl>
                <MatchSummary job={job} isAiEnabled={isAiEnabled} />
                <span className="jobs-card__source">외부공고 ID {job.externalId}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
