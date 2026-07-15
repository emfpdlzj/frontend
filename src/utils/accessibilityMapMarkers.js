import companyMapMarker from '../assets/accessibility-map/company-map-marker.png';

export const NAVER_MAP_SCRIPT_ID = 'bridgework-naver-map-sdk';
export const NAVER_MAP_READY_CALLBACK = '__bridgeworkNaverMapReady__';
export const MAX_RENDERED_MARKERS = 250;
const MARKER_GRID_DECIMALS_BY_ZOOM = [
  [13, 4],
  [10, 3],
  [0, 2]
];
export const SCORE_LEGEND_ITEMS = [
  { grade: 'A', label: '80 이상', tone: 'good' },
  { grade: 'B', label: '60 ~ 79', tone: 'warning' },
  { grade: 'C', label: '60 미만', tone: 'danger' }
];
export const MARKER_ZOOM_MODE = {
  DETAIL: 'detail',
  COMPACT: 'compact',
  DOT: 'dot'
};
export const MARKER_DISPLAY_MODE = {
  DEFAULT: 'default',
  PIN: 'pin',
  POPUP: 'popup'
};
const SUPPORT_AGENCY_CLUSTER_GRID_PX = {
  x: 120,
  y: 56
};
const OFFICE_LABEL_CLUSTER_DECIMALS_BY_ZOOM = [
  [20, 6],
  [19, 5],
  [18, 4]
];

export function createNaverLatLng(location) {
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
  return ['office', 'office-cluster', 'support-agency', 'support-agency-cluster'].includes(type)
    ? type
    : 'support-agency';
}

function getSafeOfficeMarkerTone(tone) {
  return ['good', 'warning', 'danger'].includes(tone) ? tone : 'warning';
}

export function getMarkerZoomMode(zoom) {
  const normalizedZoom = Number(zoom);
  if (!Number.isFinite(normalizedZoom) || normalizedZoom >= 18) {
    return MARKER_ZOOM_MODE.DETAIL;
  }
  return MARKER_ZOOM_MODE.DOT;
}

function getOfficeMarkerAnchor(marker, zoomMode) {
  if (marker.type === 'office-cluster') {
    return new window.naver.maps.Point(10, 10);
  }

  if (marker.displayMode === MARKER_DISPLAY_MODE.PIN) {
    return new window.naver.maps.Point(7, 7);
  }

  if (marker.displayMode === MARKER_DISPLAY_MODE.POPUP || marker.isSelected) {
    return new window.naver.maps.Point(112, 57);
  }

  if (zoomMode === MARKER_ZOOM_MODE.DOT) {
    return new window.naver.maps.Point(7, 7);
  }
  if (zoomMode === MARKER_ZOOM_MODE.COMPACT) {
    return marker.isSelected
      ? new window.naver.maps.Point(34, 27)
      : new window.naver.maps.Point(34, 13);
  }

  return marker.isSelected
    ? new window.naver.maps.Point(53, 38)
    : new window.naver.maps.Point(53, 15);
}

function createOfficeMarkerSummary(marker) {
  const textWrap = document.createElement('span');
  textWrap.className = 'accessibility-map__marker-cluster-text';

  const main = document.createElement('span');
  main.className = 'accessibility-map__marker-cluster-main';
  const name = document.createElement('strong');
  name.textContent = marker.displayLabel || marker.label || '회사명 확인 필요';
  main.append(name);

  if (typeof marker.score === 'number' && Number.isFinite(marker.score)) {
    const divider = document.createElement('span');
    divider.className = 'accessibility-map__marker-cluster-divider';
    divider.setAttribute('aria-hidden', 'true');
    const score = document.createElement('em');
    score.className = 'accessibility-map__marker-cluster-score';
    score.textContent = `${marker.score}점`;
    main.append(divider, score);
  }

  const meta = document.createElement('span');
  meta.className = 'accessibility-map__marker-cluster-meta';
  const title = document.createElement('span');
  title.className = 'accessibility-map__marker-cluster-title';
  title.textContent = marker.title || marker.jobTitle || '';
  meta.append(title);

  textWrap.append(main, meta);
  return textWrap;
}

function createSupportAgencyMarkerSummary(marker) {
  const textWrap = document.createElement('span');
  textWrap.className = 'accessibility-map__marker-cluster-text';

  const main = document.createElement('span');
  main.className = 'accessibility-map__marker-cluster-main';
  const name = document.createElement('strong');
  name.textContent = marker.displayLabel || marker.label || '수행기관명 확인 필요';
  main.append(name);

  const meta = document.createElement('span');
  meta.className = 'accessibility-map__marker-cluster-meta';
  meta.textContent = marker.address || marker.telephone || '상세 정보 확인 필요';

  textWrap.append(main, meta);
  return textWrap;
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

function projectLatLngToWorldPixel(lat, lng, zoom) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  const normalizedZoom = Number(zoom);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(normalizedZoom)) {
    return null;
  }

  const tileSize = 256;
  const sinLatitude = Math.sin((Math.max(-85.05112878, Math.min(85.05112878, latitude)) * Math.PI) / 180);
  const scale = tileSize * 2 ** normalizedZoom;

  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale
  };
}

function groupSupportAgencyMarkers(markers, zoom) {
  const groups = [];

  markers
    .map((marker) => ({
      marker,
      pixel: projectLatLngToWorldPixel(marker.lat, marker.lng, zoom)
    }))
    .forEach(({ marker, pixel }) => {
      const matchedGroup = pixel
        ? groups.find((group) =>
            group.pixel
            && Math.abs(group.pixel.x - pixel.x) <= SUPPORT_AGENCY_CLUSTER_GRID_PX.x
            && Math.abs(group.pixel.y - pixel.y) <= SUPPORT_AGENCY_CLUSTER_GRID_PX.y
          )
        : groups.find(
            (group) =>
              !group.pixel
              && Number(group.members[0]?.lat).toFixed(6) === Number(marker.lat).toFixed(6)
              && Number(group.members[0]?.lng).toFixed(6) === Number(marker.lng).toFixed(6)
          );

      if (!matchedGroup) {
        groups.push({
          lat: Number(marker.lat),
          lng: Number(marker.lng),
          members: [marker],
          pixel: pixel ? { ...pixel } : null
        });
        return;
      }

      matchedGroup.members.push(marker);
      matchedGroup.lat = matchedGroup.members.reduce((sum, member) => sum + Number(member.lat), 0) / matchedGroup.members.length;
      matchedGroup.lng = matchedGroup.members.reduce((sum, member) => sum + Number(member.lng), 0) / matchedGroup.members.length;
      if (pixel && matchedGroup.pixel) {
        matchedGroup.pixel = {
          x: matchedGroup.members.reduce(
            (sum, member) => sum + projectLatLngToWorldPixel(member.lat, member.lng, zoom).x,
            0
          ) / matchedGroup.members.length,
          y: matchedGroup.members.reduce(
            (sum, member) => sum + projectLatLngToWorldPixel(member.lat, member.lng, zoom).y,
            0
          ) / matchedGroup.members.length
        };
      }
    });

  return groups.map(({ pixel, ...group }) => group);
}

function getSupportAgencyMarkerAnchor(zoomMode) {
  if (zoomMode === MARKER_ZOOM_MODE.DOT) {
    return new window.naver.maps.Point(8, 8);
  }

  if (zoomMode === MARKER_ZOOM_MODE.COMPACT) {
    return new window.naver.maps.Point(34, 14);
  }

  return new window.naver.maps.Point(63, 18);
}

export function createMarkerElement(marker, zoomMode = MARKER_ZOOM_MODE.DETAIL) {
  const markerType = getSafeMarkerType(marker.type);
  if (markerType === 'support-agency') {
    const wrapper = document.createElement('div');
    wrapper.className = [
      'accessibility-map__company-marker',
      'is-support-agency',
      `is-zoom-${zoomMode}`
    ].join(' ');
    wrapper.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.src = companyMapMarker;
    image.alt = '근로지원기관 위치 마커 아이콘';

    wrapper.append(image);
    if (zoomMode !== MARKER_ZOOM_MODE.DOT) {
      const label = document.createElement('span');
      label.textContent = marker.displayLabel || marker.label || '';
      wrapper.append(label);
    }
    return wrapper;
  }

  if (markerType === 'support-agency-cluster') {
    const wrapper = document.createElement('div');
    wrapper.className = [
      'accessibility-map__job-map-marker',
      'is-cluster',
      'is-no-score',
      'is-support-cluster',
      `is-zoom-${zoomMode}`
    ].join(' ');
    wrapper.setAttribute('role', 'button');
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('aria-expanded', marker.isExpanded ? 'true' : 'false');
    wrapper.setAttribute('aria-label', `${marker.count}개 수행기관이 가까운 위치에 있습니다. 선택 목록 ${marker.isExpanded ? '접기' : '펼치기'}`);

    const dot = document.createElement('span');
    dot.className = 'accessibility-map__job-map-marker-dot';

    const label = document.createElement('strong');
    label.textContent = String(marker.count);

    wrapper.append(dot, label);
    if (Array.isArray(marker.members)) {
      const menu = document.createElement('div');
      menu.className = 'accessibility-map__marker-cluster-menu';
      menu.setAttribute('role', 'list');
      menu.setAttribute('aria-label', '가까운 수행기관 목록');

      marker.members.slice(0, 8).forEach((member) => {
        const item = document.createElement('div');
        item.className = [
          'accessibility-map__marker-cluster-option',
          'is-support-cluster'
        ].join(' ');
        item.setAttribute('role', 'listitem');
        const dot = document.createElement('span');
        dot.className = 'accessibility-map__marker-cluster-dot';
        dot.setAttribute('aria-hidden', 'true');
        item.append(dot, createSupportAgencyMarkerSummary(member));
        menu.append(item);
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

  const tone = getSafeOfficeMarkerTone(marker.tone);
  const wrapper = document.createElement('div');
  const hasScore = typeof marker.score === 'number' && Number.isFinite(marker.score);
  wrapper.className = [
    'accessibility-map__job-map-marker',
    markerType === 'office-cluster' ? 'is-cluster' : '',
    marker.displayMode === MARKER_DISPLAY_MODE.PIN ? 'is-pin' : '',
    marker.displayMode === MARKER_DISPLAY_MODE.POPUP ? 'is-popup' : '',
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

  if (markerType === 'office' && marker.displayMode === MARKER_DISPLAY_MODE.POPUP) {
    wrapper.append(dot, createOfficeMarkerSummary(marker));
    return wrapper;
  }

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

      button.append(dot, createOfficeMarkerSummary(member));
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

export function createMarkerIcon(marker, zoomMode = MARKER_ZOOM_MODE.DETAIL) {
  if (marker.type === 'support-agency') {
    return {
      content: createMarkerElement(marker, zoomMode),
      anchor: getSupportAgencyMarkerAnchor(zoomMode)
    };
  }

  if (marker.type === 'support-agency-cluster') {
    return {
      content: createMarkerElement(marker, zoomMode),
      anchor: new window.naver.maps.Point(10, 10)
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

export function canRenderMap(viewState) {
  return viewState !== 'error';
}

export function getProfileDisplayName(profile) {
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
  const supportMarkers = validMarkers.filter((marker) => marker.type === 'support-agency');
  const officeMarkers = validMarkers.filter((marker) => marker.type === 'office');
  const passthroughMarkers = validMarkers.filter((marker) => marker.type !== 'office' && marker.type !== 'support-agency');
  const visualGroups = groupOfficeMarkers(officeMarkers, zoom);
  const supportGroups = groupSupportAgencyMarkers(supportMarkers, zoom);

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

  const groupedSupportMarkers = supportGroups.map((group) => {
    const members = group.members;
    if (members.length === 1) {
      return {
        ...members[0],
        clusterKey: getClusterKey(members)
      };
    }

    const clusterKey = getClusterKey(members);
    return {
      id: `support-cluster:${clusterKey}`,
      clusterKey,
      label: `${members.length}개 수행기관`,
      displayLabel: String(members.length),
      count: members.length,
      isExpanded: expandedClusterKey === clusterKey,
      lat: group.lat,
      lng: group.lng,
      type: 'support-agency-cluster',
      members
    };
  });

  const groupedMarkers = [...groupedOfficeMarkers, ...groupedSupportMarkers, ...passthroughMarkers];

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
