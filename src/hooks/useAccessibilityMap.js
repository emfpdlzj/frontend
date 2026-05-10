import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapApi } from '../api/mapApi';
import { explainRecommendation, fetchMapJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  clearRecommendationCache,
  getRecommendationExplanationCacheKey,
  getCachedRecommendation,
  getRecommendationCacheKey,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { accessibilityMapMockData } from '../config/accessibilityMapMockData';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
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

const DATE_PATTERN = /(\d{4})\D?(\d{2})\D?(\d{2})/g;

const extractDateValues = (value) => {
  if (!value) {
    return [];
  }

  return Array.from(String(value).matchAll(DATE_PATTERN), ([, year, month, day]) => `${year}${month}${day}`);
};

const formatRawDate = (raw) => `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;

const formatDate = (value) => {
  const [raw] = extractDateValues(value);
  if (!raw) {
    return value ? String(value) : '확인 필요';
  }

  return formatRawDate(raw);
};

const getLastDateValue = (value) => {
  const dates = extractDateValues(value);
  return dates.length ? dates[dates.length - 1] : '';
};

const getJobStartDateValue = (job, termDate) =>
  getLastDateValue(getJobDateField(job, 'offerregDt', 'offerreg_dt') || getJobDateField(job, 'regDt', 'reg_dt')) ||
  extractDateValues(termDate)[0] ||
  '';

const getJobDeadlineDateValue = (termDate) => getLastDateValue(termDate);

const getRecruitmentPeriodText = (job, termDate) => {
  const startDate = getJobStartDateValue(job, termDate);
  const deadlineDate = getJobDeadlineDateValue(termDate);

  return `${startDate ? formatRawDate(startDate) : '확인 필요'} ~ ${deadlineDate ? formatRawDate(deadlineDate) : '확인 필요'}`;
};

const getDday = (value) => {
  const raw = getLastDateValue(value);
  if (!raw) {
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

const getFirstPresentValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '');

const getJobExternalId = (job) => getFirstPresentValue(job?.externalId, job?.external_id, job?.rno);

const getJobTitle = (job) => getFirstPresentValue(job?.jobNm, job?.job_nm, job?.jobTitle, job?.job_title);

const getCompanyName = (job) =>
  getFirstPresentValue(job?.busplaName, job?.buspla_name, job?.companyName, job?.company_name);

const getWorkAddress = (job) =>
  getFirstPresentValue(job?.compAddr, job?.comp_addr, job?.workAddress, job?.work_address);

const getGeoLatitude = (job) => getFirstPresentValue(job?.geoLatitude, job?.geo_latitude, job?.workLat, job?.work_lat);

const getGeoLongitude = (job) => getFirstPresentValue(job?.geoLongitude, job?.geo_longitude, job?.workLng, job?.work_lng);

const getJobDateField = (job, camelKey, snakeKey) => getFirstPresentValue(job?.[camelKey], job?.[snakeKey]);

const findAiMapResult = (aiResults, job) => {
  const externalId = getJobExternalId(job);
  const jobPostId = getFirstPresentValue(job?.jobPostId, job?.job_post_id, job?.id);

  return aiResults.find((result) => {
    const aiJob = result?.job || {};
    const aiExternalId = getJobExternalId(aiJob);
    const aiJobPostId = getFirstPresentValue(aiJob?.jobPostId, aiJob?.job_post_id, aiJob?.id);

    return (
      (externalId && aiExternalId === externalId) ||
      (jobPostId && aiJobPostId === jobPostId) ||
      aiJob.job_title === getJobTitle(job) ||
      aiJob.jobTitle === getJobTitle(job)
    );
  }) || null;
};

const toNumberOrNull = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^\d.-]/g, '').trim();
    if (!normalized) {
      return null;
    }

    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
};

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

const buildJobInfo = (job, recruitmentPeriodText, salaryText) => [
  ['모집직종', getJobTitle(job) || '확인 필요'],
  ['고용형태', getFirstPresentValue(job?.empType, job?.emp_type, job?.employmentType, job?.employment_type) || '확인 필요'],
  ['임금', salaryText],
  ['임금형태', getFirstPresentValue(job?.salaryType, job?.salary_type) || '확인 필요'],
  ['요구경력', getFirstPresentValue(job?.reqCareer, job?.req_career, job?.enterType, job?.enter_type) || '확인 필요'],
  ['요구학력', getFirstPresentValue(job?.reqEduc, job?.req_educ) || '확인 필요'],
  ['모집기간', recruitmentPeriodText],
  ['요구전공', getFirstPresentValue(job?.reqMajor, job?.req_major) || '확인 필요'],
  ['요구자격', getFirstPresentValue(job?.reqLicens, job?.req_licens) || '확인 필요']
];

const getDateRangeText = (job) => getRecruitmentPeriodText(job, getJobDateField(job, 'termDate', 'term_date'));

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

const getFirstInteger = (...values) => {
  for (const value of values) {
    const numberValue = toIntegerOrNull(value);
    if (numberValue !== null) {
      return numberValue;
    }
  }

  return null;
};

const getJobPostId = (source, job) =>
  getFirstInteger(
    source?.jobPostId,
    source?.job_post_id,
    source?.jobPostID,
    source?.jobId,
    source?.job_id,
    source?.recruitmentId,
    source?.recruitment_id,
    source?.postId,
    source?.post_id,
    source?.id,
    source?.sourceId,
    source?.source_id,
    job?.id
  );

const buildExplainScoreDetail = (scoreDetail) => ({
  jobFitScore: toIntegerOrNull(scoreDetail?.job_fit_score ?? scoreDetail?.jobFitScore),
  workConditionScore: toIntegerOrNull(scoreDetail?.work_condition_score ?? scoreDetail?.workConditionScore),
  disabilitySupportScore: toIntegerOrNull(scoreDetail?.disability_support_score ?? scoreDetail?.disabilitySupportScore),
  workEnvironmentScore: toIntegerOrNull(scoreDetail?.work_environment_score ?? scoreDetail?.workEnvironmentScore),
  companyStabilityScore: toIntegerOrNull(scoreDetail?.company_stability_score ?? scoreDetail?.companyStabilityScore),
  accessibilityScore: toIntegerOrNull(scoreDetail?.accessibility_score ?? scoreDetail?.accessibilityScore)
});

const normalizeMapJob = (job, aiResults, aiEnabled, matchedAiResult) => {
  const aiResult = aiEnabled ? matchedAiResult || findAiMapResult(aiResults, job) : null;
  const scoreDetail = aiResult?.score_detail || aiResult?.scoreDetail || {};
  const totalScore =
    toNumberOrNull(aiResult?.total_score) ??
    toNumberOrNull(aiResult?.totalScore) ??
    toNumberOrNull(scoreDetail?.total_score) ??
    toNumberOrNull(scoreDetail?.totalScore) ??
    toNumberOrNull(aiResult?.score);
  const accessibilityScore =
    toNumberOrNull(scoreDetail?.accessibility_score) ??
    toNumberOrNull(scoreDetail?.accessibilityScore) ??
    toNumberOrNull(aiResult?.accessibility_score) ??
    toNumberOrNull(aiResult?.accessibilityScore) ??
    totalScore;
  const displayScore = accessibilityScore ?? totalScore;
  const grade = getScoreGrade(displayScore);
  const tone = getAccessibilityTone(displayScore);
  const title = getJobTitle(job) || '공고명 확인 필요';
  const company = getCompanyName(job) || '기업명 확인 필요';
  const address = getWorkAddress(job) || '근무지 확인 필요';
  const region = getRegionLabel(address);
  const salaryType = getFirstPresentValue(job?.salaryType, job?.salary_type);
  const termDate = getJobDateField(job, 'termDate', 'term_date');
  const salaryText = normalizeSalary(salaryType, job?.salary);
  const deadlineDateValue = getJobDeadlineDateValue(termDate);
  const deadlineDate = deadlineDateValue ? formatRawDate(deadlineDateValue) : formatDate(termDate);
  const recruitmentPeriodText = getRecruitmentPeriodText(job, termDate);
  const dueLabel = getDday(termDate);
  const dueDateText = dueLabel ? `${deadlineDate} 마감` : '';
  const id = getJobExternalId(job) || `${company}-${title}-${termDate || ''}`;
  const geoLatitude = getGeoLatitude(job);
  const geoLongitude = getGeoLongitude(job);

  return {
    id,
    externalId: getJobExternalId(job) || '',
    source: job,
    company,
    title,
    badges: ['공공', grade].filter(Boolean),
    dueLabel,
    dueDateText,
    dateRangeText: getDateRangeText(job),
    commuteMinutes: '확인 필요',
    payText: salaryText,
    salaryType: salaryType || '확인 필요',
    employmentType: getFirstPresentValue(job?.empType, job?.emp_type, job?.employmentType, job?.employment_type) || '확인 필요',
    region,
    score: displayScore ?? '확인 필요',
    scoreDetail,
    totalScore,
    jobInfo: buildJobInfo(job, recruitmentPeriodText, salaryText),
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
            ['근무지 좌표', geoLatitude && geoLongitude ? '지도에서 근무지 위치를 확인할 수 있습니다.' : '근무지 좌표 데이터가 없어 위치 확인이 필요합니다.', geoLatitude && geoLongitude ? '접근 양호' : '데이터 미확인'],
            ['편의시설 정보', '엘리베이터, 저상버스, 보행 경로 등 세부 시설 정보는 기업 또는 지도 데이터로 추가 확인이 필요합니다.', '데이터 미확인']
          ],
          source: '데이터 출처 · BridgeWork Spring Backend 추천 지도 API'
        }
      ])
    ),
    mapPoint: geoLatitude && geoLongitude
      ? {
          lat: Number(geoLatitude),
          lng: Number(geoLongitude)
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

const getMapMarkerDisplayLabel = (label) => {
  const normalized = String(label || '이름 확인 필요')
    .replace(/\s+/g, ' ')
    .replace(/^\(?주\)?\s*/i, '')
    .replace(/^㈜\s*/i, '')
    .replace(/^주식회사\s*/i, '')
    .replace(/^유한회사\s*/i, '')
    .replace(/^사단법인\s*/i, '')
    .replace(/^재단법인\s*/i, '')
    .replace(/^사회복지법인\s*/i, '')
    .trim();

  if ([...normalized].length <= 12) {
    return normalized;
  }

  return `${[...normalized].slice(0, 11).join('')}...`;
};

const buildMapViewport = (jobs, selectedJob) => {
  const centerPoint = selectedJob?.mapPoint || jobs.find((job) => job.mapPoint)?.mapPoint;
  if (!centerPoint) {
    return accessibilityMapMockData.mapViewport;
  }

  return {
    center: centerPoint,
    zoom: 16
  };
};

const buildMapMarkers = (jobs) =>
  jobs
    .filter((job) => job.mapPoint)
    .map((job) => ({
      id: job.id,
      label: job.company,
      displayLabel: getMapMarkerDisplayLabel(job.company),
      lat: job.mapPoint.lat,
      lng: job.mapPoint.lng,
      type: 'office'
    }));

const normalizeSupportAgency = (agency) => ({
  id: agency?.externalId || agency?.institutionCode || `${agency?.institutionName || 'support'}-${agency?.latitude}-${agency?.longitude}`,
  label: agency?.institutionName || '근로지원기관',
  displayLabel: getMapMarkerDisplayLabel(agency?.institutionName || '근로지원기관'),
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
      getJobTitle(source),
      getFirstPresentValue(source.reqMajor, source.req_major),
      getFirstPresentValue(source.reqLicens, source.req_licens),
      getFirstPresentValue(source.enterType, source.enter_type)
    ].filter(Boolean).join(' ');
    const regionTerms = getRegionTerms(selectedFilters.region).flatMap(getComparableTerms);
    const regionText = [
      job.region,
      job.companyInfo?.address,
      getWorkAddress(source)
    ].filter(Boolean).join(' ');
    const employmentTerms = getComparableTerms(selectedFilters.employmentType);
    const salaryTerms = getComparableTerms(selectedFilters.salaryType);

    return (
      (!normalizedJobCategoryTerms.length || includesAnyTerm(jobText, normalizedJobCategoryTerms)) &&
      (!employmentTerms.length || selectedFilters.employmentType === FILTER_ALL_VALUE || includesAnyTerm(job.employmentType || getFirstPresentValue(source.empType, source.emp_type), employmentTerms)) &&
      (!regionTerms.length || includesAnyTerm(regionText, regionTerms)) &&
      (!salaryTerms.length || selectedFilters.salaryType === FILTER_ALL_VALUE || includesAnyTerm(job.salaryType || getFirstPresentValue(source.salaryType, source.salary_type), salaryTerms))
    );
  });

const sortJobsByAccessibility = (jobs) =>
  [...jobs].sort((left, right) => (getScoreNumber(right.score) ?? -1) - (getScoreNumber(left.score) ?? -1));

const buildExplainPayload = ({ job, profileId }) => {
  const source = job?.source || {};
  const scoreDetail = job?.scoreDetail || {};
  const jobPostId = getJobPostId(source, job);
  const sourceId = getFirstInteger(source.sourceId, source.source_id, source.id, jobPostId);
  const totalScore = toIntegerOrNull(job?.totalScore ?? job?.score);
  const salaryType = getFirstPresentValue(source.salaryType, source.salary_type);
  const jobFitScore =
    toIntegerOrNull(scoreDetail?.job_fit_score) ?? toIntegerOrNull(scoreDetail?.jobFitScore) ?? totalScore ?? 0;

  return {
    profileId: Number(profileId),
    job: {
      jobPostId,
      companyName: job.company,
      jobTitle: job.title,
      workAddress: getWorkAddress(source) || job.companyInfo.address,
      workLat: getGeoLatitude(source) ?? null,
      workLng: getGeoLongitude(source) ?? null,
      employmentType: getFirstPresentValue(source.empType, source.emp_type, source.employmentType, source.employment_type) || job.employmentType,
      enterType: getFirstPresentValue(source.enterType, source.enter_type) || '확인 필요',
      salaryType: salaryType || '확인 필요',
      salary: source.salary || '확인 필요',
      termDate: getJobDateField(source, 'termDate', 'term_date') || '',
      requiredCareer: getFirstPresentValue(source.reqCareer, source.req_career) || '확인 필요',
      requiredEducation: getFirstPresentValue(source.reqEduc, source.req_educ) || '확인 필요',
      requiredMajor: getFirstPresentValue(source.reqMajor, source.req_major) || '확인 필요',
      requiredLicenses: getFirstPresentValue(source.reqLicens, source.req_licens) || '확인 필요',
      registeredAt: getJobDateField(source, 'regDt', 'reg_dt') || getJobDateField(source, 'offerregDt', 'offerreg_dt') || '',
      sourceTable: source.sourceTable || 'pd_kepad_recruitment',
      sourceId,
      externalId: source.externalId ?? source.external_id ?? job.externalId ?? String(jobPostId || '')
    },
    scoreDetail: buildExplainScoreDetail(scoreDetail),
    totalScore,
    jobFitScore,
    reasons: [`추천 지도 기준 총점은 ${job.totalScore ?? job.score}점입니다.`],
    riskFactors: ['출퇴근 경로와 사업장 접근성 세부 정보는 지원 전 확인이 필요합니다.'],
    evidenceItems: []
  };
};

const getPayloadAiResults = (payload) => {
  const candidates = [
    payload?.aiResponse?.result?.results,
    payload?.aiResponse?.results,
    payload?.result?.results,
    payload?.results
  ];

  return candidates.find(Array.isArray) || [];
};

const getPayloadJobs = (payload, aiResults) => {
  const candidates = [
    payload?.jobs,
    payload?.jobRecommendations,
    payload?.recommendations,
    payload?.result?.jobs,
    payload?.result?.jobRecommendations,
    payload?.data?.jobs
  ];
  const jobs = candidates.find(Array.isArray);

  if (jobs) {
    return jobs.map((job) => ({ job, aiResult: null }));
  }

  return aiResults
    .map((result) => result?.job ? { job: result.job, aiResult: result } : null)
    .filter(Boolean);
};

export const buildRecommendationStateFromPayload = (payload, aiEnabled = Boolean(payload?.aiEnabled ?? payload?.ai_enabled)) => {
  const aiResults = getPayloadAiResults(payload);
  const jobEntries = getPayloadJobs(payload, aiResults);
  const jobs = jobEntries.map(({ job, aiResult }) => normalizeMapJob(job, aiResults, aiEnabled, aiResult));

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
        jobs: []
      }));
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
      scope: 'map',
      profileSignature: appliedAiEnabled ? selectedProfileScoringSignature : ''
    });
    const isScoringInputChanged = Boolean(activeRecommendationCacheKeyRef.current && activeRecommendationCacheKeyRef.current !== cacheKey);

    const loadRecommendations = async () => {
      const cachedPayload = getCachedRecommendation(cacheKey);
      if (cachedPayload) {
        if (isCurrentRequest) {
          activeRecommendationCacheKeyRef.current = cacheKey;
          setRecommendationState(buildRecommendationStateFromPayload(cachedPayload, appliedAiEnabled));
        }
        return;
      }

      setRecommendationState((prev) => ({
        ...prev,
        status: isScoringInputChanged ? 'calculating' : prev.jobs.length ? 'refetching' : 'loading',
        error: '',
        jobs: isScoringInputChanged ? [] : prev.jobs
      }));

      try {
        const payload = await callWithAuth((accessToken) =>
          fetchMapJobRecommendations(accessToken, {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            profileSignature: appliedAiEnabled ? selectedProfileScoringSignature : undefined,
            signal: controller.signal,
            timeoutMs: MAP_RECOMMEND_REQUEST_TIMEOUT_MS
          })
        );
        const nextState = buildRecommendationStateFromPayload(payload, appliedAiEnabled);

        if (!isCurrentRequest) {
          return;
        }

        setCachedRecommendation(cacheKey, payload);
        activeRecommendationCacheKeyRef.current = cacheKey;
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
  const jobMarkers = useMemo(() => buildMapMarkers(filteredJobs), [filteredJobs]);
  const supportAgencyMarkers = useMemo(
    () => buildSupportAgencyMarkers(supportAgencyState.agencies),
    [supportAgencyState.agencies]
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
  }, [appliedAiEnabled, callWithAuth, recommendationState.status, selectedJob, selectedProfileId, selectedProfileScoringSignature]);

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
