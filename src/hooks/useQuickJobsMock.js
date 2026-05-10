import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { explainRecommendation, fetchQuickJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  clearRecommendationCache,
  getRecommendationExplanationCacheKey,
  getCachedRecommendation,
  getRecommendationCacheKey,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
import { useProfiles } from './useProfiles';

const DEFAULT_SORT = 'latest';
const FILTER_ALL_VALUE = 'ALL';
const INITIAL_FILTERS = {
  keyword: '',
  rolePrimary: '',
  roleSecondary: '',
  role: FILTER_ALL_VALUE,
  region: FILTER_ALL_VALUE,
  employment: FILTER_ALL_VALUE,
  salary: FILTER_ALL_VALUE,
  career: FILTER_ALL_VALUE,
  education: FILTER_ALL_VALUE,
  deadline: FILTER_ALL_VALUE,
  standard: FILTER_ALL_VALUE,
  disabled: FILTER_ALL_VALUE
};

const extractDateValues = (value) => {
  const text = String(value || '');
  const matches = [...text.matchAll(/(\d{4})\D?(\d{2})\D?(\d{2})/g)];

  return matches
    .map((match) => `${match[1]}${match[2]}${match[3]}`)
    .filter((rawDate) => rawDate.length === 8);
};

const pickDateValue = (value, position = 'first') => {
  const dates = extractDateValues(value);

  if (!dates.length) {
    return '';
  }

  return position === 'last' ? dates[dates.length - 1] : dates[0];
};

const formatRawDate = (rawDate) => {
  if (!rawDate) {
    return '확인 필요';
  }

  return `${rawDate.slice(0, 4)}.${rawDate.slice(4, 6)}.${rawDate.slice(6, 8)}`;
};

const formatDate = (value, position = 'first') => formatRawDate(pickDateValue(value, position));

const formatRecruitmentPeriod = (startValue, endValue) => {
  const startDate = pickDateValue(startValue, 'first') || pickDateValue(endValue, 'first');
  const endDate = pickDateValue(endValue, 'last');

  if (!startDate && !endDate) {
    return '확인 필요';
  }

  if (!startDate || startDate === endDate) {
    return formatRawDate(endDate || startDate);
  }

  return `${formatRawDate(startDate)} ~ ${formatRawDate(endDate)}`;
};

const parseDateValue = (value, position = 'first') => {
  const rawDate = pickDateValue(value, position);
  return rawDate ? Number(rawDate) : 0;
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
      const leftDeadline = parseDateValue(left.source.termDate, 'last') || Number.MAX_SAFE_INTEGER;
      const rightDeadline = parseDateValue(right.source.termDate, 'last') || Number.MAX_SAFE_INTEGER;
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

const normalizeSearchText = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();

const includesText = (value, keyword) => normalizeSearchText(value).includes(normalizeSearchText(keyword));

const isAllFilter = (value) => !value || value === FILTER_ALL_VALUE;

const hasAnyText = (values, keyword) => values.some((value) => includesText(value, keyword));

const getJobSearchValues = (job) => [
  job.title,
  job.occupation,
  job.company,
  job.location,
  job.externalId,
  job.source?.jobNm,
  job.source?.busplaName,
  job.source?.compAddr,
  job.source?.reqMajor,
  job.source?.reqLicens
];

const matchesRoleFilter = (job, filters) => {
  const roleTerms = [filters.role, filters.roleSecondary, filters.rolePrimary]
    .filter((value) => !isAllFilter(value))
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!roleTerms.length) {
    return true;
  }

  const jobSearchValues = getJobSearchValues(job);
  return roleTerms.some((term) => hasAnyText(jobSearchValues, term));
};

const FILTER_ALIASES = {
  '학력 무관': ['학력 무관', '학력무관', '무관'],
  무관: ['무관', '관계없음', '경력무관', '학력무관'],
  신입: ['신입', '신입가능'],
  경력: ['경력'],
  고졸: ['고졸', '고등학교'],
  전문대졸: ['전문대졸', '전문대', '초대졸'],
  '대졸 이상': ['대졸 이상', '대졸', '대학교', '학사']
};

const getFilterTerms = (filterValue) => {
  if (isAllFilter(filterValue)) {
    return [];
  }

  const value = String(filterValue).trim();
  return [...new Set([value, ...(FILTER_ALIASES[value] || [])])];
};

const matchesTextFilter = (values, filterValue) => {
  const terms = getFilterTerms(filterValue);
  return !terms.length || terms.some((term) => hasAnyText(values, term));
};

const hasAffirmativeText = (...values) => {
  const text = values.map((value) => String(value || '')).join(' ');

  if (!text.trim()) {
    return false;
  }

  if (/미해당|해당없|아님|false|n\b|no\b/i.test(text)) {
    return false;
  }

  return /해당|우대|장애인|표준사업장|인증|true|y\b|yes\b/i.test(text);
};

const REGION_ALIASES = {
  서울특별시: ['서울특별시', '서울'],
  부산광역시: ['부산광역시', '부산'],
  대구광역시: ['대구광역시', '대구'],
  인천광역시: ['인천광역시', '인천'],
  광주광역시: ['광주광역시', '광주'],
  대전광역시: ['대전광역시', '대전'],
  울산광역시: ['울산광역시', '울산'],
  세종특별자치시: ['세종특별자치시', '세종'],
  경기도: ['경기도', '경기'],
  강원특별자치도: ['강원특별자치도', '강원도', '강원'],
  충청북도: ['충청북도', '충북'],
  충청남도: ['충청남도', '충남'],
  전북특별자치도: ['전북특별자치도', '전라북도', '전북'],
  전라남도: ['전라남도', '전남'],
  경상북도: ['경상북도', '경북'],
  경상남도: ['경상남도', '경남'],
  제주특별자치도: ['제주특별자치도', '제주도', '제주']
};

const normalizeRegionText = (value) => String(value || '').replace(/\s+/g, '').toLowerCase();

const getRegionTerms = (value) => {
  const selectedRegion = String(value || '').trim();
  const matchedAliases = Object.values(REGION_ALIASES).find((aliases) => aliases.includes(selectedRegion));
  return [...new Set([selectedRegion, ...(matchedAliases || [])])]
    .map(normalizeRegionText)
    .filter(Boolean);
};

const matchesRegionFilter = (job, regionFilter) => {
  if (isAllFilter(regionFilter)) {
    return true;
  }

  const regionTerms = getRegionTerms(regionFilter);
  const jobRegionText = normalizeRegionText(`${job.location || ''} ${job.source?.compAddr || ''}`);

  return regionTerms.some((term) => jobRegionText.includes(term));
};

const getDeadlineDays = (dueLabel) => {
  const match = String(dueLabel || '').match(/^D-(\d+)$/);
  return match ? Number(match[1]) : null;
};

const filterJobsBy = (jobs, filters) => {
  const keyword = String(filters.keyword || '').trim().toLowerCase();

  return jobs.filter((job) => {
    if (keyword && !hasAnyText(getJobSearchValues(job), keyword)) {
      return false;
    }

    if (!matchesRoleFilter(job, filters)) {
      return false;
    }

    if (!matchesRegionFilter(job, filters.region)) {
      return false;
    }

    if (!matchesTextFilter([job.employmentType, job.source?.empType], filters.employment)) {
      return false;
    }

    if (!matchesTextFilter([job.source?.salaryType, job.salary], filters.salary)) {
      return false;
    }

    if (!matchesTextFilter([job.experience, job.source?.reqCareer, job.source?.enterType], filters.career)) {
      return false;
    }

    if (!matchesTextFilter([job.education, job.source?.reqEduc], filters.education)) {
      return false;
    }

    if (!isAllFilter(filters.deadline)) {
      const days = getDeadlineDays(job.dueLabel);
      const maxDays = filters.deadline === '마감 3일 이내' ? 3 : 7;
      if (typeof days !== 'number' || days > maxDays) {
        return false;
      }
    }

    if (filters.standard === '표준사업장' && !job.isStandardWorkplace) {
      return false;
    }

    if (filters.disabled === '우대 공고' && !job.prefersDisabled) {
      return false;
    }

    return true;
  });
};

const getDday = (value) => {
  const raw = pickDateValue(value, 'last');
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
  const scoreDetail = matched?.score_detail || matched?.scoreDetail || {};

  return typeof matched?.job_fit_score === 'number'
    ? matched.job_fit_score
    : typeof matched?.jobFitScore === 'number'
      ? matched.jobFitScore
      : typeof scoreDetail?.job_fit_score === 'number'
        ? scoreDetail.job_fit_score
        : typeof scoreDetail?.jobFitScore === 'number'
          ? scoreDetail.jobFitScore
          : typeof matched?.total_score === 'number'
            ? matched.total_score
            : typeof matched?.totalScore === 'number'
              ? matched.totalScore
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
  const deadlineDate = formatDate(job?.termDate, 'last');
  const registeredDate = formatDate(job?.regDt || job?.offerregDt, 'first');
  const recruitmentPeriod = formatRecruitmentPeriod(job?.offerregDt || job?.regDt, job?.termDate);
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
  const isStandardWorkplace = hasAffirmativeText(
    job?.isStandardWorkplace,
    job?.standardWorkplace,
    job?.standardYn,
    job?.compTypeNm,
    job?.compCert
  );
  const prefersDisabled = hasAffirmativeText(
    job?.prefersDisabled,
    job?.disabledPreferred,
    job?.disabilityPreferred,
    job?.disabPreferYn,
    job?.enterType,
    job?.etcItm,
    job?.jobNm
  );
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
    registeredDate,
    recruitmentPeriod,
    deadlineDate,
    dueLabel,
    isDeadlineSoon: dueLabel.startsWith('D-') && Number(dueLabel.replace('D-', '')) <= 7,
    isStandardWorkplace,
    prefersDisabled,
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

const buildExplainPayload = ({ job, profileId }) => {
  const source = job?.source || {};
  const toIntegerOrNull = (value) => {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value : null;
    }

    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      const numberValue = Number(value.trim());
      return Number.isSafeInteger(numberValue) ? numberValue : null;
    }

    return null;
  };
  const getFirstInteger = (...values) => {
    for (const value of values) {
      const numberValue = toIntegerOrNull(value);
      if (numberValue !== null) {
        return numberValue;
      }
    }

    return null;
  };
  const jobPostId = getFirstInteger(
    source.jobPostId,
    source.job_post_id,
    source.jobPostID,
    source.jobId,
    source.job_id,
    source.recruitmentId,
    source.recruitment_id,
    source.postId,
    source.post_id,
    source.id,
    source.sourceId,
    source.source_id,
    job.id
  );
  const sourceId = getFirstInteger(source.sourceId, source.source_id, source.id, jobPostId);

  return {
    profileId: Number(profileId),
    job: {
      jobPostId,
      companyName: job.company,
      jobTitle: job.title,
      workAddress: source.compAddr || job.location,
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
      sourceId,
      externalId: source.externalId ?? source.external_id ?? job.externalId ?? String(jobPostId || '')
    },
    jobFitScore: typeof job.match?.score === 'number' ? job.match.score : undefined,
    reasons: job.match?.positive || job.match?.reasons || [],
    riskFactors: job.match?.caution || [],
    evidenceItems: []
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

const toCountNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
};

const getTotalJobCount = (payload, jobsLength) =>
  toCountNumber(payload?.totalCount) ??
  toCountNumber(payload?.totalElements) ??
  toCountNumber(payload?.total) ??
  toCountNumber(payload?.count) ??
  jobsLength;

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
    totalJobCount: getTotalJobCount(payload, jobs.length),
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
  const [selectedTab, setSelectedTab] = useState('job');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [sortKey, setSortKey] = useState(DEFAULT_SORT);
  const [filterValues, setFilterValues] = useState(INITIAL_FILTERS);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [recommendationState, setRecommendationState] = useState({
    status: 'idle',
    error: '',
    payload: null,
    jobs: [],
    totalJobCount: 0,
    updatedAtText: '확인 전'
  });
  const [explanationState, setExplanationState] = useState({
    status: 'idle',
    error: '',
    jobId: '',
    data: null
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
  const activeRecommendationCacheKeyRef = useRef('');

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

  useEffect(() => {
    if (!isAuthenticated) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'disabled',
        error: '퀵 맞춤 일자리 추천을 보려면 로그인이 필요합니다.',
        jobs: [],
        totalJobCount: 0
      }));
      return undefined;
    }

    if (
      profilesState.status === 'loading' ||
      profilesState.status === 'idle' ||
      profilesState.detailStatus === 'loading' ||
      (selectedProfileId && profilesState.detailStatus === 'idle')
    ) {
      setRecommendationState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'calculating' : 'loading',
        error: '',
        jobs: [],
        totalJobCount: 0
      }));
      return undefined;
    }

    if (profilesState.status === 'error') {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'error',
        error: profilesState.error || '프로필 목록을 불러오지 못했습니다.',
        jobs: [],
        totalJobCount: 0
      }));
      return undefined;
    }

    if (!profilesState.profiles.length) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'noProfile',
        error: '',
        jobs: [],
        totalJobCount: 0
      }));
      return undefined;
    }

    if (!selectedProfileId) {
      setRecommendationState((prev) => ({
        ...prev,
        status: 'noProfile',
        error: '',
        jobs: [],
        totalJobCount: 0
      }));
      return undefined;
    }

    const controller = new AbortController();
    const requestParams = {
      aiEnabled: true,
      profileId: selectedProfileId,
      profileSignature: selectedProfileScoringSignature
    };
    const cacheKey = getRecommendationCacheKey(requestParams);
    const isScoringInputChanged = Boolean(activeRecommendationCacheKeyRef.current && activeRecommendationCacheKeyRef.current !== cacheKey);

    const loadRecommendations = async () => {
      const cachedPayload = getCachedRecommendation(cacheKey);

      if (cachedPayload) {
        const cachedState = buildRecommendationStateFromPayload(cachedPayload);
        activeRecommendationCacheKeyRef.current = cacheKey;
        setRecommendationState(cachedState);
        return;
      }

      setRecommendationState((prev) => ({
        ...prev,
        status: isScoringInputChanged ? 'calculating' : prev.jobs.length ? 'refetching' : 'loading',
        error: '',
        jobs: isScoringInputChanged ? [] : prev.jobs,
        totalJobCount: isScoringInputChanged ? 0 : prev.totalJobCount
      }));

      try {
        const payload = await callWithAuth((accessToken) =>
          fetchQuickJobRecommendations(accessToken, {
            ...requestParams,
            signal: controller.signal
          })
        );
        const nextState = buildRecommendationStateFromPayload(payload);

        setCachedRecommendation(cacheKey, payload);
        activeRecommendationCacheKeyRef.current = cacheKey;
        setRecommendationState(nextState);
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setRecommendationState((prev) => ({
          ...prev,
          status: 'error',
          error: error.message || '퀵 맞춤 일자리 추천을 불러오지 못했습니다.',
          jobs: [],
          totalJobCount: 0
        }));
      }
    };

    loadRecommendations();

    return () => {
      controller.abort();
    };
  }, [
    callWithAuth,
    isAuthenticated,
    profilesState.detailStatus,
    profilesState.error,
    profilesState.profiles.length,
    profilesState.status,
    reloadKey,
    selectedProfileId,
    selectedProfileScoringSignature
  ]);

  const filteredJobs = useMemo(
    () => filterJobsBy(recommendationState.jobs, filterValues),
    [recommendationState.jobs, filterValues]
  );
  const sortedJobs = useMemo(
    () => sortJobsBy(filteredJobs, sortKey),
    [filteredJobs, sortKey]
  );
  const hasActiveFilters = useMemo(
    () => Object.entries(filterValues).some(([key, value]) => value !== INITIAL_FILTERS[key]),
    [filterValues]
  );

  useEffect(() => {
    if (!sortedJobs.length) {
      setSelectedJobId('');
      return;
    }

    setSelectedJobId((current) =>
      sortedJobs.some((job) => job.id === current) ? current : sortedJobs[0].id
    );
  }, [sortedJobs]);

  const selectedJob = useMemo(
    () => {
      return sortedJobs.find((job) => job.id === selectedJobId) ?? sortedJobs[0] ?? null;
    },
    [selectedJobId, sortedJobs]
  );

  const viewState =
    recommendationState.status === 'refetching'
      ? 'success'
      : recommendationState.status === 'disabled'
        ? 'noProfile'
        : recommendationState.status;

  useEffect(() => {
    const canLoadExplanation =
      isAiEnabled &&
      viewState === 'success' &&
      selectedJob &&
      selectedProfileId &&
      typeof selectedJob.match?.score === 'number';

    if (!canLoadExplanation) {
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
      score: selectedJob.match.score,
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
      const explainPayload = buildExplainPayload({ job: selectedJob, profileId: selectedProfileId });
      if (!explainPayload.job.jobPostId) {
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
  }, [callWithAuth, isAiEnabled, selectedJob, selectedProfileId, selectedProfileScoringSignature, viewState]);

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

  const handleChangeFilter = useCallback((filterKey, value) => {
    setFilterValues((current) => {
      if (filterKey && typeof filterKey === 'object') {
        return {
          ...current,
          ...filterKey
        };
      }

      return {
        ...current,
        [filterKey]: value
      };
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilterValues(INITIAL_FILTERS);
    setSortKey(DEFAULT_SORT);
  }, []);

  const reloadRecommendations = useCallback(() => {
    clearRecommendationCache();
    setReloadKey((current) => current + 1);
  }, []);

  return {
    updatedAtText: recommendationState.updatedAtText,
    profiles,
    filterValues,
    jobs: sortedJobs,
    totalJobCount: hasActiveFilters ? sortedJobs.length : recommendationState.totalJobCount,
    selectedJob,
    selectedJobId,
    selectedProfile: selectedProfileSummary,
    selectedProfileId,
    selectedTab,
    sortKey,
    viewState,
    errorMessage: recommendationState.error,
    explanation: explanationState.data,
    explanationViewState: explanationState.status === 'refetching' ? 'success' : explanationState.status,
    explanationErrorMessage: explanationState.error,
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
    onChangeFilter: handleChangeFilter,
    onResetFilters: handleResetFilters,
    onToggleAi: handleToggleAi,
    onToggleChecklist: handleToggleChecklist
  };
}
