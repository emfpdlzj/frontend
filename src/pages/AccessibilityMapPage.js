import { useCallback, useState } from 'react';
import { AccessibilityMapCanvas } from '../components/accessibility-map/AccessibilityMapCanvas';
import { AccessibilityMapDetailPanel } from '../components/accessibility-map/AccessibilityMapDetailPanel';
import { TrafficFilterPanel } from '../components/accessibility-map/TrafficFilterPanel';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAccessibilityMap } from '../hooks/useAccessibilityMap';

function isWithinSouthKoreaBounds(latitude, longitude) {
  return latitude >= 33 && latitude <= 39.5 && longitude >= 124 && longitude <= 132;
}

export function AccessibilityMapPage() {
  const {
    jobs,
    totalJobCount,
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
    viewState,
    setSelectedJobId,
    setSelectedProfileId,
    toggleAiScoring,
    applyFilters,
    setSelectedTab,
    reloadRecommendations
  } = useAccessibilityMap();
  const [currentLocation, setCurrentLocation] = useState(null);

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

  const viewport = !hasAppliedConditions && currentLocation
    ? {
        center: currentLocation,
        zoom: 16
      }
    : mapViewport;

  return (
    <main className="accessibility-map">
      <div className="accessibility-map__layout">
        <TrafficFilterPanel
          filterGroups={filterGroups}
          filterOptionStatus={filterOptionStatus}
          filterOptionErrorMessage={filterOptionErrorMessage}
          jobs={jobs}
          totalJobCount={totalJobCount}
          isAiEnabled={isAiEnabled}
          appliedAiEnabled={appliedAiEnabled}
          selectedJobId={selectedJobId}
          viewState={viewState}
          onSelectJob={setSelectedJobId}
          onToggleAiScoring={toggleAiScoring}
          onApplyFilters={applyFilters}
        />
        <AccessibilityMapCanvas
          legend={mapLegend}
          radiusMeters={mapRadiusMeters}
          routes={mapRoutes}
          markers={mapMarkers}
          hasAppliedConditions={hasAppliedConditions}
          showProfileSelect={isAiEnabled}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          supportAgencyCount={supportAgencyCount}
          currentLocation={currentLocation}
          viewport={viewport}
          viewState={viewState}
          onSelectProfile={setSelectedProfileId}
          onRequestCurrentLocation={requestCurrentLocation}
          onRetry={reloadRecommendations}
        />
        {viewState === 'success' && selectedJob ? (
          <AccessibilityMapDetailPanel
            job={selectedJob}
            selectedPersonaKey={selectedPersona}
            selectedTab={selectedTab}
            explanation={explanation}
            explanationViewState={explanationViewState}
            explanationErrorMessage={explanationErrorMessage}
            onChangeTab={setSelectedTab}
          />
        ) : (
          <aside className="accessibility-map__detail-panel">
            <div className="accessibility-map__detail-content">
              {viewState === 'empty' ? (
                <StatusMessage>선택 가능한 공고가 없어 상세 정보를 표시하지 않습니다.</StatusMessage>
              ) : null}
              {viewState === 'idle' ? (
                <StatusMessage>조건 적용을 누르면 회사 공고와 접근성 정보를 지도에 표시합니다.</StatusMessage>
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
    </main>
  );
}
