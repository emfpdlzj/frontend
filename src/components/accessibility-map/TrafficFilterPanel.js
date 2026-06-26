import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import infoIcon from '../../assets/accessibility-map/info-icon.png';
import triangleDownBlue from '../../assets/accessibility-map/triangle-down-blue.png';

const STATUS_CLASS_BY_BADGE = {
  공공: 'is-public',
  A등급: 'is-grade is-grade-a',
  B등급: 'is-grade is-grade-b',
  C등급: 'is-grade is-grade-c',
  표준사업장: 'is-workplace'
};

const getScoreBadgeClassName = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 'is-grade';
  }
  if (score >= 80) {
    return 'is-grade is-grade-a';
  }
  if (score >= 60) {
    return 'is-grade is-grade-b';
  }
  return 'is-grade is-grade-c';
};

const formatScoreBadge = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null;
  }
  return `${Math.round(score)}점`;
};

const formatCommuteMinutes = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return value || '-';
  }

  const roundedMinutes = Math.max(0, Math.round(value));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (!hours) {
    return `${minutes}분`;
  }
  if (!minutes) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${minutes}분`;
};

const getFilterValueSnapshot = (filterGroups) =>
  Object.fromEntries(
    filterGroups
      .filter((group) => !group.readonly)
      .map((group) => [group.id, group.selectedValue])
  );

const FILTER_ALL_VALUE = '전체';
const INITIAL_VISIBLE_MAP_JOB_COUNT = 20;
const VISIBLE_MAP_JOB_INCREMENT = 20;

const toViewTransitionName = (prefix, value) => {
  const normalized = String(value || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
  return normalized ? `${prefix}-${normalized}` : 'none';
};

export function TrafficFilterPanel({
  filterGroups,
  filterOptionStatus,
  filterOptionErrorMessage,
  jobs,
  totalJobCount,
  hasMoreJobs = false,
  isLoadingMoreJobs = false,
  recommendationProgress = { isLoading: false, loaded: 0, target: 20 },
  isAiEnabled,
  appliedAiEnabled,
  sortMode = 'score_desc',
  selectedJobId,
  viewState,
  isGuestUser = false,
  onSelectJob,
  onRequireLogin,
  onToggleAiScoring,
  onChangeSortMode,
  onLoadMoreJobs,
  onApplyFilters
}) {
  const [draftFilterValues, setDraftFilterValues] = useState(() => getFilterValueSnapshot(filterGroups));
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [visibleJobCount, setVisibleJobCount] = useState(INITIAL_VISIBLE_MAP_JOB_COUNT);
  const sortMenuRef = useRef(null);
  const resultsBodyRef = useRef(null);
  const isRecommendationLoading = Boolean(recommendationProgress?.isLoading);
  const isRecommendationBusy = viewState === 'loading' || viewState === 'calculating' || isRecommendationLoading;
  const loadingTarget = Math.max(1, Number(recommendationProgress?.target) || 20);
  const loadingLoaded = Math.min(loadingTarget, Math.max(0, Number(recommendationProgress?.loaded) || 0));
  const resultCount = viewState === 'empty' ? 0 : jobs.length;
  const usesServerPaging = true;
  const visibleJobs = useMemo(
    () => (usesServerPaging ? jobs : jobs.slice(0, visibleJobCount)),
    [jobs, usesServerPaging, visibleJobCount]
  );
  const hasMoreVisibleJobs = usesServerPaging ? hasMoreJobs : visibleJobs.length < jobs.length;

  useEffect(() => {
    setDraftFilterValues(getFilterValueSnapshot(filterGroups));
  }, [filterGroups]);

  useEffect(() => {
    setVisibleJobCount(INITIAL_VISIBLE_MAP_JOB_COUNT);
  }, [jobs]);

  const handleResultsScroll = useCallback((event) => {
    if (appliedAiEnabled) {
      return;
    }

    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom > 160 || isLoadingMoreJobs) {
      return;
    }

    if (usesServerPaging) {
      if (hasMoreJobs) {
        onLoadMoreJobs?.();
      }
      return;
    }

    if (visibleJobs.length < jobs.length) {
      setVisibleJobCount((current) => Math.min(current + VISIBLE_MAP_JOB_INCREMENT, jobs.length));
    }
  }, [appliedAiEnabled, hasMoreJobs, isLoadingMoreJobs, jobs.length, onLoadMoreJobs, usesServerPaging, visibleJobs.length]);

  useEffect(() => {
    if (!isSortMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSortMenuOpen]);

  const filterItems = useMemo(
    () => [
      ...filterGroups.map((group) => ({
        id: group.id,
        title: group.title,
        type: group.type || 'chips',
        chips: group.chips,
        options: group.options || [],
        jobCategories: group.jobCategories || [],
        selectedValue: group.readonly ? group.selectedValue : draftFilterValues[group.id],
        readonly: group.readonly,
        dashed: false
      }))
    ],
    [draftFilterValues, filterGroups]
  );
  const orderedFilterItems = useMemo(() => filterItems, [filterItems]);

  const handleSelectDraftFilter = (filterId, value) => {
    if (isGuestUser) {
      onRequireLogin?.();
      return;
    }
    setDraftFilterValues((current) => ({
      ...current,
      [filterId]: value
    }));
  };

  const handleApplyFilters = () => {
    if (isGuestUser) {
      onRequireLogin?.();
      return;
    }

    if (isRecommendationBusy) {
      return;
    }

    onApplyFilters?.(draftFilterValues);
    setIsFilterCollapsed(true);
  };

  const handleResetFilters = () => {
    if (isGuestUser) {
      onRequireLogin?.();
      return;
    }

    if (isRecommendationBusy) {
      return;
    }

    const resetValues = Object.fromEntries(
      filterGroups
        .filter((group) => !group.readonly)
        .map((group) => [group.id, FILTER_ALL_VALUE])
    );

    setDraftFilterValues(resetValues);
    onApplyFilters?.(resetValues);
  };

  return (
    <aside className="accessibility-map__filter-panel" aria-label="교통 필터">
      <header className="accessibility-map__filter-header">
        <h2>교통 필터</h2>
        <p>
          <img className="accessibility-map__info-icon" src={infoIcon} alt="안내 아이콘" />
          프로필 기준으로 필터 조건을 적용해 공고를 조회합니다.
        </p>
        <button
          type="button"
          className="accessibility-map__collapse-button"
          onClick={() => {
            if (isGuestUser) {
              onRequireLogin?.();
              return;
            }
            setIsFilterCollapsed((prev) => !prev);
          }}
          aria-expanded={!isFilterCollapsed}
        >
          {isFilterCollapsed ? '필터 펼치기' : '필터 접기'}
        </button>
      </header>
      {!isFilterCollapsed ? (
        <>
          <section className="accessibility-map__ai-toggle" aria-label="AI 스코어링 설정">
            <div>
              <strong>AI 스코어링</strong>
              <span>{isAiEnabled ? '프로필 기반 종합 점수 계산' : '프로필 기반 종합 점수 계산 해제'}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isAiEnabled}
              className={isAiEnabled ? 'is-on' : ''}
              onClick={() => {
                if (isGuestUser) {
                  onRequireLogin?.();
                  return;
                }
                onToggleAiScoring?.();
              }}
            >
              <span className="accessibility-map__ai-toggle-track" aria-hidden="true">
                <span className="accessibility-map__ai-toggle-thumb" />
              </span>
              <span className="accessibility-map__ai-toggle-label">{isAiEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </section>
          {viewState === 'success' ? (
            <p className="accessibility-map__ai-applied-note" role="status">
              현재 결과: AI 스코어링 {appliedAiEnabled ? 'ON' : 'OFF'}
            </p>
          ) : null}

          <div className="accessibility-map__filter-list">
            {filterOptionStatus === 'loading' ? (
              <div className="accessibility-map__filter-status" role="status">
                필터 옵션을 불러오는 중입니다.
              </div>
            ) : null}
            {filterOptionStatus === 'error' ? (
              <div className="accessibility-map__filter-status is-error" role="alert">
                {filterOptionErrorMessage || '필터 옵션을 불러오지 못했습니다.'}
              </div>
            ) : null}
            {orderedFilterItems.map((filterItem, filterIndex) => (
              <section key={filterItem.id} className="accessibility-map__filter-group">
                <div className="accessibility-map__filter-title-row">
                  <div>
                    <h3>{`${filterIndex + 1}. ${filterItem.title}`}</h3>
                    {filterItem.type === 'jobCategoryCascade' ? (
                      <JobCategoryCascadeFilter
                        categories={filterItem.jobCategories}
                        value={filterItem.selectedValue}
                        onChange={(value) => handleSelectDraftFilter(filterItem.id, value)}
                      />
                    ) : filterItem.type === 'select' ? (
                      <SelectFilter
                        label={filterItem.title}
                        options={filterItem.options}
                        value={filterItem.selectedValue}
                        onChange={(value) => handleSelectDraftFilter(filterItem.id, value)}
                      />
                    ) : (
                      <div
                        className={`accessibility-map__chip-row${
                          filterItem.id === 'employmentType' || filterItem.id === 'salaryType'
                            ? ' accessibility-map__chip-row--expanded'
                            : ''
                        }`}
                      >
                        {filterItem.chips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className={`accessibility-map__chip${
                              filterItem.selectedValue === chip ? ' is-selected' : ''
                            }${
                              filterItem.dashed ? ' accessibility-map__chip-dashed' : ''
                            }`}
                            disabled={filterItem.readonly}
                            aria-pressed={filterItem.selectedValue === chip}
                            onClick={() => handleSelectDraftFilter(filterItem.id, chip)}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}

      <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
        <button
          type="button"
          className="secondary-button accessibility-map__filter-reset-button"
          onClick={handleResetFilters}
          disabled={!isGuestUser && isRecommendationBusy}
        >
          초기화
        </button>
        <button
          type="button"
          className="primary-button accessibility-map__filter-apply-button"
          onClick={handleApplyFilters}
          disabled={!isGuestUser && isRecommendationBusy}
        >
          {isRecommendationBusy ? (
            <>
              로딩중
              <span className="jobs-feedback__dots" aria-hidden="true" />
            </>
          ) : '검색'}
        </button>
      </div>

      <div className="accessibility-map__results-header">
        <div className="accessibility-map__results-title-row">
          <h3>
            <span>검색 결과 {resultCount}개</span>
            {totalJobCount > resultCount ? <span> / 전체 {totalJobCount}개</span> : null}
          </h3>
          {hasMoreVisibleJobs && appliedAiEnabled ? (
            <button
              type="button"
              className="secondary-button accessibility-map__load-more-button"
              onClick={onLoadMoreJobs}
              disabled={isLoadingMoreJobs}
            >
              20개 더 불러오기
            </button>
          ) : null}
        </div>
        <div ref={sortMenuRef} className={`accessibility-map__sort${isSortMenuOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="accessibility-map__sort-button"
            onClick={() => setIsSortMenuOpen((prev) => !prev)}
            aria-expanded={isSortMenuOpen}
            aria-haspopup="listbox"
          >
            {sortMode === 'latest_desc' ? '최신순' : '접근성 점수 높은순'}
            <img src={triangleDownBlue} alt="정렬 옵션 펼치기 아이콘" />
          </button>
          {isSortMenuOpen ? (
            <div className="accessibility-map__sort-menu" role="listbox" aria-label="정렬 방식">
              {[
                ['score_desc', '접근성 점수 높은순'],
                ['latest_desc', '최신순']
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`accessibility-map__sort-option${sortMode === value ? ' is-selected' : ''}`}
                  role="option"
                  aria-selected={sortMode === value}
                  onClick={() => {
                    onChangeSortMode?.(value);
                    setIsSortMenuOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {isRecommendationLoading || isLoadingMoreJobs ? (
        <div className="accessibility-map__loading-bar" role="status" aria-live="polite">
          <span className="accessibility-map__loading-track" aria-hidden="true" />
          <span className="recommendation-loading__label">불러오는 중 {loadingLoaded}/{loadingTarget}</span>
        </div>
      ) : null}

      <div
        ref={resultsBodyRef}
        className="accessibility-map__results-body"
        onScroll={handleResultsScroll}
      >
        {viewState === 'loading' ? (
          <div className="accessibility-map__empty-panel" role="status">
            로딩중
            <span className="jobs-feedback__dots" aria-hidden="true" />
          </div>
        ) : viewState === 'calculating' ? (
          <div className="accessibility-map__empty-panel" role="status">
            로딩중
            <span className="jobs-feedback__dots" aria-hidden="true" />
          </div>
        ) : viewState === 'idle' ? (
          <div className="accessibility-map__empty-panel" role="status">
            검색을 누르면 회사 공고가 지도와 목록에 표시됩니다.
          </div>
        ) : viewState === 'empty' ? (
          <div className="accessibility-map__empty-panel" role="status">
            현재 조건에 맞는 공고가 없습니다.
            <br />
            필터 조건을 완화해보세요.
          </div>
        ) : (
          <div className="accessibility-map__job-list" aria-label="공고 목록">
            {visibleJobs.map((job) => (
              <button
                key={job.id}
                type="button"
                className={`accessibility-map__job-card${selectedJobId === job.id ? ' is-selected' : ''}`}
                style={{ viewTransitionName: toViewTransitionName('map-job', job.id) }}
                aria-pressed={selectedJobId === job.id}
                onClick={() => onSelectJob(job.id)}
              >
                <div className="accessibility-map__job-card-top">
                  <div className="accessibility-map__badge-row">
                    {job.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`accessibility-map__mini-badge ${
                          STATUS_CLASS_BY_BADGE[badge] || ''
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                    {formatScoreBadge(job.score) ? (
                      <span className={`accessibility-map__mini-badge ${getScoreBadgeClassName(job.score)}`}>
                        {formatScoreBadge(job.score)}
                      </span>
                    ) : null}
                  </div>
                  {job.dueLabel ? <strong className="accessibility-map__dday">{job.dueLabel}</strong> : null}
                </div>
                <strong className="accessibility-map__job-company">{job.company}</strong>
                <p className="accessibility-map__job-title">{job.title}</p>
                <div className="accessibility-map__job-meta">
                  <span>통근 <strong>{formatCommuteMinutes(job.commuteMinutes)}</strong></span>
                  <span>고용 <strong>{job.employmentType}</strong></span>
                </div>
                <div className="accessibility-map__job-pay">임금 <strong>{job.payText}</strong></div>
              </button>
            ))}
            {hasMoreVisibleJobs && !appliedAiEnabled && !isLoadingMoreJobs ? (
              <div className="accessibility-map__empty-panel" role="status">
                아래로 스크롤하면 다음 공고를 불러옵니다.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <label className="accessibility-map__select-field">
      <span className="sr-only">{label}</span>
      <select value={value || FILTER_ALL_VALUE} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function JobCategoryCascadeFilter({ categories, value, onChange }) {
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const selectedPath = useMemo(() => {
    if (!value || value === FILTER_ALL_VALUE) {
      return {
        primary: '',
        secondary: ''
      };
    }

    for (const category of safeCategories) {
      if (category.label === value) {
        return {
          primary: category.label,
          secondary: ''
        };
      }

      for (const group of category.groups) {
        if (group.label === value) {
          return {
            primary: category.label,
            secondary: group.label
          };
        }

        if (group.jobs.includes(value)) {
          return {
            primary: category.label,
            secondary: group.label
          };
        }
      }
    }

    return {
      primary: '',
      secondary: ''
    };
  }, [safeCategories, value]);
  const [primaryValue, setPrimaryValue] = useState(selectedPath.primary);
  const [secondaryValue, setSecondaryValue] = useState(selectedPath.secondary);
  const primaryCategory = safeCategories.find((category) => category.label === primaryValue) || null;
  const secondaryGroup = primaryCategory?.groups.find((group) => group.label === secondaryValue) || null;

  useEffect(() => {
    setPrimaryValue(selectedPath.primary);
    setSecondaryValue(selectedPath.secondary);
  }, [selectedPath.primary, selectedPath.secondary]);

  const handlePrimaryChange = (nextPrimary) => {
    setPrimaryValue(nextPrimary);
    setSecondaryValue('');
    onChange(nextPrimary || FILTER_ALL_VALUE);
  };

  const handleSecondaryChange = (nextSecondary) => {
    setSecondaryValue(nextSecondary);
    onChange(nextSecondary || primaryValue || FILTER_ALL_VALUE);
  };

  const handleJobChange = (nextJob) => {
    onChange(nextJob === FILTER_ALL_VALUE ? secondaryValue || primaryValue || FILTER_ALL_VALUE : nextJob);
  };

  return (
    <div className="accessibility-map__cascade-filter" aria-label="희망 직무 1차, 2차, 3차 선택">
      <label>
        <span>1차</span>
        <select value={primaryValue} onChange={(event) => handlePrimaryChange(event.target.value)}>
          <option value="">전체</option>
          {safeCategories.map((category) => (
            <option key={category.label} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>2차</span>
        <select
          value={secondaryValue}
          disabled={!primaryCategory}
          onChange={(event) => handleSecondaryChange(event.target.value)}
        >
          <option value="">전체</option>
          {primaryCategory?.groups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>3차</span>
        <select
          value={value && value !== FILTER_ALL_VALUE ? value : FILTER_ALL_VALUE}
          disabled={!secondaryGroup}
          onChange={(event) => handleJobChange(event.target.value)}
        >
          <option value={FILTER_ALL_VALUE}>전체</option>
          {secondaryGroup?.jobs.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
