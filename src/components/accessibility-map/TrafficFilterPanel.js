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
  const resultCount = viewState === 'empty' ? 0 : jobs.length;

  useEffect(() => {
    setDraftFilterValues(getFilterValueSnapshot(filterGroups));
  }, [filterGroups]);

  const filterItems = useMemo(
    () => [
      ...filterGroups.map((group) => ({
        id: group.id,
        title: group.title,
        chips: group.chips,
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
        .map((group) => [group.id, group.chips[0]])
    );

    setDraftFilterValues(resetValues);
    onApplyFilters?.(resetValues);
  };

  return (
    <aside className="accessibility-map__filter-panel" aria-label="교통 필터">
      <header className="accessibility-map__filter-header">
        <h2>교통 필터</h2>
        <p>
          <img className="accessibility-map__info-icon" src={infoIcon} alt="" aria-hidden="true" />
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
                <div className="accessibility-map__chip-row">
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
                <img src={dragDropIcon} alt="" aria-hidden="true" />
              </button>
            </div>
          </section>
        ))}
      </div>

      <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
        <button type="button" className="secondary-button accessibility-map__filter-reset-button" onClick={handleResetFilters}>
          초기화
        </button>
        <button type="button" className="primary-button accessibility-map__filter-apply-button" onClick={handleApplyFilters}>
          조건 적용
        </button>
      </div>

      <div className="accessibility-map__results-header">
        <h3>검색 결과 {resultCount}개{totalJobCount > resultCount ? ` / 전체 ${totalJobCount}개` : ''}</h3>
        <button type="button" className="accessibility-map__sort-button" disabled>
          접근성 점수 높은순
          <img src={triangleDownBlue} alt="" aria-hidden="true" />
        </button>
      </div>

      <div className="accessibility-map__results-body">
        {viewState === 'idle' ? (
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
                  <span>통근 <strong>{formatCommuteMinutes(job.commuteMinutes)}</strong></span>
                  <span>고용 <strong>{job.employmentType}</strong></span>
                </div>
                <div className="accessibility-map__job-pay">임금 <strong>{job.payText}</strong></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
