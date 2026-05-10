import { useCallback, useEffect, useMemo, useState } from 'react';
import { postingApi } from '../api/postingApi';
import { useAuth } from '../auth/AuthContext';

const toSafeText = (value, fallback = '확인 필요') => {
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

const normalizeScrapItem = (item) => ({
  id: String(item?.postingId || ''),
  postingId: Number(item?.postingId),
  company: toSafeText(item?.companyName),
  title: toSafeText(item?.jobTitle),
  location: toSafeText(item?.workAddress),
  employmentType: toSafeText(item?.employmentType),
  salary: [item?.salaryType, item?.salary].filter(Boolean).join(' ') || '급여 확인 필요',
  termDate: item?.termDate || '',
  dueLabel: getDday(item?.termDate),
  postingStatus: item?.postingStatus || 'ACTIVE',
  scrapCount: Number(item?.scrapCount || 0),
  scrappedAt: item?.scrappedAt || '',
  registeredAt: parseDateText(item?.registeredAt)
});

const normalizeDetail = (detail) => {
  if (!detail) {
    return null;
  }

  return {
    postingId: detail.postingId,
    title: toSafeText(detail.jobTitle),
    company: toSafeText(detail.companyName),
    location: toSafeText(detail.workAddress),
    salary: [detail.salaryType, detail.salary].filter(Boolean).join(' ') || '급여 확인 필요',
    employmentType: toSafeText(detail.employmentType),
    enterType: toSafeText(detail.enterType),
    termDateText: parseDateText(detail.termDate) || '확인 필요',
    dueLabel: getDday(detail.termDate),
    postingStatus: detail.postingStatus || 'ACTIVE',
    scrapCount: Number(detail.scrapCount || 0),
    fields: [
      ['외부공고 ID', toSafeText(detail.externalId)],
      ['모집직종', toSafeText(detail.jobTitle)],
      ['사업장명', toSafeText(detail.companyName)],
      ['근무지 주소', toSafeText(detail.workAddress)],
      ['연락처', toSafeText(detail.contactNumber)],
      ['고용형태', toSafeText(detail.employmentType)],
      ['입사유형', toSafeText(detail.enterType)],
      ['임금형태', toSafeText(detail.salaryType)],
      ['임금', toSafeText(detail.salary)],
      ['모집마감일', parseDateText(detail.termDate) || '확인 필요'],
      ['공고등록일', parseDateText(detail.offerRegisteredAt || detail.registeredAt) || '확인 필요'],
      ['요구경력', toSafeText(detail.requiredCareer)],
      ['요구학력', toSafeText(detail.requiredEducation)],
      ['요구전공', toSafeText(detail.requiredMajor)],
      ['요구자격증', toSafeText(detail.requiredLicenses)],
      ['담당기관', toSafeText(detail.agencyName)]
    ]
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
