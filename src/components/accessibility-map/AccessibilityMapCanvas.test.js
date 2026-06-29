import { toRenderableMarkers } from './AccessibilityMapCanvas';

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
