import { useMemo, useState } from 'react';
import dragDropIcon from '../../assets/accessibility-map/drag-drop-btn.png';
import infoIcon from '../../assets/accessibility-map/info-icon.png';
import triangleDownBlue from '../../assets/accessibility-map/triangle-down-blue.png';

const STATUS_CLASS_BY_BADGE = {
  공공: 'public',
  A등급: 'grade',
  표준사업장: 'workplace'
};

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
  jobs,
  persona,
  selectedJobId,
  viewState,
  onSelectJob
}) {
  const [filterOrder, setFilterOrder] = useState(() => [
    ...filterGroups.map(([title]) => title),
    'persona-filter'
  ]);
  const [draggingFilterId, setDraggingFilterId] = useState(null);
  const resultCount = viewState === 'empty' ? 0 : jobs.length;
  const filterItems = useMemo(
    () => [
      ...filterGroups.map(([title, chips]) => ({
        id: title,
        title,
        chips,
        dashed: false
      })),
      {
        id: 'persona-filter',
        title: persona.filterLabel,
        chips: persona.filterChips,
        dashed: true
      }
    ],
    [filterGroups, persona.filterChips, persona.filterLabel]
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

  return (
    <aside className="accessibility-map__filter-panel" aria-label="교통 필터">
      <header className="accessibility-map__filter-header">
        <h2>교통 필터</h2>
        <p>
          <img className="accessibility-map__info-icon" src={infoIcon} alt="" aria-hidden="true" />
          드래그하여 검색 우선순위를 설정해보세요.
        </p>
      </header>

      <div className="accessibility-map__filter-list">
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
                  {filterItem.chips.map((chip, chipIndex) => (
                    <button
                      key={chip}
                      type="button"
                      className={`accessibility-map__chip${
                        !filterItem.dashed && chipIndex === 1 ? ' is-selected' : ''
                      }${
                        filterItem.dashed ? ' accessibility-map__chip-dashed' : ''
                      }`}
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

      <div className="accessibility-map__results-header">
        <h3>검색 결과 {resultCount}개</h3>
        <button type="button" className="accessibility-map__sort-button">
          접근성 점수 높은순
          <img src={triangleDownBlue} alt="" aria-hidden="true" />
        </button>
      </div>

      <div className="accessibility-map__results-body">
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
      </div>
    </aside>
  );
}
