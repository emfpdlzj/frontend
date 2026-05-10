import { useEffect, useMemo, useState } from 'react';
import dragDropIcon from '../../assets/accessibility-map/drag-drop-btn.png';
import infoIcon from '../../assets/accessibility-map/info-icon.png';
import triangleDownBlue from '../../assets/accessibility-map/triangle-down-blue.png';

const STATUS_CLASS_BY_BADGE = {
  공공: 'public',
  A등급: 'grade',
  B등급: 'grade',
  C등급: 'grade',
  표준사업장: 'workplace'
};

const formatCommuteMinutes = (value) => (typeof value === 'number' ? `${value}분` : value || '확인 필요');

const getFilterValueSnapshot = (filterGroups) =>
  Object.fromEntries(
    filterGroups
      .filter((group) => !group.readonly)
      .map((group) => [group.id, group.selectedValue])
  );

const FILTER_ALL_VALUE = '전체';
const INITIAL_VISIBLE_MAP_JOB_COUNT = 80;
const VISIBLE_MAP_JOB_INCREMENT = 80;

function moveItem(items, sourceId, targetId) {
  const sourceIndex = items.indexOf(sourceId);
  const targetIndex = items.indexOf(targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);

  return nextItems;
}

function moveItemByOffset(items, sourceId, offset) {
  const sourceIndex = items.indexOf(sourceId);
  const targetIndex = sourceIndex + offset;

  if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);

  return nextItems;
}

export function TrafficFilterPanel({
  filterGroups,
  filterOptionStatus,
  filterOptionErrorMessage,
  jobs,
  totalJobCount,
  isAiEnabled,
  appliedAiEnabled,
  selectedJobId,
  viewState,
  onSelectJob,
  onToggleAiScoring,
  onApplyFilters
}) {
  const [filterOrder, setFilterOrder] = useState(() => [
    ...filterGroups.map((group) => group.id)
  ]);
  const [draftFilterValues, setDraftFilterValues] = useState(() => getFilterValueSnapshot(filterGroups));
  const [draggingFilterId, setDraggingFilterId] = useState(null);
  const [visibleJobCount, setVisibleJobCount] = useState(INITIAL_VISIBLE_MAP_JOB_COUNT);
  const isRecommendationBusy = viewState === 'loading' || viewState === 'calculating';
  const resultCount = viewState === 'empty' || isRecommendationBusy ? 0 : jobs.length;
  const visibleJobs = useMemo(() => jobs.slice(0, visibleJobCount), [jobs, visibleJobCount]);
  const hasMoreJobs = visibleJobs.length < jobs.length;

  useEffect(() => {
    setDraftFilterValues(getFilterValueSnapshot(filterGroups));
  }, [filterGroups]);

  useEffect(() => {
    setVisibleJobCount(INITIAL_VISIBLE_MAP_JOB_COUNT);
  }, [jobs]);

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
  const orderedFilterItems = useMemo(() => {
    const itemById = new Map(filterItems.map((item) => [item.id, item]));
    const orderedIds = filterOrder.filter((id) => itemById.has(id));

    filterItems.forEach((item) => {
      if (!orderedIds.includes(item.id)) {
        orderedIds.push(item.id);
      }
    });

    return orderedIds.map((id) => itemById.get(id));
  }, [filterItems, filterOrder]);

  const handleDragStart = (event, filterId) => {
    setDraggingFilterId(filterId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', filterId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event, targetFilterId) => {
    event.preventDefault();
    const sourceFilterId = event.dataTransfer.getData('text/plain') || draggingFilterId;

    setFilterOrder((currentOrder) => moveItem(currentOrder, sourceFilterId, targetFilterId));
    setDraggingFilterId(null);
  };

  const handleDragEnd = () => {
    setDraggingFilterId(null);
  };

  const handleDragHandleKeyDown = (event, filterId) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    setFilterOrder((currentOrder) => moveItemByOffset(currentOrder, filterId, event.key === 'ArrowUp' ? -1 : 1));
  };

  const handleSelectDraftFilter = (filterId, value) => {
    setDraftFilterValues((current) => ({
      ...current,
      [filterId]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters?.(draftFilterValues);
  };

  const handleResetFilters = () => {
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
          드래그하여 검색 우선순위를 설정해보세요.
        </p>
      </header>

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
          onClick={onToggleAiScoring}
        >
          <span aria-hidden="true" />
          {isAiEnabled ? 'ON' : 'OFF'}
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
          <section
            key={filterItem.id}
            className={`accessibility-map__filter-group${
              draggingFilterId === filterItem.id ? ' is-dragging' : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, filterItem.id)}
          >
            <div className="accessibility-map__filter-title-row">
              <span className="accessibility-map__filter-priority">{filterIndex + 1}</span>
              <div>
                <h3>{filterItem.title}</h3>
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
              <button
                type="button"
                className="accessibility-map__drag-handle"
                aria-label={`${filterItem.title} 우선순위 조정. 드래그하거나 위아래 방향키로 이동`}
                draggable="true"
                onDragStart={(event) => handleDragStart(event, filterItem.id)}
                onDragEnd={handleDragEnd}
                onKeyDown={(event) => handleDragHandleKeyDown(event, filterItem.id)}
              >
                <img src={dragDropIcon} alt="드래그 핸들 아이콘" />
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
        <button type="button" className="secondary-button accessibility-map__filter-reset-button" onClick={handleResetFilters}>
          초기화
        </button>
        <button
          type="button"
          className="primary-button accessibility-map__filter-apply-button"
          onClick={handleApplyFilters}
          disabled={isRecommendationBusy}
        >
          {isRecommendationBusy ? '계산 중' : '조건 적용'}
        </button>
      </div>

      <div className="accessibility-map__results-header">
        <h3>검색 결과 {resultCount}개{totalJobCount > resultCount ? ` / 전체 ${totalJobCount}개` : ''}</h3>
        <button type="button" className="accessibility-map__sort-button" disabled>
          {appliedAiEnabled ? '접근성 점수 높은순' : '최신순'}
          <img src={triangleDownBlue} alt="정렬 옵션 펼치기 아이콘" />
        </button>
      </div>

      <div className="accessibility-map__results-body">
        {viewState === 'loading' ? (
          <div className="accessibility-map__empty-panel" role="status">
            지역 접근성 지도 추천을 불러오는 중입니다.
          </div>
        ) : viewState === 'calculating' ? (
          <div className="accessibility-map__empty-panel" role="status">
            선택한 프로필 기준으로 접근성 점수를 다시 계산하고 있습니다.
          </div>
        ) : viewState === 'idle' ? (
          <div className="accessibility-map__empty-panel" role="status">
            조건 적용을 누르면 회사 공고가 지도와 목록에 표시됩니다.
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
                aria-pressed={selectedJobId === job.id}
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
            {hasMoreJobs ? (
              <button
                type="button"
                className="secondary-button accessibility-map__more-button"
                onClick={() => setVisibleJobCount((current) => current + VISIBLE_MAP_JOB_INCREMENT)}
              >
                공고 {Math.min(VISIBLE_MAP_JOB_INCREMENT, jobs.length - visibleJobs.length)}개 더 보기
              </button>
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
