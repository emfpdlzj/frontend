import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
import { JobFilterBar } from '../components/jobs/JobFilterBar';
import { JobListPanel } from '../components/jobs/JobListPanel';
import { StatusMessage } from '../components/common/StatusMessage';
import { useJobFilterOptions } from '../hooks/useJobFilterOptions';
import { useQuickJobsMock } from '../hooks/useQuickJobsMock';

function ProfileBanner({ profileStatus }) {
  if (profileStatus.kind === 'ready') {
    return null;
  }

  if (profileStatus.kind === 'none') {
    return (
      <StatusMessage kind="warning">
        퀵 맞춤 일자리 추천을 보려면 로그인 후 프로필을 선택해주세요.
      </StatusMessage>
    );
  }

  return (
    <div className="jobs-profile-banner" role="status">
      <div>
        <strong>프로필 필수 정보가 부족합니다.</strong>
        <ul>
          {profileStatus.missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="secondary-button">프로필 수정하기</button>
    </div>
  );
}

export function JobsPage() {
  const {
    profiles,
    filterValues,
    jobs,
    totalJobCount,
    selectedJob,
    selectedJobId,
    selectedProfileId,
    selectedTab,
    sortKey,
    viewState,
    errorMessage,
    explanation,
    explanationViewState,
    explanationErrorMessage,
    profileStatus,
    isAiEnabled,
    isAdvancedOpen,
    checklist,
    setSelectedProfileId,
    setSelectedJobId,
    setSelectedTab,
    setSortKey,
    reloadRecommendations,
    setIsAdvancedOpen,
    onChangeFilter,
    onResetFilters,
    onToggleAi,
    onToggleChecklist
  } = useQuickJobsMock();
  const filterOptions = useJobFilterOptions();

  return (
    <main className="jobs-page">
      <header className="jobs-page__header">
        <div>
          <h1>퀵 맞춤 일자리 추천</h1>
          <p>최신 공고를 기준으로 선택한 프로필과의 직무 적합도를 빠르게 확인할 수 있습니다.</p>
        </div>
      </header>

      <section className="jobs-control-card" aria-label="프로필 및 AI 직무 적합도 설정">
        <div className="jobs-profile-card">
          <div className="jobs-profile-card__main">
            <label htmlFor="jobs-profile">추천 기준 프로필</label>
            <select
              id="jobs-profile"
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              {!profiles.length ? <option value="">프로필 없음</option> : null}
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.isDefault ? '기본 프로필 · ' : ''}{profile.name} ({profile.role})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="jobs-ai-toggle">
          <button
            type="button"
            role="switch"
            aria-checked={isAiEnabled}
            className={isAiEnabled ? 'is-on' : ''}
            onClick={onToggleAi}
          >
            <span aria-hidden="true" />
            AI 직무 적합도 {isAiEnabled ? 'ON' : 'OFF'}
          </button>
          <p>AI 적합도는 참고용이며 채용 여부를 보장하지 않습니다.</p>
        </div>
      </section>

      <ProfileBanner profileStatus={profileStatus} />

      {viewState === 'loading' ? (
        <div className="jobs-feedback" role="status">최신 공고를 불러오는 중입니다.</div>
      ) : null}

      {viewState === 'calculating' ? (
        <div className="jobs-feedback" role="status">선택한 프로필 기준으로 직무 적합도를 다시 계산하는 중입니다.</div>
      ) : null}

      {viewState === 'error' ? (
        <div className="jobs-feedback is-error" role="alert">
          <strong>{errorMessage || '공고 목록을 불러오지 못했습니다.'}</strong>
          <button type="button" className="secondary-button" onClick={reloadRecommendations}>다시 시도</button>
        </div>
      ) : null}

      {viewState === 'analysisError' ? (
        <div className="jobs-feedback is-warning" role="alert">
          <strong>현재 직무 적합도 계산이 지연되고 있습니다. 최신 공고는 계속 확인할 수 있습니다.</strong>
          <button type="button" className="secondary-button" onClick={reloadRecommendations}>재시도</button>
        </div>
      ) : null}

      <div className="jobs-workspace">
        <JobFilterBar
          isAdvancedOpen={isAdvancedOpen}
          filterValues={filterValues}
          optionState={filterOptions}
          sortKey={sortKey}
          onChangeFilter={onChangeFilter}
          onChangeSort={setSortKey}
          onResetFilters={onResetFilters}
          onToggleAdvanced={() => setIsAdvancedOpen((current) => !current)}
        />
        <div className="jobs-page__content">
          <JobListPanel
            jobs={jobs}
            totalJobCount={totalJobCount}
            selectedJobId={selectedJobId}
            isAiEnabled={isAiEnabled && viewState !== 'analysisError'}
            viewState={viewState}
            onSelectJob={setSelectedJobId}
            onResetFilters={onResetFilters}
          />
          <JobDetailPanel
            job={selectedJob}
            selectedTab={selectedTab}
            isAiEnabled={isAiEnabled && viewState !== 'analysisError'}
            explanation={explanation}
            explanationViewState={explanationViewState}
            explanationErrorMessage={explanationErrorMessage}
            checklist={checklist}
            onChangeTab={setSelectedTab}
            onToggleChecklist={onToggleChecklist}
          />
        </div>
      </div>
    </main>
  );
}
