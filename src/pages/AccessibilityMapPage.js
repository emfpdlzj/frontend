import { useEffect, useState } from 'react';
import { AccessibilityMapCanvas } from '../components/accessibility-map/AccessibilityMapCanvas';
import { AccessibilityMapDetailPanel } from '../components/accessibility-map/AccessibilityMapDetailPanel';
import { TrafficFilterPanel } from '../components/accessibility-map/TrafficFilterPanel';
import { StatusMessage } from '../components/common/StatusMessage';
import { useAccessibilityMapMock } from '../hooks/useAccessibilityMapMock';

function isWithinSouthKoreaBounds(latitude, longitude) {
  return latitude >= 33 && latitude <= 39.5 && longitude >= 124 && longitude <= 132;
}

export function AccessibilityMapPage() {
  const {
    jobs,
    personas,
    filterGroups,
    mapLegend,
    mapRadiusMeters,
    mapRoutes,
    mapMarkers,
    mapViewport,
    selectedJob,
    selectedJobId,
    selectedPersona,
    selectedTab,
    viewState,
    setSelectedJobId,
    setSelectedPersona,
    setSelectedTab,
    setViewState
  } = useAccessibilityMapMock();
  const [currentViewport] = useState(mapViewport);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
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
  }, [mapViewport]);

  return (
    <main className="accessibility-map">
      <div className="accessibility-map__layout">
        <TrafficFilterPanel
          filterGroups={filterGroups}
          jobs={jobs}
          persona={personas[selectedPersona]}
          selectedJobId={selectedJobId}
          viewState={viewState}
          onSelectJob={setSelectedJobId}
        />
        <AccessibilityMapCanvas
          legend={mapLegend}
          radiusMeters={mapRadiusMeters}
          routes={mapRoutes}
          markers={mapMarkers}
          currentLocation={currentLocation}
          viewport={currentViewport}
          viewState={viewState}
          onRetry={() => setViewState('success')}
        />
        {viewState === 'success' ? (
          <AccessibilityMapDetailPanel
            job={selectedJob}
            personas={personas}
            selectedPersonaKey={selectedPersona}
            selectedTab={selectedTab}
            onChangePersona={setSelectedPersona}
            onChangeTab={setSelectedTab}
          />
        ) : (
          <aside className="accessibility-map__detail-panel">
            <div className="accessibility-map__persona-tabs" role="tablist" aria-label="장애 유형 선택">
              {Object.entries(personas).map(([key, persona]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={selectedPersona === key}
                  className={`accessibility-map__persona-button${selectedPersona === key ? ' is-active' : ''}`}
                  onClick={() => setSelectedPersona(key)}
                >
                  <strong>{persona.label}</strong>
                  <span>{persona.description}</span>
                </button>
              ))}
            </div>
            <div className="accessibility-map__detail-content">
              {viewState === 'empty' ? (
                <StatusMessage>선택 가능한 공고가 없어 상세 정보를 표시하지 않습니다.</StatusMessage>
              ) : null}
              {viewState === 'loading' ? (
                <StatusMessage>목업 데이터를 준비하는 동안 상세 패널도 함께 대기합니다.</StatusMessage>
              ) : null}
              {viewState === 'error' ? (
                <StatusMessage kind="error">상세 데이터를 불러오지 못했습니다.</StatusMessage>
              ) : null}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
