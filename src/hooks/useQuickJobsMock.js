import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchQuickJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import { useProfiles } from './useProfiles';

const DEFAULT_FILTERS = ['최신 공고', '기능2 API', 'Spring Backend'];
const DEFAULT_SORT = 'latest';
const QUICK_RECOMMEND_CACHE_TTL_MS = 5 * 60 * 1000;

const SORT_LABELS = {
  latest: '최신순',
  deadline: '마감임박순',
  match: '직무 적합도 높은순',
  salary: '임금 높은순'
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

const parseDateValue = (value) => {
  const raw = String(value || '').replace(/\D/g, '');
  return raw.length === 8 ? Number(raw) : 0;
};

const parseSalaryValue = (salaryType, salary) => {
  const text = `${salaryType || ''} ${salary || ''}`;
  const normalizedNumber = Number(String(salary || '').replace(/[^\d]/g, ''));

  if (!normalizedNumber) {
    return 0;
  }

  if (text.includes('시급')) {
    return normalizedNumber * 209;
  }

  if (text.includes('연봉')) {
    return Math.round(normalizedNumber / 12);
  }

  return normalizedNumber;
};

const sortJobsBy = (jobs, sortKey) => {
  const sortedJobs = [...jobs];

  sortedJobs.sort((left, right) => {
    if (sortKey === 'deadline') {
      const leftDeadline = parseDateValue(left.source.termDate) || Number.MAX_SAFE_INTEGER;
      const rightDeadline = parseDateValue(right.source.termDate) || Number.MAX_SAFE_INTEGER;
      return leftDeadline - rightDeadline;
    }

    if (sortKey === 'match') {
      return (right.match.score ?? -1) - (left.match.score ?? -1);
    }

    if (sortKey === 'salary') {
      return right.salaryValue - left.salaryValue;
    }

    return parseDateValue(right.source.regDt || right.source.offerregDt) - parseDateValue(left.source.regDt || left.source.offerregDt);
  });

  return sortedJobs;
};

const getDday = (value) => {
  const raw = String(value || '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '마감 확인';
  }

  const deadline = new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);

  if (Number.isNaN(diffDays)) {
    return '마감 확인';
  }

  if (diffDays < 0) {
    return '마감';
  }

  return `D-${diffDays}`;
};

const getGrade = (score) => {
  if (typeof score !== 'number') {
    return '확인 필요';
  }
  if (score >= 80) {
    return '높음';
  }
  if (score >= 60) {
    return '보통';
  }
  return '확인 필요';
};

const findAiScore = (aiResults, job) => {
  const externalId = job?.externalId;
  const matched = aiResults.find((result) => {
    const aiJob = result?.job || {};
    return (
      aiJob.external_id === externalId ||
      aiJob.externalId === externalId ||
      aiJob.job_title === job?.jobNm ||
      aiJob.jobTitle === job?.jobNm
    );
  });

  return typeof matched?.job_fit_score === 'number'
    ? matched.job_fit_score
    : typeof matched?.jobFitScore === 'number'
      ? matched.jobFitScore
      : null;
};

const normalizeSalary = (salaryType, salary) => {
  if (!salary && !salaryType) {
    return '확인 필요';
  }

  if (!salaryType || String(salary).includes(String(salaryType))) {
    return salary || salaryType;
  }

  return `${salaryType} ${salary || ''}`.trim();
};

const normalizeJob = (job, aiResults, aiEnabled) => {
  const score = aiEnabled ? findAiScore(aiResults, job) : null;
  const grade = getGrade(score);
  const deadlineDate = formatDate(job?.termDate);
  const dueLabel = getDday(job?.termDate);
  const title = job?.jobNm || '공고명 확인 필요';
  const company = job?.busplaName || '기업명 확인 필요';
  const location = job?.compAddr || '근무지역 확인 필요';
  const salary = normalizeSalary(job?.salaryType, job?.salary);
  const salaryValue = parseSalaryValue(job?.salaryType, job?.salary);
  const experience = job?.reqCareer || job?.enterType || '확인 필요';
  const education = job?.reqEduc || '확인 필요';
  const major = job?.reqMajor || '확인 필요';
  const certificates = job?.reqLicens || '확인 필요';
  const hasScore = typeof score === 'number';

  return {
    id: job?.externalId || `${company}-${title}-${job?.termDate || ''}`,
    externalId: job?.externalId || '확인 필요',
    source: {
      ...job,
      busplaName: company,
      jobNm: title,
      compAddr: location,
      empType: job?.empType || '확인 필요',
      enterType: job?.enterType || '확인 필요',
      salaryType: job?.salaryType || '급여',
      salary: job?.salary || '확인 필요',
      termDate: job?.termDate || '확인 필요',
      offerregDt: job?.offerregDt || '확인 필요',
      regDt: job?.regDt || '확인 필요',
      reqCareer: experience,
      reqEduc: education,
      reqMajor: major,
      reqLicens: certificates
    },
    company,
    title,
    occupation: title,
    location,
    employmentType: job?.empType || '확인 필요',
    salary,
    salaryValue,
    experience,
    education,
    major,
    certificates,
    deadlineDate,
    dueLabel,
    isDeadlineSoon: dueLabel.startsWith('D-') && Number(dueLabel.replace('D-', '')) <= 7,
    isStandardWorkplace: false,
    prefersDisabled: false,
    agency: '확인 필요',
    contact: '확인 필요',
    match: {
      score,
      grade,
      reasons: hasScore
        ? [`${title} 공고와 선택 프로필의 직무 적합도는 ${score}점입니다.`, '세부 추천 설명은 공고 정보와 프로필 정보를 함께 확인해주세요.']
        : ['AI 적합도 정보가 없거나 계산 대기 중입니다.', '공고 조건은 계속 확인할 수 있습니다.'],
      roleFit: hasScore ? '확인됨' : '확인 필요',
      skills: [
        ['직무명', title ? '확인됨' : '확인 필요'],
        ['요구경력', experience === '확인 필요' ? '확인 필요' : '확인됨'],
        ['요구학력', education === '확인 필요' ? '확인 필요' : '확인됨']
      ],
      education: education === '확인 필요' ? '확인 필요' : '확인됨',
      experience: experience === '확인 필요' ? '확인 필요' : '확인됨',
      positive: hasScore ? [`직무 적합도 ${score}점으로 ${grade} 등급입니다.`] : ['최신 공고 정보는 확인 가능합니다.'],
      caution: ['채용 여부는 기업의 실제 판단과 다를 수 있습니다.'],
      missing: [major === '확인 필요' ? '요구전공' : null, certificates === '확인 필요' ? '요구자격증' : null].filter(Boolean)
    },
    companyInfo: {
      name: company,
      address: location,
      standardWorkplace: '확인 필요',
      certification: '확인 필요',
      agency: '확인 필요'
    }
  };
};

const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const getProfileLabel = (profile) => profile?.fullName || profile?.name || `프로필 ${getProfileId(profile)}`;

const getProfileRole = (profile) => profile?.targetJob || profile?.desiredJob || '희망 직무 확인 필요';

const getMissingProfileFields = (profile) => {
  if (!profile) {
    return [];
  }

  return [
    [profile.targetJob || profile.desiredJob, '희망 직무'],
    [Array.isArray(profile.skills) && profile.skills.length > 0, '보유 기술/역량'],
    [profile.disabilityType, '장애 유형'],
    [Array.isArray(profile.workTypes) && profile.workTypes.length > 0, '희망 고용형태']
  ]
    .filter(([value]) => !value)
    .map(([, label]) => label);
};

const getProfileCompletionRate = (profile) => {
  if (!profile) {
    return 0;
  }

  const checks = [
    profile.fullName || profile.name,
    profile.targetJob || profile.desiredJob,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    profile.disabilityType,
    profile.highestEducation || profile.educationSummary,
    profile.majorCareer || profile.careerSummary,
    Array.isArray(profile.workTypes) && profile.workTypes.length > 0,
    profile.selfIntroduction
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const normalizeProfiles = (profiles, selectedProfile) =>
  profiles.map((profile) => {
    const profileId = getProfileId(profile);
    const detail = profileId === getProfileId(selectedProfile) ? selectedProfile : profile;

    return {
      ...profile,
      id: profileId,
      name: getProfileLabel(profile),
      role: getProfileRole(detail),
      disabilitySummary: [detail?.disabilityType, detail?.disabilitySeverity].filter(Boolean).join(' · ') || '확인 필요',
      completionRate: getProfileCompletionRate(detail),
      missingRequiredFields: getMissingProfileFields(detail)
    };
  });

const getCacheKey = ({ aiEnabled, profileId }) =>
  `quick:${aiEnabled ? 'ai-on' : 'ai-off'}:${aiEnabled ? profileId || 'default' : 'latest'}`;

const buildRecommendationStateFromPayload = (payload) => {
  const aiResults = payload?.aiResponse?.result?.results || payload?.aiResponse?.results || [];
  const jobs = Array.isArray(payload?.jobs)
    ? payload.jobs.map((job) => normalizeJob(job, aiResults, Boolean(payload?.aiEnabled)))
    : [];

  return {
    status: jobs.length ? 'success' : 'empty',
    error: '',
    payload,
    jobs,
    updatedAtText: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date())
  };
};

export function useQuickJobsMock() {
  const { callWithAuth, isAuthenticated } = useAuth();
  const profilesState = useProfiles();
  const recommendationCacheRef = useRef(new Map());
  const [selectedTab, setSelectedTab] = useState('job');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [sortKey, setSortKey] = useState(DEFAULT_SORT);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [recommendationState, setRecommendationState] = useState({
    status: 'idle',
    error: '',
    payload: null,
    jobs: [],
    updatedAtText: '확인 전'
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [checklist, setChecklist] = useState({
    profile: true,
    role: true,
    skills: true,
    career: true,
    introduction: false,
    requirements: false
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

  useEffect(() => {
    if (!isAuthenticated) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'disabled',
        error: '퀵 맞춤 일자리 추천을 보려면 로그인이 필요합니다.',
        jobs: []
      }));
      return undefined;
    }

    if (profilesState.status === 'loading' || profilesState.status === 'idle' || profilesState.detailStatus === 'loading') {
      setRecommendationState((prev) => ({ ...prev, status: 'loading', error: '' }));
      return undefined;
    }

    if (profilesState.status === 'error') {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'error',
        error: profilesState.error || '프로필 목록을 불러오지 못했습니다.',
        jobs: []
      }));
      return undefined;
    }

    if (!profilesState.profiles.length) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'noProfile',
        error: '',
        jobs: []
      }));
      return undefined;
    }

    if (isAiEnabled && !selectedProfileId) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'noProfile',
        error: '',
        jobs: []
      }));
      return undefined;
    }

    const controller = new AbortController();
    const requestParams = {
      aiEnabled: isAiEnabled,
      profileId: isAiEnabled ? selectedProfileId : undefined
    };
    const cacheKey = getCacheKey(requestParams);

    const loadRecommendations = async () => {
      const cachedResult = recommendationCacheRef.current.get(cacheKey);

      if (cachedResult && Date.now() - cachedResult.cachedAt < QUICK_RECOMMEND_CACHE_TTL_MS) {
        setRecommendationState({
          ...cachedResult.state,
          status: cachedResult.state.jobs.length ? 'success' : 'empty'
        });
        return;
      }

      setRecommendationState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'refetching' : 'loading',
        error: ''
      }));

      try {
        const payload = await callWithAuth((accessToken) =>
          fetchQuickJobRecommendations(accessToken, {
            ...requestParams,
            signal: controller.signal
          })
        );
        const nextState = buildRecommendationStateFromPayload(payload);

        recommendationCacheRef.current.set(cacheKey, {
          cachedAt: Date.now(),
          state: nextState
        });
        setRecommendationState(nextState);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setRecommendationState((prev) => ({
          ...prev,
          status: 'error',
          error: error.message || '퀵 맞춤 일자리 추천을 불러오지 못했습니다.',
          jobs: []
        }));
      }
    };

    loadRecommendations();

    return () => {
      controller.abort();
    };
  }, [
    callWithAuth,
    isAiEnabled,
    isAuthenticated,
    profilesState.detailStatus,
    profilesState.error,
    profilesState.profiles.length,
    profilesState.status,
    reloadKey,
    selectedProfileId
  ]);

  useEffect(() => {
    if (!recommendationState.jobs.length) {
      setSelectedJobId('');
      return;
    }

    setSelectedJobId((current) =>
      recommendationState.jobs.some((job) => job.id === current) ? current : recommendationState.jobs[0].id
    );
  }, [recommendationState.jobs]);

  const selectedJob = useMemo(
    () => {
      const sortedJobs = sortJobsBy(recommendationState.jobs, sortKey);
      return sortedJobs.find((job) => job.id === selectedJobId) ?? sortedJobs[0] ?? null;
    },
    [recommendationState.jobs, selectedJobId, sortKey]
  );
  const sortedJobs = useMemo(
    () => sortJobsBy(recommendationState.jobs, sortKey),
    [recommendationState.jobs, sortKey]
  );

  const profileStatus = useMemo(() => {
    if (!isAuthenticated || recommendationState.status === 'noProfile' || !selectedProfileSummary) {
      return { kind: 'none', missingFields: [] };
    }
    if (selectedProfileSummary.missingRequiredFields.length > 0) {
      return { kind: 'incomplete', missingFields: selectedProfileSummary.missingRequiredFields };
    }
    return { kind: 'ready', missingFields: [] };
  }, [isAuthenticated, recommendationState.status, selectedProfileSummary]);

  const handleToggleChecklist = (key) => {
    setChecklist((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleToggleAi = () => {
    setIsAiEnabled((current) => {
      if (current && selectedTab === 'match') {
        setSelectedTab('job');
      }
      return !current;
    });
  };

  const reloadRecommendations = useCallback(() => {
    recommendationCacheRef.current.clear();
    setReloadKey((current) => current + 1);
  }, []);

  const viewState =
    recommendationState.status === 'refetching'
      ? 'success'
      : recommendationState.status === 'disabled'
        ? 'noProfile'
        : recommendationState.status;

  return {
    apiContract: {
      endpoint: 'POST /api/v1/recommend/quick',
      request: {
        aiEnabled: isAiEnabled,
        profileId: isAiEnabled && selectedProfileId ? Number(selectedProfileId) : undefined
      },
      cacheTtlMinutes: Math.round(QUICK_RECOMMEND_CACHE_TTL_MS / 60000)
    },
    updatedAtText: recommendationState.updatedAtText,
    profiles,
    selectedFilters: isAiEnabled ? [...DEFAULT_FILTERS, 'AI 적합도', SORT_LABELS[sortKey]] : [...DEFAULT_FILTERS, 'AI OFF', SORT_LABELS[sortKey]],
    jobs: sortedJobs,
    selectedJob,
    selectedJobId,
    selectedProfile: selectedProfileSummary,
    selectedProfileId,
    selectedTab,
    sortKey,
    viewState,
    errorMessage: recommendationState.error,
    profileStatus,
    isAiEnabled,
    isAdvancedOpen,
    checklist,
    setSelectedProfileId: profilesState.selectProfile,
    setSelectedJobId,
    setSelectedTab,
    setSortKey,
    reloadRecommendations,
    setIsAdvancedOpen,
    onToggleAi: handleToggleAi,
    onToggleChecklist: handleToggleChecklist
  };
}
