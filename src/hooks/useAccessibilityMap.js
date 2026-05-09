import { useCallback, useEffect, useMemo, useState } from 'react';
import { mapApi } from '../api/mapApi';
import { explainRecommendation, fetchMapJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  clearRecommendationCache,
  getCachedRecommendation,
  getRecommendationCacheKey,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { accessibilityMapMockData } from '../config/accessibilityMapMockData';
import { useJobFilterOptions } from './useJobFilterOptions';
import { useProfiles } from './useProfiles';

const MAP_RECOMMEND_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
const FILTER_ALL_VALUE = '전체';
const VALID_TABS = ['accessibility', 'job', 'company'];
const REGION_ALIASES = {
  서울: ['서울', '서울특별시'],
  부산: ['부산', '부산광역시'],
  대구: ['대구', '대구광역시'],
  인천: ['인천', '인천광역시'],
  광주: ['광주', '광주광역시'],
  대전: ['대전', '대전광역시'],
  울산: ['울산', '울산광역시'],
  세종: ['세종', '세종특별자치시'],
  경기: ['경기', '경기도'],
  강원: ['강원', '강원도', '강원특별자치도'],
  충북: ['충북', '충청북도'],
  충남: ['충남', '충청남도'],
  전북: ['전북', '전라북도', '전북특별자치도'],
  전남: ['전남', '전라남도'],
  경북: ['경북', '경상북도'],
  경남: ['경남', '경상남도'],
  제주: ['제주', '제주특별자치도']
};

const formatDate = (value) => {
  if (!value) {
    return '확인 필요';
  }

  const raw = String(value).replace(/\D/g, '');
  if (raw.length !== 8) {
    return String(value);
  }

  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
};

const getDday = (value) => {
  const raw = String(value || '').replace(/\D/g, '');
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

  return diffDays < 0 ? '마감' : `D-${diffDays}`;
};

const normalizeSalary = (salaryType, salary) => {
  if (!salary && !salaryType) {
    return '확인 필요';
  }

  if (!salaryType || String(salary || '').includes(String(salaryType))) {
    return salary || salaryType;
  }

  return `${salaryType} ${salary || ''}`.trim();
};

const getScoreGrade = (score) => {
  if (typeof score !== 'number') {
    return '확인 필요';
  }
  if (score >= 80) {
    return 'A등급';
  }
  if (score >= 60) {
    return 'B등급';
  }
  return 'C등급';
};

const getAccessibilityTone = (score) => {
  if (typeof score !== 'number') {
    return {
      headline: '확인 필요',
      description: '접근성 판단에 필요한 데이터가 부족합니다. 지원 전 이동 경로와 사업장 환경을 확인해주세요.'
    };
  }

  if (score >= 80) {
    return {
      headline: '접근성 양호',
      description: '현재 데이터 기준 접근성 점수가 높은 편입니다. 실제 이동 경로는 지원 전 다시 확인해주세요.'
    };
  }

  if (score >= 60) {
    return {
      headline: '주의 필요',
      description: '일부 접근성 요소는 확인이 필요합니다. 출퇴근 경로와 사업장 편의시설을 함께 점검해주세요.'
    };
  }

  return {
    headline: '추가 확인 필요',
    description: '접근성 점수가 낮거나 데이터가 부족합니다. 접근 불가로 단정하지 말고 세부 경로를 확인해주세요.'
  };
};

const findAiMapResult = (aiResults, job) => {
  const externalId = job?.externalId;

  return aiResults.find((result) => {
    const aiJob = result?.job || {};
    return (
      aiJob.external_id === externalId ||
      aiJob.externalId === externalId ||
      aiJob.job_title === job?.jobNm ||
      aiJob.jobTitle === job?.jobNm
    );
  }) || null;
};

const toNumberOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const buildJobInfo = (job, deadlineDate, salaryText) => [
  ['모집직종', job?.jobNm || '확인 필요'],
  ['고용형태', job?.empType || '확인 필요'],
  ['임금', salaryText],
  ['임금형태', job?.salaryType || '확인 필요'],
  ['요구경력', job?.reqCareer || job?.enterType || '확인 필요'],
  ['요구학력', job?.reqEduc || '확인 필요'],
  ['모집기간', `${formatDate(job?.offerregDt || job?.regDt)} ~ ${deadlineDate}`],
  ['요구전공', job?.reqMajor || '확인 필요'],
  ['요구자격', job?.reqLicens || '확인 필요']
];

const getDateRangeText = (job) => `${formatDate(job?.offerregDt || job?.regDt)} ~ ${formatDate(job?.termDate)}`;

const getRegionLabel = (address) => {
  const firstToken = String(address || '').trim().split(/\s+/)[0];
  return firstToken || '지역 확인 필요';
};

const normalizeSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[()[\]{}·ㆍ,./_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getComparableTerms = (value) => {
  const normalized = normalizeSearchText(value);
  if (!normalized) {
    return [];
  }

  return [
    normalized,
    ...normalized
      .split(' ')
      .map((term) => term.trim())
      .filter((term) => term.length >= 2)
  ];
};

const includesAnyTerm = (target, terms) => {
  const normalizedTarget = normalizeSearchText(target);
  return terms.some((term) => normalizedTarget.includes(term) || term.includes(normalizedTarget));
};

const getInitial = (value) => {
  const normalized = String(value || '확인').trim();
  return normalized.slice(0, 1) || '확';
};

const getScoreNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const normalizeMapJob = (job, aiResults, aiEnabled) => {
  const aiResult = aiEnabled ? findAiMapResult(aiResults, job) : null;
  const scoreDetail = aiResult?.score_detail || aiResult?.scoreDetail || {};
  const totalScore = toNumberOrNull(aiResult?.total_score) ?? toNumberOrNull(aiResult?.totalScore);
  const accessibilityScore =
    toNumberOrNull(scoreDetail?.accessibility_score) ?? toNumberOrNull(scoreDetail?.accessibilityScore) ?? totalScore;
  const displayScore = accessibilityScore ?? totalScore;
  const grade = getScoreGrade(displayScore);
  const tone = getAccessibilityTone(displayScore);
  const title = job?.jobNm || '공고명 확인 필요';
  const company = job?.busplaName || '기업명 확인 필요';
  const address = job?.compAddr || '근무지 확인 필요';
  const region = getRegionLabel(address);
  const salaryText = normalizeSalary(job?.salaryType, job?.salary);
  const deadlineDate = formatDate(job?.termDate);
  const dueLabel = getDday(job?.termDate);
  const dueDateText = dueLabel ? `${deadlineDate} 마감` : '';
  const id = job?.externalId || `${company}-${title}-${job?.termDate || ''}`;

  return {
    id,
    externalId: job?.externalId || '',
    source: job,
    company,
    title,
    badges: ['공공', grade, '접근성 지도'].filter(Boolean),
    dueLabel,
    dueDateText,
    dateRangeText: getDateRangeText(job),
    commuteMinutes: '확인 필요',
    payText: salaryText,
    salaryType: job?.salaryType || '확인 필요',
    employmentType: job?.empType || '확인 필요',
    region,
    score: displayScore ?? '확인 필요',
    scoreDetail,
    totalScore,
    jobInfo: buildJobInfo(job, deadlineDate, salaryText),
    companyInfo: {
      name: company,
      type: '확인 필요',
      address,
      initial: getInitial(company),
      workplaceType: '확인 필요',
      hiringRate: '확인 필요',
      legalRate: '확인 필요',
      hiringSummary: '장애인 고용 현황은 추가 확인이 필요합니다.'
    },
    accessibilityByPersona: Object.fromEntries(
      Object.keys(accessibilityMapMockData.personas).map((personaKey) => [
        personaKey,
        {
          panelBadge: `${grade} · ${accessibilityMapMockData.personas[personaKey].label} 기준`,
          headline: tone.headline,
          description: tone.description,
          commuteStats: ['총 시간 확인 필요', '환승 확인 필요', '도보 확인 필요'],
          detailItems: [
            ['접근성 점수', displayScore === null || displayScore === undefined ? '점수 데이터가 없어 확인이 필요합니다.' : `접근성 점수는 ${displayScore}점입니다.`, displayScore >= 80 ? '접근 양호' : displayScore >= 60 ? '주의 필요' : '데이터 미확인'],
            ['근무지 좌표', job?.geoLatitude && job?.geoLongitude ? '지도에서 근무지 위치를 확인할 수 있습니다.' : '근무지 좌표 데이터가 없어 위치 확인이 필요합니다.', job?.geoLatitude && job?.geoLongitude ? '접근 양호' : '데이터 미확인'],
            ['편의시설 정보', '엘리베이터, 저상버스, 보행 경로 등 세부 시설 정보는 기업 또는 지도 데이터로 추가 확인이 필요합니다.', '데이터 미확인']
          ],
          source: '데이터 출처 · BridgeWork Spring Backend 추천 지도 API'
        }
      ])
    ),
    mapPoint: job?.geoLatitude && job?.geoLongitude
      ? {
          lat: Number(job.geoLatitude),
          lng: Number(job.geoLongitude)
        }
      : null
  };
};

const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const getPersonaFromProfile = (profile) => {
  const text = `${profile?.disabilityType || ''} ${profile?.disabilitySeverity || ''}`;
  if (/시각|저시력|전맹|vision/i.test(text)) {
    return 'vision';
  }
  if (/청각|난청|농|hearing/i.test(text)) {
    return 'hearing';
  }
  return 'wheelchair';
};

const normalizeProfiles = (profiles, selectedProfile) =>
  profiles.map((profile) => {
    const id = getProfileId(profile);
    const detail = id === getProfileId(selectedProfile) ? selectedProfile : profile;

    return {
      ...profile,
      id,
      name: profile?.fullName || profile?.name || `프로필 ${id}`,
      description: [detail?.disabilityType, detail?.disabilitySeverity].filter(Boolean).join(' · ') || '설정된 정보 확인 필요',
      personaKey: getPersonaFromProfile(detail)
    };
  });

const buildMapViewport = (jobs) => {
  const firstPoint = jobs.find((job) => job.mapPoint)?.mapPoint;
  if (!firstPoint) {
    return accessibilityMapMockData.mapViewport;
  }

  return {
    center: firstPoint,
    zoom: 16
  };
};

const buildMapMarkers = (jobs) =>
  jobs
    .filter((job) => job.mapPoint)
    .map((job) => ({
      id: job.id,
      label: job.company.slice(0, 6),
      lat: job.mapPoint.lat,
      lng: job.mapPoint.lng,
      type: 'office'
    }));

const normalizeSupportAgency = (agency) => ({
  id: agency?.externalId || agency?.institutionCode || `${agency?.institutionName || 'support'}-${agency?.latitude}-${agency?.longitude}`,
  label: agency?.institutionName || '근로지원기관',
  address: agency?.address || '주소 확인 필요',
  telephone: agency?.telephone || '연락처 확인 필요',
  lat: Number(agency?.latitude),
  lng: Number(agency?.longitude),
  type: 'support-agency'
});

const buildSupportAgencyMarkers = (agencies) =>
  agencies
    .map(normalizeSupportAgency)
    .filter((agency) => Number.isFinite(agency.lat) && Number.isFinite(agency.lng));

const createFilterGroup = (id, title, options, selectedValue) => ({
  id,
  title,
  type: 'chips',
  chips: [FILTER_ALL_VALUE, ...options.map((option) => option.label).filter(Boolean)],
  selectedValue: selectedValue || FILTER_ALL_VALUE
});

const uniqueOptions = (options) => {
  const seen = new Set();

  return options.filter((option) => {
    if (!option?.label || seen.has(option.label)) {
      return false;
    }

    seen.add(option.label);
    return true;
  });
};

const buildFilterGroups = (selectedFilters, optionState) => [
  {
    id: 'jobCategory',
    title: '희망 직무',
    type: 'jobCategoryCascade',
    jobCategories: optionState.jobCategories,
    selectedValue: selectedFilters.jobCategory || FILTER_ALL_VALUE
  },
  {
    id: 'region',
    title: '근무지역',
    type: 'select',
    options: [FILTER_ALL_VALUE, ...uniqueOptions(optionState.regions).map((option) => option.label).filter(Boolean)],
    selectedValue: selectedFilters.region || FILTER_ALL_VALUE
  },
  createFilterGroup('employmentType', '고용형태', uniqueOptions(optionState.employmentTypes), selectedFilters.employmentType),
  createFilterGroup('salaryType', '급여 방식', uniqueOptions(optionState.salaryTypes), selectedFilters.salaryType)
];

const getJobCategoryTerms = (jobCategories, selectedValue) => {
  if (!selectedValue || selectedValue === FILTER_ALL_VALUE) {
    return [];
  }

  for (const category of jobCategories) {
    if (category.label === selectedValue) {
      return [
        category.label,
        ...category.groups.flatMap((group) => [group.label, ...group.jobs])
      ];
    }

    for (const group of category.groups) {
      if (group.label === selectedValue) {
        return [group.label, ...group.jobs];
      }

      if (group.jobs.includes(selectedValue)) {
        return [selectedValue];
      }
    }
  }

  return [selectedValue];
};

const getRegionTerms = (selectedRegion) => {
  if (!selectedRegion || selectedRegion === FILTER_ALL_VALUE) {
    return [];
  }

  const terms = new Set([selectedRegion]);
  Object.values(REGION_ALIASES).forEach((aliases) => {
    if (aliases.includes(selectedRegion)) {
      aliases.forEach((alias) => terms.add(alias));
    }
  });

  return Array.from(terms);
};

export const filterAccessibilityMapJobs = (jobs, selectedFilters, jobCategories = []) =>
  jobs.filter((job) => {
    const source = job.source || {};
    const jobCategoryTerms = getJobCategoryTerms(jobCategories, selectedFilters.jobCategory);
    const normalizedJobCategoryTerms = jobCategoryTerms.flatMap(getComparableTerms);
    const jobText = [
      job.title,
      source.jobNm,
      source.reqMajor,
      source.reqLicens,
      source.enterType
    ].filter(Boolean).join(' ');
    const regionTerms = getRegionTerms(selectedFilters.region).flatMap(getComparableTerms);
    const regionText = [
      job.region,
      job.companyInfo?.address,
      source.compAddr
    ].filter(Boolean).join(' ');
    const employmentTerms = getComparableTerms(selectedFilters.employmentType);
    const salaryTerms = getComparableTerms(selectedFilters.salaryType);

    return (
      (!normalizedJobCategoryTerms.length || includesAnyTerm(jobText, normalizedJobCategoryTerms)) &&
      (!employmentTerms.length || selectedFilters.employmentType === FILTER_ALL_VALUE || includesAnyTerm(job.employmentType || source.empType, employmentTerms)) &&
      (!regionTerms.length || includesAnyTerm(regionText, regionTerms)) &&
      (!salaryTerms.length || selectedFilters.salaryType === FILTER_ALL_VALUE || includesAnyTerm(job.salaryType || source.salaryType, salaryTerms))
    );
  });

const sortJobsByAccessibility = (jobs) =>
  [...jobs].sort((left, right) => (getScoreNumber(right.score) ?? -1) - (getScoreNumber(left.score) ?? -1));

const buildExplainPayload = ({ job, profileId }) => {
  const source = job?.source || {};
  const scoreDetail = job?.scoreDetail || {};
  const jobFitScore =
    toNumberOrNull(scoreDetail?.job_fit_score) ?? toNumberOrNull(scoreDetail?.jobFitScore) ?? toNumberOrNull(job?.totalScore) ?? 0;

  return {
    profileId: Number(profileId),
    job: {
      jobPostId: source.jobPostId || source.id || null,
      companyName: job.company,
      jobTitle: job.title,
      workAddress: source.compAddr || job.companyInfo.address,
      workLat: source.geoLatitude ?? null,
      workLng: source.geoLongitude ?? null,
      employmentType: source.empType || job.employmentType,
      enterType: source.enterType || '확인 필요',
      salaryType: source.salaryType || '확인 필요',
      salary: source.salary || '확인 필요',
      termDate: source.termDate || '',
      requiredCareer: source.reqCareer || '확인 필요',
      requiredEducation: source.reqEduc || '확인 필요',
      requiredMajor: source.reqMajor || '확인 필요',
      requiredLicenses: source.reqLicens || '확인 필요',
      registeredAt: source.regDt || source.offerregDt || '',
      sourceTable: source.sourceTable || 'pd_kepad_recruitment',
      sourceId: source.sourceId || source.id || null,
      externalId: source.externalId || job.externalId
    },
    jobFitScore,
    reasons: [`추천 지도 기준 총점은 ${job.totalScore ?? job.score}점입니다.`],
    riskFactors: ['출퇴근 경로와 사업장 접근성 세부 정보는 지원 전 확인이 필요합니다.'],
    evidenceItems: []
  };
};

const buildRecommendationStateFromPayload = (payload, aiEnabled = Boolean(payload?.aiEnabled)) => {
  const aiResults = payload?.aiResponse?.result?.results || payload?.aiResponse?.results || [];
  const jobs = Array.isArray(payload?.jobs)
    ? payload.jobs.map((job) => normalizeMapJob(job, aiResults, aiEnabled))
    : [];

  return {
    status: jobs.length ? 'success' : 'empty',
    error: '',
    payload,
    jobs
  };
};

export function useAccessibilityMap() {
  const { callWithAuth, isAuthenticated } = useAuth();
  const profilesState = useProfiles();
  const filterOptions = useJobFilterOptions();
  const [selectedTab, setSelectedTab] = useState('accessibility');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [appliedAiEnabled, setAppliedAiEnabled] = useState(true);
  const [hasAppliedConditions, setHasAppliedConditions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const [recommendationState, setRecommendationState] = useState({
    status: 'idle',
    error: '',
    payload: null,
    jobs: []
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

  const selectedProfileId = profilesState.selectedProfileId;
  const selectedProfile = profilesState.selectedProfile;
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
  const filteredJobs = useMemo(
    () => sortJobsByAccessibility(filterAccessibilityMapJobs(allJobs, selectedFilters, filterOptions.jobCategories)),
    [allJobs, filterOptions.jobCategories, selectedFilters]
  );
  const filterGroups = useMemo(
    () => buildFilterGroups(selectedFilters, filterOptions),
    [filterOptions, selectedFilters]
  );

  useEffect(() => {
    if (!hasAppliedConditions) {
      return undefined;
    }

    if (!isAuthenticated) {
      setRecommendationState({
        status: 'disabled',
        error: '지역 접근성 지도 추천을 보려면 로그인이 필요합니다.',
        payload: null,
        jobs: []
      });
      return undefined;
    }

    if (
      appliedAiEnabled &&
      (profilesState.status === 'loading' || profilesState.status === 'idle' || profilesState.detailStatus === 'loading')
    ) {
      setRecommendationState((prev) => ({ ...prev, status: 'loading', error: '' }));
      return undefined;
    }

    if (appliedAiEnabled && profilesState.status === 'error') {
      setRecommendationState({
        status: 'error',
        error: profilesState.error || '프로필 목록을 불러오지 못했습니다.',
        payload: null,
        jobs: []
      });
      return undefined;
    }

    if (appliedAiEnabled && (!profilesState.profiles.length || !selectedProfileId)) {
      setRecommendationState({
        status: 'noProfile',
        error: '',
        payload: null,
        jobs: []
      });
      return undefined;
    }

    let isCurrentRequest = true;
    const controller = new AbortController();
    const cacheKey = getRecommendationCacheKey({
      profileId: selectedProfileId,
      aiEnabled: appliedAiEnabled,
      scope: 'map'
    });

    const loadRecommendations = async () => {
      const cachedPayload = getCachedRecommendation(cacheKey);
      if (cachedPayload) {
        if (isCurrentRequest) {
          setRecommendationState(buildRecommendationStateFromPayload(cachedPayload, appliedAiEnabled));
        }
        return;
      }

      setRecommendationState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'refetching' : 'loading',
        error: ''
      }));

      try {
        const payload = await callWithAuth((accessToken) =>
          fetchMapJobRecommendations(accessToken, {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            signal: controller.signal,
            timeoutMs: MAP_RECOMMEND_REQUEST_TIMEOUT_MS
          })
        );
        const nextState = buildRecommendationStateFromPayload(payload, appliedAiEnabled);

        if (!isCurrentRequest) {
          return;
        }

        setCachedRecommendation(cacheKey, payload);
        setRecommendationState(nextState);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        if (!isCurrentRequest) {
          return;
        }

        setRecommendationState({
          status: 'error',
          error: error.message || '지역 접근성 지도 추천을 불러오지 못했습니다.',
          payload: null,
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
    callWithAuth,
    hasAppliedConditions,
    isAuthenticated,
    profilesState.detailStatus,
    profilesState.error,
    profilesState.profiles.length,
    profilesState.status,
    reloadKey,
    selectedProfileId
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
  const jobMarkers = useMemo(() => buildMapMarkers(filteredJobs), [filteredJobs]);
  const supportAgencyMarkers = useMemo(
    () => buildSupportAgencyMarkers(supportAgencyState.agencies),
    [supportAgencyState.agencies]
  );
  const mapMarkers = useMemo(
    () => (hasAppliedConditions ? [...jobMarkers, ...supportAgencyMarkers] : []),
    [hasAppliedConditions, jobMarkers, supportAgencyMarkers]
  );
  const mapViewport = useMemo(() => buildMapViewport(filteredJobs), [filteredJobs]);

  useEffect(() => {
    if (!hasAppliedConditions) {
      setSupportAgencyState({
        status: 'idle',
        error: '',
        agencies: []
      });
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
  }, [callWithAuth, hasAppliedConditions, isAuthenticated, reloadKey]);

  useEffect(() => {
    if (!appliedAiEnabled || !selectedJob || !selectedProfileId || recommendationState.status !== 'success') {
      setExplanationState({
        status: 'idle',
        error: '',
        jobId: '',
        data: null
      });
      return undefined;
    }

    const controller = new AbortController();

    const loadExplanation = async () => {
      setExplanationState((prev) => ({
        ...prev,
        status: prev.jobId === selectedJob.id && prev.data ? 'refetching' : 'loading',
        error: '',
        jobId: selectedJob.id
      }));

      try {
        const data = await callWithAuth((accessToken) =>
          explainRecommendation(accessToken, buildExplainPayload({ job: selectedJob, profileId: selectedProfileId }), {
            signal: controller.signal
          })
        );

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
  }, [appliedAiEnabled, callWithAuth, recommendationState.status, selectedJob, selectedProfileId]);

  const reloadRecommendations = useCallback(() => {
    clearRecommendationCache();
    setReloadKey((current) => current + 1);
  }, []);

  const applyFilters = useCallback((filters) => {
    setSelectedFilters(filters || {});
    setAppliedAiEnabled(isAiEnabled);
    setHasAppliedConditions(true);
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

  return {
    jobs: filteredJobs,
    totalJobCount: allJobs.length,
    profiles,
    personas: accessibilityMapMockData.personas,
    filterGroups,
    filterOptionStatus: filterOptions.status,
    filterOptionErrorMessage: filterOptions.error,
    mapLegend: accessibilityMapMockData.mapLegend,
    mapRadiusMeters: accessibilityMapMockData.mapRadiusMeters,
    mapRoutes: [],
    mapMarkers,
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
    viewState,
    errorMessage: recommendationState.error,
    explanation: explanationState.data,
    explanationViewState: explanationState.status === 'refetching' ? 'success' : explanationState.status,
    explanationErrorMessage: explanationState.error,
    setSelectedJobId,
    setSelectedProfileId: profilesState.selectProfile,
    setSelectedTab,
    toggleAiScoring,
    applyFilters,
    reloadRecommendations
  };
}
