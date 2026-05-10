const tabItems = [
  ['job', '공고 정보'],
  ['match', '직무 적합도'],
  ['company', '기업 정보'],
  ['checklist', '지원 체크리스트']
];

const checklistLabels = {
  profile: '내 프로필 필수 정보 입력 완료 여부',
  role: '지원 직무 입력 여부',
  skills: '보유 기술/역량 입력 여부',
  career: '경력/학력 정보 입력 여부',
  introduction: '필요 시 자기소개 작성 여부',
  requirements: '공고 요구조건 확인 여부'
};

function DefinitionGrid({ items }) {
  return (
    <dl className="jobs-detail__definition-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function NoticeBox({ children }) {
  return <div className="jobs-detail__notice">{children}</div>;
}

function normalizeExplanation(explanation) {
  const result = explanation?.aiResponse?.result || {};

  return {
    shortSummary: explanation?.shortSummary || result.short_summary || '',
    recommendationReasons: explanation?.recommendationReasons || result.recommendation_reasons || [],
    cautionPoints: explanation?.cautionPoints || result.caution_points || [],
    checklist: explanation?.checklist || result.checklist || []
  };
}

function JobBadgeRow({ job }) {
  return (
    <div className="jobs-detail__badges" aria-label="공고 특성">
      {job.isStandardWorkplace ? <span>표준사업장</span> : null}
      {job.prefersDisabled ? <span>장애인 우대</span> : null}
      {job.isDeadlineSoon ? <span>마감 임박</span> : null}
    </div>
  );
}

export function JobDetailPanel({
  job,
  selectedTab,
  isAiEnabled,
  explanation,
  explanationViewState,
  explanationErrorMessage,
  checklist,
  onChangeTab,
  onToggleChecklist
}) {
  if (!job) {
    return (
      <aside className="jobs-detail" aria-label="선택된 공고 상세">
        <div className="jobs-empty" role="status">
          <strong>공고를 선택해주세요.</strong>
          <p>왼쪽 목록에서 공고를 선택하면 상세 정보를 확인할 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  const jobInfo = [
    ['외부공고 ID', job.externalId],
    ['모집직종', job.occupation],
    ['고용형태', job.employmentType],
    ['입사유형', job.source.enterType],
    ['급여방식', job.source.salaryType],
    ['급여', job.salary],
    ['근무지역', job.location],
    ['요구경력', job.experience],
    ['요구학력', job.education],
    ['요구전공', job.major],
    ['요구자격증', job.certificates],
    ['등록일', job.registeredDate],
    ['모집기간', job.recruitmentPeriod],
    ['담당기관', job.agency],
    ['연락처', job.contact]
  ];

  const companyInfo = [
    ['사업장명', job.companyInfo.name],
    ['사업장 주소', job.companyInfo.address],
    ['표준사업장 여부', job.companyInfo.standardWorkplace],
    ['인증 상태', job.companyInfo.certification],
    ['담당기관', job.companyInfo.agency]
  ];
  const llmExplanation = normalizeExplanation(explanation);
  const llmExplanationItems = [
    ...llmExplanation.recommendationReasons.map((text) => ['추천 이유', text]),
    ...llmExplanation.cautionPoints.map((text) => ['주의점', text]),
    ...llmExplanation.checklist.map((text) => ['체크리스트', text])
  ];

  return (
    <aside className="jobs-detail" aria-label="선택된 공고 상세">
      <header className="jobs-detail__header">
        <div className="jobs-detail__header-top">
          {job.dueLabel ? (
            <strong className="jobs-detail__dday" aria-label={`마감까지 ${job.dueLabel.replace('D-', '')}일`}>
              {job.dueLabel}
            </strong>
          ) : null}
          <div className="jobs-detail__actions">
            <button type="button" className="secondary-button" aria-label="관심 공고로 저장">
              저장
            </button>
            <button type="button" className="secondary-button" aria-label="공고 공유">
              공유
            </button>
            <button type="button" className="primary-button">
              지원하기
            </button>
          </div>
        </div>
        <h2>{job.title}</h2>
        <p>{job.company}</p>
        <JobBadgeRow job={job} />
        <section className="jobs-detail__summary" aria-label="공고 핵심 요약">
          <div>
            <span>급여</span>
            <strong>{job.salary}</strong>
          </div>
          <div>
            <span>근무지역</span>
            <strong>{job.location}</strong>
          </div>
          <div>
            <span>고용형태</span>
            <strong>{job.employmentType}</strong>
          </div>
          <div>
            <span>입사유형</span>
            <strong>{job.source.enterType}</strong>
          </div>
          <div>
            <span>모집기간</span>
            <strong>{job.recruitmentPeriod}</strong>
          </div>
        </section>
        <div className="jobs-detail__tabs" role="tablist" aria-label="공고 상세 탭">
          {tabItems.map(([id, label]) => {
            const isDisabled = id === 'match' && !isAiEnabled;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selectedTab === id}
                aria-disabled={isDisabled}
                className={`jobs-detail__tab${selectedTab === id ? ' is-active' : ''}`}
                onClick={() => {
                  if (!isDisabled) {
                    onChangeTab(id);
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="jobs-detail__body">
        {!isAiEnabled ? (
          <NoticeBox>AI 직무 적합도를 켜면 선택 프로필 기준으로 공고와의 일치도를 확인할 수 있습니다.</NoticeBox>
        ) : null}

        {selectedTab === 'job' ? <DefinitionGrid items={jobInfo} /> : null}

        {selectedTab === 'match' && isAiEnabled ? (
          <section className="jobs-detail__match" aria-label="직무 적합도 상세">
            <div className="jobs-detail__score-card">
              <span>총 직무 적합도 점수</span>
              <strong>{typeof job.match.score === 'number' ? `${job.match.score}점` : '정보 부족'}</strong>
              <em>{job.match.grade}</em>
            </div>
            <section className="jobs-detail__decision-card" aria-label="지원 판단 요약">
              <h3>지원 전 빠른 판단</h3>
              <p>{job.match.reasons[0]}</p>
              <p>{job.match.caution[0]}</p>
            </section>
            <section className="jobs-detail__section" aria-label="AI 추천 설명">
              <h3>AI 추천 설명</h3>
              {explanationViewState === 'loading' ? (
                <NoticeBox>추천 설명을 불러오는 중입니다.</NoticeBox>
              ) : null}
              {explanationViewState === 'error' ? (
                <NoticeBox>{explanationErrorMessage || '추천 설명을 불러오지 못했습니다.'}</NoticeBox>
              ) : null}
              {explanationViewState === 'success' ? (
                llmExplanationItems.length ? (
                  <div className="jobs-detail__explanation-card">
                    <strong>{llmExplanation.shortSummary || '추천 설명을 확인했습니다.'}</strong>
                    <ul className="jobs-detail__status-list">
                      {llmExplanationItems.map(([label, text], index) => (
                        <li key={`${label}-${text}-${index}`}>
                          <span>{label}</span>
                          <p>{text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <NoticeBox>추천 설명 세부 항목이 없습니다. 공고 정보와 적합도 점수를 함께 확인해주세요.</NoticeBox>
                )
              ) : null}
              {explanationViewState === 'idle' ? (
                <NoticeBox>직무 적합도 점수가 확인되면 AI 추천 설명을 함께 표시합니다.</NoticeBox>
              ) : null}
            </section>
            <DefinitionGrid
              items={[
                ['지원 직무와 공고 직무의 일치 여부', job.match.roleFit],
                ['학력 조건 일치 여부', job.match.education],
                ['경력 조건 일치 여부', job.match.experience]
              ]}
            />
            <section className="jobs-detail__section">
              <h3>보유 기술/역량과 공고 요구사항 비교</h3>
              <ul className="jobs-detail__status-list">
                {job.match.skills.map(([skill, status]) => (
                  <li key={skill}>
                    <span>{skill}</span>
                    <strong>{status}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section className="jobs-detail__section">
              <h3>긍정 요인</h3>
              <ul>{job.match.positive.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section className="jobs-detail__section">
              <h3>주의 요인</h3>
              <ul>{job.match.caution.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section className="jobs-detail__section">
              <h3>부족 정보</h3>
              <ul>{job.match.missing.map((item) => <li key={item}>{item} · 확인 필요</li>)}</ul>
            </section>
            <NoticeBox>AI 설명은 프로필 정보와 공고 정보를 바탕으로 계산한 참고용이며, 채용 여부를 보장하지 않습니다.</NoticeBox>
          </section>
        ) : null}

        {selectedTab === 'company' ? (
          <>
            <DefinitionGrid items={companyInfo} />
            <NoticeBox>
              기업 안정성/채용 친화도는 접근성 지도 화면의 종합 점수 대상이므로 여기서는 간단한 참고 정보로만 표시합니다.
            </NoticeBox>
          </>
        ) : null}

        {selectedTab === 'checklist' ? (
          <section className="jobs-detail__section" aria-label="지원 체크리스트">
            <div className="jobs-checklist">
              {Object.entries(checklistLabels).map(([key, label]) => (
                <label key={key} className="jobs-checklist__item">
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[key])}
                    onChange={() => onToggleChecklist(key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <footer className="jobs-detail__footer">
        <p>직무 적합도는 프로필 정보와 공고 정보를 바탕으로 계산한 참고 지표입니다.</p>
        <p>기업의 실제 채용 판단과 다를 수 있습니다.</p>
        <p>정보가 부족한 항목은 확인 필요로 표시됩니다.</p>
      </footer>
    </aside>
  );
}
