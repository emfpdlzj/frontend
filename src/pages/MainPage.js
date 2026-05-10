import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postingApi } from '../api/postingApi';
import { profileApi } from '../api/profileApi';
import { fetchQuickJobRecommendations, fetchRecommendTaskStatus } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import { getCachedRecommendation, getRecommendationCacheKey, setCachedRecommendation } from '../cache/recommendationCache';
import { useJobFilterOptions } from '../hooks/useJobFilterOptions';
import { useLocale } from '../i18n/LocaleContext';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
import { filterAccessibilityMapJobs } from '../hooks/useAccessibilityMap';
import { LoginModal } from '../components/auth/LoginModal';

const FILTER_ALL_VALUE = '전체';
const RECOMMEND_TASK_POLL_INTERVAL_MS = 2500;

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

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

const getDateNumber = (value) => {
  const raw = String(value ?? '').replace(/\D/g, '');
  return raw.length === 8 ? Number(raw) : 0;
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

const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const getProfileLabel = (profile) => {
  if (!profile) {
    return '기본 프로필';
  }
  const baseName = profile.fullName || profile.name || `프로필 ${getProfileId(profile)}`;
  const targetJob = profile.targetJob || profile.desiredJob;
  return targetJob ? `${baseName} · ${targetJob}` : baseName;
};

const uniqueOptions = (options) => {
  const seen = new Set();

  return (Array.isArray(options) ? options : []).filter((option) => {
    if (!option?.label || seen.has(option.label)) {
      return false;
    }
    seen.add(option.label);
    return true;
  });
};

const getPopularPostingSummary = (item) => ({
  postingId: Number(item?.postingId),
  companyName: toSafeText(item?.companyName),
  jobTitle: toSafeText(item?.jobTitle),
  workAddress: toSafeText(item?.workAddress),
  employmentType: toSafeText(item?.employmentType),
  salaryText: [item?.salaryType, item?.salary].filter(Boolean).join(' ') || '급여 확인 필요',
  termDate: item?.termDate || '',
  dueLabel: getDday(item?.termDate),
  registeredDateText: parseDateText(item?.registeredAt),
  scrapCount: Number(item?.scrapCount || 0)
});

const normalizePostingDetail = (detail) => ({
  postingId: detail?.postingId,
  externalId: toSafeText(detail?.externalId),
  companyName: toSafeText(detail?.companyName),
  jobTitle: toSafeText(detail?.jobTitle),
  workAddress: toSafeText(detail?.workAddress),
  contactNumber: toSafeText(detail?.contactNumber),
  employmentType: toSafeText(detail?.employmentType),
  enterType: toSafeText(detail?.enterType),
  salaryType: toSafeText(detail?.salaryType),
  salary: toSafeText(detail?.salary),
  salaryText: [detail?.salaryType, detail?.salary].filter(Boolean).join(' ') || '급여 확인 필요',
  termDate: detail?.termDate || '',
  dueLabel: getDday(detail?.termDate),
  offerRegisteredAt: parseDateText(detail?.offerRegisteredAt),
  registeredAt: parseDateText(detail?.registeredAt),
  requiredCareer: toSafeText(detail?.requiredCareer),
  requiredEducation: toSafeText(detail?.requiredEducation),
  requiredMajor: toSafeText(detail?.requiredMajor),
  requiredLicenses: toSafeText(detail?.requiredLicenses),
  agencyName: toSafeText(detail?.agencyName),
  postingStatus: detail?.postingStatus || 'ACTIVE',
  scrapCount: Number(detail?.scrapCount || 0),
  scrappedByMe: Boolean(detail?.scrappedByMe)
});

const getQuickFitScore = (item) => {
  const score = item?.job_fit_score ?? item?.jobFitScore ?? item?.score;
  return typeof score === 'number' && Number.isFinite(score) ? score : null;
};

const normalizeQuickJob = (item, index) => {
  const job = item?.job || item;
  const externalId = job?.external_id || job?.externalId || `${job?.company_name || job?.companyName}-${index}`;
  const companyName = toSafeText(job?.company_name || job?.companyName);
  const jobTitle = toSafeText(job?.job_title || job?.jobTitle);
  const workAddress = toSafeText(job?.work_address || job?.workAddress);
  const employmentType = toSafeText(job?.employment_type || job?.employmentType);
  const salaryType = toSafeText(job?.salary_type || job?.salaryType, '');
  const salary = toSafeText(job?.salary, '');
  const termDate = job?.term_date || job?.termDate || '';
  const registeredAt = job?.registered_at || job?.registeredAt || '';
  const fitScore = getQuickFitScore(item);

  return {
    id: String(externalId || `${companyName}-${jobTitle}-${index}`),
    externalId: externalId || '',
    company: companyName,
    title: jobTitle,
    location: workAddress,
    employmentType,
    salaryType: salaryType || '확인 필요',
    salary: [salaryType, salary].filter(Boolean).join(' ') || '급여 확인 필요',
    dueLabel: getDday(termDate),
    termDate,
    registeredAt,
    registeredDateText: parseDateText(registeredAt),
    fitScore,
    fitLabel: typeof fitScore === 'number' ? `${fitScore}점` : '확인 필요',
    source: {
      reqMajor: job?.required_major || job?.requiredMajor,
      reqLicens: job?.required_licenses || job?.requiredLicenses,
      enterType: job?.enter_type || job?.enterType,
      empType: job?.employment_type || job?.employmentType,
      salaryType: job?.salary_type || job?.salaryType,
      compAddr: job?.work_address || job?.workAddress
    },
    region: workAddress.split(' ')[0] || '지역 확인 필요',
    companyInfo: {
      address: workAddress
    }
  };
};

const parseQuickJobsFromResult = (result) => {
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows.map((item, index) => normalizeQuickJob(item, index));
};

const sortQuickJobs = (jobs, aiEnabled) => {
  const sorted = [...jobs];

  sorted.sort((left, right) => {
    if (aiEnabled) {
      const rightScore = typeof right.fitScore === 'number' ? right.fitScore : -1;
      const leftScore = typeof left.fitScore === 'number' ? left.fitScore : -1;
      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }
    }

    return getDateNumber(right.registeredAt) - getDateNumber(left.registeredAt);
  });

  return sorted;
};

async function waitForRecommendTask(callWithAuth, requestId, signal) {
  let lastPayload = null;

  while (!signal?.aborted) {
    const payload = await callWithAuth((accessToken) =>
      fetchRecommendTaskStatus(accessToken, requestId, { signal })
    );
    lastPayload = payload;

    if (payload?.status === 'COMPLETED' || payload?.status === 'FAILED') {
      return payload;
    }

    await delay(RECOMMEND_TASK_POLL_INTERVAL_MS);
  }

  return lastPayload;
}

function HomeLoadingModal({ isOpen }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="home-loading-modal" role="status" aria-live="polite" aria-label="추천 결과를 준비하고 있습니다.">
      <div className="home-loading-modal__panel">
        <strong>추천 결과를 준비하고 있습니다.</strong>
        <p>요청이 끝날 때까지 페이지를 다시 열어도 진행 상태가 이어집니다.</p>
      </div>
    </div>
  );
}

function PopularPostingDetailModal({ detail, loading, error, onClose, onScrap }) {
  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="login-modal posting-detail-modal" role="dialog" aria-modal="true" aria-labelledby="popular-posting-detail-title">
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="공고 상세 창 닫기">
          닫기
        </button>
        <div className="login-modal__body posting-detail-modal__body">
          {loading ? <div className="jobs-feedback" role="status">공고 상세를 불러오는 중입니다.</div> : null}
          {error ? <div className="jobs-feedback is-error" role="alert">{error}</div> : null}

          {detail ? (
            <>
              <div className="login-modal__heading">
                <h2 id="popular-posting-detail-title" className="login-modal__title">{detail.jobTitle}</h2>
                <p>{detail.companyName}</p>
              </div>
              <div className="posting-detail-modal__summary">
                <span>{detail.postingStatus === 'ACTIVE' ? '진행중' : '마감'}</span>
                <span>스크랩 {detail.scrapCount}건</span>
                {detail.dueLabel ? <span>{detail.dueLabel}</span> : null}
              </div>
              <dl className="jobs-detail__definition-grid">
                <div><dt>외부공고 ID</dt><dd>{detail.externalId}</dd></div>
                <div><dt>근무지 주소</dt><dd>{detail.workAddress}</dd></div>
                <div><dt>연락처</dt><dd>{detail.contactNumber}</dd></div>
                <div><dt>고용형태</dt><dd>{detail.employmentType}</dd></div>
                <div><dt>입사유형</dt><dd>{detail.enterType}</dd></div>
                <div><dt>임금</dt><dd>{detail.salaryText}</dd></div>
                <div><dt>모집마감일</dt><dd>{parseDateText(detail.termDate) || '확인 필요'}</dd></div>
                <div><dt>공고등록일</dt><dd>{detail.offerRegisteredAt || detail.registeredAt || '확인 필요'}</dd></div>
                <div><dt>요구경력</dt><dd>{detail.requiredCareer}</dd></div>
                <div><dt>요구학력</dt><dd>{detail.requiredEducation}</dd></div>
                <div><dt>요구전공</dt><dd>{detail.requiredMajor}</dd></div>
                <div><dt>요구자격증</dt><dd>{detail.requiredLicenses}</dd></div>
                <div><dt>담당기관</dt><dd>{detail.agencyName}</dd></div>
              </dl>
              <div className="posting-detail-modal__actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={detail.scrappedByMe || detail.postingStatus !== 'ACTIVE'}
                  onClick={onScrap}
                >
                  {detail.scrappedByMe ? '스크랩 완료' : '공고 스크랩'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ScrapConfirmModal({ pending, onConfirm, onClose }) {
  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="login-modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="scrap-confirm-title">
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="스크랩 확인 창 닫기" disabled={pending}>
          닫기
        </button>
        <div className="login-modal__body logout-confirm-modal__body">
          <div className="login-modal__heading">
            <h2 id="scrap-confirm-title" className="login-modal__title">스크랩 확인</h2>
            <p>이 공고를 스크랩하시겠습니까?</p>
          </div>
          <div className="logout-confirm-modal__actions">
            <button type="button" className="logout-confirm-modal__button" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button
              type="button"
              className="logout-confirm-modal__button logout-confirm-modal__button--confirm"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? '처리 중' : '스크랩'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function JobCategoryCascadeFilter({ categories, value, onChange }) {
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const selectedPath = useMemo(() => {
    if (!value || value === FILTER_ALL_VALUE) {
      return { primary: '', secondary: '' };
    }

    for (const category of safeCategories) {
      if (category.label === value) {
        return { primary: category.label, secondary: '' };
      }

      for (const group of category.groups) {
        if (group.label === value) {
          return { primary: category.label, secondary: group.label };
        }

        if (group.jobs.includes(value)) {
          return { primary: category.label, secondary: group.label };
        }
      }
    }

    return { primary: '', secondary: '' };
  }, [safeCategories, value]);

  const [primaryValue, setPrimaryValue] = useState(selectedPath.primary);
  const [secondaryValue, setSecondaryValue] = useState(selectedPath.secondary);
  const primaryCategory = safeCategories.find((category) => category.label === primaryValue) || null;
  const secondaryGroup = primaryCategory?.groups.find((group) => group.label === secondaryValue) || null;

  useEffect(() => {
    setPrimaryValue(selectedPath.primary);
    setSecondaryValue(selectedPath.secondary);
  }, [selectedPath.primary, selectedPath.secondary]);

  const handlePrimaryChange = (nextPrimary) => {
    setPrimaryValue(nextPrimary);
    setSecondaryValue('');
    onChange(nextPrimary || FILTER_ALL_VALUE);
  };

  const handleSecondaryChange = (nextSecondary) => {
    setSecondaryValue(nextSecondary);
    onChange(nextSecondary || primaryValue || FILTER_ALL_VALUE);
  };

  const handleJobChange = (nextJob) => {
    onChange(nextJob === FILTER_ALL_VALUE ? secondaryValue || primaryValue || FILTER_ALL_VALUE : nextJob);
  };

  return (
    <div className="accessibility-map__cascade-filter" aria-label="희망 직무 1차, 2차, 3차 선택">
      <label>
        <span>1차</span>
        <select value={primaryValue} onChange={(event) => handlePrimaryChange(event.target.value)}>
          <option value="">전체</option>
          {safeCategories.map((category) => (
            <option key={category.label} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>2차</span>
        <select value={secondaryValue} disabled={!primaryCategory} onChange={(event) => handleSecondaryChange(event.target.value)}>
          <option value="">전체</option>
          {primaryCategory?.groups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>3차</span>
        <select value={value && value !== FILTER_ALL_VALUE ? value : FILTER_ALL_VALUE} disabled={!secondaryGroup} onChange={(event) => handleJobChange(event.target.value)}>
          <option value={FILTER_ALL_VALUE}>전체</option>
          {secondaryGroup?.jobs.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <label className="accessibility-map__select-field">
      <span className="sr-only">{label}</span>
      <select value={value || FILTER_ALL_VALUE} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MainPage() {
  const { localizePath } = useLocale();
  const { isAuthenticated, isInitializing, callWithAuth } = useAuth();
  const filterOptions = useJobFilterOptions();

  const [popularState, setPopularState] = useState({ status: 'loading', error: '', items: [] });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailState, setDetailState] = useState({ status: 'idle', error: '', data: null });
  const [selectedPostingId, setSelectedPostingId] = useState(null);

  const [scrapConfirmOpen, setScrapConfirmOpen] = useState(false);
  const [isScrapping, setIsScrapping] = useState(false);

  const [profilesState, setProfilesState] = useState({ status: 'idle', error: '', profiles: [] });
  const [selectedProfileId, setSelectedProfileId] = useState('');

  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [appliedAiEnabled, setAppliedAiEnabled] = useState(true);
  const [draftFilters, setDraftFilters] = useState({
    jobCategory: FILTER_ALL_VALUE,
    region: FILTER_ALL_VALUE,
    employmentType: FILTER_ALL_VALUE,
    salaryType: FILTER_ALL_VALUE
  });
  const [appliedFilters, setAppliedFilters] = useState({
    jobCategory: FILTER_ALL_VALUE,
    region: FILTER_ALL_VALUE,
    employmentType: FILTER_ALL_VALUE,
    salaryType: FILTER_ALL_VALUE
  });

  const [quickState, setQuickState] = useState({
    status: 'idle',
    error: '',
    rawJobs: []
  });

  const autoRequestedRef = useRef(false);

  const selectedProfile = useMemo(
    () => profilesState.profiles.find((profile) => getProfileId(profile) === String(selectedProfileId)) || null,
    [profilesState.profiles, selectedProfileId]
  );
  const orderedProfiles = useMemo(() => {
    const profiles = [...profilesState.profiles];
    profiles.sort((left, right) => Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault)));
    return profiles;
  }, [profilesState.profiles]);

  const baseFilterGroups = useMemo(() => [
    {
      id: 'jobCategory',
      title: '희망 직무',
      type: 'jobCategoryCascade',
      jobCategories: filterOptions.jobCategories,
      selectedValue: draftFilters.jobCategory
    },
    {
      id: 'region',
      title: '근무지역',
      type: 'select',
      options: [FILTER_ALL_VALUE, ...uniqueOptions(filterOptions.regions).map((option) => option.label)],
      selectedValue: draftFilters.region
    },
    {
      id: 'employmentType',
      title: '고용형태',
      type: 'chips',
      chips: [FILTER_ALL_VALUE, ...uniqueOptions(filterOptions.employmentTypes).map((option) => option.label)],
      selectedValue: draftFilters.employmentType
    },
    {
      id: 'salaryType',
      title: '급여 방식',
      type: 'chips',
      chips: [FILTER_ALL_VALUE, ...uniqueOptions(filterOptions.salaryTypes).map((option) => option.label)],
      selectedValue: draftFilters.salaryType
    }
  ], [draftFilters, filterOptions]);

  const filteredQuickJobs = useMemo(() => {
    const filtered = filterAccessibilityMapJobs(
      quickState.rawJobs,
      appliedFilters,
      filterOptions.jobCategories
    );
    return sortQuickJobs(filtered, appliedAiEnabled);
  }, [quickState.rawJobs, appliedFilters, filterOptions.jobCategories, appliedAiEnabled]);

  useEffect(() => {
    const controller = new AbortController();

    const loadPopular = async () => {
      setPopularState((prev) => ({ ...prev, status: 'loading', error: '' }));
      try {
        const list = await postingApi.getPopularPostings({ limit: 20, signal: controller.signal });
        setPopularState({
          status: 'success',
          error: '',
          items: list.map(getPopularPostingSummary)
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setPopularState({
          status: 'error',
          error: error.message || '인기 공고를 불러오지 못했습니다.',
          items: []
        });
      }
    };

    loadPopular();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (isInitializing) {
      return undefined;
    }

    if (!isAuthenticated) {
      setProfilesState({ status: 'disabled', error: '', profiles: [] });
      setSelectedProfileId('');
      autoRequestedRef.current = false;
      return undefined;
    }

    const controller = new AbortController();

    const loadProfiles = async () => {
      setProfilesState((prev) => ({ ...prev, status: 'loading', error: '' }));

      try {
        const profiles = await callWithAuth((accessToken) => profileApi.getProfiles(accessToken, controller.signal));
        const nextProfiles = Array.isArray(profiles) ? profiles : [];
        const defaultProfile = nextProfiles.find((profile) => profile?.isDefault) || nextProfiles[0] || null;

        setProfilesState({ status: 'success', error: '', profiles: nextProfiles });
        setSelectedProfileId(defaultProfile ? getProfileId(defaultProfile) : '');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setProfilesState({ status: 'error', error: error.message || '프로필을 불러오지 못했습니다.', profiles: [] });
      }
    };

    loadProfiles();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, isAuthenticated, isInitializing]);

  const runQuickRecommendation = useCallback(async ({ profileId, aiEnabled, filters, signal }) => {
    if (!profileId) {
      setQuickState({ status: 'empty', error: '', rawJobs: [] });
      return;
    }

    setQuickState((prev) => ({
      ...prev,
      status: prev.rawJobs.length ? 'refetching' : 'loading',
      error: ''
    }));

    const selectedProfileObject = profilesState.profiles.find((profile) => getProfileId(profile) === String(profileId)) || null;
    const profileSignature = getProfileScoringSignature(selectedProfileObject);
    const cacheKey = getRecommendationCacheKey({
      profileId,
      aiEnabled,
      scope: 'quick-home',
      profileSignature
    });

    const cached = getCachedRecommendation(cacheKey);
    if (cached) {
      const cachedJobs = parseQuickJobsFromResult(cached);
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      setQuickState({ status: cachedJobs.length ? 'success' : 'empty', error: '', rawJobs: cachedJobs });
      return;
    }

    const taskPayload = await callWithAuth((accessToken) =>
      fetchQuickJobRecommendations(accessToken, {
        aiEnabled,
        profileId,
        signal
      })
    );
    const taskResult = unwrapApiResult(taskPayload);

    if (taskResult?.status === 'FAILED') {
      setQuickState({ status: 'error', error: taskResult.errorMessage || '퀵 추천을 불러오지 못했습니다.', rawJobs: [] });
      return;
    }

    if (taskResult?.status === 'COMPLETED' && taskResult?.result) {
      setCachedRecommendation(cacheKey, taskResult.result);
      const jobs = parseQuickJobsFromResult(taskResult.result);
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      setQuickState({ status: jobs.length ? 'success' : 'empty', error: '', rawJobs: jobs });
      return;
    }

    if (!taskResult?.requestId) {
      setQuickState({ status: 'error', error: '퀵 추천 요청 상태를 확인할 수 없습니다.', rawJobs: [] });
      return;
    }

    const completed = await waitForRecommendTask(callWithAuth, taskResult.requestId, signal);
    if (!completed || completed.status === 'FAILED') {
      setQuickState({ status: 'error', error: completed?.errorMessage || '퀵 추천을 불러오지 못했습니다.', rawJobs: [] });
      return;
    }

    setCachedRecommendation(cacheKey, completed.result);
    const jobs = parseQuickJobsFromResult(completed.result);
    setAppliedAiEnabled(aiEnabled);
    setAppliedFilters(filters);
    setQuickState({ status: jobs.length ? 'success' : 'empty', error: '', rawJobs: jobs });
  }, [callWithAuth, profilesState.profiles]);

  useEffect(() => {
    if (!isAuthenticated || !selectedProfileId || autoRequestedRef.current) {
      return undefined;
    }

    autoRequestedRef.current = true;
    const controller = new AbortController();

    runQuickRecommendation({
      profileId: selectedProfileId,
      aiEnabled: isAiEnabled,
      filters: draftFilters,
      signal: controller.signal
    }).catch((error) => {
      if (error?.name === 'AbortError') {
        return;
      }
      setQuickState({
        status: 'error',
        error: error.message || '퀵 추천을 불러오지 못했습니다.',
        rawJobs: []
      });
    });

    return () => {
      controller.abort();
    };
  }, [draftFilters, isAiEnabled, isAuthenticated, runQuickRecommendation, selectedProfileId]);

  const handleOpenPopularPosting = useCallback(async (postingId) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    setSelectedPostingId(postingId);
    setDetailModalOpen(true);
    setDetailState({ status: 'loading', error: '', data: null });

    try {
      const detail = await callWithAuth((accessToken) => postingApi.getPostingDetail(postingId, { accessToken }));
      setDetailState({ status: 'success', error: '', data: normalizePostingDetail(detail) });
    } catch (error) {
      setDetailState({ status: 'error', error: error.message || '공고 상세를 불러오지 못했습니다.', data: null });
    }
  }, [callWithAuth, isAuthenticated]);

  const handleApplyQuickFilters = useCallback(async () => {
    if (!selectedProfileId || quickState.status === 'loading' || quickState.status === 'refetching') {
      return;
    }

    const controller = new AbortController();

    try {
      await runQuickRecommendation({
        profileId: selectedProfileId,
        aiEnabled: isAiEnabled,
        filters: draftFilters,
        signal: controller.signal
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setQuickState({ status: 'error', error: error.message || '퀵 추천을 불러오지 못했습니다.', rawJobs: [] });
    }
  }, [draftFilters, isAiEnabled, quickState.status, runQuickRecommendation, selectedProfileId]);

  const handleResetQuickFilters = useCallback(() => {
    setDraftFilters({
      jobCategory: FILTER_ALL_VALUE,
      region: FILTER_ALL_VALUE,
      employmentType: FILTER_ALL_VALUE,
      salaryType: FILTER_ALL_VALUE
    });
  }, []);

  const handleScrapConfirm = useCallback(async () => {
    if (!selectedPostingId || isScrapping) {
      return;
    }

    try {
      setIsScrapping(true);
      await callWithAuth((accessToken) => postingApi.scrapPosting(accessToken, selectedPostingId));

      setDetailState((prev) => {
        if (!prev.data) {
          return prev;
        }
        return {
          ...prev,
          data: {
            ...prev.data,
            scrappedByMe: true,
            scrapCount: prev.data.scrapCount + 1
          }
        };
      });

      setPopularState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.postingId === selectedPostingId
            ? { ...item, scrapCount: item.scrapCount + 1 }
            : item
        )
      }));

      setScrapConfirmOpen(false);
    } catch (error) {
      setDetailState((prev) => ({
        ...prev,
        error: error.message || '스크랩 처리에 실패했습니다.'
      }));
    } finally {
      setIsScrapping(false);
    }
  }, [callWithAuth, isScrapping, selectedPostingId]);

  const isQuickLoading = quickState.status === 'loading' || quickState.status === 'refetching';

  return (
    <main className="main-page" aria-labelledby="main-page-title">
      <HomeLoadingModal isOpen={isQuickLoading} />
      <div className="main-page__inner">
        <section className="home-overview" aria-labelledby="main-page-title">
          <div className="home-overview__heading">
            <p className="home-eyebrow">Home</p>
            <h1 id="main-page-title">현재 인기 공고</h1>
            <p>인기순으로 정렬된 공고를 가로 스크롤로 확인하고, 상세 조회 후 바로 스크랩할 수 있습니다.</p>
          </div>
        </section>

        <section className="home-popular" aria-labelledby="popular-postings-title">
          <div className="home-section-head">
            <div>
              <h2 id="popular-postings-title">인기 공고 TOP 20</h2>
              <p className="home-popular__caption">정렬: 스크랩 수 높은순, 동률 시 최신 공고 우선</p>
            </div>
          </div>

          {popularState.status === 'loading' ? <div className="home-feedback" role="status">인기 공고를 불러오는 중입니다.</div> : null}
          {popularState.status === 'error' ? <div className="home-feedback is-error" role="alert">{popularState.error}</div> : null}

          {popularState.status === 'success' ? (
            <div className="home-popular__scroller" aria-label="인기 공고 목록">
              {popularState.items.map((item) => (
                <button
                  key={item.postingId}
                  type="button"
                  className="home-popular__card"
                  onClick={() => handleOpenPopularPosting(item.postingId)}
                >
                  <div className="home-popular__card-top">
                    <strong>{item.companyName}</strong>
                    <span>스크랩 {item.scrapCount}건</span>
                  </div>
                  <h3>{item.jobTitle}</h3>
                  <p>{item.workAddress}</p>
                  <div className="home-popular__card-meta">
                    <span>{item.employmentType}</span>
                    <span>{item.salaryText}</span>
                    {item.dueLabel ? <span>{item.dueLabel}</span> : null}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {isAuthenticated ? (
          <section className="home-quick" aria-labelledby="quick-recommend-title">
            <div className="home-section-head">
              <div>
                <h2 id="quick-recommend-title">기능 2. 퀵 맞춤 일자리 추천 (최신 + 직무 적합)</h2>
              </div>
            </div>

            <div className="home-quick__workflow" aria-label="퀵 추천 동작 상태">
              <div className="home-quick__workflow-item">
                <strong>프로필</strong>
                <span>{selectedProfile ? getProfileLabel(selectedProfile) : '프로필 선택 필요'}</span>
              </div>
              <div className="home-quick__workflow-item">
                <strong>AI 직무 적합도</strong>
                <span>{isAiEnabled ? 'ON · 직무 적합도 계산' : 'OFF · 최신 공고 순'}</span>
              </div>
              <div className="home-quick__workflow-item">
                <strong>필터 적용</strong>
                <span>{quickState.status === 'success' ? `${filteredQuickJobs.length}건 반영` : '조건 적용 대기'}</span>
              </div>
            </div>

            <aside className="accessibility-map__filter-panel" aria-label="퀵 추천 필터">
              <header className="accessibility-map__filter-header">
                <h2>퀵 추천 필터</h2>
                <p>접근성 지도와 동일한 필터로 추천 결과를 조회합니다.</p>
              </header>

              <section className="accessibility-map__ai-toggle" aria-label="AI 스코어링 설정">
                <div>
                  <strong>AI 직무 적합도</strong>
                  <span>{isAiEnabled ? '프로필 기반 직무 적합도 계산' : '최신 공고만 조회'}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAiEnabled}
                  className={isAiEnabled ? 'is-on' : ''}
                  onClick={() => setIsAiEnabled((prev) => !prev)}
                >
                  <span aria-hidden="true" />
                  {isAiEnabled ? 'ON' : 'OFF'}
                </button>
              </section>

              <div className="accessibility-map__filter-list">
                <section className="accessibility-map__filter-group">
                  <div className="accessibility-map__filter-title-row">
                    <span className="accessibility-map__filter-priority">1</span>
                    <div>
                      <h3>프로필</h3>
                      <SelectFilter
                        label="프로필 선택"
                        options={orderedProfiles.length ? orderedProfiles.map((profile) => getProfileLabel(profile)) : ['프로필 없음']}
                        value={orderedProfiles.length ? getProfileLabel(selectedProfile) : '프로필 없음'}
                        onChange={(label) => {
                          const matched = orderedProfiles.find((profile) => getProfileLabel(profile) === label);
                          if (matched) {
                            setSelectedProfileId(getProfileId(matched));
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

                {baseFilterGroups.map((group, index) => (
                  <section key={group.id} className="accessibility-map__filter-group">
                    <div className="accessibility-map__filter-title-row">
                      <span className="accessibility-map__filter-priority">{index + 2}</span>
                      <div>
                        <h3>{group.title}</h3>
                        {group.type === 'jobCategoryCascade' ? (
                          <JobCategoryCascadeFilter
                            categories={group.jobCategories}
                            value={group.selectedValue}
                            onChange={(value) => setDraftFilters((prev) => ({ ...prev, [group.id]: value }))}
                          />
                        ) : group.type === 'select' ? (
                          <SelectFilter
                            label={group.title}
                            options={group.options}
                            value={group.selectedValue}
                            onChange={(value) => setDraftFilters((prev) => ({ ...prev, [group.id]: value }))}
                          />
                        ) : (
                          <div className="accessibility-map__chip-row accessibility-map__chip-row--expanded">
                            {group.chips.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                className={`accessibility-map__chip${group.selectedValue === chip ? ' is-selected' : ''}`}
                                aria-pressed={group.selectedValue === chip}
                                onClick={() => setDraftFilters((prev) => ({ ...prev, [group.id]: chip }))}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
                <button type="button" className="secondary-button accessibility-map__filter-reset-button" onClick={handleResetQuickFilters}>
                  초기화
                </button>
                <button
                  type="button"
                  className="primary-button accessibility-map__filter-apply-button"
                  onClick={handleApplyQuickFilters}
                  disabled={isQuickLoading || !selectedProfileId}
                >
                  {isQuickLoading ? '로딩 중' : '조건 적용'}
                </button>
              </div>
            </aside>

            <section className="home-quick__results" aria-label="퀵 추천 결과">
              {profilesState.status === 'loading' ? <div className="home-feedback" role="status">프로필을 불러오는 중입니다.</div> : null}
              {profilesState.status === 'error' ? <div className="home-feedback is-error" role="alert">{profilesState.error}</div> : null}
              {quickState.status === 'idle' ? <div className="home-feedback" role="status">조건 적용을 누르면 퀵 추천 결과를 조회합니다.</div> : null}
              {quickState.status === 'loading' || quickState.status === 'refetching' ? <div className="home-feedback" role="status">퀵 추천 결과를 계산하는 중입니다.</div> : null}
              {quickState.status === 'error' ? <div className="home-feedback is-error" role="alert">{quickState.error}</div> : null}
              {quickState.status === 'empty' ? <div className="home-feedback" role="status">현재 조건에 맞는 공고가 없습니다.</div> : null}

              {quickState.status === 'success' ? (
                <div className="home-job-list" aria-label="퀵 추천 공고 목록">
                  {filteredQuickJobs.map((job) => (
                    <article
                      className={`home-job-card${appliedAiEnabled && typeof job.fitScore === 'number' && job.fitScore >= 70 ? ' is-recommended' : ''}`}
                      key={job.id}
                    >
                      <div className="home-job-card__main">
                        <div className="home-job-card__top">
                          <span className="home-job-company">{job.company}</span>
                        </div>
                        <h3>{job.title}</h3>
                        <p className="home-job-role">{job.location}</p>
                        <dl className="home-job-meta" aria-label={`${job.title} 공고 정보`}>
                          <div><dt>급여</dt><dd>{job.salary}</dd></div>
                          <div><dt>고용형태</dt><dd>{job.employmentType}</dd></div>
                          <div><dt>등록일</dt><dd>{job.registeredDateText || '확인 필요'}</dd></div>
                          {job.dueLabel ? <div><dt>마감</dt><dd>{job.dueLabel}</dd></div> : null}
                        </dl>
                        <div className="home-job-tags">
                          {appliedAiEnabled ? (
                            <span className={`home-badge ${job.fitScore && job.fitScore >= 70 ? 'home-badge--match' : 'home-badge--neutral'}`}>
                              직무 적합도 {job.fitLabel}
                            </span>
                          ) : (
                            <span className="home-badge home-badge--neutral">최신 공고 순 정렬</span>
                          )}
                          <span className="home-badge home-badge--neutral">AI {appliedAiEnabled ? 'ON' : 'OFF'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          </section>
        ) : null}
      </div>

      {detailModalOpen ? (
        <PopularPostingDetailModal
          detail={detailState.data}
          loading={detailState.status === 'loading'}
          error={detailState.status === 'error' ? detailState.error : ''}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedPostingId(null);
            setDetailState({ status: 'idle', error: '', data: null });
          }}
          onScrap={() => setScrapConfirmOpen(true)}
        />
      ) : null}

      {scrapConfirmOpen ? (
        <ScrapConfirmModal
          pending={isScrapping}
          onConfirm={handleScrapConfirm}
          onClose={() => setScrapConfirmOpen(false)}
        />
      ) : null}

      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </main>
  );
}
