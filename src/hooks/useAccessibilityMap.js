import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapApi } from '../api/mapApi';
import { explainRecommendation } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  clearActiveRecommendationTask,
  clearRecommendationCache,
  getRecommendationExplanationCacheKey,
  getActiveRecommendationTask,
  getCachedRecommendation,
  getRecommendationCacheKey,
  setActiveRecommendationTask,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
import {
  ACCESSIBILITY_MAP_LEGEND as MAP_LEGEND,
  ACCESSIBILITY_MAP_PERSONAS as MAP_PERSONAS,
  ACCESSIBILITY_MAP_RADIUS_METERS as MAP_RADIUS_METERS,
  COMMUTABLE_FILTER_ID,
  FILTER_ALL_VALUE,
  VALID_ACCESSIBILITY_MAP_TABS as VALID_TABS
} from '../constants/accessibilityMap';
import {
  buildExplainPayload,
  buildFilterGroups,
  buildMapMarkers,
  buildMapViewport,
  buildRecommendationStateFromPayload,
  buildSupportAgencyMarkers,
  filterAccessibilityMapJobs,
  filterJobsByMapSearchQuery,
  getScoreNumber,
  normalizeProfiles,
  sortMapJobs
} from '../utils/accessibilityMapData';
import { hasMoreRecommendationPages, MAP_RECOMMENDATION } from '../constants/recommendation';
import { requestMapRecommendationResult } from '../services/recommendationTaskService';
import { useJobFilterOptions } from './useJobFilterOptions';
import { useProfiles } from './useProfiles';

const MAP_PAGE_SIZE = MAP_RECOMMENDATION.pageSize;
const MAP_INCREMENTAL_APPEND_DELAY_MS = MAP_RECOMMENDATION.incrementalAppendDelayMs;
const MAP_ACTIVE_TASK_SCOPE = MAP_RECOMMENDATION.activeTaskScope;
const hasMoreMapJobs = (state, offset = 0) =>
  hasMoreRecommendationPages({
    pageSize: MAP_PAGE_SIZE,
    loadedCount: state.jobs.length,
    offset,
    totalCount: state.totalJobCount
  });

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getMapPageCacheKey = ({ profileId, aiEnabled, profileSignature, offset = 0 }) =>
  getRecommendationCacheKey({
    profileId,
    aiEnabled,
    scope: `map:${offset}`,
    profileSignature: aiEnabled ? profileSignature : ''
  });

const getCachedMapPagesState = ({ profileId, aiEnabled, profileSignature, selectedProfile }) => {
  const jobs = [];
  let lastPayload = null;
  let totalJobCount = 0;

  for (let offset = 0; ; offset += MAP_PAGE_SIZE) {
    const cachedPayload = getCachedRecommendation(getMapPageCacheKey({
      profileId,
      aiEnabled,
      profileSignature,
      offset
    }));
    if (!cachedPayload) {
      break;
    }

    const cachedState = buildRecommendationStateFromPayload(cachedPayload, aiEnabled, selectedProfile);
    if (!cachedState.jobs.length) {
      break;
    }

    jobs.push(...cachedState.jobs);
    lastPayload = cachedPayload;
    totalJobCount = Math.max(totalJobCount, cachedState.totalJobCount || 0, jobs.length);
    if (cachedState.jobs.length < MAP_PAGE_SIZE || jobs.length >= totalJobCount) {
      break;
    }
  }

  if (!jobs.length) {
    return null;
  }

  return {
    status: 'success',
    error: '',
    payload: lastPayload,
    totalJobCount: Math.max(totalJobCount, jobs.length),
    jobs
  };
};

export { buildExplainPayload, buildRecommendationStateFromPayload, filterAccessibilityMapJobs };

export function useAccessibilityMap({ searchQuery = '' } = {}) {
  const { callWithAuth, isAuthenticated } = useAuth();
  const profilesState = useProfiles();
  const filterOptions = useJobFilterOptions();
  const [selectedTab, setSelectedTab] = useState('accessibility');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [appliedAiEnabled, setAppliedAiEnabled] = useState(true);
  const [hasAppliedConditions, setHasAppliedConditions] = useState(false);
  const [sortMode, setSortMode] = useState('score_desc');
  const [showSupportAgencies, setShowSupportAgencies] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    jobCategory: FILTER_ALL_VALUE,
    region: FILTER_ALL_VALUE,
    employmentType: FILTER_ALL_VALUE,
    salaryType: FILTER_ALL_VALUE,
    [COMMUTABLE_FILTER_ID]: true
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [mapViewportResetKey, setMapViewportResetKey] = useState(0);
  const [recommendationState, setRecommendationState] = useState({
    status: 'idle',
    error: '',
    payload: null,
    totalJobCount: 0,
    jobs: []
  });
  const [profileOffPageState, setProfileOffPageState] = useState({
    hasMore: false,
    isLoadingMore: false,
    nextOffset: 0,
    loadingLoaded: 0,
    loadingTarget: MAP_PAGE_SIZE
  });
  const [explanationState, setExplanationState] = useState({
    status: 'idle',
    error: '',
    jobId: '',
    data: null
  });
  const [supportAgencyState, setSupportAgencyState] = useState({
    status: 'idle',
    error: '',
    agencies: []
  });
  const activeRecommendationCacheKeyRef = useRef('');
  const mapLoadMoreInFlightKeyRef = useRef('');
  const mapRenderedJobIdsRef = useRef(new Set());
  const mapPageMountedRef = useRef(false);

  const selectedProfileId = profilesState.selectedProfileId;
  const selectedProfile = profilesState.selectedProfile;
  const selectedProfileScoringSignature = useMemo(
    () => getProfileScoringSignature(selectedProfile),
    [selectedProfile]
  );
  const profiles = useMemo(
    () => normalizeProfiles(profilesState.profiles, selectedProfile),
    [profilesState.profiles, selectedProfile]
  );
  const selectedProfileSummary = useMemo(
    () => profiles.find((profile) => profile.id === String(selectedProfileId)) || null,
    [profiles, selectedProfileId]
  );
  const selectedPersona = selectedProfileSummary?.personaKey || 'wheelchair';
  const allJobs = recommendationState.jobs;
  const filteredJobs = useMemo(() => {
    const filterMatchedJobs = filterAccessibilityMapJobs(allJobs, selectedFilters, filterOptions.jobCategories, selectedProfile);
    const searchMatchedJobs = filterJobsByMapSearchQuery(
      filterMatchedJobs,
      hasAppliedConditions ? searchQuery : ''
    );
    return sortMapJobs(searchMatchedJobs, sortMode);
  }, [allJobs, filterOptions.jobCategories, hasAppliedConditions, searchQuery, selectedFilters, selectedProfile, sortMode]);
  const filterGroups = useMemo(
    () => buildFilterGroups(selectedFilters, filterOptions),
    [filterOptions, selectedFilters]
  );

  useEffect(() => {
    mapPageMountedRef.current = true;
    return () => {
      mapPageMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    mapRenderedJobIdsRef.current = new Set(recommendationState.jobs.map((job) => job.id).filter(Boolean));
  }, [recommendationState.jobs]);

  const appendMapJobsIncrementally = useCallback(async ({
    nextState,
    replace = false,
    offset = 0,
    hasMore = false,
    signal,
    loadingMore = false,
    keepLoading = false,
    showLoadingDuringAppend = false,
    loadingTarget = MAP_PAGE_SIZE
  }) => {
    const incomingJobs = Array.isArray(nextState?.jobs) ? nextState.jobs : [];

    if (!incomingJobs.length) {
      setRecommendationState((prev) => ({
        ...prev,
        status: replace ? 'empty' : prev.jobs.length ? 'success' : 'empty',
        error: '',
        payload: nextState?.payload || prev.payload,
        totalJobCount: Math.max(replace ? 0 : prev.totalJobCount || 0, nextState?.totalJobCount || 0, offset),
        jobs: replace ? [] : prev.jobs
      }));
      setProfileOffPageState({
        hasMore: false,
        isLoadingMore: false,
        nextOffset: offset,
        loadingLoaded: 0,
        loadingTarget
      });
      return;
    }

    let didReplace = false;
    if (replace) {
      mapRenderedJobIdsRef.current = new Set();
    }
    for (const job of incomingJobs) {
      if (signal?.aborted) {
        return;
      }

      const didAppendJob = !job.id || !mapRenderedJobIdsRef.current.has(job.id) || (replace && !didReplace);
      if (didAppendJob && job.id) {
        mapRenderedJobIdsRef.current.add(job.id);
      }
      const nextLoadingLoaded = Math.min(
        Math.max(0, Math.min(mapRenderedJobIdsRef.current.size, offset + loadingTarget) - offset),
        loadingTarget
      );
      setRecommendationState((prev) => {
        const baseJobs = replace && !didReplace ? [] : prev.jobs;
        const existingIds = new Set(baseJobs.map((item) => item.id));
        if (existingIds.has(job.id)) {
          return prev;
        }
        const mergedJobs = existingIds.has(job.id)
          ? baseJobs
          : [...baseJobs, job];

        return {
          ...prev,
          status: keepLoading || loadingMore || showLoadingDuringAppend ? 'refetching' : 'success',
          error: '',
          payload: nextState.payload,
          totalJobCount: Math.max(replace && !didReplace ? 0 : prev.totalJobCount || 0, nextState.totalJobCount || 0, mergedJobs.length),
          jobs: mergedJobs
        };
      });
      if (didAppendJob) {
        setProfileOffPageState({
          hasMore: false,
          isLoadingMore: loadingMore,
          nextOffset: offset + incomingJobs.length,
          loadingLoaded: nextLoadingLoaded,
          loadingTarget
        });
      }
      didReplace = didReplace || didAppendJob;

      if (didAppendJob) {
        await delay(MAP_INCREMENTAL_APPEND_DELAY_MS);
      }
    }

    if (signal?.aborted) {
      return;
    }

    setRecommendationState((prev) => ({
      ...prev,
      status: keepLoading ? (prev.jobs.length ? 'refetching' : 'loading') : prev.jobs.length ? 'success' : 'empty',
      error: '',
      payload: nextState.payload,
      totalJobCount: Math.max(prev.totalJobCount || 0, nextState.totalJobCount || 0, prev.jobs.length)
    }));
    setProfileOffPageState({
      hasMore: keepLoading ? false : Boolean(hasMore),
      isLoadingMore: keepLoading ? loadingMore : false,
      nextOffset: offset + incomingJobs.length,
      loadingLoaded: Math.min(Math.max(0, offset + incomingJobs.length - offset), loadingTarget),
      loadingTarget
    });
  }, []);

  const applyMapStateImmediately = useCallback(({ nextState, replace = false, offset = 0, hasMore = false }) => {
    const incomingJobs = Array.isArray(nextState?.jobs) ? nextState.jobs : [];

    setRecommendationState((prev) => {
      const baseJobs = replace ? [] : prev.jobs;
      const existingIds = new Set(baseJobs.map((job) => job.id));
      const mergedJobs = replace
        ? incomingJobs
        : [
            ...baseJobs,
            ...incomingJobs.filter((job) => !existingIds.has(job.id))
          ];

      return {
        ...prev,
        status: mergedJobs.length ? 'success' : 'empty',
        error: '',
        payload: nextState?.payload || prev.payload,
        totalJobCount: Math.max(replace ? 0 : prev.totalJobCount || 0, nextState?.totalJobCount || 0, mergedJobs.length),
        jobs: mergedJobs
      };
    });
    setProfileOffPageState({
      hasMore: Boolean(hasMore),
      isLoadingMore: false,
      nextOffset: offset + incomingJobs.length,
      loadingLoaded: 0,
      loadingTarget: MAP_PAGE_SIZE
    });
  }, []);

  useEffect(() => {
    if (
      hasAppliedConditions ||
      !isAuthenticated ||
      profilesState.status !== 'success' ||
      !profilesState.profiles.length ||
      !selectedProfileId ||
      !selectedProfile ||
      profilesState.detailStatus === 'loading' ||
      profilesState.detailStatus === 'idle'
    ) {
      return;
    }

    const activeTask = getActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
    if (!activeTask?.aiEnabled || !activeTask.profileId) {
      return;
    }

    if (String(activeTask.profileId) !== String(selectedProfileId)) {
      clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
      return;
    }

    if (activeTask.profileSignature && activeTask.profileSignature !== selectedProfileScoringSignature) {
      clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
      return;
    }

    const activeTaskFilters = activeTask.filters || {};
    const hasStoredCommutableChoice = Object.prototype.hasOwnProperty.call(activeTaskFilters, COMMUTABLE_FILTER_ID);
    const filters = {
      jobCategory: FILTER_ALL_VALUE,
      region: FILTER_ALL_VALUE,
      employmentType: FILTER_ALL_VALUE,
      salaryType: FILTER_ALL_VALUE,
      [COMMUTABLE_FILTER_ID]: true,
      ...activeTaskFilters
    };
    const normalizedFilters = {
      ...filters,
      [COMMUTABLE_FILTER_ID]: hasStoredCommutableChoice ? Boolean(filters[COMMUTABLE_FILTER_ID]) : true,
      region: filters[COMMUTABLE_FILTER_ID] ? FILTER_ALL_VALUE : filters.region
    };
    setSelectedFilters(normalizedFilters);
    setIsAiEnabled(true);
    setAppliedAiEnabled(true);
    setSortMode('score_desc');
    setHasAppliedConditions(true);
    setReloadKey((current) => current + 1);
    setMapViewportResetKey((current) => current + 1);
  }, [
    hasAppliedConditions,
    isAuthenticated,
    profilesState.profiles.length,
    profilesState.status,
    profilesState.detailStatus,
    selectedProfileId,
    selectedProfile,
    selectedProfileScoringSignature
  ]);

  useEffect(() => {
    if (!hasAppliedConditions) {
      return undefined;
    }

    if (!isAuthenticated) {
      setRecommendationState({
        status: 'disabled',
        error: '지역 접근성 지도 추천을 보려면 로그인이 필요합니다.',
        payload: null,
        totalJobCount: 0,
        jobs: []
      });
      return undefined;
    }

    if (
      appliedAiEnabled &&
      (
        profilesState.status === 'loading' ||
        profilesState.status === 'idle' ||
        profilesState.detailStatus === 'loading' ||
        (selectedProfileId && profilesState.detailStatus === 'idle')
      )
    ) {
      setRecommendationState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'calculating' : 'loading',
        error: '',
        totalJobCount: 0,
        jobs: []
      }));
      return undefined;
    }

    if (appliedAiEnabled && profilesState.status === 'error') {
      setRecommendationState({
        status: 'error',
        error: profilesState.error || '프로필 목록을 불러오지 못했습니다.',
        payload: null,
        totalJobCount: 0,
        jobs: []
      });
      return undefined;
    }

    if (appliedAiEnabled && (!profilesState.profiles.length || !selectedProfileId)) {
      setRecommendationState({
        status: 'noProfile',
        error: '',
        payload: null,
        totalJobCount: 0,
        jobs: []
      });
      return undefined;
    }

    let isCurrentRequest = true;
    const controller = new AbortController();
    const cacheKey = getMapPageCacheKey({
      profileId: selectedProfileId,
      aiEnabled: appliedAiEnabled,
      profileSignature: selectedProfileScoringSignature,
      offset: 0
    });
    const isScoringInputChanged = Boolean(activeRecommendationCacheKeyRef.current && activeRecommendationCacheKeyRef.current !== cacheKey);

    const loadRecommendations = async () => {
      const cachedState = appliedAiEnabled
        ? getCachedMapPagesState({
            profileId: selectedProfileId,
            aiEnabled: appliedAiEnabled,
            profileSignature: selectedProfileScoringSignature,
            selectedProfile
          })
        : null;
      if (cachedState) {
        if (isCurrentRequest) {
          activeRecommendationCacheKeyRef.current = cacheKey;
          setRecommendationState(cachedState);
          setProfileOffPageState({
            hasMore: false,
            isLoadingMore: false,
            nextOffset: cachedState.jobs.length,
            loadingLoaded: 0,
            loadingTarget: MAP_PAGE_SIZE
          });
        }
        return;
      }

      setProfileOffPageState({ hasMore: false, isLoadingMore: false, nextOffset: 0, loadingLoaded: 0, loadingTarget: MAP_PAGE_SIZE });
      setRecommendationState((prev) => ({
        ...prev,
        status: isScoringInputChanged ? 'calculating' : prev.jobs.length ? 'refetching' : 'loading',
        error: '',
        jobs: isScoringInputChanged ? [] : prev.jobs
      }));
      const activeTask = appliedAiEnabled ? getActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE) : null;
      const shouldPreserveLoadMoreActiveTask = (
        Number(activeTask?.offset || 0) > 0 &&
        String(activeTask?.profileId || '') === String(selectedProfileId || '') &&
        (!activeTask.profileSignature || activeTask.profileSignature === selectedProfileScoringSignature)
      );
      if (appliedAiEnabled) {
        if (!shouldPreserveLoadMoreActiveTask) {
          setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
            aiEnabled: appliedAiEnabled,
            profileId: selectedProfileId,
            profileSignature: selectedProfileScoringSignature,
            filters: selectedFilters,
            offset: 0
          });
        }
      } else {
        clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
      }

      try {
        let hasProgressResult = false;
        const completedResult = await requestMapRecommendationResult(
          callWithAuth,
          {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            limit: appliedAiEnabled ? undefined : MAP_PAGE_SIZE,
            offset: appliedAiEnabled ? undefined : 0
          },
          controller.signal,
          appliedAiEnabled
            ? async (progressPayload) => {
              const progressState = buildRecommendationStateFromPayload(progressPayload, appliedAiEnabled, selectedProfile);
              if (!progressState.jobs.length) {
                return;
              }
              await appendMapJobsIncrementally({
                nextState: progressState,
                replace: !hasProgressResult,
                offset: 0,
                hasMore: false,
                signal: controller.signal,
                keepLoading: true,
                loadingTarget: Math.max(1, progressState.totalJobCount || progressState.jobs.length)
              });
              hasProgressResult = true;
            }
            : undefined
        );
        const completedPayload = completedResult.payload;

        const nextState = buildRecommendationStateFromPayload(completedPayload, appliedAiEnabled, selectedProfile);

        if (!isCurrentRequest) {
          return;
        }

        if (appliedAiEnabled) {
          setCachedRecommendation(cacheKey, completedPayload);
          setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
            aiEnabled: appliedAiEnabled,
            profileId: selectedProfileId,
            profileSignature: selectedProfileScoringSignature,
            filters: selectedFilters,
            offset: 0
          });
        }
        activeRecommendationCacheKeyRef.current = cacheKey;
        if (completedResult.cached || !appliedAiEnabled) {
          applyMapStateImmediately({
            nextState,
            replace: true,
            offset: 0,
            hasMore: !appliedAiEnabled && hasMoreMapJobs(nextState)
          });
        } else {
          await appendMapJobsIncrementally({
            nextState,
            replace: false,
            offset: 0,
            hasMore: false,
            signal: controller.signal,
            showLoadingDuringAppend: true,
            loadingTarget: Math.max(1, nextState.totalJobCount || nextState.jobs.length)
          });
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        if (appliedAiEnabled) {
          clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
        }
        setRecommendationState({
          status: 'error',
          error: error.message || '지역 접근성 지도 추천을 불러오지 못했습니다.',
          payload: null,
          totalJobCount: 0,
          jobs: []
        });
      }
    };

    loadRecommendations();

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [
    appliedAiEnabled,
    appendMapJobsIncrementally,
    applyMapStateImmediately,
    callWithAuth,
    hasAppliedConditions,
    isAuthenticated,
    profilesState.detailStatus,
    profilesState.error,
    profilesState.profiles.length,
    profilesState.status,
    reloadKey,
    selectedProfileId,
    selectedProfile,
    selectedProfileScoringSignature,
    selectedFilters
  ]);

  const loadMoreRecommendations = useCallback(async () => {
    if (
      !hasAppliedConditions ||
      appliedAiEnabled ||
      !profileOffPageState.hasMore ||
      profileOffPageState.isLoadingMore ||
      recommendationState.status !== 'success'
    ) {
      return;
    }

    const offset = profileOffPageState.nextOffset;
    if (recommendationState.totalJobCount > 0 && offset >= recommendationState.totalJobCount) {
      setProfileOffPageState((prev) => ({ ...prev, hasMore: false, isLoadingMore: false, loadingLoaded: 0 }));
      return;
    }

    const loadingTarget = MAP_PAGE_SIZE;
    const requestKey = JSON.stringify({
      aiEnabled: appliedAiEnabled,
      profileId: appliedAiEnabled ? selectedProfileId : '',
      profileSignature: appliedAiEnabled ? selectedProfileScoringSignature : '',
      offset
    });
    if (mapLoadMoreInFlightKeyRef.current === requestKey) {
      return;
    }
    mapLoadMoreInFlightKeyRef.current = requestKey;

    const controller = new AbortController();
    setProfileOffPageState((prev) => ({ ...prev, isLoadingMore: true, loadingLoaded: 0, loadingTarget }));
    if (appliedAiEnabled) {
      setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
        aiEnabled: appliedAiEnabled,
        profileId: selectedProfileId,
        profileSignature: selectedProfileScoringSignature,
        filters: selectedFilters,
        offset
      });
    }

    try {
      const pageCacheKey = appliedAiEnabled
        ? getMapPageCacheKey({
            profileId: selectedProfileId,
            aiEnabled: appliedAiEnabled,
            profileSignature: selectedProfileScoringSignature,
            offset
          })
        : '';
      const cachedPayload = pageCacheKey ? getCachedRecommendation(pageCacheKey) : null;
      if (cachedPayload) {
        if (appliedAiEnabled) {
          setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
            aiEnabled: appliedAiEnabled,
            profileId: selectedProfileId,
            profileSignature: selectedProfileScoringSignature,
            filters: selectedFilters,
            offset: 0
          });
        }
        const cachedState = buildRecommendationStateFromPayload(cachedPayload, appliedAiEnabled, selectedProfile);
        applyMapStateImmediately({
          nextState: cachedState,
          replace: false,
          offset,
          hasMore: hasMoreMapJobs(cachedState, offset)
        });
        return;
      }

      let hasProgressResult = false;
      const completedResult = await requestMapRecommendationResult(
          callWithAuth,
          {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            limit: MAP_PAGE_SIZE,
            offset
          },
          controller.signal,
          appliedAiEnabled
            ? async (progressPayload) => {
              const progressState = buildRecommendationStateFromPayload(progressPayload, appliedAiEnabled, selectedProfile);
              if (!progressState.jobs.length) {
                return;
              }
              await appendMapJobsIncrementally({
                nextState: progressState,
                replace: false,
                offset,
                hasMore: false,
                signal: controller.signal,
                loadingMore: true,
                keepLoading: true,
                loadingTarget
              });
              hasProgressResult = true;
            }
            : undefined
        );
      const completedPayload = completedResult.payload;
      if (pageCacheKey) {
        setCachedRecommendation(pageCacheKey, completedPayload);
      }
      if (!mapPageMountedRef.current) {
        return;
      }
      if (appliedAiEnabled) {
        setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
          aiEnabled: appliedAiEnabled,
          profileId: selectedProfileId,
          profileSignature: selectedProfileScoringSignature,
          filters: selectedFilters,
          offset: 0
        });
      }
      const nextState = buildRecommendationStateFromPayload(completedPayload, appliedAiEnabled, selectedProfile);

      if (completedResult.cached || !appliedAiEnabled) {
        applyMapStateImmediately({
          nextState,
          replace: false,
          offset,
          hasMore: hasMoreMapJobs(nextState, offset)
        });
      } else {
        await appendMapJobsIncrementally({
          nextState,
          replace: false,
          offset,
          hasMore: hasMoreMapJobs(nextState, offset),
          signal: controller.signal,
          showLoadingDuringAppend: true,
          loadingTarget
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      if (!mapPageMountedRef.current) {
        return;
      }
      if (appliedAiEnabled) {
        clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
      }
      setProfileOffPageState((prev) => ({ ...prev, isLoadingMore: false, loadingLoaded: 0 }));
      setRecommendationState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'success' : 'error',
        error: error.message || '지역 접근성 지도 추천을 불러오지 못했습니다.'
      }));
    } finally {
      if (mapLoadMoreInFlightKeyRef.current === requestKey) {
        mapLoadMoreInFlightKeyRef.current = '';
      }
    }
  }, [
    appliedAiEnabled,
    appendMapJobsIncrementally,
    applyMapStateImmediately,
    callWithAuth,
    hasAppliedConditions,
    profileOffPageState.hasMore,
    profileOffPageState.isLoadingMore,
    profileOffPageState.nextOffset,
    recommendationState.status,
    recommendationState.totalJobCount,
    selectedProfile,
    selectedProfileId,
    selectedProfileScoringSignature,
    selectedFilters
  ]);

  useEffect(() => {
    if (
      !hasAppliedConditions ||
      appliedAiEnabled ||
      !profileOffPageState.hasMore ||
      profileOffPageState.isLoadingMore ||
      recommendationState.status !== 'success'
    ) {
      return;
    }

    loadMoreRecommendations();
  }, [
    appliedAiEnabled,
    hasAppliedConditions,
    loadMoreRecommendations,
    profileOffPageState.hasMore,
    profileOffPageState.isLoadingMore,
    recommendationState.status
  ]);

  useEffect(() => {
    if (
      !hasAppliedConditions ||
      !appliedAiEnabled ||
      recommendationState.status !== 'success' ||
      profileOffPageState.isLoadingMore
    ) {
      return;
    }

    const activeTask = getActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
    if (!activeTask?.aiEnabled) {
      return;
    }

    if (
      String(activeTask.profileId || '') !== String(selectedProfileId || '') ||
      (activeTask.profileSignature && activeTask.profileSignature !== selectedProfileScoringSignature)
    ) {
      clearActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE);
      return;
    }

    const activeOffset = Number(activeTask.offset || 0);
    if (activeOffset <= 0) {
      return;
    }

    if (profileOffPageState.nextOffset > activeOffset) {
      setActiveRecommendationTask(MAP_ACTIVE_TASK_SCOPE, {
        ...activeTask,
        offset: 0
      });
      return;
    }

    if (profileOffPageState.nextOffset === activeOffset && profileOffPageState.hasMore) {
      loadMoreRecommendations();
    }
  }, [
    appliedAiEnabled,
    hasAppliedConditions,
    loadMoreRecommendations,
    profileOffPageState.hasMore,
    profileOffPageState.isLoadingMore,
    profileOffPageState.nextOffset,
    recommendationState.status,
    selectedProfileId,
    selectedProfileScoringSignature
  ]);

  useEffect(() => {
    if (!filteredJobs.length) {
      setSelectedJobId('');
      return;
    }

    setSelectedJobId((current) =>
      filteredJobs.some((job) => job.id === current) ? current : filteredJobs[0].id
    );
  }, [filteredJobs]);

  const selectedJob = useMemo(
    () => filteredJobs.find((job) => job.id === selectedJobId) || filteredJobs[0] || null,
    [filteredJobs, selectedJobId]
  );
  const jobMarkers = useMemo(() => buildMapMarkers(filteredJobs, selectedJobId), [filteredJobs, selectedJobId]);
  const supportAgencyMarkers = useMemo(
    () => (showSupportAgencies ? buildSupportAgencyMarkers(supportAgencyState.agencies) : []),
    [showSupportAgencies, supportAgencyState.agencies]
  );
  const mapMarkers = useMemo(
    () => (hasAppliedConditions ? [...jobMarkers, ...supportAgencyMarkers] : []),
    [hasAppliedConditions, jobMarkers, supportAgencyMarkers]
  );
  const mapViewport = useMemo(() => buildMapViewport(filteredJobs, selectedJob), [filteredJobs, selectedJob]);

  useEffect(() => {
    if (!hasAppliedConditions) {
      setSupportAgencyState({
        status: 'idle',
        error: '',
        agencies: []
      });
      return undefined;
    }

    if (!showSupportAgencies) {
      setSupportAgencyState((prev) => ({
        ...prev,
        status: 'idle',
        error: ''
      }));
      return undefined;
    }

    if (!isAuthenticated) {
      setSupportAgencyState({
        status: 'disabled',
        error: '',
        agencies: []
      });
      return undefined;
    }

    const controller = new AbortController();

    const loadSupportAgencies = async () => {
      setSupportAgencyState((prev) => ({
        ...prev,
        status: prev.agencies.length ? 'refetching' : 'loading',
        error: ''
      }));

      try {
        const agencies = await callWithAuth((accessToken) => mapApi.getSupportAgencies(accessToken, controller.signal));
        setSupportAgencyState({
          status: agencies.length ? 'success' : 'empty',
          error: '',
          agencies
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setSupportAgencyState({
          status: 'error',
          error: error.message || '근로지원인 수행기관을 불러오지 못했습니다.',
          agencies: []
        });
      }
    };

    loadSupportAgencies();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, hasAppliedConditions, isAuthenticated, reloadKey, showSupportAgencies]);

  useEffect(() => {
    if (!appliedAiEnabled || !selectedJob || !selectedProfileId) {
      setExplanationState({
        status: 'idle',
        error: '',
        jobId: '',
        data: null
      });
      return undefined;
    }

    const controller = new AbortController();
    const cacheKey = getRecommendationExplanationCacheKey({
      profileId: selectedProfileId,
      externalId: selectedJob.externalId,
      jobId: selectedJob.id,
      score: getScoreNumber(selectedJob.score),
      profileSignature: selectedProfileScoringSignature
    });
    const cachedExplanation = getCachedRecommendation(cacheKey);

    if (cachedExplanation) {
      setExplanationState({
        status: 'success',
        error: '',
        jobId: selectedJob.id,
        data: cachedExplanation
      });
      return undefined;
    }

    const loadExplanation = async () => {
      const explainPayload = buildExplainPayload({
        job: selectedJob,
        profileId: selectedProfileId,
        profile: selectedProfile
      });
      if (!explainPayload) {
        setExplanationState({
          status: 'error',
          error: '추천 설명 요청에 필요한 프로필/공고 정보가 부족합니다.',
          jobId: selectedJob.id,
          data: null
        });
        return;
      }
      if (!explainPayload?.job?.job_post_id && !explainPayload?.job?.source_id) {
        setExplanationState({
          status: 'error',
          error: '추천 설명을 요청할 공고 내부 ID가 없어 설명을 불러올 수 없습니다.',
          jobId: selectedJob.id,
          data: null
        });
        return;
      }

      setExplanationState((prev) => ({
        ...prev,
        status: prev.jobId === selectedJob.id && prev.data ? 'refetching' : 'loading',
        error: '',
        jobId: selectedJob.id
      }));

      try {
        const data = await callWithAuth((accessToken) =>
          explainRecommendation(accessToken, explainPayload, {
            signal: controller.signal
          })
        );

        setCachedRecommendation(cacheKey, data);
        setExplanationState({
          status: 'success',
          error: '',
          jobId: selectedJob.id,
          data
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setExplanationState({
          status: 'error',
          error: error.message || '추천 설명을 불러오지 못했습니다.',
          jobId: selectedJob.id,
          data: null
        });
      }
    };

    loadExplanation();

    return () => {
      controller.abort();
    };
  }, [appliedAiEnabled, callWithAuth, selectedJob, selectedProfile, selectedProfileId, selectedProfileScoringSignature]);

  const reloadRecommendations = useCallback(() => {
    clearRecommendationCache();
    setReloadKey((current) => current + 1);
    setMapViewportResetKey((current) => current + 1);
  }, []);

  const markJobScrapped = useCallback((jobId, scrapped = true) => {
    clearRecommendationCache();
    setRecommendationState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              scrappedByMe: scrapped,
              scrapCount: Math.max(0, Number(job.scrapCount || 0) + (scrapped ? 1 : -1))
            }
          : job
      )
    }));
  }, []);

  const applyFilters = useCallback((filters) => {
    const commutableOnly = Boolean(isAiEnabled && filters?.[COMMUTABLE_FILTER_ID]);
    const nextFilters = {
      ...(filters || {}),
      [COMMUTABLE_FILTER_ID]: commutableOnly,
      region: commutableOnly ? FILTER_ALL_VALUE : filters?.region
    };
    setSelectedFilters(nextFilters);
    setAppliedAiEnabled(isAiEnabled);
    setSortMode(isAiEnabled ? 'score_desc' : 'latest_desc');
    setHasAppliedConditions(true);
    setMapViewportResetKey((current) => current + 1);
  }, [isAiEnabled]);

  const toggleAiScoring = useCallback(() => {
    setIsAiEnabled((current) => !current);
  }, []);

  const viewState =
    recommendationState.status === 'refetching'
      ? 'success'
      : recommendationState.status === 'disabled' || recommendationState.status === 'noProfile'
        ? 'empty'
        : recommendationState.status;
  const isRecommendationLoading =
    ['loading', 'calculating', 'refetching'].includes(recommendationState.status) ||
    profileOffPageState.isLoadingMore;
  const recommendationProgress = {
    isLoading: isRecommendationLoading,
    loaded: Math.min(
      Math.max(0, profileOffPageState.loadingLoaded || 0),
      Math.max(1, profileOffPageState.loadingTarget || MAP_PAGE_SIZE)
    ),
    target: Math.max(
      1,
      appliedAiEnabled
        ? profileOffPageState.loadingTarget || MAP_PAGE_SIZE
        : Math.min(profileOffPageState.loadingTarget || MAP_PAGE_SIZE, MAP_PAGE_SIZE)
    )
  };

  return {
    jobs: filteredJobs,
    totalJobCount: appliedAiEnabled
      ? allJobs.length
      : Math.max(allJobs.length, Number(recommendationState.totalJobCount) || 0),
    hasMoreJobs: profileOffPageState.hasMore,
    isLoadingMoreJobs: profileOffPageState.isLoadingMore,
    recommendationProgress,
    profiles,
    personas: MAP_PERSONAS,
    filterGroups,
    filterOptionStatus: filterOptions.status,
    filterOptionErrorMessage: filterOptions.error,
    mapLegend: MAP_LEGEND,
    mapRadiusMeters: MAP_RADIUS_METERS,
    mapRoutes: [],
    mapMarkers,
    mapViewportResetKey,
    hasAppliedConditions,
    supportAgencyStatus: supportAgencyState.status,
    supportAgencyErrorMessage: supportAgencyState.error,
    supportAgencyCount: supportAgencyMarkers.length,
    mapViewport,
    selectedJob,
    selectedJobId,
    selectedPersona,
    selectedProfileId,
    selectedProfile: selectedProfileSummary,
    selectedTab: VALID_TABS.includes(selectedTab) ? selectedTab : 'accessibility',
    isAiEnabled,
    appliedAiEnabled,
    isCommutableOnlyApplied: Boolean(appliedAiEnabled && selectedFilters[COMMUTABLE_FILTER_ID]),
    showSupportAgencies,
    sortMode,
    viewState,
    errorMessage: recommendationState.error,
    explanation: explanationState.jobId === selectedJob?.id ? explanationState.data : null,
    explanationViewState: explanationState.status === 'refetching' ? 'success' : explanationState.status,
    explanationErrorMessage: explanationState.error,
    setSelectedJobId,
    setSelectedProfileId: profilesState.selectProfile,
    setSelectedTab,
    setSortMode,
    setShowSupportAgencies,
    toggleAiScoring,
    applyFilters,
    loadMoreRecommendations,
    reloadRecommendations,
    markJobScrapped
  };
}
