import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import arrowDown from '../../assets/accessibility-map/arrow_down.png';
import profileIcon from '../../assets/accessibility-map/profile-icon.png';
import settingIcon from '../../assets/accessibility-map/setting-icon.png';
import { NAVER_MAP_CONFIG } from '../../config/appConfig';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';
import { loadNaverMapScript } from '../../utils/naverMapSdk';
import { LoadingView } from '../common/LoadingView';
import { StatusMessage } from '../common/StatusMessage';
import {
  canRenderMap,
  createMarkerIcon,
  createNaverLatLng,
  getMarkerZoomMode,
  getProfileDisplayName,
  MARKER_DISPLAY_MODE,
  MARKER_ZOOM_MODE,
  MAX_RENDERED_MARKERS,
  NAVER_MAP_READY_CALLBACK,
  NAVER_MAP_SCRIPT_ID,
  SCORE_LEGEND_ITEMS,
  toRenderableMarkers
} from '../../utils/accessibilityMapMarkers';

export { createMarkerElement, toRenderableMarkers } from '../../utils/accessibilityMapMarkers';

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
  viewportResetKey = 0,
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
  const hoverCloseTimerRef = useRef(null);
  const [mapScriptStatus, setMapScriptStatus] = useState(() =>
    NAVER_MAP_CONFIG.clientId ? 'loading' : 'missing-client-id'
  );
  const [mapInitError, setMapInitError] = useState('');
  const [mapZoom, setMapZoom] = useState(viewport.zoom);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [expandedClusterKey, setExpandedClusterKey] = useState('');
  const [hoveredMarkerId, setHoveredMarkerId] = useState('');
  const markerZoomMode = useMemo(() => getMarkerZoomMode(mapZoom), [mapZoom]);
  const renderableMarkers = useMemo(
    () => toRenderableMarkers(markers, mapZoom, expandedClusterKey),
    [expandedClusterKey, markers, mapZoom]
  );
  const selectedClusterKey = useMemo(() => {
    const selectedCluster = renderableMarkers.find(
      (marker) => marker.type === 'office-cluster' && marker.members?.some((member) => member.isSelected)
    );
    return selectedCluster?.clusterKey || '';
  }, [renderableMarkers]);
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
  const openMarkerHover = useCallback((markerId) => {
    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    setHoveredMarkerId(markerId);
  }, []);
  const closeMarkerHover = useCallback((markerId) => {
    if (hoverCloseTimerRef.current) {
      window.clearTimeout(hoverCloseTimerRef.current);
    }
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setHoveredMarkerId((current) => (current === markerId ? '' : current));
      hoverCloseTimerRef.current = null;
    }, 80);
  }, []);

  useEffect(() => {
    if (!showProfileSelect) {
      setIsProfileMenuOpen(false);
    }
  }, [showProfileSelect]);

  useEffect(() => {
    if (!expandedClusterKey) {
      return;
    }

    const hasExpandedCluster = renderableMarkers.some(
      (marker) => ['office-cluster', 'support-agency-cluster'].includes(marker.type) && marker.clusterKey === expandedClusterKey
    );
    if (!hasExpandedCluster) {
      setExpandedClusterKey('');
    }
  }, [expandedClusterKey, renderableMarkers]);

  useEffect(() => {
    if (selectedClusterKey) {
      setExpandedClusterKey(selectedClusterKey);
    }
  }, [selectedClusterKey]);

  useEffect(() => {
    if (!hoveredMarkerId) {
      return;
    }

    const hasHoveredMarker = renderableMarkers.some((marker) => marker.id === hoveredMarkerId);
    if (!hasHoveredMarker) {
      setHoveredMarkerId('');
    }
  }, [hoveredMarkerId, renderableMarkers]);

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
  }, [mapScriptStatus, viewportResetKey, viewState]);

  useEffect(() => {
    if (!mapInstanceRef.current || mapScriptStatus !== 'ready' || !canRenderMap(viewState)) {
      return;
    }

    mapInstanceRef.current.setCenter(new window.naver.maps.LatLng(viewport.center.lat, viewport.center.lng));
  }, [mapScriptStatus, viewport.center.lat, viewport.center.lng, viewState]);

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
        const isPinnedOfficeMarker =
          marker.type === 'office' &&
          (marker.isSelected || markerZoomMode === MARKER_ZOOM_MODE.DOT);
        const shouldRenderPopup =
          marker.type === 'office' &&
          (marker.isSelected || (markerZoomMode === MARKER_ZOOM_MODE.DOT && hoveredMarkerId === marker.id));
        const selectedClusterMember = marker.type === 'office-cluster'
          ? marker.members?.find((member) => member.isSelected)
          : null;
        const markerDescriptors = [
          {
            source: marker,
            rendered: isPinnedOfficeMarker
              ? { ...marker, displayMode: MARKER_DISPLAY_MODE.PIN, isSelected: false, isHovered: false }
              : marker,
            zoomMode: isPinnedOfficeMarker ? MARKER_ZOOM_MODE.DOT : markerZoomMode,
            kind: 'base'
          },
          shouldRenderPopup
            ? {
                source: marker,
                rendered: {
                  ...marker,
                  displayMode: MARKER_DISPLAY_MODE.POPUP,
                  isHovered: !marker.isSelected && hoveredMarkerId === marker.id
                },
                zoomMode: MARKER_ZOOM_MODE.DETAIL,
                kind: 'popup'
              }
            : null,
          selectedClusterMember
            ? {
                source: {
                  ...selectedClusterMember,
                  lat: marker.lat,
                  lng: marker.lng
                },
                rendered: {
                  ...selectedClusterMember,
                  lat: marker.lat,
                  lng: marker.lng,
                  displayMode: MARKER_DISPLAY_MODE.POPUP,
                  isSelected: true,
                  isHovered: false
                },
                zoomMode: MARKER_ZOOM_MODE.DETAIL,
                kind: 'popup'
              }
            : null
        ].filter(Boolean);

        return markerDescriptors.map(({ source, rendered, zoomMode, kind }) => {
          const icon = createMarkerIcon(rendered, zoomMode);

          if (['office-cluster', 'support-agency-cluster'].includes(source.type) && icon.content instanceof HTMLElement) {
            const handleClusterOpen = () => {
              setExpandedClusterKey(source.clusterKey);
            };
            icon.content.dataset.clusterKey = source.clusterKey;
            icon.content.addEventListener('click', (event) => {
              const memberButton = event.target.closest?.('[data-marker-member-id]');
              if (memberButton && source.type === 'office-cluster') {
                event.preventDefault();
                event.stopPropagation();
                setExpandedClusterKey('');
                onSelectMarker?.(memberButton.dataset.markerMemberId);
                return;
              }

              handleClusterOpen();
            });
            icon.content.addEventListener('keydown', (event) => {
              const memberButton = event.target.closest?.('[data-marker-member-id]');
              if (memberButton && source.type === 'office-cluster' && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                event.stopPropagation();
                setExpandedClusterKey('');
                onSelectMarker?.(memberButton.dataset.markerMemberId);
                return;
              }

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleClusterOpen();
              }
            });
          }

          if (source.type === 'office' && icon.content instanceof HTMLElement) {
            icon.content.addEventListener('mouseenter', () => {
              if (source.isSelected) {
                return;
              }
              openMarkerHover(source.id);
            });
            icon.content.addEventListener('mouseleave', () => {
              closeMarkerHover(source.id);
            });
          }

          const mapMarker = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(Number(source.lat), Number(source.lng)),
            map: mapInstanceRef.current,
            title: source.label,
            icon,
            zIndex: kind === 'popup' ? 30 : ['office-cluster', 'support-agency-cluster'].includes(source.type) ? 20 : 10
          });

          if (source.type === 'office') {
            window.naver.maps.Event.addListener(mapMarker, 'mouseover', () => {
              if (source.isSelected) {
                return;
              }
              openMarkerHover(source.id);
            });
            window.naver.maps.Event.addListener(mapMarker, 'mouseout', () => {
              closeMarkerHover(source.id);
            });
            window.naver.maps.Event.addListener(mapMarker, 'click', () => {
              setExpandedClusterKey('');
              onSelectMarker?.(source.id);
            });
          }

          return mapMarker;
        });
      })
      .flat();
  }, [
    closeMarkerHover,
    hoveredMarkerId,
    mapScriptStatus,
    markerZoomMode,
    onSelectMarker,
    openMarkerHover,
    renderableMarkers,
    viewState
  ]);

  useEffect(() => {
    if (!expandedClusterKey) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const clusterElement = event.target.closest?.('[data-cluster-key]');
      if (clusterElement?.dataset?.clusterKey === expandedClusterKey) {
        return;
      }

      setExpandedClusterKey('');
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [expandedClusterKey]);

  useEffect(
    () => () => {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
      markerRefs.current.forEach((marker) => marker.setMap(null));
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      if (hoverCloseTimerRef.current) {
        window.clearTimeout(hoverCloseTimerRef.current);
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
