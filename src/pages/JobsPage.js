import { useEffect, useMemo, useState } from 'react';
import { useScrappedJobs } from '../hooks/useScrappedJobs';
import { PostingMapPreview } from '../components/jobs/PostingMapPreview';

const INITIAL_VISIBLE_SCRAP_COUNT = 60;
const VISIBLE_SCRAP_INCREMENT = 60;
const SORT_OPTIONS = [
  ['saved_desc', '최근 저장순'],
  ['deadline_asc', '마감 임박순']
];

function ScrapDeleteConfirmModal({ pending, onConfirm, onClose }) {
  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (!pending && event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="login-modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="scrap-delete-confirm-title">
        <div className="login-modal__body logout-confirm-modal__body">
          <div className="login-modal__heading">
            <h2 id="scrap-delete-confirm-title" className="login-modal__title">스크랩 삭제 확인</h2>
            <p>정말 이 스크랩 공고를 삭제하시겠습니까?</p>
          </div>
          <div className="logout-confirm-modal__actions">
            <button type="button" className="logout-confirm-modal__button" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button
              type="button"
              className="logout-confirm-modal__button logout-confirm-modal__button--confirm logout-confirm-modal__button--danger"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ScrapSidebarHeader({ scraps, sortMode, onSortChange }) {
  const summary = useMemo(() => {
    const activeCount = scraps.filter((item) => item.statusLabel === '진행중 공고').length;
    const closedCount = scraps.filter((item) => item.statusLabel !== '진행중 공고').length;

    return { activeCount, closedCount };
  }, [scraps]);

  return (
    <header className="scrap-sidebar__header">
      <div className="scrap-sidebar__intro">
        <span className="jobs-page__eyebrow">개인 맞춤 공고 모아보기</span>
        <h1>스크랩한 공고</h1>
        <p>저장한 공고의 채용 상태와 접근성 정보를 한곳에서 비교해보세요.</p>
        <div className="scrap-summary-chips" aria-label="스크랩 공고 요약">
          <span>전체 <strong>{scraps.length}건</strong></span>
          <span>진행중 <strong>{summary.activeCount}건</strong></span>
          <span>마감 <strong>{summary.closedCount}건</strong></span>
        </div>
      </div>
      <label className="scrap-sort-field">
        <span>공고 정렬</span>
        <select value={sortMode} onChange={(event) => onSortChange(event.target.value)}>
          {SORT_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
    </header>
  );
}

function ScrapListPanel({ scraps, selectedPostingId, onSelect }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_SCRAP_COUNT);
  const visibleScraps = useMemo(() => scraps.slice(0, visibleCount), [scraps, visibleCount]);
  const hasMoreScraps = visibleScraps.length < scraps.length;

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_SCRAP_COUNT);
  }, [scraps]);

  return (
    <section className="jobs-list-panel jobs-list-panel--scrap" aria-label="스크랩 공고 목록">
      <div className="jobs-list-panel__header">
        <div>
          <h2>
            저장목록
            <span>총 {scraps.length}건</span>
          </h2>
          <p>공고를 선택하면 상세 정보가 열립니다.</p>
        </div>
      </div>
      <div className="jobs-list-panel__list">
        {visibleScraps.map((item) => {
          const isSelected = item.postingId === selectedPostingId;

          return (
            <button
              key={item.id}
              type="button"
              className={`scrap-job-card${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${item.title}, ${item.company}, ${item.statusLabel}`}
              onClick={() => onSelect(item.postingId)}
            >
              <div className="scrap-job-card__top">
                <div className="scrap-job-card__badges">
                  <span className={`scrap-job-card__status${item.statusLabel === '진행중 공고' ? ' is-active' : ' is-closed'}`}>
                    {item.statusLabel === '진행중 공고' ? '진행중' : '마감'}
                  </span>
                </div>
                {item.dueLabel ? <strong className="scrap-job-card__dday">{item.dueLabel}</strong> : null}
              </div>
              <strong className="scrap-job-card__company" data-i18n-skip>{item.company}</strong>
              <p className="scrap-job-card__title" data-i18n-skip>{item.title}</p>
              <div className="scrap-job-card__meta">
                <span>고용 <strong data-i18n-skip>{item.employmentType}</strong></span>
                <span>지역 <strong data-i18n-skip>{item.location}</strong></span>
              </div>
              <div className="scrap-job-card__pay">임금 <strong data-i18n-skip>{item.salary}</strong></div>
            </button>
          );
        })}
        {hasMoreScraps ? (
          <button
            type="button"
            className="secondary-button jobs-list-panel__more-button"
            onClick={() => setVisibleCount((current) => current + VISIBLE_SCRAP_INCREMENT)}
          >
            스크랩 공고 {Math.min(VISIBLE_SCRAP_INCREMENT, scraps.length - visibleScraps.length)}건 더 보기
          </button>
        ) : null}
      </div>
    </section>
  );
}

function DetailInfoCard({ title, description, children }) {
  return (
    <section className="scrap-detail-card posting-detail-modal__info-section">
      <div className="posting-detail-modal__section-heading">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

const getPhoneHref = (value) => {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};

function ScrapDetailPanel({ detail, detailViewState, detailErrorMessage, onDelete, isDeleting }) {
  if (!detail && detailViewState === 'loading') {
    return (
      <aside className="jobs-detail scrap-detail" aria-label="스크랩 공고 상세">
        <div className="jobs-feedback" role="status">공고 상세를 불러오는 중입니다.</div>
      </aside>
    );
  }

  if (!detail && detailViewState === 'error') {
    return (
      <aside className="jobs-detail scrap-detail" aria-label="스크랩 공고 상세">
        <div className="jobs-feedback is-error" role="alert">{detailErrorMessage || '공고 상세를 불러오지 못했습니다.'}</div>
      </aside>
    );
  }

  if (!detail) {
    return (
      <aside className="jobs-detail scrap-detail" aria-label="스크랩 공고 상세">
        <div className="jobs-empty" role="status">
          <strong>공고를 선택해주세요.</strong>
          <p>왼쪽 목록에서 저장한 공고를 선택하면 근무 조건과 지원 요건을 볼 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  const isActive = detail.postingStatus === 'ACTIVE';
  const statusTone = isActive ? 'active' : 'closed';
  const statusLabel = isActive ? '진행중' : '마감';
  const statusDescription = isActive
    ? '현재 지원 가능한 공고입니다. 급여와 근무 환경, 지원 요건을 아래에서 차례대로 확인해보세요.'
    : '모집 종료 또는 상태 확인이 필요한 공고입니다. 등록 정보와 연락처를 먼저 확인해 주세요.';
  const contactHref = getPhoneHref(detail.contactNumber);
  const summaryItems = [
    ['근무지', detail.location],
    ['임금', detail.salary],
    ['고용형태', detail.employmentType],
    ['모집마감일', detail.termDateText]
  ];

  return (
    <aside className="jobs-detail scrap-detail posting-detail-modal" aria-label="스크랩 공고 상세">
      <div className="posting-detail-modal__hero">
        <div className="posting-detail-modal__hero-copy">
          <div className="posting-detail-modal__hero-badges" aria-label="공고 상태 정보">
            <span className={`posting-detail-modal__hero-badge is-${statusTone}`}>{statusLabel}</span>
            {detail.dueLabel ? <span className="posting-detail-modal__hero-badge is-deadline">{detail.dueLabel}</span> : null}
            {detail.region !== '없음' ? <span className="posting-detail-modal__hero-badge is-region">{detail.region}</span> : null}
          </div>
          <div className="posting-detail-modal__heading">
            <p className="posting-detail-modal__eyebrow">채용공고 상세</p>
            <h2 id="scrap-posting-detail-title" data-i18n-skip>{detail.title}</h2>
            <p data-i18n-skip>{detail.company}</p>
          </div>
          <p className="posting-detail-modal__hero-description">{statusDescription}</p>
          <div className="posting-detail-modal__hero-links">
            {contactHref ? (
              <a className="posting-detail-modal__hero-link" href={contactHref} aria-label={`채용 문의 전화 ${detail.contactNumber}`}>
                <span>채용 문의</span>
                <strong data-i18n-skip>{detail.contactNumber}</strong>
                <small>터치하거나 클릭하면 바로 전화할 수 있습니다.</small>
              </a>
            ) : (
              <div className="posting-detail-modal__hero-link" aria-label={`채용 문의 ${detail.contactNumber}`}>
                <span>채용 문의</span>
                <strong data-i18n-skip>{detail.contactNumber}</strong>
                <small>연락처 정보가 등록된 경우 전화 연결이 가능합니다.</small>
              </div>
            )}
            <div className="posting-detail-modal__hero-link" aria-label={`등록 기관 ${detail.agencyName}`}>
              <span>등록 기관</span>
              <strong data-i18n-skip>{detail.agencyName}</strong>
              <small data-i18n-skip>{detail.registeredAtText !== '등록일 확인 필요' ? `공고 등록일 ${detail.registeredAtText}` : '공고 등록일 정보가 없습니다.'}</small>
            </div>
          </div>
        </div>
        <aside className="posting-detail-modal__summary" aria-label="공고 상태 및 스크랩 정보">
          <strong className="posting-detail-modal__summary-title">관심 공고</strong>
          <div className="posting-detail-modal__scrap-panel">
            <span className="posting-detail-modal__scrap-caption">현재 스크랩</span>
            <span className="posting-detail-modal__scrap-count" aria-label={`스크랩 ${detail.scrapCount}건`}>
              <span>스크랩</span>
              <strong>{detail.scrapCount}</strong>
              <span>건</span>
            </span>
            <p>이미 저장한 공고입니다. 더 이상 보관하지 않으려면 삭제할 수 있습니다.</p>
          </div>
          <button
            type="button"
            className="secondary-button is-danger posting-detail-modal__scrap-button"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '스크랩 삭제'}
          </button>
        </aside>
      </div>

      <div className="posting-detail-modal__content">
        {detailViewState === 'error' ? (
          <div className="jobs-feedback is-error" role="alert">{detailErrorMessage || '공고 상세를 불러오지 못했습니다.'}</div>
        ) : null}

        <section className="jobs-detail__summary posting-detail-modal__key-summary" aria-label="공고 핵심 요약">
          {summaryItems.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong data-i18n-skip>{value}</strong>
            </div>
          ))}
        </section>

        <div className="posting-detail-modal__info-stack">
          <DetailInfoCard title="연락 및 위치" description="지원 전에 먼저 확인하면 좋은 기본 정보입니다.">
            <dl className="jobs-detail__definition-grid scrap-definition-grid">
              {detail.contactFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd data-i18n-skip>{value}</dd>
                </div>
              ))}
            </dl>
          </DetailInfoCard>

          <DetailInfoCard title="근무 조건" description="근무 방식과 기본 채용 조건을 빠르게 확인하세요.">
            <dl className="jobs-detail__definition-grid scrap-definition-grid">
              {detail.workConditionFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd data-i18n-skip>{value}</dd>
                </div>
              ))}
            </dl>
          </DetailInfoCard>

          <DetailInfoCard title="작업 환경" description="현장 업무 특성과 신체 부담 정보를 정리했습니다.">
            <dl className="jobs-detail__definition-grid scrap-definition-grid">
              {detail.workEnvironmentFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd data-i18n-skip>{value}</dd>
                </div>
              ))}
            </dl>
          </DetailInfoCard>

          <DetailInfoCard title="지원 요건" description="경력, 학력, 자격 관련 조건을 확인할 수 있습니다.">
            <dl className="jobs-detail__definition-grid scrap-definition-grid">
              {detail.requirementFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd data-i18n-skip>{value}</dd>
                </div>
              ))}
            </dl>
          </DetailInfoCard>

          <DetailInfoCard title="지도 미리보기" description="스크랩 공고 상세와 동일한 방식으로 근무지 위치를 미리 확인할 수 있습니다.">
            <PostingMapPreview mapPreview={detail.mapPreview} title={detail.title} />
          </DetailInfoCard>
        </div>
      </div>
    </aside>
  );
}

const getDeadlineSortValue = (termDate) => {
  const raw = String(termDate ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(raw);
};

const getSavedSortValue = (scrappedAt) => {
  const value = new Date(scrappedAt).getTime();
  return Number.isNaN(value) ? 0 : value;
};

function sortScraps(scraps, sortMode) {
  return [...scraps].sort((left, right) => {
    if (sortMode === 'deadline_asc') {
      return getDeadlineSortValue(left.termDate) - getDeadlineSortValue(right.termDate);
    }

    return getSavedSortValue(right.scrappedAt) - getSavedSortValue(left.scrappedAt);
  });
}

export function JobsPage() {
  const {
    viewState,
    errorMessage,
    scraps,
    selectedPostingId,
    detail,
    detailViewState,
    detailErrorMessage,
    setSelectedPostingId,
    removeScrap
  } = useScrappedJobs();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sortMode, setSortMode] = useState('saved_desc');
  const sortedScraps = useMemo(() => sortScraps(scraps, sortMode), [scraps, sortMode]);

  const confirmDelete = async () => {
    if (isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await removeScrap();
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="jobs-page jobs-page--scrap-view">
      {viewState !== 'success' ? (
        <section className="jobs-state-panel" aria-labelledby="jobs-state-title">
          <span className="jobs-page__eyebrow">개인 맞춤 공고 모아보기</span>
          <h1 id="jobs-state-title">스크랩한 공고</h1>
          {viewState === 'disabled' ? (
            <div className="jobs-feedback" role="status">로그인 후 스크랩 공고를 확인할 수 있습니다.</div>
          ) : null}
          {viewState === 'loading' ? (
            <div className="jobs-feedback" role="status">스크랩 공고를 불러오는 중입니다.</div>
          ) : null}
          {viewState === 'error' ? (
            <div className="jobs-feedback is-error" role="alert">{errorMessage || '스크랩 공고를 불러오지 못했습니다.'}</div>
          ) : null}
          {viewState === 'empty' ? (
            <div className="jobs-feedback" role="status">아직 스크랩한 공고가 없습니다.</div>
          ) : null}
        </section>
      ) : null}

      {viewState === 'success' ? (
        <div className="jobs-workspace jobs-workspace--scrap">
          <aside className="scrap-sidebar" aria-label="스크랩 공고 탐색">
            <ScrapSidebarHeader
              scraps={scraps}
              sortMode={sortMode}
              onSortChange={setSortMode}
            />
            <ScrapListPanel
              scraps={sortedScraps}
              selectedPostingId={selectedPostingId}
              onSelect={setSelectedPostingId}
            />
          </aside>
          <div className="jobs-page__content jobs-page__content--scrap">
            <ScrapDetailPanel
              detail={detail}
              detailViewState={detailViewState}
              detailErrorMessage={detailErrorMessage}
              onDelete={() => setIsDeleteConfirmOpen(true)}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <ScrapDeleteConfirmModal
          pending={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setIsDeleteConfirmOpen(false)}
        />
      ) : null}
    </main>
  );
}
