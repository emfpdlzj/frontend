import { createMarkerElement, toRenderableMarkers } from './AccessibilityMapCanvas';

const officeMarker = (id, lat, lng, overrides = {}) => ({
  id,
  label: `회사 ${id}`,
  title: `공고 ${id}`,
  score: 80,
  tone: 'good',
  isSelected: false,
  lat,
  lng,
  type: 'office',
  ...overrides
});

const supportAgencyMarker = (id, lat, lng, overrides = {}) => ({
  id,
  label: `수행기관 ${id}`,
  displayLabel: `수행기관 ${id}`,
  lat,
  lng,
  type: 'support-agency',
  ...overrides
});

test('지도 확대 상태에서는 같은 위치의 공고 마커를 개수 클러스터로 묶는다', () => {
  const markers = [
    officeMarker('job-1', 37.501234, 127.001234, { score: 82 }),
    officeMarker('job-2', 37.501234, 127.001234, { score: 75, tone: 'warning' })
  ];

  const [cluster] = toRenderableMarkers(markers, 18);

  expect(cluster.type).toBe('office-cluster');
  expect(cluster.count).toBe(2);
  expect(cluster.score).toBe(82);
  expect(cluster.members.map((member) => member.id)).toEqual(['job-1', 'job-2']);
});

test('같은 좌표의 여러 공고는 최대 확대 상태에서도 숫자 마커로 유지한다', () => {
  const markers = [
    officeMarker('job-1', 37.501234, 127.001234, { score: 82, isSelected: true }),
    officeMarker('job-2', 37.501234, 127.001234, { score: 75, tone: 'warning' })
  ];

  const [cluster] = toRenderableMarkers(markers, 20);

  expect(cluster).toMatchObject({
    type: 'office-cluster',
    count: 2,
    isSelected: true
  });
  expect(cluster.members.find((member) => member.id === 'job-1')).toMatchObject({
    isSelected: true
  });
});

test('지도 축소 상태에서는 같은 위치 공고만 숫자로 묶고 가까운 공고는 각각 점으로 보여준다', () => {
  const markers = [
    officeMarker('job-1', 37.50121, 127.00121, { score: 72, tone: 'warning' }),
    officeMarker('job-2', 37.50131, 127.00131, { score: 91 }),
    officeMarker('job-3', 37.50131, 127.00131, { score: 85 }),
    {
      id: 'agency-1',
      label: '근로지원기관',
      lat: 37.5014,
      lng: 127.0014,
      type: 'support-agency'
    }
  ];

  const renderableMarkers = toRenderableMarkers(markers, 14);

  expect(renderableMarkers).toHaveLength(3);
  expect(renderableMarkers.filter((marker) => marker.type === 'office')).toHaveLength(1);
  expect(renderableMarkers.find((marker) => marker.type === 'office-cluster')).toMatchObject({
    count: 2,
    score: 91
  });
  expect(renderableMarkers.find((marker) => marker.id === 'agency-1')).toMatchObject({
    type: 'support-agency',
    id: 'agency-1'
  });
});

test('지도 확대 상태에서는 라벨이 겹칠 만큼 가까운 공고를 숫자 클러스터로 묶는다', () => {
  const markers = [
    officeMarker('job-1', 37.50121, 127.00121, { score: 72, tone: 'warning' }),
    officeMarker('job-2', 37.50124, 127.00124, { score: 91 })
  ];

  const renderableMarkers = toRenderableMarkers(markers, 18);

  expect(renderableMarkers).toHaveLength(1);
  expect(renderableMarkers[0]).toMatchObject({
    type: 'office-cluster',
    count: 2,
    score: 91
  });
});

test('지도 확대 상태에서는 가까운 수행기관 마커를 숫자 마커로 묶는다', () => {
  const markers = [
    supportAgencyMarker('agency-1', 37.50121, 127.00121),
    supportAgencyMarker('agency-2', 37.50124, 127.00124)
  ];

  const renderableMarkers = toRenderableMarkers(markers, 18);

  expect(renderableMarkers).toHaveLength(1);
  expect(renderableMarkers[0]).toMatchObject({
    type: 'support-agency-cluster',
    count: 2
  });
  expect(renderableMarkers[0].members.map((member) => member.id)).toEqual(['agency-1', 'agency-2']);
});

test('지도 축소 상태에서도 가까운 수행기관 마커를 숫자 마커로 묶는다', () => {
  const markers = [
    supportAgencyMarker('agency-1', 37.5, 127.0),
    supportAgencyMarker('agency-2', 37.5, 127.008)
  ];

  const renderableMarkers = toRenderableMarkers(markers, 14);

  expect(renderableMarkers).toHaveLength(1);
  expect(renderableMarkers[0]).toMatchObject({
    type: 'support-agency-cluster',
    count: 2
  });
});

test('수행기관 일반 마커는 축소 상태에서 라벨을 숨기고 작아진다', () => {
  const detailMarker = createMarkerElement(supportAgencyMarker('agency-1', 37.5, 127.0), 'detail');
  const dotMarker = createMarkerElement(supportAgencyMarker('agency-1', 37.5, 127.0), 'dot');

  expect(detailMarker.className).toContain('is-zoom-detail');
  expect(detailMarker.querySelector('span')?.textContent).toBe('수행기관 agency-1');
  expect(dotMarker.className).toContain('is-zoom-dot');
  expect(dotMarker.querySelector('span')).toBeNull();
});
