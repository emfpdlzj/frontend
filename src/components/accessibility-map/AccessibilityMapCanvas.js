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
const OFFICE_LABEL_CLUSTER_DECIMALS_BY_ZOOM = [
  [20, 6],
  [19, 5],
  [18, 4]
];

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
  return ['office', 'office-cluster', 'support-agency'].includes(type) ? type : 'support-agency';
}

function getSafeOfficeMarkerTone(tone) {
  return ['good', 'warning', 'danger'].includes(tone) ? tone : 'warning';
}

function getMarkerZoomMode(zoom) {
  const normalizedZoom = Number(zoom);
  if (!Number.isFinite(normalizedZoom) || normalizedZoom >= 18) {
    return MARKER_ZOOM_MODE.DETAIL;
  }
  return MARKER_ZOOM_MODE.DOT;
}

function getOfficeMarkerAnchor(marker, zoomMode) {
  if (marker.type === 'office-cluster') {
    return new window.naver.maps.Point(14, 14);
  }

  if (marker.isSelected) {
    return new window.naver.maps.Point(110, 54);
  }

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

function getStableMarkerId(marker) {
  return String(marker.id || `${marker.lat}:${marker.lng}:${marker.label || ''}`);
}

function getClusterKey(markers) {
  return markers.map(getStableMarkerId).sort().join('|');
}

function getLabelClusterDecimals(zoom) {
  const normalizedZoom = Number(zoom);
  const [, decimals] = OFFICE_LABEL_CLUSTER_DECIMALS_BY_ZOOM.find(([minZoom]) => normalizedZoom >= minZoom) ||
    OFFICE_LABEL_CLUSTER_DECIMALS_BY_ZOOM[OFFICE_LABEL_CLUSTER_DECIMALS_BY_ZOOM.length - 1];
  return decimals;
}

function groupOfficeMarkers(markers, zoom) {
  const zoomMode = getMarkerZoomMode(zoom);
  const decimals = zoomMode === MARKER_ZOOM_MODE.DETAIL ? getLabelClusterDecimals(zoom) : 6;
  const groups = new Map();

  markers.forEach((marker) => {
    const key = `${Number(marker.lat).toFixed(decimals)}:${Number(marker.lng).toFixed(decimals)}`;
    const group = groups.get(key) || {
      lat: 0,
      lng: 0,
      members: []
    };
    group.members.push(marker);
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    lat: group.members.reduce((sum, marker) => sum + Number(marker.lat), 0) / group.members.length,
    lng: group.members.reduce((sum, marker) => sum + Number(marker.lng), 0) / group.members.length
  }));
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
    markerType === 'office-cluster' ? 'is-cluster' : '',
    `is-${tone}`,
    `is-zoom-${zoomMode}`,
    marker.isSelected ? 'is-selected' : '',
    marker.isHovered ? 'is-hovered' : '',
    marker.isExpanded ? 'is-expanded' : '',
    hasScore ? '' : 'is-no-score'
  ].filter(Boolean).join(' ');

  if (markerType === 'office-cluster') {
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-expanded', marker.isExpanded ? 'true' : 'false');
    wrapper.setAttribute('aria-label', `${marker.count}개 공고가 같은 위치에 있습니다. 선택 목록 ${marker.isExpanded ? '접기' : '펼치기'}`);
  } else {
    wrapper.setAttribute('aria-hidden', 'true');
  }

  const dot = document.createElement('span');
  dot.className = 'accessibility-map__job-map-marker-dot';

  const label = document.createElement('strong');
  if (markerType === 'office-cluster') {
    label.textContent = String(marker.count);
  } else {
    label.textContent = marker.displayLabel || marker.label || '회사';
  }

  const divider = document.createElement('span');
  divider.className = 'accessibility-map__job-map-marker-divider';

  wrapper.append(dot, label);
  if (hasScore) {
    const score = document.createElement('em');
    score.textContent = String(marker.score);
    wrapper.append(divider, score);
  }

  if (markerType === 'office-cluster' && Array.isArray(marker.members)) {
    const menu = document.createElement('div');
    menu.className = 'accessibility-map__marker-cluster-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', '같은 위치 공고 선택');

    marker.members.slice(0, 8).forEach((member) => {
      const button = document.createElement('button');
      const memberTone = getSafeOfficeMarkerTone(member.tone);
      button.type = 'button';
      button.className = [
        'accessibility-map__marker-cluster-option',
        `is-${memberTone}`,
        member.isSelected ? 'is-selected' : ''
      ].filter(Boolean).join(' ');
      button.dataset.markerMemberId = member.id;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', member.isSelected ? 'true' : 'false');

      const dot = document.createElement('span');
      dot.className = 'accessibility-map__marker-cluster-dot';
      dot.setAttribute('aria-hidden', 'true');

      const textWrap = document.createElement('span');
      textWrap.className = 'accessibility-map__marker-cluster-text';

      const main = document.createElement('span');
      main.className = 'accessibility-map__marker-cluster-main';
      const name = document.createElement('strong');
      name.textContent = member.label || '회사명 확인 필요';
      const divider = document.createElement('span');
      divider.className = 'accessibility-map__marker-cluster-divider';
      divider.setAttribute('aria-hidden', 'true');
      const score = document.createElement('em');
      score.className = 'accessibility-map__marker-cluster-score';
      score.textContent = typeof member.score === 'number' && Number.isFinite(member.score)
        ? `${member.score}점`
        : '';
      main.append(name, divider, score);

      const meta = document.createElement('span');
      meta.className = 'accessibility-map__marker-cluster-meta';
      const title = document.createElement('span');
      title.className = 'accessibility-map__marker-cluster-title';
      title.textContent = member.title || '';

      meta.append(title);
      textWrap.append(main, meta);
      button.append(dot, textWrap);
      menu.append(button);
    });

    if (marker.members.length > 8) {
      const more = document.createElement('span');
      more.className = 'accessibility-map__marker-cluster-more';
      more.textContent = `외 ${marker.members.length - 8}개`;
      menu.append(more);
    }

    wrapper.append(menu);
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

  if (marker.type === 'office' || marker.type === 'office-cluster') {
    return {
      content: createMarkerElement(marker, zoomMode),
      anchor: getOfficeMarkerAnchor(marker, zoomMode)
    };
  }

  return {
    content: `<div class="accessibility-map__marker is-sdk is-${escapeHtml(marker.type || 'unknown')}" aria-hidden="true"></div>`,
    anchor: new window.naver.maps.Point(8, 8)
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

export function toRenderableMarkers(markers, zoom, expandedClusterKey = '') {
  const validMarkers = markers.filter((marker) => Number.isFinite(Number(marker.lat)) && Number.isFinite(Number(marker.lng)));
  const supportMarkers = validMarkers.filter((marker) => marker.type !== 'office');
  const officeMarkers = validMarkers.filter((marker) => marker.type === 'office');
  const visualGroups = groupOfficeMarkers(officeMarkers, zoom);

  const groupedOfficeMarkers = visualGroups.map((group) => {
    const members = group.members;
    if (members.length === 1) {
      return {
        ...members[0],
        clusterKey: getClusterKey(members)
      };
    }

    const clusterKey = getClusterKey(members);
    const selectedMember = members.find((marker) => marker.isSelected);
    const scoredMembers = members.filter((marker) => typeof marker.score === 'number' && Number.isFinite(marker.score));
    const bestScore = scoredMembers.length ? Math.max(...scoredMembers.map((marker) => marker.score)) : null;
    const toneSource = selectedMember || scoredMembers.find((marker) => marker.score === bestScore) || members[0];

    return {
      id: `cluster:${clusterKey}`,
      clusterKey,
      label: `${members.length}개 공고`,
      displayLabel: `${members.length}개`,
      count: members.length,
      score: bestScore,
      tone: toneSource.tone,
      isSelected: Boolean(selectedMember),
      isExpanded: expandedClusterKey === clusterKey,
      lat: group.lat,
      lng: group.lng,
      type: 'office-cluster',
      members
    };
  });

  const groupedMarkers = [...groupedOfficeMarkers, ...supportMarkers];

  if (groupedMarkers.length <= MAX_RENDERED_MARKERS) {
    return groupedMarkers;
  }

  const decimals = getMarkerGridDecimals(zoom);
  const cells = new Map();

  groupedMarkers.forEach((marker) => {
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
      (marker) => marker.type === 'office-cluster' && marker.clusterKey === expandedClusterKey
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
        const isHoverPreview =
          marker.type === 'office' &&
          !marker.isSelected &&
          markerZoomMode === MARKER_ZOOM_MODE.DOT &&
          hoveredMarkerId === marker.id;
        const renderedMarker = isHoverPreview ? { ...marker, isHovered: true } : marker;
        const renderedZoomMode = isHoverPreview ? MARKER_ZOOM_MODE.DETAIL : markerZoomMode;
        const icon = createMarkerIcon(renderedMarker, renderedZoomMode);

        if (marker.type === 'office-cluster' && icon.content instanceof HTMLElement) {
          const handleClusterOpen = () => {
            setExpandedClusterKey(marker.clusterKey);
          };
          icon.content.dataset.clusterKey = marker.clusterKey;
          icon.content.addEventListener('click', (event) => {
            const memberButton = event.target.closest?.('[data-marker-member-id]');
            if (memberButton) {
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
            if (memberButton && (event.key === 'Enter' || event.key === ' ')) {
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

        if (marker.type === 'office' && icon.content instanceof HTMLElement) {
          icon.content.addEventListener('mouseenter', () => {
            if (marker.isSelected) {
              return;
            }
            setHoveredMarkerId(marker.id);
          });
          icon.content.addEventListener('mouseleave', () => {
            setHoveredMarkerId((current) => (current === marker.id ? '' : current));
          });
        }

        const mapMarker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(Number(marker.lat), Number(marker.lng)),
          map: mapInstanceRef.current,
          title: marker.label,
          icon
        });

        if (marker.type === 'office') {
          window.naver.maps.Event.addListener(mapMarker, 'mouseover', () => {
            if (marker.isSelected) {
              return;
            }
            setHoveredMarkerId(marker.id);
          });
          window.naver.maps.Event.addListener(mapMarker, 'mouseout', () => {
            setHoveredMarkerId((current) => (current === marker.id ? '' : current));
          });
          window.naver.maps.Event.addListener(mapMarker, 'click', () => {
            setExpandedClusterKey('');
            onSelectMarker?.(marker.id);
          });
        }

        return mapMarker;
      });
  }, [hoveredMarkerId, mapScriptStatus, markerZoomMode, onSelectMarker, renderableMarkers, viewState]);

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
