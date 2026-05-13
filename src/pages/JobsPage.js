import { useEffect, useMemo, useRef, useState } from 'react';
import { useScrappedJobs } from '../hooks/useScrappedJobs';
import { NAVER_MAP_CONFIG } from '../config/appConfig';
import { loadNaverMapScript } from '../utils/naverMapSdk';
import {
  AccessibilityDetailIcon,
  AccessibilityScoreHelpButton,
  DetailStatusBadge
} from '../components/accessibility-map/AccessibilityMapDetailPanel';

const INITIAL_VISIBLE_SCRAP_COUNT = 60;
const VISIBLE_SCRAP_INCREMENT = 60;
const SCRAP_NAVER_MAP_SCRIPT_ID = 'bridgework-scrap-naver-map-sdk';
const SCRAP_NAVER_MAP_READY_CALLBACK = '__bridgeworkScrapNaverMapReady__';
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

function ScrapSummaryHeader({ scraps, sortMode, onSortChange }) {
  const summary = useMemo(() => {
    const activeCount = scraps.filter((item) => item.statusLabel === '진행중 공고').length;
    const closedCount = scraps.filter((item) => item.statusLabel !== '진행중 공고').length;

    return { activeCount, closedCount };
  }, [scraps]);

  return (
    <header className="jobs-page__header jobs-page__header--scrap">
      <div>
        <span className="jobs-page__eyebrow">개인 맞춤 공고 모아보기</span>
        <h1>스크랩한 공고</h1>
        <p>저장한 공고를 접근성 점수와 추천 이유 기준으로 다시 비교해보세요.</p>
        <div className="scrap-summary-chips" aria-label="스크랩 공고 요약">
          <span>전체 <strong>{scraps.length}건</strong></span>
          <span>진행중 <strong>{summary.activeCount}건</strong></span>
          <span>마감 <strong>{summary.closedCount}건</strong></span>
        </div>
      </div>
      <div className="scrap-header-actions">
        <label className="scrap-sort-field">
          <span>정렬</span>
          <select value={sortMode} onChange={(event) => onSortChange(event.target.value)}>
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>
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
          <h2>스크랩한 공고 {scraps.length}건</h2>
          <p>저장 날짜, 마감 여부, 접근성 요약을 한눈에 확인합니다.</p>
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
              aria-label={`${item.title}, ${item.company}, ${item.statusLabel}`}
              onClick={() => onSelect(item.postingId)}
            >
              <div className="jobs-card__top">
                <span className="jobs-card__company">{item.company}</span>
                {item.dueLabel ? <strong className="jobs-card__dday">{item.dueLabel}</strong> : null}
              </div>
              <div className="jobs-card__headline">
                <strong className="jobs-card__title">{item.title}</strong>
              </div>
              <div className="jobs-card__badges" aria-label="공고 상태">
                <span>{item.statusLabel}</span>
                <span>저장 {item.scrappedAtText}</span>
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

function DetailInfoCard({ title, titleAddon = null, children }) {
  return (
    <section className="scrap-detail-card">
      <div className="scrap-detail-card__header">
        <h3>{title}</h3>
        {titleAddon}
      </div>
      {children}
    </section>
  );
}

function ScrapNaverMapPreview({ mapPreview, title }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const hasPoint = mapPreview.available && typeof mapPreview.lat === 'number' && typeof mapPreview.lng === 'number';
  const [status, setStatus] = useState(hasPoint ? 'loading' : 'empty');

  useEffect(() => {
    if (!hasPoint) {
      setStatus('empty');
      return undefined;
    }

    if (!NAVER_MAP_CONFIG.clientId) {
      setStatus('missing-client-id');
      return undefined;
    }

    let cancelled = false;
    let frameId = 0;

    setStatus('loading');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: SCRAP_NAVER_MAP_SCRIPT_ID,
      callbackName: SCRAP_NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        const initializeMap = () => {
          if (cancelled || !mapElementRef.current) {
            return;
          }

          if (mapElementRef.current.clientWidth <= 0 || mapElementRef.current.clientHeight <= 0) {
            frameId = window.requestAnimationFrame(initializeMap);
            return;
          }

          try {
            const position = new window.naver.maps.LatLng(mapPreview.lat, mapPreview.lng);
            mapInstanceRef.current = new window.naver.maps.Map(mapElementRef.current, {
              center: position,
              zoom: 16,
              mapTypeId: window.naver.maps.MapTypeId.NORMAL,
              zoomControl: true,
              zoomControlOptions: {
                position: window.naver.maps.Position.TOP_RIGHT
              }
            });
            markerRef.current = new window.naver.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title
            });
            setStatus('ready');
          } catch (error) {
            setStatus('error');
          }
        };

        initializeMap();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [hasPoint, mapPreview.lat, mapPreview.lng, title]);

  if (!hasPoint) {
    return (
      <div className="scrap-map-preview is-empty">
        <strong>{mapPreview.label}</strong>
        <p>{mapPreview.address}</p>
      </div>
    );
  }

  return (
    <div className="scrap-naver-map-preview">
      <div ref={mapElementRef} className="scrap-naver-map-preview__canvas" role="img" aria-label={`${title} 근무지 지도`} />
      {status !== 'ready' ? (
        <div className="scrap-naver-map-preview__overlay" role={status === 'error' || status === 'missing-client-id' ? 'alert' : 'status'}>
          {status === 'missing-client-id'
            ? '네이버 지도 클라이언트 정보가 없습니다.'
            : status === 'error'
              ? '네이버 지도를 표시하지 못했습니다.'
              : '네이버 지도를 불러오는 중입니다.'}
        </div>
      ) : null}
      <div className="scrap-naver-map-preview__caption">
        <strong>{mapPreview.label}</strong>
        <p>{mapPreview.address}</p>
      </div>
    </div>
  );
}

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
          <p>왼쪽 목록에서 저장한 공고를 선택하면 접근성 요약과 추천 이유를 볼 수 있습니다.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="jobs-detail scrap-detail" aria-label="스크랩 공고 상세">
      <header className="jobs-detail__header">
        <div className="jobs-detail__header-top">
          <div className="scrap-detail__badge-row">
            <span className="scrap-detail__status">{detail.statusLabel}</span>
            {detail.dueLabel ? <strong className="jobs-detail__dday">{detail.dueLabel}</strong> : null}
          </div>
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
            <strong>{detail.statusLabel}</strong>
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
            <span>근무지역</span>
            <strong>{detail.region}</strong>
          </div>
        </section>
      </header>

      <div className="jobs-detail__body">
        {detailViewState === 'error' ? (
          <div className="jobs-feedback is-error" role="alert">{detailErrorMessage || '공고 상세를 불러오지 못했습니다.'}</div>
        ) : null}

        <DetailInfoCard title="스크랩 및 상태">
          <dl className="jobs-detail__definition-grid scrap-definition-grid">
            {detail.statusFields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </DetailInfoCard>

        <DetailInfoCard title="접근성 요약" titleAddon={<AccessibilityScoreHelpButton />}>
          {detail.accessibilitySummaryItems.length ? (
            <ul className="accessibility-map__accessibility-list scrap-accessibility-list">
              {detail.accessibilitySummaryItems.map(([title, description, status]) => (
                <li key={`${title}-${description}`}>
                  <AccessibilityDetailIcon title={title} status={status} />
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                  <DetailStatusBadge label={status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="jobs-detail__notice" role="status">연동된 접근성 요약 데이터가 없습니다.</div>
          )}
        </DetailInfoCard>

        <DetailInfoCard title="공고 핵심 정보">
          <dl className="jobs-detail__definition-grid scrap-definition-grid">
            {detail.jobInfoFields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </DetailInfoCard>

        {detail.geoInfoFields.length ? (
          <DetailInfoCard title="주소 매칭 정보">
            <dl className="jobs-detail__definition-grid scrap-definition-grid">
              {detail.geoInfoFields.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </DetailInfoCard>
        ) : null}

        <DetailInfoCard title="지도 미리보기">
          <ScrapNaverMapPreview mapPreview={detail.mapPreview} title={detail.title} />
        </DetailInfoCard>
      </div>

      <footer className="jobs-detail__footer">
        <p>표시 정보는 공고 상세 API에서 제공한 값 기준입니다.</p>
        <p>지원 전 최신 채용 상태와 이동 경로를 다시 확인하세요.</p>
      </footer>
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
    <main className="jobs-page">
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
        <>
          <ScrapSummaryHeader
            scraps={scraps}
            sortMode={sortMode}
            onSortChange={setSortMode}
          />
          <div className="jobs-workspace jobs-workspace--scrap">
            <ScrapListPanel
              scraps={sortedScraps}
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
        </>
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
