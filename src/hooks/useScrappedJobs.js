import { useCallback, useEffect, useMemo, useState } from 'react';
import { postingApi } from '../api/postingApi';
import { useAuth } from '../auth/AuthContext';

const toSafeText = (value, fallback = '없음') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const parseDateText = (value) => {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '';
  }
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
};

const parseRegionFromAddress = (value) => {
  const text = String(value ?? '').trim();
  if (!text) {
    return '없음';
  }

  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.length) {
    return '없음';
  }

  if (tokens.length === 1) {
    return tokens[0];
  }

  // 한국 주소 기준으로 시/도 + 시/군/구 단위까지 보여준다.
  return `${tokens[0]} ${tokens[1]}`;
};

const getDday = (value) => {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '';
  }

  const deadline = new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
  if (Number.isNaN(diffDays)) {
    return '';
  }

  if (diffDays < 0) {
    return '마감';
  }

  if (diffDays === 0) {
    return '오늘 마감';
  }

  return `D-${diffDays}`;
};

const getMapCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getStatusLabel = (postingStatus, dueLabel) => {
  if (postingStatus !== 'ACTIVE' || dueLabel === '마감') {
    return '마감 공고';
  }
  return '진행중 공고';
};

const buildPresentFields = (fieldEntries) =>
  fieldEntries
    .map(([label, value]) => [label, toSafeText(value, '')])
    .filter(([, value]) => value);

const buildDisplayFields = (fieldEntries) =>
  fieldEntries.map(([label, value]) => [label, toSafeText(value)]);

const normalizeScrapItem = (item) => {
  const score = null;
  const dueLabel = getDday(item?.termDate);
  const postingStatus = item?.postingStatus || 'ACTIVE';

  return {
    id: String(item?.postingId || ''),
    postingId: Number(item?.postingId),
    company: toSafeText(item?.companyName),
    title: toSafeText(item?.jobTitle),
    location: parseRegionFromAddress(item?.workAddress),
    employmentType: toSafeText(item?.employmentType),
    salary: [item?.salaryType, item?.salary].filter(Boolean).join(' ') || '급여 확인 필요',
    termDate: item?.termDate || '',
    dueLabel,
    postingStatus,
    statusLabel: getStatusLabel(postingStatus, dueLabel),
    scrappedAt: item?.scrappedAt || '',
    registeredAt: parseDateText(item?.registeredAt)
  };
};

const normalizeDetail = (detail) => {
  if (!detail) {
    return null;
  }

  const dueLabel = getDday(detail.termDate);
  const mapLat = getMapCoordinate(detail.geoLatitude);
  const mapLng = getMapCoordinate(detail.geoLongitude);
  const hasMapPoint = mapLat !== null && mapLng !== null;

  return {
    postingId: detail.postingId,
    title: toSafeText(detail.jobTitle),
    company: toSafeText(detail.companyName),
    location: toSafeText(detail.workAddress),
    region: parseRegionFromAddress(detail.workAddress),
    salary: [detail.salaryType, detail.salary].filter(Boolean).join(' ') || '급여 확인 필요',
    employmentType: toSafeText(detail.employmentType),
    enterType: toSafeText(detail.enterType),
    termDateText: parseDateText(detail.termDate) || '없음',
    dueLabel,
    postingStatus: detail.postingStatus || 'ACTIVE',
    statusLabel: getStatusLabel(detail.postingStatus || 'ACTIVE', dueLabel),
    scrapCount: Number(detail.scrapCount || 0),
    registeredAtText: parseDateText(detail.offerRegisteredAt || detail.registeredAt) || '등록일 확인 필요',
    scrappedByMe: Boolean(detail.scrappedByMe),
    contactNumber: toSafeText(detail.contactNumber),
    agencyName: toSafeText(detail.agencyName),
    mapPreview: {
      available: hasMapPoint,
      lat: mapLat,
      lng: mapLng,
      label: hasMapPoint ? '연동된 지도 정보입니다.' : '지도 위치 데이터가 없습니다.',
      address: toSafeText(detail.workAddress, '근무지 주소 확인 필요')
    },
    contactFields: buildDisplayFields([
      ['연락처', detail.contactNumber],
      ['담당기관', detail.agencyName],
      ['공고등록일', parseDateText(detail.offerRegisteredAt || detail.registeredAt)],
      ['매칭 주소', detail.geoMatchedAddress || detail.workAddress]
    ]),
    workConditionFields: buildDisplayFields([
      ['고용형태', detail.employmentType],
      ['입사유형', detail.enterType],
      ['급여', [detail.salaryType, detail.salary].filter(Boolean).join(' ')],
      ['근무지', detail.workAddress]
    ]),
    workEnvironmentFields: buildDisplayFields([
      ['양손 사용', detail.envBothHands],
      ['시력', detail.envEyesight],
      ['듣기·말하기', detail.envLstnTalk],
      ['손작업', detail.envHandWork],
      ['들어올리기', detail.envLiftPower],
      ['서기·걷기', detail.envStndWalk]
    ]),
    requirementFields: buildDisplayFields([
      ['요구경력', detail.requiredCareer],
      ['요구학력', detail.requiredEducation],
      ['요구전공', detail.requiredMajor],
      ['요구자격증', detail.requiredLicenses]
    ])
  };
};

export function useScrappedJobs() {
  const { isAuthenticated, callWithAuth } = useAuth();
  const [viewState, setViewState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState([]);
  const [selectedPostingId, setSelectedPostingId] = useState(null);
  const [detailState, setDetailState] = useState({
    status: 'idle',
    error: '',
    data: null
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setViewState('disabled');
      setItems([]);
      setSelectedPostingId(null);
      return;
    }

    const controller = new AbortController();

    const loadScraps = async () => {
      setViewState('loading');
      setErrorMessage('');

      try {
        const list = await callWithAuth((accessToken) => postingApi.getMyScraps(accessToken, controller.signal));
        const normalized = list.map(normalizeScrapItem);

        setItems(normalized);
        setSelectedPostingId((current) => {
          if (current && normalized.some((item) => item.postingId === current)) {
            return current;
          }
          return normalized[0]?.postingId ?? null;
        });
        setViewState(normalized.length ? 'success' : 'empty');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setViewState('error');
        setErrorMessage(error.message || '스크랩 공고를 불러오지 못했습니다.');
      }
    };

    loadScraps();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedPostingId) {
      setDetailState({ status: 'idle', error: '', data: null });
      return;
    }

    const controller = new AbortController();

    const loadDetail = async () => {
      setDetailState((prev) => ({
        ...prev,
        status: prev.data ? 'refetching' : 'loading',
        error: ''
      }));

      try {
        const detail = await callWithAuth((accessToken) => postingApi.getPostingDetail(selectedPostingId, { accessToken, signal: controller.signal }));
        setDetailState({
          status: 'success',
          error: '',
          data: normalizeDetail(detail)
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setDetailState({
          status: 'error',
          error: error.message || '공고 상세를 불러오지 못했습니다.',
          data: null
        });
      }
    };

    loadDetail();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, isAuthenticated, selectedPostingId]);

  const removeScrap = useCallback(async () => {
    if (!selectedPostingId) {
      return;
    }

    await callWithAuth((accessToken) => postingApi.deleteScrap(accessToken, selectedPostingId));
    setItems((prev) => {
      const remained = prev.filter((item) => item.postingId !== selectedPostingId);
      setSelectedPostingId((current) => (current === selectedPostingId ? remained[0]?.postingId ?? null : current));
      return remained;
    });
  }, [callWithAuth, selectedPostingId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.postingId === selectedPostingId) || null,
    [items, selectedPostingId]
  );

  return {
    viewState,
    errorMessage,
    scraps: items,
    selectedItem,
    selectedPostingId,
    detail: detailState.data,
    detailViewState: detailState.status === 'refetching' ? 'success' : detailState.status,
    detailErrorMessage: detailState.error,
    setSelectedPostingId,
    removeScrap
  };
}
