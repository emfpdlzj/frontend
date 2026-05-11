import { useEffect, useMemo, useState } from 'react';
import { useScrappedJobs } from '../hooks/useScrappedJobs';

const INITIAL_VISIBLE_SCRAP_COUNT = 60;
const VISIBLE_SCRAP_INCREMENT = 60;

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
              className="logout-confirm-modal__button logout-confirm-modal__button--confirm"
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
          <h2>스크랩 공고 {scraps.length}건</h2>
          <p>저장한 공고를 빠르게 다시 확인하고, 필요하면 삭제할 수 있습니다.</p>
        </div>
      </div>
      <div className="jobs-list-panel__list">
        {visibleScraps.map((item) => {
          const isSelected = item.postingId === selectedPostingId;

          return (
            <button
              key={item.id}
              type="button"
              className={`jobs-card${isSelected ? ' is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(item.postingId)}
            >
              <div className="jobs-card__top">
                <span className="jobs-card__company">{item.company}</span>
                {item.dueLabel ? <strong className="jobs-card__dday">{item.dueLabel}</strong> : null}
              </div>
              <div className="jobs-card__headline">
                <strong className="jobs-card__title">{item.title}</strong>
              </div>
              <div className="jobs-card__badges">
                <span>{item.postingStatus === 'ACTIVE' ? '진행중 공고' : '마감 공고'}</span>
                <span>스크랩 {item.scrapCount}건</span>
              </div>
              <dl className="jobs-card__quick-meta">
                <div><dt>지역</dt><dd>{item.location}</dd></div>
                <div><dt>급여</dt><dd>{item.salary}</dd></div>
                <div><dt>고용형태</dt><dd>{item.employmentType}</dd></div>
              </dl>
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

function ScrapDetailPanel({ detail, detailViewState, detailErrorMessage, onDelete, isDeleting }) {
  if (!detail) {
    return (
      <aside className="jobs-detail" aria-label="스크랩 공고 상세">
        <div className="jobs-empty" role="status">
          <strong>공고를 선택해주세요.</strong>
          <p>왼쪽 목록에서 공고를 선택하면 상세 정보를 볼 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="jobs-detail" aria-label="스크랩 공고 상세">
      <header className="jobs-detail__header">
        <div className="jobs-detail__header-top">
          {detail.dueLabel ? <strong className="jobs-detail__dday">{detail.dueLabel}</strong> : null}
          <div className="jobs-detail__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '스크랩 삭제'}
            </button>
          </div>
        </div>
        <h2>{detail.title}</h2>
        <p>{detail.company}</p>
        <section className="jobs-detail__summary" aria-label="공고 핵심 요약">
          <div>
            <span>공고 상태</span>
            <strong>{detail.postingStatus === 'ACTIVE' ? '진행중' : '마감'}</strong>
          </div>
          <div>
            <span>급여</span>
            <strong>{detail.salary}</strong>
          </div>
          <div>
            <span>고용형태</span>
            <strong>{detail.employmentType}</strong>
          </div>
          <div>
            <span>전체 스크랩 수</span>
            <strong>{detail.scrapCount}건</strong>
          </div>
        </section>
      </header>

      <div className="jobs-detail__body">
        {detailViewState === 'loading' ? (
          <div className="jobs-feedback" role="status">공고 상세를 불러오는 중입니다.</div>
        ) : null}
        {detailViewState === 'error' ? (
          <div className="jobs-feedback is-error" role="alert">{detailErrorMessage || '공고 상세를 불러오지 못했습니다.'}</div>
        ) : null}
        <dl className="jobs-detail__definition-grid">
          {detail.fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="jobs-detail__footer">
        <p>마감 공고도 스크랩 목록에서는 확인할 수 있습니다.</p>
        <p>지원 전 최신 채용 상태와 조건을 다시 확인하세요.</p>
      </footer>
    </aside>
  );
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
    <main className="jobs-page">
      <header className="jobs-page__header">
        <div>
          <h1>스크랩 공고 관리</h1>
          <p>저장한 공고를 목록·상세로 확인하고 필요 없는 공고는 즉시 삭제할 수 있습니다.</p>
        </div>
      </header>

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

      {viewState === 'success' ? (
        <div className="jobs-workspace">
          <ScrapListPanel
            scraps={scraps}
            selectedPostingId={selectedPostingId}
            onSelect={setSelectedPostingId}
          />
          <div className="jobs-page__content">
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
