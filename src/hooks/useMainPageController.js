import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { noticeApi } from '../api/noticeApi';
import { postingApi } from '../api/postingApi';
import { profileApi } from '../api/profileApi';
import { explainRecommendation, fetchQuickJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  clearActiveRecommendationTask,
  getActiveRecommendationTask,
  getCachedRecommendation,
  setActiveRecommendationTask,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { COMMUTABLE_FILTER_ID, FILTER_ALL_VALUE } from '../constants/accessibilityMap';
import { HOME_SUPPORT_ORGANIZATIONS, HOME_SUPPORT_SECTION_COPY } from '../constants/homeSupport';
import { hasMoreRecommendationPages, QUICK_RECOMMENDATION } from '../constants/recommendation';
import { filterAccessibilityMapJobs } from './useAccessibilityMap';
import { useJobFilterOptions } from './useJobFilterOptions';
import { useLocale } from '../i18n/LocaleContext';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
import {
  buildQuickExplainPayload,
  estimateCommuteMinutes,
  getCachedQuickExplain,
  getCachedQuickPages,
  getPopularPostingSummary,
  getProfileDisplayName,
  getProfileId,
  getQuickJobKey,
  getQuickPageCacheKey,
  getRecommendationTotalCount,
  hasProfileCommuteOrigin,
  mergeUniqueQuickJobs,
  normalizePostingDetail,
  parseQuickJobsFromResult,
  setCachedQuickExplain,
  sortQuickJobs,
  toQuickFallbackDetail,
  uniqueOptions
} from '../utils/quickJobs';
import {
  getTaskErrorMessage,
  getTaskRequestId,
  getTaskStatus,
  isDirectQuickResultPayload,
  isTaskCached,
  normalizeTaskPayload,
  requestQuickRecommendationResult,
  waitForRecommendTask
} from '../services/recommendationTaskService';

const POPULAR_AUTOPLAY_INTERVAL_MS = 3600;
const QUICK_PAGE_SIZE = QUICK_RECOMMENDATION.pageSize;
const QUICK_INCREMENTAL_APPEND_DELAY_MS = QUICK_RECOMMENDATION.incrementalAppendDelayMs;
const QUICK_ACTIVE_TASK_SCOPE = QUICK_RECOMMENDATION.activeTaskScope;
const hasMoreQuickJobs = (payload, pageLength, offset = 0) =>
  hasMoreRecommendationPages({
    pageSize: QUICK_PAGE_SIZE,
    loadedCount: pageLength,
    offset,
    totalCount: getRecommendationTotalCount(payload, offset + pageLength)
  });
const QUICK_LIST_MOVE_ANIMATION_OPTIONS = {
  duration: 520,
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
};
const QUICK_LIST_INSERT_ANIMATION_OPTIONS = {
  duration: 520,
  easing: 'cubic-bezier(0.18, 0.9, 0.24, 1)'
};

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export function useMainPageController(view) {

  const isQuickPage = view === 'quick';
  const isHomePage = !isQuickPage;
  const { locale, localizePath } = useLocale();
  const { isAuthenticated, isInitializing, callWithAuth } = useAuth();
  const filterOptions = useJobFilterOptions();

  const [popularState, setPopularState] = useState({ status: 'loading', error: '', items: [] });
  const [noticeState, setNoticeState] = useState({ status: 'loading', error: '', items: [] });
  const [isPopularCarouselPaused, setIsPopularCarouselPaused] = useState(false);
  const popularScrollerRef = useRef(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailState, setDetailState] = useState({ status: 'idle', error: '', data: null });
  const [selectedPostingId, setSelectedPostingId] = useState(null);
  const [selectedQuickJob, setSelectedQuickJob] = useState(null);
  const [quickDetailState, setQuickDetailState] = useState({
    mode: 'none',
    fitScore: null,
    explainStatus: 'idle',
    explainError: '',
    explainData: null
  });

  const [scrapConfirmOpen, setScrapConfirmOpen] = useState(false);
  const [isScrapping, setIsScrapping] = useState(false);

  const [profilesState, setProfilesState] = useState({ status: 'idle', error: '', profiles: [] });
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedProfileDetail, setSelectedProfileDetail] = useState(null);

  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [appliedAiEnabled, setAppliedAiEnabled] = useState(true);
  const [draftFilters, setDraftFilters] = useState({
    jobCategory: FILTER_ALL_VALUE,
    region: FILTER_ALL_VALUE,
    employmentType: FILTER_ALL_VALUE,
    salaryType: FILTER_ALL_VALUE,
    [COMMUTABLE_FILTER_ID]: true
  });
  const [appliedFilters, setAppliedFilters] = useState({
    jobCategory: FILTER_ALL_VALUE,
    region: FILTER_ALL_VALUE,
    employmentType: FILTER_ALL_VALUE,
    salaryType: FILTER_ALL_VALUE,
    [COMMUTABLE_FILTER_ID]: true
  });

  const [quickState, setQuickState] = useState({
    status: 'idle',
    error: '',
    rawJobs: [],
    hasMore: false,
    isLoadingMore: false,
    nextOffset: 0,
    totalJobCount: 0,
    loadingLoaded: 0,
    loadingTarget: QUICK_PAGE_SIZE
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isQuickFilterCollapsed, setIsQuickFilterCollapsed] = useState(true);

  const quickProfileSelectRef = useRef(null);
  const quickLoadMoreSentinelRef = useRef(null);
  const quickResultListRef = useRef(null);
  const quickListItemRectsRef = useRef(new Map());
  const quickExplainRequestSequenceRef = useRef(0);
  const quickSearchInFlightKeyRef = useRef('');
  const quickLoadMoreInFlightKeyRef = useRef('');
  const quickRenderedJobKeysRef = useRef(new Set());
  const quickPageActiveRef = useRef(false);
  const wasQuickBatchLoadingRef = useRef(false);

  const supportSectionCopy = HOME_SUPPORT_SECTION_COPY[locale] || HOME_SUPPORT_SECTION_COPY.ko;
  const supportOrganizations = useMemo(
    () => HOME_SUPPORT_ORGANIZATIONS.map((organization) => ({
      ...organization,
      categoryLabel: organization.category[locale] || organization.category.ko,
      descriptionLabel: organization.description[locale] || organization.description.ko,
      logoAlt: `${organization.name[locale] || organization.name.ko} 로고`,
      nameLabel: organization.name[locale] || organization.name.ko
    })),
    [locale]
  );

  const selectedProfile = useMemo(
    () => profilesState.profiles.find((profile) => getProfileId(profile) === String(selectedProfileId)) || null,
    [profilesState.profiles, selectedProfileId]
  );
  const orderedProfiles = useMemo(() => {
    const profiles = [...profilesState.profiles];
    profiles.sort((left, right) => Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault)));
    return profiles;
  }, [profilesState.profiles]);
  const fallbackSelectedProfile = selectedProfile || orderedProfiles[0] || null;
  const effectiveSelectedProfileId = selectedProfileId || getProfileId(fallbackSelectedProfile);
  const selectedProfileForScoring = useMemo(() => {
    if (!selectedProfileDetail || getProfileId(selectedProfileDetail) !== String(effectiveSelectedProfileId)) {
      return fallbackSelectedProfile;
    }

    return {
      ...(fallbackSelectedProfile || {}),
      ...selectedProfileDetail
    };
  }, [effectiveSelectedProfileId, fallbackSelectedProfile, selectedProfileDetail]);
  const visibleSelectedProfile = selectedProfileForScoring || fallbackSelectedProfile;
  const closedProfileLabel = getProfileDisplayName(visibleSelectedProfile);
  const isQuickProfileDetailReady = !effectiveSelectedProfileId || getProfileId(selectedProfileDetail) === String(effectiveSelectedProfileId);
  const canUseQuickCommutableFilter = isQuickProfileDetailReady && hasProfileCommuteOrigin(visibleSelectedProfile);
  const getQuickProfileForScoring = useCallback((profileId) => {
    const listProfile = profilesState.profiles.find((profile) => getProfileId(profile) === String(profileId)) || null;
    if (selectedProfileDetail && getProfileId(selectedProfileDetail) === String(profileId)) {
      return {
        ...(listProfile || {}),
        ...selectedProfileDetail
      };
    }
    return listProfile;
  }, [profilesState.profiles, selectedProfileDetail]);

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
      selectedValue: isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID] ? FILTER_ALL_VALUE : draftFilters.region,
      disabled: Boolean(isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID])
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
  ], [draftFilters, filterOptions, isAiEnabled]);
  const orderedFilterGroups = useMemo(() => baseFilterGroups, [baseFilterGroups]);

  const filteredQuickJobs = useMemo(() => {
    const jobsWithCommute = quickState.rawJobs.map((job) => {
      const commuteEstimate = estimateCommuteMinutes(visibleSelectedProfile, job);
      return {
        ...job,
        commuteEstimate,
        commuteMinutes: commuteEstimate.minutes
      };
    });
    const effectiveAppliedFilters = appliedAiEnabled
      ? appliedFilters
      : {
          ...appliedFilters,
          [COMMUTABLE_FILTER_ID]: false
        };
    const filtered = filterAccessibilityMapJobs(
      jobsWithCommute,
      effectiveAppliedFilters,
      filterOptions.jobCategories,
      visibleSelectedProfile
    );
    return sortQuickJobs(filtered, appliedAiEnabled);
  }, [quickState.rawJobs, appliedFilters, filterOptions.jobCategories, appliedAiEnabled, visibleSelectedProfile]);
  const filteredQuickJobSignature = useMemo(
    () => filteredQuickJobs.map((job) => String(job.id)).join('|'),
    [filteredQuickJobs]
  );

  useEffect(() => {
    quickPageActiveRef.current = isQuickPage;
    return () => {
      quickPageActiveRef.current = false;
    };
  }, [isQuickPage]);

  useEffect(() => {
    setDraftFilters((current) => {
      if (isAiEnabled) {
        return {
          ...current,
          [COMMUTABLE_FILTER_ID]: true,
          region: FILTER_ALL_VALUE
        };
      }

      return current[COMMUTABLE_FILTER_ID]
        ? {
            ...current,
            [COMMUTABLE_FILTER_ID]: false
          }
        : current;
    });
  }, [isAiEnabled]);

  useLayoutEffect(() => {
    const container = quickResultListRef.current;
    if (!container) {
      return;
    }

    const cards = Array.from(container.querySelectorAll('.home-job-card[data-job-id]'));
    const previousRects = quickListItemRectsRef.current;
    const nextRects = new Map();

    cards.forEach((card) => {
      const key = card.getAttribute('data-job-id');
      if (!key) {
        return;
      }

      const nextRect = card.getBoundingClientRect();
      nextRects.set(key, nextRect);
      const previousRect = previousRects.get(key);

      if (previousRect) {
        const deltaX = previousRect.left - nextRect.left;
        const deltaY = previousRect.top - nextRect.top;
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          card.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' }
            ],
            QUICK_LIST_MOVE_ANIMATION_OPTIONS
          );
        }
        return;
      }

      card.animate(
        [
          { opacity: 0, transform: 'translateY(16px) scale(0.985)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ],
        QUICK_LIST_INSERT_ANIMATION_OPTIONS
      );
    });

    quickListItemRectsRef.current = nextRects;
  }, [filteredQuickJobSignature]);

  useEffect(() => {
    // 프로필 목록이 갱신되어도 선택값이 비거나 유효하지 않으면 기본 프로필로 복원한다.
    if (!profilesState.profiles.length) {
      if (selectedProfileId) {
        setSelectedProfileId('');
      }
      return;
    }

    const hasSelected = profilesState.profiles.some((profile) => getProfileId(profile) === String(selectedProfileId));
    if (hasSelected) {
      return;
    }

    const fallbackProfile = profilesState.profiles.find((profile) => profile?.isDefault) || profilesState.profiles[0];
    setSelectedProfileId(getProfileId(fallbackProfile));
  }, [profilesState.profiles, selectedProfileId]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!quickProfileSelectRef.current?.contains(event.target)) {
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

  useEffect(() => {
    if (!isHomePage) {
      return undefined;
    }

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
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) {
      return undefined;
    }

    const controller = new AbortController();

    const loadNotices = async () => {
      setNoticeState((prev) => ({ ...prev, status: 'loading', error: '' }));
      try {
        const list = await noticeApi.getNotices({ limit: 5, signal: controller.signal });
        setNoticeState({
          status: list.length ? 'success' : 'empty',
          error: '',
          items: list
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setNoticeState({
          status: 'error',
          error: error.message || '공지사항을 불러오지 못했습니다.',
          items: []
        });
      }
    };

    loadNotices();

    return () => {
      controller.abort();
    };
  }, [isHomePage]);

  useEffect(() => {
    if (!isHomePage) {
      return undefined;
    }

    const scroller = popularScrollerRef.current;
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (
      popularState.status !== 'success' ||
      popularState.items.length < 2 ||
      isPopularCarouselPaused ||
      !scroller ||
      document.documentElement.dataset.bwReduceMotion === 'on' ||
      prefersReducedMotion
    ) {
      return undefined;
    }

    const getCardStep = () => {
      const firstCard = scroller.querySelector('.home-popular__card');
      if (!firstCard) {
        return 0;
      }
      const styles = window.getComputedStyle(scroller);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return firstCard.getBoundingClientRect().width + gap;
    };

    const moveToNextCard = () => {
      if (document.hidden) {
        return;
      }

      const step = getCardStep();
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      if (step <= 0 || maxScrollLeft <= 1) {
        return;
      }

      const nextScrollLeft = scroller.scrollLeft + step;
      const shouldLoop = nextScrollLeft >= maxScrollLeft - step / 2;
      scroller.scrollTo({
        left: shouldLoop ? 0 : Math.min(nextScrollLeft, maxScrollLeft),
        behavior: 'smooth'
      });
    };

    const intervalId = window.setInterval(moveToNextCard, POPULAR_AUTOPLAY_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isHomePage, isPopularCarouselPaused, popularState.items.length, popularState.status]);

  useEffect(() => {
    if (!isQuickPage) {
      return undefined;
    }

    if (isInitializing) {
      return undefined;
    }

    if (!isAuthenticated) {
      setProfilesState({ status: 'disabled', error: '', profiles: [] });
      setSelectedProfileId('');
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
  }, [callWithAuth, isAuthenticated, isInitializing, isQuickPage]);

  useEffect(() => {
    if (!isQuickPage || !isAuthenticated || !effectiveSelectedProfileId) {
      setSelectedProfileDetail(null);
      return undefined;
    }

    const controller = new AbortController();

    const loadSelectedProfileDetail = async () => {
      try {
        const profileDetail = await callWithAuth((accessToken) =>
          profileApi.getProfile(accessToken, effectiveSelectedProfileId, controller.signal)
        );
        setSelectedProfileDetail(profileDetail || null);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setSelectedProfileDetail(null);
      }
    };

    loadSelectedProfileDetail();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, effectiveSelectedProfileId, isAuthenticated, isQuickPage]);

  useEffect(() => {
    quickRenderedJobKeysRef.current = new Set(quickState.rawJobs.map(getQuickJobKey).filter(Boolean));
  }, [quickState.rawJobs]);

  const appendQuickJobsIncrementally = useCallback(async ({
    jobs,
    replace = false,
    offset = 0,
    hasMore = false,
    signal,
    loadingMore = false,
    keepLoading = false,
    showLoadingDuringAppend = false,
    loadingTarget = QUICK_PAGE_SIZE,
    totalCount = null
  }) => {
    const incomingJobs = Array.isArray(jobs) ? jobs : [];
    const resolvedTotalCount = getRecommendationTotalCount({ totalCount }, offset + incomingJobs.length);

    if (!incomingJobs.length) {
      setQuickState((prev) => ({
        ...prev,
        status: replace ? 'empty' : prev.rawJobs.length ? 'success' : 'empty',
        rawJobs: replace ? [] : prev.rawJobs,
        hasMore: false,
        isLoadingMore: false,
        nextOffset: offset,
        totalJobCount: Math.max(replace ? 0 : prev.totalJobCount || 0, resolvedTotalCount),
        loadingLoaded: 0,
        loadingTarget
      }));
      return;
    }

    let didReplace = false;
    if (replace) {
      quickRenderedJobKeysRef.current = new Set();
    }
    for (const job of incomingJobs) {
      if (signal?.aborted) {
        return;
      }

      const jobKey = getQuickJobKey(job);
      const didAppendJob = !jobKey || !quickRenderedJobKeysRef.current.has(jobKey) || (replace && !didReplace);
      if (didAppendJob && jobKey) {
        quickRenderedJobKeysRef.current.add(jobKey);
      }
      setQuickState((prev) => {
        const baseJobs = replace && !didReplace ? [] : prev.rawJobs;
        if (jobKey && baseJobs.some((item) => getQuickJobKey(item) === jobKey)) {
          return prev;
        }
        const mergedJobs = mergeUniqueQuickJobs(baseJobs, [job]);

        return {
          ...prev,
          status: keepLoading || loadingMore || showLoadingDuringAppend ? 'refetching' : 'success',
          error: '',
          rawJobs: mergedJobs,
          hasMore: false,
          isLoadingMore: loadingMore,
          nextOffset: mergedJobs.length,
          totalJobCount: Math.max(replace && !didReplace ? 0 : prev.totalJobCount || 0, resolvedTotalCount, mergedJobs.length),
          loadingLoaded: Math.min(Math.max(0, mergedJobs.length - offset), loadingTarget),
          loadingTarget
        };
      });
      didReplace = didReplace || didAppendJob;

      if (didAppendJob) {
        await delay(QUICK_INCREMENTAL_APPEND_DELAY_MS);
      }
    }

    if (signal?.aborted) {
      return;
    }

    setQuickState((prev) => ({
      ...prev,
      status: keepLoading ? (prev.rawJobs.length ? 'refetching' : 'loading') : prev.rawJobs.length ? 'success' : 'empty',
      error: '',
      hasMore: keepLoading ? false : Boolean(hasMore),
      isLoadingMore: keepLoading ? loadingMore : false,
      nextOffset: prev.rawJobs.length,
      totalJobCount: Math.max(prev.totalJobCount || 0, resolvedTotalCount, prev.rawJobs.length),
      loadingLoaded: Math.min(Math.max(0, prev.rawJobs.length - offset), loadingTarget),
      loadingTarget
    }));
  }, []);

  const applyQuickJobsImmediately = useCallback(({ jobs, replace = false, offset = 0, hasMore = false, totalCount = null }) => {
    const incomingJobs = Array.isArray(jobs) ? jobs : [];
    const resolvedTotalCount = getRecommendationTotalCount({ totalCount }, offset + incomingJobs.length);

    setQuickState((prev) => {
      const mergedJobs = replace
        ? incomingJobs
        : mergeUniqueQuickJobs(prev.rawJobs, incomingJobs);

      return {
        ...prev,
        status: mergedJobs.length ? 'success' : 'empty',
        error: '',
        rawJobs: mergedJobs,
        hasMore: Boolean(hasMore),
        isLoadingMore: false,
        nextOffset: offset + incomingJobs.length,
        totalJobCount: Math.max(replace ? 0 : prev.totalJobCount || 0, resolvedTotalCount, mergedJobs.length),
        loadingLoaded: 0,
        loadingTarget: QUICK_PAGE_SIZE
      };
    });
  }, []);

  const runQuickRecommendation = useCallback(async ({ profileId, aiEnabled, filters, signal }) => {
    if (!profileId) {
      setQuickState({ status: 'empty', error: '', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
      return;
    }

    const selectedProfileObject = getQuickProfileForScoring(profileId);
    const profileSignature = getProfileScoringSignature(selectedProfileObject);
    const cacheKey = getQuickPageCacheKey({
      profileId,
      aiEnabled,
      profileSignature,
      offset: 0
    });
    const shouldPreserveLoadMoreActiveTask = () => {
      const activeTask = getActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
      return (
        Number(activeTask?.offset || 0) > 0 &&
        String(activeTask?.profileId || '') === String(profileId || '') &&
        (!activeTask.profileSignature || activeTask.profileSignature === profileSignature)
      );
    };

    const cachedPages = getCachedQuickPages({ profileId, aiEnabled, profileSignature });
    if (cachedPages.jobs.length) {
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      applyQuickJobsImmediately({
        jobs: cachedPages.jobs,
        replace: true,
        offset: 0,
        hasMore: !aiEnabled && hasMoreQuickJobs(cachedPages, cachedPages.jobs.length),
        totalCount: cachedPages.totalCount
      });
      return;
    }

    if (!shouldPreserveLoadMoreActiveTask()) {
      setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
        aiEnabled,
        profileId,
        profileSignature,
        filters,
        offset: 0
      });
    }

    setQuickState((prev) => ({
      ...prev,
      status: prev.rawJobs.length ? 'refetching' : 'loading',
      error: '',
      loadingLoaded: 0,
      loadingTarget: QUICK_PAGE_SIZE
    }));

    const proceedTaskResult = async (taskResult) => {
      if (isDirectQuickResultPayload(taskResult)) {
        setCachedRecommendation(cacheKey, taskResult);
        const directJobs = parseQuickJobsFromResult(taskResult);
        setAppliedAiEnabled(aiEnabled);
        setAppliedFilters(filters);
        if (!aiEnabled) {
          applyQuickJobsImmediately({
            jobs: directJobs,
            replace: true,
            offset: 0,
            hasMore: hasMoreQuickJobs(taskResult, directJobs.length),
            totalCount: getRecommendationTotalCount(taskResult, directJobs.length)
          });
          return;
        }
        await appendQuickJobsIncrementally({
          jobs: directJobs,
          replace: true,
          offset: 0,
          hasMore: false,
          signal,
          showLoadingDuringAppend: true,
          totalCount: getRecommendationTotalCount(taskResult, directJobs.length)
        });
        return;
      }

      const taskStatus = getTaskStatus(taskResult);
      const taskRequestId = getTaskRequestId(taskResult);

      if (taskStatus === 'FAILED') {
        clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
        setQuickState({ status: 'error', error: getTaskErrorMessage(taskResult) || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
        return;
      }

      if (taskStatus === 'COMPLETED' && taskResult?.result) {
        setCachedRecommendation(cacheKey, taskResult.result);
        const jobs = parseQuickJobsFromResult(taskResult.result);
        setAppliedAiEnabled(aiEnabled);
        setAppliedFilters(filters);
        if (isTaskCached(taskResult)) {
          applyQuickJobsImmediately({
            jobs,
            replace: true,
            offset: 0,
            hasMore: !aiEnabled && hasMoreQuickJobs(taskResult.result, jobs.length),
            totalCount: getRecommendationTotalCount(taskResult.result, jobs.length)
          });
          return;
        }
        if (!aiEnabled) {
          applyQuickJobsImmediately({
            jobs,
            replace: true,
            offset: 0,
            hasMore: hasMoreQuickJobs(taskResult.result, jobs.length),
            totalCount: getRecommendationTotalCount(taskResult.result, jobs.length)
          });
          return;
        }
        await appendQuickJobsIncrementally({
          jobs,
          replace: true,
          offset: 0,
          hasMore: false,
          signal,
          showLoadingDuringAppend: true,
          totalCount: getRecommendationTotalCount(taskResult.result, jobs.length)
        });
        return;
      }

      if (!taskRequestId) {
        clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
        setQuickState({ status: 'error', error: '퀵 추천 요청 상태를 확인할 수 없습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
        return;
      }

      setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
        aiEnabled,
        profileId,
        profileSignature,
        filters,
        offset: 0,
        requestId: taskRequestId
      });

      let hasProgressResult = false;
      const completed = await waitForRecommendTask(callWithAuth, taskRequestId, signal, async (progressResult) => {
        if (!aiEnabled) {
          return;
        }
        const progressJobs = parseQuickJobsFromResult(progressResult);
        if (!progressJobs.length) {
          return;
        }
        setAppliedAiEnabled(aiEnabled);
        setAppliedFilters(filters);
        await appendQuickJobsIncrementally({
          jobs: progressJobs,
          replace: !hasProgressResult,
          offset: 0,
          hasMore: false,
          signal,
          keepLoading: true,
          loadingTarget: Math.max(1, getRecommendationTotalCount(progressResult, progressJobs.length)),
          totalCount: getRecommendationTotalCount(progressResult, progressJobs.length)
        });
        hasProgressResult = true;
      });
      const completedStatus = getTaskStatus(completed);

      if (!completed || completedStatus === 'FAILED') {
        clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
        setQuickState({ status: 'error', error: getTaskErrorMessage(completed) || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
        return;
      }

      setCachedRecommendation(cacheKey, completed.result);
      const jobs = parseQuickJobsFromResult(completed.result);
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      if (completed.cached) {
        applyQuickJobsImmediately({
          jobs,
          replace: true,
          offset: 0,
          hasMore: !aiEnabled && hasMoreQuickJobs(completed.result, jobs.length),
          totalCount: getRecommendationTotalCount(completed.result, jobs.length)
        });
      } else if (!aiEnabled) {
        applyQuickJobsImmediately({
          jobs,
          replace: true,
          offset: 0,
          hasMore: hasMoreQuickJobs(completed.result, jobs.length),
          totalCount: getRecommendationTotalCount(completed.result, jobs.length)
        });
      } else if (hasProgressResult) {
        await appendQuickJobsIncrementally({
          jobs,
          replace: false,
          offset: 0,
          hasMore: false,
          signal,
          showLoadingDuringAppend: true,
          totalCount: getRecommendationTotalCount(completed.result, jobs.length)
        });
      } else {
        await appendQuickJobsIncrementally({
          jobs,
          replace: true,
          offset: 0,
          hasMore: false,
          signal,
          showLoadingDuringAppend: true,
          totalCount: getRecommendationTotalCount(completed.result, jobs.length)
        });
      }
    };

    const taskPayload = await callWithAuth((accessToken) =>
      fetchQuickJobRecommendations(accessToken, {
        aiEnabled,
        profileId,
        limit: aiEnabled ? undefined : QUICK_PAGE_SIZE,
        offset: aiEnabled ? undefined : 0,
        signal
      })
    );
    const taskResult = normalizeTaskPayload(taskPayload);
    await proceedTaskResult(taskResult);
  }, [appendQuickJobsIncrementally, applyQuickJobsImmediately, callWithAuth, getQuickProfileForScoring]);

  const loadMoreQuickRecommendations = useCallback(async () => {
    if (
      !isQuickPage ||
      appliedAiEnabled ||
      !selectedProfileId ||
      !quickState.hasMore ||
      quickState.isLoadingMore ||
      !['success', 'refetching'].includes(quickState.status)
    ) {
      return;
    }

    const offset = Math.max(quickState.nextOffset || quickState.rawJobs.length, quickState.rawJobs.length);
    if (quickState.totalJobCount > 0 && offset >= quickState.totalJobCount) {
      setQuickState((prev) => ({ ...prev, hasMore: false, isLoadingMore: false, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE }));
      return;
    }

    const requestKey = JSON.stringify({
      aiEnabled: appliedAiEnabled,
      profileId: appliedAiEnabled ? selectedProfileId : '',
      offset
    });
    if (quickLoadMoreInFlightKeyRef.current === requestKey) {
      return;
    }
    quickLoadMoreInFlightKeyRef.current = requestKey;

    const controller = new AbortController();
    const loadingTarget = QUICK_PAGE_SIZE;
    setQuickState((prev) => ({ ...prev, isLoadingMore: true, error: '', loadingLoaded: 0, loadingTarget }));

    try {
      const selectedProfileObject = getQuickProfileForScoring(selectedProfileId);
      const profileSignature = getProfileScoringSignature(selectedProfileObject);
      if (appliedAiEnabled) {
        setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
          aiEnabled: appliedAiEnabled,
          profileId: selectedProfileId,
          profileSignature,
          filters: appliedFilters,
          offset
        });
      }
      const pageCacheKey = appliedAiEnabled
        ? getQuickPageCacheKey({
            profileId: selectedProfileId,
            aiEnabled: appliedAiEnabled,
            profileSignature,
            offset
          })
        : '';
      const cachedPayload = pageCacheKey ? getCachedRecommendation(pageCacheKey) : null;
      if (cachedPayload) {
        if (appliedAiEnabled) {
          setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
            aiEnabled: appliedAiEnabled,
            profileId: selectedProfileId,
            profileSignature,
            filters: appliedFilters,
            offset: 0
          });
        }
        const cachedJobs = parseQuickJobsFromResult(cachedPayload);
        applyQuickJobsImmediately({
          jobs: cachedJobs,
          replace: false,
          offset,
          hasMore: hasMoreQuickJobs(cachedPayload, cachedJobs.length, offset),
          totalCount: getRecommendationTotalCount(cachedPayload, offset + cachedJobs.length)
        });
        return;
      }

      let hasProgressResult = false;
      const completedResult = await requestQuickRecommendationResult(
          callWithAuth,
          {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            limit: QUICK_PAGE_SIZE,
            offset
          },
          controller.signal,
          appliedAiEnabled
            ? async (progressResult) => {
              const progressJobs = parseQuickJobsFromResult(progressResult);
              if (!progressJobs.length) {
                return;
              }
              await appendQuickJobsIncrementally({
                jobs: progressJobs,
                replace: false,
                offset,
                hasMore: false,
                signal: controller.signal,
                loadingMore: true,
                keepLoading: true,
                loadingTarget,
                totalCount: getRecommendationTotalCount(progressResult, offset + progressJobs.length)
              });
              hasProgressResult = true;
            }
            : undefined
        );
      const completedPayload = completedResult.payload;
      if (pageCacheKey) {
        setCachedRecommendation(pageCacheKey, completedPayload);
      }
      if (!quickPageActiveRef.current) {
        return;
      }
      if (appliedAiEnabled) {
        setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
          aiEnabled: appliedAiEnabled,
          profileId: selectedProfileId,
          profileSignature,
          filters: appliedFilters,
          offset: 0
        });
      }
      const nextJobs = parseQuickJobsFromResult(completedPayload);

      if (completedResult.cached || !appliedAiEnabled) {
        applyQuickJobsImmediately({
          jobs: nextJobs,
          replace: false,
          offset,
          hasMore: hasMoreQuickJobs(completedPayload, nextJobs.length, offset),
          totalCount: getRecommendationTotalCount(completedPayload, offset + nextJobs.length)
        });
      } else {
        await appendQuickJobsIncrementally({
          jobs: nextJobs,
          replace: false,
          offset,
          hasMore: hasMoreQuickJobs(completedPayload, nextJobs.length, offset),
          signal: controller.signal,
          showLoadingDuringAppend: true,
          loadingTarget,
          totalCount: getRecommendationTotalCount(completedPayload, offset + nextJobs.length)
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      if (!quickPageActiveRef.current) {
        return;
      }
      if (appliedAiEnabled) {
        clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
      }
      setQuickState((prev) => ({
        ...prev,
        status: prev.rawJobs.length ? 'success' : 'error',
        error: error.message || '퀵 추천을 불러오지 못했습니다.',
        isLoadingMore: false,
        loadingLoaded: 0
      }));
    } finally {
      if (quickLoadMoreInFlightKeyRef.current === requestKey) {
        quickLoadMoreInFlightKeyRef.current = '';
      }
    }
  }, [
    appendQuickJobsIncrementally,
    appliedAiEnabled,
    applyQuickJobsImmediately,
    callWithAuth,
    getQuickProfileForScoring,
    isQuickPage,
    quickState.hasMore,
    quickState.isLoadingMore,
    quickState.nextOffset,
    quickState.rawJobs,
    quickState.status,
    quickState.totalJobCount,
    selectedProfileId,
    appliedFilters
  ]);

  useEffect(() => {
    if (
      !isQuickPage ||
      appliedAiEnabled ||
      !quickState.hasMore ||
      quickState.isLoadingMore ||
      quickState.status !== 'success'
    ) {
      return;
    }

    loadMoreQuickRecommendations();
  }, [
    appliedAiEnabled,
    isQuickPage,
    loadMoreQuickRecommendations,
    quickState.hasMore,
    quickState.isLoadingMore,
    quickState.status
  ]);

  useEffect(() => {
    if (!isQuickPage || appliedAiEnabled || !quickState.hasMore || quickState.isLoadingMore) {
      return undefined;
    }

    const sentinel = quickLoadMoreSentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMoreQuickRecommendations();
      }
    }, { rootMargin: '260px 0px' });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [appliedAiEnabled, isQuickPage, loadMoreQuickRecommendations, quickState.hasMore, quickState.isLoadingMore]);

  useEffect(() => {
    if (
      !isQuickPage ||
      !appliedAiEnabled ||
      quickState.status !== 'success' ||
      quickState.isLoadingMore
    ) {
      return;
    }

    const activeTask = getActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
    if (!activeTask?.aiEnabled) {
      return;
    }

    const selectedProfileObject = getQuickProfileForScoring(selectedProfileId);
    const profileSignature = getProfileScoringSignature(selectedProfileObject);
    if (
      String(activeTask.profileId || '') !== String(selectedProfileId || '') ||
      (activeTask.profileSignature && activeTask.profileSignature !== profileSignature)
    ) {
      clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
      return;
    }

    const activeOffset = Number(activeTask.offset || 0);
    if (activeOffset <= 0) {
      return;
    }

    if (quickState.nextOffset > activeOffset) {
      setActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE, {
        ...activeTask,
        offset: 0
      });
      return;
    }

    if (quickState.nextOffset === activeOffset && quickState.hasMore) {
      loadMoreQuickRecommendations();
    }
  }, [
    appliedAiEnabled,
    getQuickProfileForScoring,
    isQuickPage,
    loadMoreQuickRecommendations,
    quickState.hasMore,
    quickState.isLoadingMore,
    quickState.nextOffset,
    quickState.status,
    selectedProfileId
  ]);

  const loadQuickExplanation = useCallback(async (job, profileObject, detailObject = null, options = {}) => {
    const { requireFitScore = true, profileId = effectiveSelectedProfileId, signal } = options;
    if (!job || !profileObject || !profileId || !appliedAiEnabled || (requireFitScore && typeof job.fitScore !== 'number')) {
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'idle',
        explainError: '',
        explainData: null
      }));
      return;
    }

    const profileSignature = getProfileScoringSignature(profileObject);
    const explainCacheKey = [
      'quick-explain',
      String(profileId),
      profileSignature || 'current',
      String(job.postingId || job.externalId || job.id || 'unknown')
    ].join(':');
    const cached = getCachedQuickExplain(explainCacheKey);

    if (cached) {
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'success',
        explainError: '',
        explainData: cached
      }));
      return;
    }

    const explainPayload = buildQuickExplainPayload({ job, profile: profileObject, detail: detailObject });
    if (!explainPayload) {
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'error',
        explainError: '추천 설명을 요청할 기업명 또는 직무명이 없습니다.',
        explainData: null
      }));
      return;
    }
    if (!explainPayload?.profile?.profile_id || (!explainPayload?.job?.job_post_id && !explainPayload?.job?.source_id)) {
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'error',
        explainError: '추천 설명을 요청할 필수 정보가 부족합니다.',
        explainData: null
      }));
      return;
    }

    const sequence = quickExplainRequestSequenceRef.current + 1;
    quickExplainRequestSequenceRef.current = sequence;
    setQuickDetailState((prev) => ({
      ...prev,
      explainStatus: 'loading',
      explainError: '',
      explainData: null
    }));

    try {
      const response = await callWithAuth((accessToken) => explainRecommendation(accessToken, explainPayload, { signal }));
      if (quickExplainRequestSequenceRef.current !== sequence) {
        return;
      }
      setCachedQuickExplain(explainCacheKey, response);
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'success',
        explainError: '',
        explainData: response
      }));
    } catch (error) {
      if (error?.name === 'AbortError') {
        if (quickExplainRequestSequenceRef.current === sequence) {
          setQuickDetailState((prev) => ({
            ...prev,
            explainStatus: 'idle',
            explainError: '',
            explainData: null
          }));
        }
        return;
      }
      if (quickExplainRequestSequenceRef.current !== sequence) {
        return;
      }
      setQuickDetailState((prev) => ({
        ...prev,
        explainStatus: 'error',
        explainError: error.message || '추천 설명을 불러오지 못했습니다.',
        explainData: null
      }));
    }
  }, [appliedAiEnabled, callWithAuth, effectiveSelectedProfileId]);

  useEffect(() => {
    if (!detailModalOpen || quickDetailState.mode !== 'quick' || quickDetailState.explainStatus !== 'idle' || !selectedQuickJob) {
      return undefined;
    }

    if (detailState.status === 'loading') {
      return undefined;
    }

    const profileId = effectiveSelectedProfileId;
    const profileObject = getQuickProfileForScoring(profileId);
    if (!profileId || !profileObject || !appliedAiEnabled || typeof selectedQuickJob.fitScore !== 'number') {
      return undefined;
    }

    const controller = new AbortController();
    loadQuickExplanation(selectedQuickJob, profileObject, detailState.data, {
      profileId,
      signal: controller.signal
    });
    return () => {
      controller.abort();
    };
  }, [
    appliedAiEnabled,
    detailModalOpen,
    detailState.data,
    detailState.status,
    effectiveSelectedProfileId,
    getQuickProfileForScoring,
    loadQuickExplanation,
    quickDetailState.mode,
    selectedQuickJob
  ]);

  useEffect(() => {
    const isQuickBatchLoading = quickState.status === 'loading' || quickState.status === 'refetching' || quickState.isLoadingMore;
    const wasQuickBatchLoading = wasQuickBatchLoadingRef.current;
    wasQuickBatchLoadingRef.current = isQuickBatchLoading;

    if (
      !detailModalOpen ||
      quickDetailState.mode !== 'quick' ||
      quickDetailState.explainStatus !== 'error' ||
      !selectedQuickJob ||
      !wasQuickBatchLoading ||
      isQuickBatchLoading ||
      detailState.status === 'loading'
    ) {
      return undefined;
    }

    const profileId = effectiveSelectedProfileId;
    const profileObject = getQuickProfileForScoring(profileId);
    if (!profileId || !profileObject || !appliedAiEnabled || typeof selectedQuickJob.fitScore !== 'number') {
      return undefined;
    }

    const controller = new AbortController();
    loadQuickExplanation(selectedQuickJob, profileObject, detailState.data, {
      profileId,
      signal: controller.signal
    });
    return () => {
      controller.abort();
    };
  }, [
    appliedAiEnabled,
    detailModalOpen,
    detailState.data,
    detailState.status,
    effectiveSelectedProfileId,
    getQuickProfileForScoring,
    loadQuickExplanation,
    quickDetailState.mode,
    quickState.isLoadingMore,
    quickState.status,
    selectedQuickJob
  ]);

  const handleOpenPopularPosting = useCallback(async (postingId) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    setQuickDetailState({
      mode: 'popular',
      fitScore: null,
      explainStatus: 'idle',
      explainError: '',
      explainData: null
    });
    setSelectedQuickJob(null);
    setSelectedPostingId(postingId);
    setDetailModalOpen(true);
    setDetailState({ status: 'loading', error: '', data: null });

    try {
      const detail = await callWithAuth((accessToken) => postingApi.getPostingDetail(postingId, { accessToken }));
      const normalizedDetail = normalizePostingDetail(detail);
      setDetailState({ status: 'success', error: '', data: normalizedDetail });
    } catch (error) {
      setDetailState({ status: 'error', error: error.message || '공고 상세를 불러오지 못했습니다.', data: null });
    }
  }, [callWithAuth, isAuthenticated]);

  const handleOpenQuickPosting = useCallback(async (job) => {
    if (!job) {
      return;
    }

    setSelectedQuickJob(job);
    setQuickDetailState({
      mode: 'quick',
      fitScore: typeof job.fitScore === 'number' ? job.fitScore : null,
      explainStatus: 'idle',
      explainError: '',
      explainData: null
    });
    const postingId = Number.isFinite(Number(job.postingId)) ? Number(job.postingId) : null;
    setSelectedPostingId(postingId);
    setDetailModalOpen(true);
    setDetailState({ status: 'loading', error: '', data: null });

    if (!postingId) {
      setDetailState({ status: 'success', error: '', data: toQuickFallbackDetail(job) });
      return;
    }

    try {
      const detail = await callWithAuth((accessToken) => postingApi.getPostingDetail(postingId, { accessToken }));
      const normalizedDetail = normalizePostingDetail(detail);
      setDetailState({ status: 'success', error: '', data: normalizedDetail });
    } catch (error) {
      const fallbackDetail = toQuickFallbackDetail(job);
      setDetailState({
        status: 'success',
        error: '',
        data: fallbackDetail
      });
    }
  }, [callWithAuth]);

  const handleCloseDetailModal = useCallback(() => {
    quickExplainRequestSequenceRef.current += 1;
    setDetailModalOpen(false);
    setSelectedPostingId(null);
    setSelectedQuickJob(null);
    setDetailState({ status: 'idle', error: '', data: null });
    setQuickDetailState({
      mode: 'none',
      fitScore: null,
      explainStatus: 'idle',
      explainError: '',
      explainData: null
    });
  }, []);
  const handleOpenScrapConfirm = useCallback(() => {
    setScrapConfirmOpen(true);
  }, []);
  const detailModalQuickExplainState = useMemo(
    () => ({
      status: quickDetailState.explainStatus,
      error: quickDetailState.explainError,
      data: quickDetailState.explainData
    }),
    [quickDetailState.explainData, quickDetailState.explainError, quickDetailState.explainStatus]
  );

  const handleApplyQuickFilters = useCallback(async () => {
    if (!effectiveSelectedProfileId || quickState.status === 'loading' || quickState.status === 'refetching') {
      return;
    }
    if (isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID] && !isQuickProfileDetailReady) {
      return;
    }

    const commutableOnly = Boolean(isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID]);
    const normalizedDraftFilters = {
      ...draftFilters,
      [COMMUTABLE_FILTER_ID]: commutableOnly,
      region: commutableOnly ? FILTER_ALL_VALUE : draftFilters.region
    };
    const requestKey = JSON.stringify({
      profileId: effectiveSelectedProfileId,
      aiEnabled: isAiEnabled,
      filters: normalizedDraftFilters
    });
    if (quickSearchInFlightKeyRef.current === requestKey) {
      return;
    }
    quickSearchInFlightKeyRef.current = requestKey;

    const controller = new AbortController();

    try {
      await runQuickRecommendation({
        profileId: effectiveSelectedProfileId,
        aiEnabled: isAiEnabled,
        filters: normalizedDraftFilters,
        signal: controller.signal
      });
      setIsQuickFilterCollapsed(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setQuickState({ status: 'error', error: error.message || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
    } finally {
      if (quickSearchInFlightKeyRef.current === requestKey) {
        quickSearchInFlightKeyRef.current = '';
      }
    }
  }, [draftFilters, effectiveSelectedProfileId, isAiEnabled, isQuickProfileDetailReady, quickState.status, runQuickRecommendation]);

  useEffect(() => {
    if (
      !isQuickPage ||
      !isAuthenticated ||
      profilesState.status !== 'success' ||
      !profilesState.profiles.length ||
      !['idle', 'empty'].includes(quickState.status)
    ) {
      return undefined;
    }

    const activeTask = getActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
    if (!activeTask?.profileId) {
      return undefined;
    }

    const activeProfile = getQuickProfileForScoring(activeTask.profileId);
    if (!activeProfile) {
      clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
      return undefined;
    }

    const activeProfileSignature = getProfileScoringSignature(activeProfile);
    if (activeTask.profileSignature && activeTask.profileSignature !== activeProfileSignature) {
      clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
      return undefined;
    }

    const activeTaskAiEnabled = Boolean(activeTask.aiEnabled ?? true);
    const filters = activeTask.filters || {
      jobCategory: FILTER_ALL_VALUE,
      region: FILTER_ALL_VALUE,
      employmentType: FILTER_ALL_VALUE,
      salaryType: FILTER_ALL_VALUE,
      [COMMUTABLE_FILTER_ID]: true
    };
    const normalizedFilters = {
      ...filters,
      [COMMUTABLE_FILTER_ID]: Boolean(activeTaskAiEnabled && filters[COMMUTABLE_FILTER_ID])
    };
    setSelectedProfileId(String(activeTask.profileId));
    setIsAiEnabled(activeTaskAiEnabled);
    setDraftFilters(normalizedFilters);
    setAppliedFilters(normalizedFilters);

    runQuickRecommendation({
      profileId: activeTask.profileId,
      aiEnabled: activeTaskAiEnabled,
      filters: normalizedFilters
    }).catch((error) => {
      if (error.name !== 'AbortError') {
        clearActiveRecommendationTask(QUICK_ACTIVE_TASK_SCOPE);
        setQuickState({ status: 'error', error: error.message || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0, totalJobCount: 0, loadingLoaded: 0, loadingTarget: QUICK_PAGE_SIZE });
      }
    });
  }, [
    isAuthenticated,
    isQuickPage,
    getQuickProfileForScoring,
    profilesState.profiles,
    profilesState.status,
    quickState.status,
    runQuickRecommendation
  ]);

  const handleResetQuickFilters = useCallback(() => {
    setDraftFilters({
      jobCategory: FILTER_ALL_VALUE,
      region: FILTER_ALL_VALUE,
      employmentType: FILTER_ALL_VALUE,
      salaryType: FILTER_ALL_VALUE,
      [COMMUTABLE_FILTER_ID]: isAiEnabled
    });
  }, [isAiEnabled]);

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
            scrapCount: prev.data.scrappedByMe ? prev.data.scrapCount : prev.data.scrapCount + 1
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

      setQuickState((prev) => ({
        ...prev,
        rawJobs: prev.rawJobs.map((job) =>
          Number(job.postingId) === Number(selectedPostingId)
            ? {
                ...job,
                scrappedByMe: true,
                scrapCount: job.scrappedByMe ? job.scrapCount : job.scrapCount + 1
              }
            : job
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
  const isQuickBatchLoading = isQuickLoading || quickState.isLoadingMore;
  const quickLoadingTarget = Math.max(
    1,
    appliedAiEnabled ? quickState.loadingTarget || QUICK_PAGE_SIZE : Math.min(quickState.loadingTarget || QUICK_PAGE_SIZE, QUICK_PAGE_SIZE)
  );
  const quickLoadingLoaded = Math.min(quickLoadingTarget, Math.max(0, quickState.loadingLoaded || 0));
  const isGuestUser = !isAuthenticated;
  const isQuickCommutableToggleDisabled = !isAiEnabled || isQuickBatchLoading || !canUseQuickCommutableFilter;
  const isQuickCommutableOnlyApplied = Boolean(appliedAiEnabled && appliedFilters[COMMUTABLE_FILTER_ID]);
  const quickResultCount = appliedAiEnabled
    ? filteredQuickJobs.length
    : Math.max(filteredQuickJobs.length, Number(quickState.totalJobCount) || 0);
  const shouldShowQuickHeader = !isGuestUser && (filteredQuickJobs.length > 0 || isQuickBatchLoading);
  const shouldShowQuickResults = !isGuestUser && filteredQuickJobs.length > 0 && ['success', 'refetching', 'loading'].includes(quickState.status);
  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);
  const handleToggleQuickCommutableOnly = useCallback(() => {
    if (isGuestUser) {
      openLoginModal();
      return;
    }

    if (isQuickCommutableToggleDisabled) {
      return;
    }

    setDraftFilters((current) => {
      const nextEnabled = !Boolean(current[COMMUTABLE_FILTER_ID]);
      return {
        ...current,
        [COMMUTABLE_FILTER_ID]: nextEnabled,
        region: nextEnabled ? FILTER_ALL_VALUE : current.region
      };
    });
  }, [isGuestUser, isQuickCommutableToggleDisabled, openLoginModal]);

  const handleToggleQuickAi = useCallback(() => {
    if (isGuestUser) {
      openLoginModal();
      return;
    }

    setIsAiEnabled((current) => {
      const nextEnabled = !current;
      if (!nextEnabled) {
        setDraftFilters((filters) => ({
          ...filters,
          [COMMUTABLE_FILTER_ID]: false
        }));
      } else {
        setDraftFilters((filters) => ({
          ...filters,
          [COMMUTABLE_FILTER_ID]: true,
          region: FILTER_ALL_VALUE
        }));
      }
      return nextEnabled;
    });
  }, [isGuestUser, openLoginModal]);

  return {
    appliedAiEnabled,
    closedProfileLabel,
    detailModalOpen,
    detailModalQuickExplainState,
    detailState,
    draftFilters,
    effectiveSelectedProfileId,
    filteredQuickJobs,
    handleApplyQuickFilters,
    handleCloseDetailModal,
    handleOpenPopularPosting,
    handleOpenQuickPosting,
    handleOpenScrapConfirm,
    handleResetQuickFilters,
    handleScrapConfirm,
    handleToggleQuickAi,
    handleToggleQuickCommutableOnly,
    isAiEnabled,
    isGuestUser,
    isHomePage,
    isLoginModalOpen,
    isProfileMenuOpen,
    isQuickBatchLoading,
    isQuickCommutableOnlyApplied,
    isQuickCommutableToggleDisabled,
    isQuickFilterCollapsed,
    isQuickPage,
    isScrapping,
    localizePath,
    noticeState,
    openLoginModal,
    orderedFilterGroups,
    orderedProfiles,
    popularScrollerRef,
    popularState,
    profilesState,
    quickDetailState,
    quickLoadMoreSentinelRef,
    quickLoadingLoaded,
    quickLoadingTarget,
    quickProfileSelectRef,
    quickResultCount,
    quickResultListRef,
    quickState,
    scrapConfirmOpen,
    selectedProfileId,
    setDraftFilters,
    setIsLoginModalOpen,
    setIsPopularCarouselPaused,
    setIsProfileMenuOpen,
    setIsQuickFilterCollapsed,
    setScrapConfirmOpen,
    setSelectedProfileId,
    shouldShowQuickHeader,
    shouldShowQuickResults,
    supportOrganizations,
    supportSectionCopy,
    visibleSelectedProfile
  };
}
