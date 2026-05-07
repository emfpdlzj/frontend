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
  const [locationNotice, setLocationNotice] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationNotice('브라우저가 위치 확인을 지원하지 않아 기본 지도를 표시합니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!isWithinSouthKoreaBounds(coords.latitude, coords.longitude)) {
          setLocationNotice('현재 위치가 지도 제공 범위를 벗어나 기본 지도를 표시합니다.');
          return;
        }

        setCurrentLocation({
          lat: coords.latitude,
          lng: coords.longitude
        });
        setLocationNotice('현재 위치를 확인했습니다. 현위치 버튼으로 이동할 수 있습니다.');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationNotice('위치 권한이 없어 기본 지도를 표시합니다.');
          return;
        }

        setLocationNotice('현재 위치를 확인하지 못해 기본 지도를 표시합니다.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [mapViewport]);

  return (
    <main className="accessibility-map">
      <header className="accessibility-map__topbar">
        {locationNotice ? (
          <p className="accessibility-map__location-notice" role="status" aria-live="polite">
            {locationNotice}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}

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
      </header>

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
            selectedPersonaKey={selectedPersona}
            selectedTab={selectedTab}
            onChangeTab={setSelectedTab}
          />
        ) : (
          <aside className="accessibility-map__detail-panel">
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
