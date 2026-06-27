import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMapSearch } from '../accessibility/MapSearchContext';
import { postingApi } from '../api/postingApi';
import { AccessibilityMapCanvas } from '../components/accessibility-map/AccessibilityMapCanvas';
import { AccessibilityMapDetailPanel } from '../components/accessibility-map/AccessibilityMapDetailPanel';
import { TrafficFilterPanel } from '../components/accessibility-map/TrafficFilterPanel';
import { LoginModal } from '../components/auth/LoginModal';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAuth } from '../auth/AuthContext';
import { useAccessibilityMap } from '../hooks/useAccessibilityMap';

function isWithinSouthKoreaBounds(latitude, longitude) {
  return latitude >= 33 && latitude <= 39.5 && longitude >= 124 && longitude <= 132;
}

function MapScrapConfirmModal({ pending, mode = 'scrap', onConfirm, onClose }) {
  const isDeleteMode = mode === 'delete';
  const title = isDeleteMode ? '스크랩 취소 확인' : '스크랩 확인';
  const message = isDeleteMode ? '이 공고의 스크랩을 취소하시겠습니까?' : '이 공고를 스크랩하시겠습니까?';
  const confirmLabel = isDeleteMode ? '스크랩 취소' : '스크랩';

  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) {
        onClose();
      }
    }}>
      <section className="login-modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="map-scrap-confirm-title">
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="스크랩 확인 창 닫기" disabled={pending}>
          닫기
        </button>
        <div className="login-modal__body logout-confirm-modal__body">
          <div className="login-modal__heading">
            <h2 id="map-scrap-confirm-title" className="login-modal__title">{title}</h2>
            <p>{message}</p>
          </div>
          <div className="logout-confirm-modal__actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button type="button" className="primary-button" onClick={onConfirm} disabled={pending}>
              {pending ? '처리 중' : confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AccessibilityMapPage() {
  const { callWithAuth, isAuthenticated } = useAuth();
  const { submittedQuery, setSearchEnabled, clearQuery } = useMapSearch();
  const {
    jobs,
    totalJobCount,
    hasMoreJobs,
    isLoadingMoreJobs,
    recommendationProgress,
    profiles,
    filterGroups,
    filterOptionStatus,
    filterOptionErrorMessage,
    mapLegend,
    mapRadiusMeters,
    mapRoutes,
    mapMarkers,
    hasAppliedConditions,
    mapViewport,
    errorMessage,
    supportAgencyCount,
    explanation,
    explanationViewState,
    explanationErrorMessage,
    selectedJob,
    selectedJobId,
    selectedPersona,
    selectedProfileId,
    selectedTab,
    isAiEnabled,
    appliedAiEnabled,
    isCommutableOnlyApplied,
    showSupportAgencies,
    sortMode,
    viewState,
    setSelectedJobId,
    setSelectedProfileId,
    toggleAiScoring,
    applyFilters,
    loadMoreRecommendations,
    setSelectedTab,
    setSortMode,
    setShowSupportAgencies,
    reloadRecommendations,
    markJobScrapped
  } = useAccessibilityMap({ searchQuery: submittedQuery });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrapState, setScrapState] = useState({
    confirmOpen: false,
    mode: 'scrap',
    pending: false,
    error: ''
  });

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!isWithinSouthKoreaBounds(coords.latitude, coords.longitude)) {
          return;
        }

        setCurrentLocation({
          lat: coords.latitude,
          lng: coords.longitude
        });
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  const viewport = useMemo(
    () =>
      !hasAppliedConditions && currentLocation
        ? {
            center: currentLocation,
            zoom: 16
          }
        : mapViewport,
    [currentLocation, hasAppliedConditions, mapViewport]
  );
  const isGuestUser = !isAuthenticated;
  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);
  const openScrapConfirm = useCallback(() => {
    if (isGuestUser) {
      openLoginModal();
      return;
    }
    setScrapState({
      confirmOpen: true,
      mode: selectedJob?.scrappedByMe ? 'delete' : 'scrap',
      pending: false,
      error: ''
    });
  }, [isGuestUser, openLoginModal, selectedJob?.scrappedByMe]);
  const handleScrapConfirm = useCallback(async () => {
    if (!selectedJob?.postingId || scrapState.pending) {
      return;
    }

    const mode = scrapState.mode;
    setScrapState((prev) => ({ ...prev, confirmOpen: true, pending: true, error: '' }));

    try {
      if (mode === 'delete') {
        await callWithAuth((accessToken, signal) => postingApi.deleteScrap(accessToken, selectedJob.postingId, signal));
        markJobScrapped(selectedJob.id, false);
      } else {
        await callWithAuth((accessToken, signal) => postingApi.scrapPosting(accessToken, selectedJob.postingId, signal));
        markJobScrapped(selectedJob.id, true);
      }
      setScrapState({ confirmOpen: false, mode: 'scrap', pending: false, error: '' });
    } catch (error) {
      setScrapState({
        confirmOpen: true,
        mode,
        pending: false,
        error: error.message || (mode === 'delete' ? '스크랩 취소에 실패했습니다.' : '스크랩 처리에 실패했습니다.')
      });
    }
  }, [callWithAuth, markJobScrapped, scrapState.mode, scrapState.pending, selectedJob]);

  useEffect(() => {
    setSearchEnabled(hasAppliedConditions);
    if (!hasAppliedConditions) {
      clearQuery();
    }
  }, [clearQuery, hasAppliedConditions, setSearchEnabled]);

  useEffect(() => () => {
    setSearchEnabled(false);
    clearQuery();
  }, [clearQuery, setSearchEnabled]);

  return (
    <main className="accessibility-map">
      <div className="accessibility-map__layout">
        <TrafficFilterPanel
          filterGroups={filterGroups}
          filterOptionStatus={filterOptionStatus}
          filterOptionErrorMessage={filterOptionErrorMessage}
          jobs={jobs}
          totalJobCount={totalJobCount}
          hasMoreJobs={hasMoreJobs}
          isLoadingMoreJobs={isLoadingMoreJobs}
          recommendationProgress={recommendationProgress}
          isAiEnabled={isAiEnabled}
          appliedAiEnabled={appliedAiEnabled}
          isCommutableOnlyApplied={isCommutableOnlyApplied}
          sortMode={sortMode}
          selectedJobId={selectedJobId}
          viewState={viewState}
          isGuestUser={isGuestUser}
          onSelectJob={setSelectedJobId}
          onRequireLogin={openLoginModal}
          onToggleAiScoring={toggleAiScoring}
          onChangeSortMode={setSortMode}
          onApplyFilters={applyFilters}
          onLoadMoreJobs={loadMoreRecommendations}
        />
        <AccessibilityMapCanvas
          legend={mapLegend}
          radiusMeters={mapRadiusMeters}
          routes={mapRoutes}
          markers={mapMarkers}
          hasAppliedConditions={hasAppliedConditions}
          showProfileSelect={isAiEnabled}
          isGuestUser={isGuestUser}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          supportAgencyCount={supportAgencyCount}
          showSupportAgencies={showSupportAgencies}
          currentLocation={currentLocation}
          viewport={viewport}
          viewState={viewState}
          onSelectProfile={setSelectedProfileId}
          onRequireLogin={openLoginModal}
          onRequestCurrentLocation={requestCurrentLocation}
          onSelectMarker={setSelectedJobId}
          onToggleSupportAgencies={setShowSupportAgencies}
          onRetry={reloadRecommendations}
        />
        {viewState === 'success' && selectedJob ? (
          <AccessibilityMapDetailPanel
            job={selectedJob}
            selectedPersonaKey={selectedPersona}
            selectedTab={selectedTab}
            isAiEnabled={appliedAiEnabled}
            explanation={explanation}
            explanationViewState={explanationViewState}
            explanationErrorMessage={explanationErrorMessage}
            onChangeTab={setSelectedTab}
            onScrap={openScrapConfirm}
            scrapErrorMessage={scrapState.error}
          />
        ) : (
          <aside className="accessibility-map__detail-panel">
            <div className="accessibility-map__detail-content">
              {viewState === 'empty' ? (
                <StatusMessage>선택 가능한 공고가 없어 상세 정보를 표시하지 않습니다.</StatusMessage>
              ) : null}
              {viewState === 'idle' ? (
                <StatusMessage>검색을 누르면 회사 공고와 접근성 정보를 지도에 표시합니다.</StatusMessage>
              ) : null}
              {viewState === 'loading' ? (
                <StatusMessage>지역 접근성 지도 추천을 불러오는 중입니다.</StatusMessage>
              ) : null}
              {viewState === 'calculating' ? (
                <StatusMessage>선택한 프로필 기준으로 접근성 점수를 다시 계산하는 중입니다.</StatusMessage>
              ) : null}
              {viewState === 'error' ? (
                <StatusMessage kind="error">{errorMessage || '상세 데이터를 불러오지 못했습니다.'}</StatusMessage>
              ) : null}
            </div>
          </aside>
        )}
      </div>
      {scrapState.confirmOpen ? (
        <MapScrapConfirmModal
          pending={scrapState.pending}
          mode={scrapState.mode}
          onConfirm={handleScrapConfirm}
          onClose={() => setScrapState((prev) => ({ ...prev, confirmOpen: false, pending: false }))}
        />
      ) : null}
      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </main>
  );
}
