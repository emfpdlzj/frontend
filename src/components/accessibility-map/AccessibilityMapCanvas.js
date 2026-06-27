import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import arrowDown from '../../assets/accessibility-map/arrow_down.png';
import companyMapMarker from '../../assets/accessibility-map/company-map-marker.png';
import profileIcon from '../../assets/accessibility-map/profile-icon.png';
import settingIcon from '../../assets/accessibility-map/setting-icon.png';
import { NAVER_MAP_CONFIG } from '../../config/appConfig';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';
import { loadNaverMapScript } from '../../utils/naverMapSdk';
import { LoadingView } from '../common/LoadingView';
import { StatusMessage } from '../common/StatusMessage';

const NAVER_MAP_SCRIPT_ID = 'bridgework-naver-map-sdk';
const NAVER_MAP_READY_CALLBACK = '__bridgeworkNaverMapReady__';
const MAX_RENDERED_MARKERS = 250;
const MARKER_GRID_DECIMALS_BY_ZOOM = [
  [13, 4],
  [10, 3],
  [0, 2]
];
const SCORE_LEGEND_ITEMS = [
  { grade: 'A', label: '80 이상', tone: 'good' },
  { grade: 'B', label: '60 ~ 79', tone: 'warning' },
  { grade: 'C', label: '60 미만', tone: 'danger' }
];
const MARKER_ZOOM_MODE = {
  DETAIL: 'detail',
  COMPACT: 'compact',
  DOT: 'dot'
};

function createNaverLatLng(location) {
  if (!location) {
    return null;
  }

  return new window.naver.maps.LatLng(location.lat, location.lng);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSafeMarkerType(type) {
  return ['office', 'support-agency'].includes(type) ? type : 'support-agency';
}

function getSafeOfficeMarkerTone(tone) {
  return ['good', 'warning', 'danger'].includes(tone) ? tone : 'warning';
}

function getMarkerZoomMode(zoom) {
  const normalizedZoom = Number(zoom);
  if (!Number.isFinite(normalizedZoom) || normalizedZoom >= 15) {
    return MARKER_ZOOM_MODE.DETAIL;
  }
  if (normalizedZoom >= 13) {
    return MARKER_ZOOM_MODE.COMPACT;
  }
  return MARKER_ZOOM_MODE.DOT;
}

function getOfficeMarkerAnchor(marker, zoomMode) {
  if (zoomMode === MARKER_ZOOM_MODE.DOT) {
    return new window.naver.maps.Point(10, 10);
  }
  if (zoomMode === MARKER_ZOOM_MODE.COMPACT) {
    return marker.isSelected
      ? new window.naver.maps.Point(48, 38)
      : new window.naver.maps.Point(48, 18);
  }

  return marker.isSelected
    ? new window.naver.maps.Point(76, 54)
    : new window.naver.maps.Point(76, 22);
}

function createMarkerElement(marker, zoomMode = MARKER_ZOOM_MODE.DETAIL) {
  const markerType = getSafeMarkerType(marker.type);
  if (markerType === 'support-agency') {
    const wrapper = document.createElement('div');
    wrapper.className = 'accessibility-map__company-marker is-support-agency';
    wrapper.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.src = companyMapMarker;
    image.alt = '근로지원기관 위치 마커 아이콘';

    const label = document.createElement('span');
    label.textContent = marker.displayLabel || marker.label || '';

    wrapper.append(image, label);
    return wrapper;
  }

  const tone = getSafeOfficeMarkerTone(marker.tone);
  const wrapper = document.createElement('div');
  const hasScore = typeof marker.score === 'number' && Number.isFinite(marker.score);
  wrapper.className = [
    'accessibility-map__job-map-marker',
    `is-${tone}`,
    `is-zoom-${zoomMode}`,
    marker.isSelected ? 'is-selected' : '',
    hasScore ? '' : 'is-no-score'
  ].filter(Boolean).join(' ');
  wrapper.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('span');
  dot.className = 'accessibility-map__job-map-marker-dot';

  const label = document.createElement('strong');
  label.textContent = marker.displayLabel || marker.label || '회사';

  const divider = document.createElement('span');
  divider.className = 'accessibility-map__job-map-marker-divider';

  wrapper.append(dot, label);
  if (hasScore) {
    const score = document.createElement('em');
    score.textContent = String(marker.score);
    wrapper.append(divider, score);
  }
  return wrapper;
}

function createMarkerIcon(marker, zoomMode = MARKER_ZOOM_MODE.DETAIL) {
  if (marker.type === 'support-agency') {
    return {
      content: createMarkerElement(marker, zoomMode),
      anchor: new window.naver.maps.Point(90, 25)
    };
  }

  if (marker.type === 'office') {
    return {
      content: createMarkerElement(marker, zoomMode),
      anchor: getOfficeMarkerAnchor(marker, zoomMode)
    };
  }

  return {
    content: `<div class="accessibility-map__marker is-sdk is-${escapeHtml(marker.type || 'support-agency')}" aria-hidden="true">기관</div>`,
    anchor: new window.naver.maps.Point(24, 24)
  };
}

function canRenderMap(viewState) {
  return viewState !== 'error';
}

function getProfileDisplayName(profile) {
  if (!profile) {
    return '';
  }

  return profile.profileName || profile.fullName || (profile.id ? `프로필 ${profile.id}` : '');
}

function getMarkerGridDecimals(zoom) {
  const normalizedZoom = Number(zoom);
  const [, decimals] = MARKER_GRID_DECIMALS_BY_ZOOM.find(([minZoom]) => normalizedZoom >= minZoom) ||
    MARKER_GRID_DECIMALS_BY_ZOOM[MARKER_GRID_DECIMALS_BY_ZOOM.length - 1];
  return decimals;
}

function toRenderableMarkers(markers, zoom) {
  const validMarkers = markers.filter((marker) => Number.isFinite(Number(marker.lat)) && Number.isFinite(Number(marker.lng)));

  if (validMarkers.length <= MAX_RENDERED_MARKERS) {
    return validMarkers;
  }

  const decimals = getMarkerGridDecimals(zoom);
  const cells = new Map();

  validMarkers.forEach((marker) => {
    const lat = Number(marker.lat).toFixed(decimals);
    const lng = Number(marker.lng).toFixed(decimals);
    const key = `${lat}:${lng}:${getSafeMarkerType(marker.type)}`;

    if (!cells.has(key)) {
      cells.set(key, marker);
    }
  });

  return Array.from(cells.values()).slice(0, MAX_RENDERED_MARKERS);
}

function AccessibilityMapCanvasComponent({
  markers = [],
  hasAppliedConditions = false,
  showProfileSelect = true,
  isGuestUser = false,
  profiles = [],
  selectedProfileId,
  supportAgencyCount = 0,
  showSupportAgencies = false,
  currentLocation,
  viewport,
  viewState,
  onSelectProfile,
  onRequireLogin,
  onRequestCurrentLocation,
  onSelectMarker,
  onToggleSupportAgencies,
  onRetry
}) {
  const { localizePath } = useLocale();
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const markerRefs = useRef([]);
  const profileSelectRef = useRef(null);
  const [mapScriptStatus, setMapScriptStatus] = useState(() =>
    NAVER_MAP_CONFIG.clientId ? 'loading' : 'missing-client-id'
  );
  const [mapInitError, setMapInitError] = useState('');
  const [mapZoom, setMapZoom] = useState(viewport.zoom);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const markerZoomMode = useMemo(() => getMarkerZoomMode(mapZoom), [mapZoom]);
  const renderableMarkers = useMemo(() => toRenderableMarkers(markers, mapZoom), [markers, mapZoom]);
  const officeMarkerCount = useMemo(
    () => markers.filter((marker) => marker.type === 'office').length,
    [markers]
  );
  const orderedProfiles = useMemo(
    () => [...profiles].sort((left, right) => Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault))),
    [profiles]
  );
  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === String(selectedProfileId)) || null,
    [profiles, selectedProfileId]
  );

  useEffect(() => {
    if (!showProfileSelect) {
      setIsProfileMenuOpen(false);
    }
  }, [showProfileSelect]);

  useEffect(() => {
    let isMounted = true;

    if (!NAVER_MAP_CONFIG.clientId) {
      setMapScriptStatus('missing-client-id');
      return undefined;
    }

    setMapScriptStatus('loading');
    setMapInitError('');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: NAVER_MAP_SCRIPT_ID,
      callbackName: NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        if (isMounted) {
          setMapScriptStatus('ready');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setMapScriptStatus('error');
          setMapInitError(error.message || 'script-load-failed');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!canRenderMap(viewState) || mapScriptStatus !== 'ready' || !mapElementRef.current || mapInstanceRef.current) {
      return undefined;
    }

    let cancelled = false;
    let frameId = 0;
    const mapElement = mapElementRef.current;

    const initializeMap = () => {
      if (cancelled) {
        return;
      }

      if (mapElement.clientWidth <= 0 || mapElement.clientHeight <= 0) {
        frameId = window.requestAnimationFrame(initializeMap);
        return;
      }

      try {
        if (!window.naver?.maps?.Map) {
          throw new Error('sdk-not-ready');
        }

        mapInstanceRef.current = new window.naver.maps.Map(mapElement, {
          center: new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng),
          zoom: viewport.zoom,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          zoomControl: false,
          zoomOrigin: createNaverLatLng(currentLocation)
        });

        setMapZoom(viewport.zoom);
        setMapInitError('');
      } catch (error) {
        setMapInitError(error.message || 'map-init-failed');
      }
    };

    initializeMap();

    return () => {
      cancelled = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [currentLocation, mapScriptStatus, viewport, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return;
    }

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng));
    mapInstanceRef.current.setZoom(viewport.zoom, false);
    setMapZoom(viewport.zoom);
  }, [mapScriptStatus, viewport, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return undefined;
    }

    const map = mapInstanceRef.current;
    const syncZoom = () => {
      const nextZoom = Number(map.getZoom?.());
      if (Number.isFinite(nextZoom)) {
        setMapZoom(nextZoom);
      }
    };
    const listener = window.naver.maps.Event.addListener(map, 'zoom_changed', syncZoom);
    syncZoom();

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [mapScriptStatus, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return undefined;
    }

    const map = mapInstanceRef.current;
    const center = new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng);
    const relayout = () => {
      window.naver.maps.Event.trigger(map, 'resize');
      map.setCenter(center);
    };

    relayout();
    const timerId = window.setTimeout(relayout, 120);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [mapScriptStatus, viewState, viewport.center.lat, viewport.center.lng]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return;
    }

    mapInstanceRef.current.setOptions('zoomOrigin', createNaverLatLng(currentLocation));
  }, [currentLocation, mapScriptStatus, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return;
    }

    if (!currentLocation) {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }
      return;
    }

    const position = createNaverLatLng(currentLocation);

    if (!currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current = new window.naver.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: '현재 위치',
        icon: {
          content:
            '<div class="accessibility-map__current-location-marker" aria-hidden="true"><span></span></div>',
          anchor: new window.naver.maps.Point(11, 11)
        }
      });
      return;
    }

    currentLocationMarkerRef.current.setPosition(position);
    currentLocationMarkerRef.current.setMap(mapInstanceRef.current);
  }, [currentLocation, mapScriptStatus, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = renderableMarkers
      .map((marker) => {
        const mapMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(Number(marker.lat), Number(marker.lng)),
          map: mapInstanceRef.current,
          title: marker.label,
          icon: createMarkerIcon(marker, markerZoomMode)
        });

        if (marker.type === 'office') {
          window.naver.maps.Event.addListener(mapMarker, 'click', () => {
            onSelectMarker?.(marker.id);
          });
        }

        return mapMarker;
      });
  }, [mapScriptStatus, markerZoomMode, onSelectMarker, renderableMarkers, viewState]);

  useEffect(
    () => () => {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
      markerRefs.current.forEach((marker) => marker.setMap(null));
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      currentLocationMarkerRef.current = null;
      markerRefs.current = [];
      mapInstanceRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!profileSelectRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.zoomBy(1, createNaverLatLng(currentLocation) || undefined, true);
  }, [currentLocation]);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    mapInstanceRef.current.zoomBy(-1, createNaverLatLng(currentLocation) || undefined, true);
  }, [currentLocation]);

  const handleMoveToCurrentLocation = useCallback(() => {
    if (!currentLocation) {
      onRequestCurrentLocation?.();
      return;
    }

    if (!mapInstanceRef.current || !currentLocation) {
      return;
    }

    mapInstanceRef.current.panTo(createNaverLatLng(currentLocation));
  }, [currentLocation, onRequestCurrentLocation]);

  const visibleSelectedProfile = selectedProfile || orderedProfiles[0] || null;
  const closedProfileLabel = isGuestUser
    ? '로그인 후 자신의 프로필을 선택해보세요.'
    : getProfileDisplayName(visibleSelectedProfile);

  if (viewState === 'error') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">지도 데이터를 불러오지 못했습니다. 다시 시도해주세요.</StatusMessage>
        <button type="button" className="primary-button accessibility-map__retry-button" onClick={onRetry}>
          다시 시도
        </button>
      </section>
    );
  }

  if (mapScriptStatus === 'missing-client-id') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">
          네이버 지도 Client ID가 없습니다. `.env.local`에 `REACT_APP_NAVER_MAP_CLIENT_ID`를 설정해주세요.
        </StatusMessage>
      </section>
    );
  }

  if (mapScriptStatus === 'loading') {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <LoadingView label="네이버 지도를 불러오는 중입니다..." />
      </section>
    );
  }

  if (mapScriptStatus === 'error' || mapInitError) {
    return (
      <section className="accessibility-map__map-panel is-feedback">
        <StatusMessage kind="error">네이버 지도를 표시하지 못했습니다.</StatusMessage>
      </section>
    );
  }

  return (
    <section className="accessibility-map__map-panel" aria-label="지역 접근성 지도">
      <div className="accessibility-map__map-surface">
        <div ref={mapElementRef} className="accessibility-map__naver-map" />
      </div>
      {viewState === 'loading' || viewState === 'calculating' ? (
        <div className="accessibility-map__map-loading-overlay" role="status" aria-live="polite">
          <div className="accessibility-map__map-loading-message jobs-feedback--animated-dots">
            로딩중
            <span className="jobs-feedback__dots" aria-hidden="true" />
          </div>
        </div>
      ) : null}
      {showProfileSelect ? (
        <div
          ref={profileSelectRef}
          className={`accessibility-map__profile-select${isProfileMenuOpen ? ' is-open' : ''}`}
          aria-label="프로필 선택"
        >
          <button
            type="button"
            className="accessibility-map__profile-trigger"
            aria-haspopup="listbox"
            aria-expanded={isGuestUser ? false : isProfileMenuOpen}
            onClick={() => {
              if (isGuestUser) {
                onRequireLogin?.();
                return;
              }
              setIsProfileMenuOpen((isOpen) => !isOpen);
            }}
          >
            <span className="accessibility-map__profile-trigger-main">
              <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
              <span className="accessibility-map__profile-option-text">
                {isGuestUser ? (
                  <strong>{closedProfileLabel}</strong>
                ) : isProfileMenuOpen ? (
                  <strong>프로필을 선택하세요</strong>
                ) : (
                  <>
                    <strong>{closedProfileLabel || '기본 프로필'}</strong>
                    {visibleSelectedProfile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                  </>
                )}
              </span>
            </span>
            <img src={arrowDown} alt="프로필 목록 펼치기 아이콘" loading="lazy" decoding="async" />
          </button>
          {isProfileMenuOpen && !isGuestUser ? (
            <div className="accessibility-map__profile-menu" role="listbox" aria-label="프로필 목록">
              {orderedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`accessibility-map__profile-option${profile.id === String(selectedProfileId) ? ' is-selected' : ''}`}
                  role="option"
                  aria-selected={profile.id === String(selectedProfileId)}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectProfile?.(profile.id);
                    setIsProfileMenuOpen(false);
                  }}
                >
                  <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
                  <span className="accessibility-map__profile-option-text">
                    <strong>{getProfileDisplayName(profile)}</strong>
                    {profile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                  </span>
                </button>
              ))}
              <Link to={localizePath(ROUTE_PATHS.myProfile)} className="accessibility-map__profile-manage">
                <img src={settingIcon} alt="프로필 관리 아이콘" loading="lazy" decoding="async" />
                프로필 관리
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="accessibility-map__top-right-overlays">
        <section className="accessibility-map__score-map-legend" aria-label="접근성 점수 기준">
          <h2>접근성 점수</h2>
          <ul>
            {SCORE_LEGEND_ITEMS.map((item) => (
              <li key={item.grade}>
                <span className={`accessibility-map__score-map-dot is-${item.tone}`} aria-hidden="true" />
                <strong>{item.grade}</strong>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>
        {hasAppliedConditions ? (
          <label className="accessibility-map__support-agency-toggle">
            <input
              type="checkbox"
              checked={showSupportAgencies}
              onChange={(event) => onToggleSupportAgencies?.(event.target.checked)}
            />
            근로지원인 수행기관 보기
          </label>
        ) : null}
      </div>
      {hasAppliedConditions ? (
        <>
          <div className="accessibility-map__map-pill">
            공고 {officeMarkerCount}개 · 수행기관 {supportAgencyCount}곳
            {markers.length > MAX_RENDERED_MARKERS ? ` · 지도 표시 ${MAX_RENDERED_MARKERS}개` : ''}
          </div>
        </>
      ) : null}
      <div className="accessibility-map__map-actions" aria-label="지도 조작">
        <button
          type="button"
          className="accessibility-map__map-action-button is-location"
          onClick={handleMoveToCurrentLocation}
          aria-label={currentLocation ? '현재 위치로 이동' : '현재 위치 사용 요청'}
        >
          <svg className="accessibility-map__location-icon" viewBox="0 0 29 29" aria-hidden="true" focusable="false">
            <path d="M13.89 23.01V21a0.61 0.61 0 0 1 1.22 0v2.01a8.533 8.533 0 0 0 7.9-7.9H21a0.61 0.61 0 0 1 0-1.22h2.01a8.533 8.533 0 0 0-7.9-7.9V8a0.61 0.61 0 0 1-1.22 0V5.99a8.533 8.533 0 0 0-7.9 7.9H8a0.61 0.61 0 0 1 0 1.22H5.99a8.533 8.533 0 0 0 7.9 7.9Zm10.36-8.51c0 5.385-4.365 9.75-9.75 9.75s-9.75-4.365-9.75-9.75 4.365-9.75 9.75-9.75 9.75 4.365 9.75 9.75Zm-9.75 1.625a1.625 1.625 0 1 0 0-3.25 1.625 1.625 0 0 0 0 3.25Z" />
          </svg>
        </button>
        <div className="accessibility-map__zoom-actions" role="group" aria-label="지도 확대 및 축소">
          <button
            type="button"
            className="accessibility-map__map-action-button is-zoom-in"
            onClick={handleZoomIn}
            aria-label="지도 확대"
          >
            +
          </button>
          <button
            type="button"
            className="accessibility-map__map-action-button is-zoom-out"
            onClick={handleZoomOut}
            aria-label="지도 축소"
          >
            -
          </button>
        </div>
      </div>
    </section>
  );
}

export const AccessibilityMapCanvas = memo(AccessibilityMapCanvasComponent);
