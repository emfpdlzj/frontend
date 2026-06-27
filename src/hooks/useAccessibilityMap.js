import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapApi } from '../api/mapApi';
import { explainRecommendation, fetchMapJobRecommendations, fetchRecommendTaskStatus } from '../api/recommendApi';
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
import { getAddressCoordinate, getAddressDistrict } from '../utils/addressCoordinates';
import { useJobFilterOptions } from './useJobFilterOptions';
import { useProfiles } from './useProfiles';

const MAP_RECOMMEND_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
const MAP_RECOMMEND_POLL_INTERVAL_MS = 500;
const MAP_PAGE_SIZE = 100;
const MAP_MAX_RESULTS = 1000;
const MAP_INCREMENTAL_APPEND_DELAY_MS = 220;
const MAP_ACTIVE_TASK_SCOPE = 'accessibility-map';
const FILTER_ALL_VALUE = '전체';
const VALID_TABS = ['accessibility', 'job'];
const MAP_PERSONAS = {
  wheelchair: {
    label: '지체'
  },
  vision: {
    label: '시각'
  },
  hearing: {
    label: '청각'
  }
};
const MAP_LEGEND = [
  ['A', '80 이상', 'good'],
  ['B', '60 ~ 79', 'warning'],
  ['C', '60 미만', 'danger']
];
const MAP_DEFAULT_VIEWPORT = {
  center: { lat: 37.498095, lng: 127.02761 },
  zoom: 16
};
const MAP_RADIUS_METERS = 850;
const COMMUTABLE_FILTER_ID = 'commutableOnly';
const DEFAULT_COMMUTABLE_DISTANCE_KM = 25;
const DEFAULT_COMMUTABLE_MINUTES = 75;
const MAX_DISPLAY_COMMUTE_MINUTES = 75 * 60;
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

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const toSafeText = (value, fallback = '-') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const toNullableText = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const splitToList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (value == null) {
    return [];
  }
  return String(value)
    .split(/[,/]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const extractInteger = (raw) => {
  if (raw == null) {
    return null;
  }
  const matched = String(raw).match(/\d+/);
  if (!matched) {
    return null;
  }
  const parsed = Number.parseInt(matched[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const isTaskCached = (payload) => Boolean(payload?.cached);

async function waitForRecommendTask(callWithAuth, requestId, signal, onProgress) {
  let lastPayload = null;

  while (!signal?.aborted) {
    const payload = await callWithAuth((accessToken) =>
      fetchRecommendTaskStatus(accessToken, requestId, { signal })
    );
    lastPayload = payload;

    if (payload?.status === 'PROCESSING' && payload?.result) {
      await onProgress?.(payload.result);
    }

    if (payload?.status === 'COMPLETED' || payload?.status === 'FAILED') {
      return payload;
    }

    await delay(MAP_RECOMMEND_POLL_INTERVAL_MS);
  }

  return lastPayload;
}

async function requestMapRecommendationResult(callWithAuth, request, signal, onProgress) {
  const taskPayload = await callWithAuth((accessToken) =>
    fetchMapJobRecommendations(accessToken, {
      ...request,
      signal,
      timeoutMs: MAP_RECOMMEND_REQUEST_TIMEOUT_MS
    })
  );

  if (taskPayload?.status === 'FAILED') {
    throw new Error(taskPayload.errorMessage || '지역 접근성 지도 추천을 불러오지 못했습니다.');
  }

  if (taskPayload?.status === 'COMPLETED' && taskPayload?.result) {
    return { payload: taskPayload.result, cached: isTaskCached(taskPayload), progressed: false };
  }

  if (!taskPayload?.requestId) {
    throw new Error('추천 요청 상태를 확인할 수 없습니다.');
  }

  let progressed = false;
  if (taskPayload?.result) {
    progressed = true;
    await onProgress?.(taskPayload.result);
  }
  const completedTask = await waitForRecommendTask(callWithAuth, taskPayload.requestId, signal, async (progressResult) => {
    progressed = true;
    await onProgress?.(progressResult);
  });
  if (!completedTask || completedTask.status === 'FAILED') {
    throw new Error(completedTask?.errorMessage || '지역 접근성 지도 추천을 불러오지 못했습니다.');
  }

  return { payload: completedTask.result, cached: isTaskCached(completedTask), progressed };
}

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
    return value ? String(value) : '-';
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

  return `${startDate ? formatRawDate(startDate) : '-'} ~ ${deadlineDate ? formatRawDate(deadlineDate) : '-'}`;
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
    return '-';
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

const getAccessibilityStatusFromScore = (score) => {
  if (typeof score !== 'number') {
    return '주의 필요';
  }
  if (score >= 80) {
    return '접근 양호';
  }
  if (score >= 60) {
    return '주의 필요';
  }
  return '접근 어려움';
};

const buildWorkLocationSummary = (workAddress, hasMapPoint) => {
  const hasWorkAddress = Boolean(workAddress && workAddress !== '-');

  if (hasMapPoint && hasWorkAddress) {
    return `근무지는 ${workAddress} 기준으로 지도에 표시됩니다.`;
  }

  if (hasMapPoint) {
    return '근무지 위치가 지도에 표시됩니다.';
  }

  return '지도에 표시할 근무지 위치 정보가 부족합니다. 실제 주소와 이동 경로를 함께 확인해야 합니다.';
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

const getRecruitmentContext = (job) => job?.recruitmentContext || job?.recruitment_context || {};

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

const getDistanceKm = (from, to) => {
  if (!from || !to) {
    return null;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const formatCommuteMinutes = (minutes) =>
  Number.isFinite(minutes) ? Math.max(10, Math.round(minutes / 5) * 5) : '-';

const parseCommuteLimitMinutes = (profile) => {
  const raw = String(profile?.commuteRange ?? profile?.commute_range ?? '').trim();
  if (!raw) {
    return DEFAULT_COMMUTABLE_MINUTES;
  }

  const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minuteMatch = raw.match(/(\d+(?:\.\d+)?)\s*분/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const totalMinutes = hours * 60 + minutes;

  return Number.isFinite(totalMinutes) && totalMinutes > 0 ? totalMinutes : DEFAULT_COMMUTABLE_MINUTES;
};

const parseMobilityRangeKm = (profile) => {
  const raw = String(profile?.commuteRange ?? profile?.commute_range ?? '').trim();
  const kmMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:km|㎞|킬로|키로)/i);
  const km = kmMatch ? Number(kmMatch[1]) : NaN;

  return Number.isFinite(km) && km > 0 ? km : DEFAULT_COMMUTABLE_DISTANCE_KM;
};

const getHomeWorkDistanceKm = (profile, job) => {
  const source = job?.source || job || {};
  const homeAddress = getFirstPresentValue(profile?.detailAddress, profile?.address);
  const homeLatitude = toNumberOrNull(getFirstPresentValue(profile?.homeLat, profile?.home_lat));
  const homeLongitude = toNumberOrNull(getFirstPresentValue(profile?.homeLng, profile?.home_lng));
  const homeCoordinate = homeLatitude !== null && homeLongitude !== null
    ? { latitude: homeLatitude, longitude: homeLongitude }
    : getAddressCoordinate(homeAddress);
  const workLatitude = toNumberOrNull(getFirstPresentValue(getGeoLatitude(source), job?.workLatitude, job?.work_lat));
  const workLongitude = toNumberOrNull(getFirstPresentValue(getGeoLongitude(source), job?.workLongitude, job?.work_lng));
  const workCoordinate = workLatitude !== null && workLongitude !== null
    ? { latitude: workLatitude, longitude: workLongitude }
    : getAddressCoordinate(getWorkAddress(source) || job?.location);

  return getDistanceKm(homeCoordinate, workCoordinate);
};

const isCommutableJob = (job, profile) => {
  const commuteMinutes = parseDurationMinutes(job?.commuteMinutes);
  if (commuteMinutes !== null) {
    return commuteMinutes <= parseCommuteLimitMinutes(profile);
  }

  const distanceKm = getHomeWorkDistanceKm(profile, job);
  if (distanceKm !== null) {
    return distanceKm <= parseMobilityRangeKm(profile);
  }

  // 통근 가능 필터는 선택 프로필의 거주지와 공고 근무지를 계산할 수 있을 때만 통과시킨다.
  return false;
};

const parseDurationMinutes = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*시간/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*분/);
  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    const totalMinutes = hours * 60 + minutes;
    return Number.isFinite(totalMinutes) ? totalMinutes : null;
  }

  return toNumberOrNull(value);
};

const estimateCommuteMinutes = (profile, job, commuteStats) => {
  const providedMinutes = parseDurationMinutes(commuteStats?.[0]);
  if (providedMinutes !== null) {
    return providedMinutes;
  }

  const homeAddress = getFirstPresentValue(profile?.detailAddress, profile?.address);
  const homeCoordinate = getAddressCoordinate(homeAddress);
  const workLatitude = toNumberOrNull(getGeoLatitude(job));
  const workLongitude = toNumberOrNull(getGeoLongitude(job));
  const workCoordinate = workLatitude !== null && workLongitude !== null
    ? { latitude: workLatitude, longitude: workLongitude }
    : getAddressCoordinate(getWorkAddress(job));
  const distanceKm = getDistanceKm(homeCoordinate, workCoordinate);

  if (distanceKm === null) {
    return '-';
  }

  const homeDistrict = getAddressDistrict(homeAddress);
  const workDistrict = getAddressDistrict(getWorkAddress(job));
  const estimatedMinutes = homeDistrict && workDistrict && homeDistrict === workDistrict
    ? 20 + distanceKm * 4
    : 18 + distanceKm * 5.2;

  return formatCommuteMinutes(estimatedMinutes);
};

const buildJobInfo = (job, recruitmentPeriodText, salaryText) => {
  const recruitmentContext = getRecruitmentContext(job);
  return [
    ['모집직종', getJobTitle(job) || '-'],
    ['고용형태', getFirstPresentValue(job?.empType, job?.emp_type, job?.employmentType, job?.employment_type) || '-'],
    ['임금', salaryText],
    ['임금형태', getFirstPresentValue(job?.salaryType, job?.salary_type) || '-'],
    [
      '요구경력',
      getFirstPresentValue(
        job?.reqCareer,
        job?.req_career,
        job?.requiredCareer,
        job?.required_career,
        recruitmentContext.req_career,
        recruitmentContext.reqCareer,
        job?.enterType,
        job?.enter_type
      ) || '-'
    ],
    [
      '요구학력',
      getFirstPresentValue(
        job?.reqEduc,
        job?.req_educ,
        job?.requiredEducation,
        job?.required_education,
        recruitmentContext.req_educ,
        recruitmentContext.reqEduc
      ) || '-'
    ],
    ['모집기간', recruitmentPeriodText],
    [
      '요구전공',
      getFirstPresentValue(
        job?.reqMajor,
        job?.req_major,
        job?.requiredMajor,
        job?.required_major,
        recruitmentContext.req_major,
        recruitmentContext.reqMajor
      ) || '-'
    ],
    [
      '요구자격',
      getFirstPresentValue(
        job?.reqLicens,
        job?.req_licens,
        job?.requiredLicenses,
        job?.required_licenses,
        recruitmentContext.req_licens,
        recruitmentContext.reqLicens
      ) || '-'
    ]
  ];
};

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

const getBooleanValue = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
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
  job_fit_score: toIntegerOrNull(scoreDetail?.job_fit_score ?? scoreDetail?.jobFitScore),
  work_condition_score: toIntegerOrNull(scoreDetail?.work_condition_score ?? scoreDetail?.workConditionScore),
  disability_support_score: toIntegerOrNull(scoreDetail?.disability_support_score ?? scoreDetail?.disabilitySupportScore),
  work_environment_score: toIntegerOrNull(scoreDetail?.work_environment_score ?? scoreDetail?.workEnvironmentScore),
  company_stability_score: toIntegerOrNull(scoreDetail?.company_stability_score ?? scoreDetail?.companyStabilityScore),
  accessibility_score: toIntegerOrNull(scoreDetail?.accessibility_score ?? scoreDetail?.accessibilityScore),
  distance_score: toIntegerOrNull(scoreDetail?.distance_score ?? scoreDetail?.distanceScore),
  commute_score: toIntegerOrNull(scoreDetail?.commute_score ?? scoreDetail?.commuteScore)
});

const normalizeEvidenceItems = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const formatEvidenceDistance = (distanceMeters) => {
  const numberValue = toNumberOrNull(distanceMeters);
  if (numberValue === null) {
    return '';
  }
  return numberValue >= 1000 ? `약 ${(numberValue / 1000).toFixed(1)}km` : `약 ${Math.round(numberValue)}m`;
};

const getEvidenceDistance = (item) => item?.distance_meters ?? item?.distanceMeters;

const summarizeEvidenceGroup = (items, presentText, missingText) => {
  if (!items.length) {
    return missingText;
  }

  const distances = items
    .map((item) => toNumberOrNull(getEvidenceDistance(item)))
    .filter((distance) => distance !== null);
  const nearestDistance = distances.length ? Math.min(...distances) : null;
  const distanceText = formatEvidenceDistance(nearestDistance);
  const suffix = distanceText ? `, 최근접 ${distanceText}` : '';
  return `${presentText} ${items.length}건${suffix} 확인됩니다.`;
};

const getEvidenceSourceSummary = (evidenceItems) => {
  const sourceNames = [
    ...new Set(
      normalizeEvidenceItems(evidenceItems)
        .map((item) => item?.source_name || item?.sourceName || item?.source_type || item?.sourceType)
        .filter(Boolean)
    )
  ];

  if (!sourceNames.length) {
    return '데이터 출처 · BridgeWork Spring Backend 추천 지도 API';
  }

  const visibleNames = sourceNames.slice(0, 3).join(', ');
  const suffix = sourceNames.length > 3 ? ` 외 ${sourceNames.length - 3}건` : '';
  return `데이터 출처 · ${visibleNames}${suffix}`;
};

const formatScoreBreakdownDescription = (description) =>
  String(description || '')
    .replace(/\s*(강점:)/g, '\n$1')
    .replace(/\s*(확인 필요:)/g, '\n$1')
    .trim();

const buildEvidenceDetailItems = (evidenceItems) => {
  const normalizedItems = normalizeEvidenceItems(evidenceItems);
  const filterBySourceTypes = (sourceTypes) =>
    normalizedItems.filter((item) => sourceTypes.includes(item?.source_type || item?.sourceType));
  const scoreBreakdownItem = normalizedItems.find(
    (item) => (item?.source_type || item?.sourceType) === 'BRIDGEWORK_SCORE_BREAKDOWN'
  );

  const transportationItems = filterBySourceTypes([
    'NATIONWIDE_BUS_STOP',
    'SEOUL_LOW_FLOOR_BUS_ROUTE_RETENTION',
    'TRANSPORT_SUPPORT_CENTER'
  ]);
  const walkingItems = filterBySourceTypes([
    'NATIONWIDE_CROSSWALK',
    'NATIONWIDE_TRAFFIC_LIGHT',
    'SEOUL_WALKING_NETWORK'
  ]);
  const wheelchairFacilityItems = filterBySourceTypes([
    'RAIL_WHEELCHAIR_LIFT',
    'RAIL_WHEELCHAIR_LIFT_MOVEMENT',
    'SEOUL_WHEELCHAIR_LIFT',
    'SEOUL_TRANSPORT_WEAK_WHEELCHAIR_LIFT',
    'SEOUL_SUBWAY_ENTRANCE_LIFT',
    'SEOUL_WHEELCHAIR_RAMP_STATUS',
    'KORAIL_WEEK_PERSON_FACILITIES'
  ]);
  const scoreBreakdownFields = scoreBreakdownItem?.fields || {};
  const scoreComponents = Array.isArray(scoreBreakdownFields.components) ? scoreBreakdownFields.components : [];
  const cautionComponents = Array.isArray(scoreBreakdownFields.caution_components)
    ? scoreBreakdownFields.caution_components
    : [];
  const scoreBreakdownDescription = formatScoreBreakdownDescription(
    scoreBreakdownItem
      ? scoreBreakdownItem.description ||
        `총점은 ${scoreComponents.length || '여러'}개 항목을 동일 비중으로 계산했습니다.`
      : '점수 항목별 산정 근거는 추천 결과 상세 설명에서 확인할 수 있습니다.'
  );
  const hasCautionScoreComponent = cautionComponents.length > 0;

  return [
    [
      '점수 산정 근거',
      scoreBreakdownDescription,
      scoreBreakdownItem ? (hasCautionScoreComponent ? '주의 필요' : '접근 양호') : '확인 필요'
    ],
    [
      '교통 접근 근거',
      summarizeEvidenceGroup(
        transportationItems,
        '근무지 주변 대중교통 또는 교통약자 이동지원 데이터가',
        '주변 대중교통/이동지원 데이터는 추가 확인이 필요합니다.'
      ),
      transportationItems.length ? '접근 양호' : '주의 필요'
    ],
    [
      '보행 안전 근거',
      summarizeEvidenceGroup(
        walkingItems,
        '횡단보도, 신호등, 보행 네트워크 데이터가',
        '보행 경로 안전 데이터는 추가 확인이 필요합니다.'
      ),
      walkingItems.length ? '접근 양호' : '주의 필요'
    ],
    [
      '휠체어/편의시설 근거',
      summarizeEvidenceGroup(
        wheelchairFacilityItems,
        '리프트, 경사로 또는 철도 편의시설 데이터가',
        '휠체어 리프트/경사로 등 편의시설은 현장 확인이 필요합니다.'
      ),
      wheelchairFacilityItems.length ? '접근 양호' : '주의 필요'
    ]
  ];
};

const formatDurationMinutes = (value) => {
  const minutesValue = parseDurationMinutes(value);
  if (minutesValue === null) {
    return '';
  }

  const roundedMinutes = Math.max(0, Math.round(minutesValue));
  if (roundedMinutes >= MAX_DISPLAY_COMMUTE_MINUTES) {
    return '75시간 이상';
  }

  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (!hours) {
    return `${minutes}분`;
  }
  if (!minutes) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${minutes}분`;
};

const formatTransferCount = (value) => {
  const transferValue = toNumberOrNull(value);
  return transferValue === null ? '' : `환승 ${Math.max(0, Math.round(transferValue))}회`;
};

const formatWalkDistance = (value) => {
  const stringValue = typeof value === 'string' ? value.trim() : '';
  if (stringValue && /(?:m|km|미터|킬로미터)/i.test(stringValue)) {
    return stringValue.startsWith('도보') ? stringValue : `도보 ${stringValue}`;
  }

  const distanceValue = toNumberOrNull(value);
  if (distanceValue === null) {
    return '';
  }

  return distanceValue >= 1000 ? `도보 ${(distanceValue / 1000).toFixed(1)}km` : `도보 ${Math.round(distanceValue)}m`;
};

const resolveCommuteStats = (source, aiResult, scoreDetail) => {
  const transitTime = aiResult?.transit_time || aiResult?.transitTime || {};
  const totalMinutes = getFirstPresentValue(
    scoreDetail?.total_minutes,
    scoreDetail?.totalMinutes,
    transitTime?.duration_minutes,
    transitTime?.durationMinutes,
    aiResult?.total_minutes,
    aiResult?.totalMinutes,
    source?.totalMinutes,
    source?.total_minutes
  );
  const transferCount = getFirstPresentValue(
    scoreDetail?.transfer_count,
    scoreDetail?.transferCount,
    transitTime?.transfer_count,
    transitTime?.transferCount,
    aiResult?.transfer_count,
    aiResult?.transferCount,
    source?.transferCount,
    source?.transfer_count
  );
  const walkDistance = getFirstPresentValue(
    scoreDetail?.walk_distance_meters,
    scoreDetail?.walkDistanceMeters,
    transitTime?.walk_distance_meters,
    transitTime?.walkDistanceMeters,
    aiResult?.walk_distance_meters,
    aiResult?.walkDistanceMeters,
    source?.walkDistanceMeters,
    source?.walk_distance_meters
  );
  const walkMinutes = getFirstPresentValue(
    scoreDetail?.walk_minutes,
    scoreDetail?.walkMinutes,
    aiResult?.walk_minutes,
    aiResult?.walkMinutes,
    source?.walkMinutes,
    source?.walk_minutes
  );

  const totalText = totalMinutes != null && totalMinutes !== '' ? `총 ${formatDurationMinutes(totalMinutes)}` : '';
  const transferText = transferCount != null && transferCount !== '' ? formatTransferCount(transferCount) : '';
  const walkText = walkDistance != null && walkDistance !== ''
    ? formatWalkDistance(walkDistance)
    : walkMinutes != null && walkMinutes !== ''
      ? `도보 ${formatDurationMinutes(walkMinutes)}`
      : '';

  return [totalText, transferText, walkText];
};

const normalizeMapJob = (job, aiResults, aiEnabled, matchedAiResult, profile = null) => {
  const aiResult = aiEnabled ? matchedAiResult || findAiMapResult(aiResults, job) : null;
  const scoreDetail = aiResult?.score_detail || aiResult?.scoreDetail || {};
  const evidenceItems = normalizeEvidenceItems(aiResult?.evidence_items || aiResult?.evidenceItems);
  const recommendationReasons = Array.isArray(aiResult?.reasons) ? aiResult.reasons : [];
  const riskFactors = Array.isArray(aiResult?.risk_factors || aiResult?.riskFactors)
    ? aiResult?.risk_factors || aiResult?.riskFactors
    : [];
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
  const displayScore = totalScore ?? accessibilityScore;
  const grade = getScoreGrade(displayScore);
  const tone = getAccessibilityTone(displayScore);
  const title = getJobTitle(job) || '-';
  const company = getCompanyName(job) || '-';
  const address = getWorkAddress(job) || '-';
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
  const postingId = getJobPostId(job, job);
  const geoLatitude = getGeoLatitude(job);
  const geoLongitude = getGeoLongitude(job);
  const hasMapPoint = Boolean(geoLatitude && geoLongitude);
  const commuteStats = resolveCommuteStats(job, aiResult, scoreDetail);
  const commuteMinutes = estimateCommuteMinutes(profile, job, commuteStats);
  const evidenceDetailItems = buildEvidenceDetailItems(evidenceItems);
  const evidenceSourceSummary = getEvidenceSourceSummary(evidenceItems);

  return {
    id,
    postingId,
    externalId: getJobExternalId(job) || '',
    scrapCount: Number(getFirstPresentValue(job?.scrapCount, job?.scrap_count, aiResult?.scrapCount, aiResult?.scrap_count) || 0),
    scrappedByMe: getBooleanValue(getFirstPresentValue(job?.scrappedByMe, job?.scrapped_by_me, aiResult?.scrappedByMe, aiResult?.scrapped_by_me)),
    source: job,
    company,
    title,
    badges: [grade].filter(Boolean),
    dueLabel,
    dueDateText,
    dateRangeText: getDateRangeText(job),
    commuteMinutes,
    payText: salaryText,
    salaryType: salaryType || '-',
    employmentType: getFirstPresentValue(job?.empType, job?.emp_type, job?.employmentType, job?.employment_type) || '-',
    region,
    score: displayScore ?? '-',
    scoreDetail,
    totalScore,
    evidenceItems,
    recommendationReasons,
    riskFactors,
    jobInfo: buildJobInfo(job, recruitmentPeriodText, salaryText),
    companyInfo: {
      address
    },
    accessibilityByPersona: Object.fromEntries(
      Object.keys(MAP_PERSONAS).map((personaKey) => [
        personaKey,
        {
          panelBadge: grade,
          headline: tone.headline,
          description: tone.description,
          commuteStats,
          detailItems: [
            [
              '접근성 점수',
              displayScore === null || displayScore === undefined
                ? '점수 데이터가 없어 확인이 필요합니다.'
                : `전체 추천 점수는 ${displayScore}점이고, ${grade}에 해당됩니다.`,
              getAccessibilityStatusFromScore(displayScore)
            ],
            [
              '근무지 위치',
              buildWorkLocationSummary(address, hasMapPoint),
              hasMapPoint ? '접근 양호' : '주의 필요'
            ],
            ...evidenceDetailItems
          ],
          source: evidenceSourceSummary
        }
      ])
    ),
    mapPoint: hasMapPoint
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
      name: profile?.profileName || profile?.fullName || `프로필 ${id}`,
      description: [detail?.disabilityType, detail?.disabilitySeverity].filter(Boolean).join(' · ') || '설정된 정보 확인 필요',
      personaKey: getPersonaFromProfile(detail)
    };
  });

const getMapMarkerDisplayLabel = (label) => {
  const normalized = String(label || '이름 확인 필요')
    .replace(/\s+/g, ' ')
    .replace(/^주식회사\s*/i, '')
    .replace(/^유한회사\s*/i, '')
    .replace(/^사단법인\s*/i, '')
    .replace(/^재단법인\s*/i, '')
    .replace(/^사회복지법인\s*/i, '')
    .replace(/^㈜\s*/i, '')
    .replace(/^\(주\)\s*/i, '')
    .trim();

  if ([...normalized].length <= 14) {
    return normalized;
  }

  return `${[...normalized].slice(0, 13).join('')}...`;
};

const buildMapViewport = (jobs, selectedJob) => {
  const centerPoint = selectedJob?.mapPoint || jobs.find((job) => job.mapPoint)?.mapPoint;
  if (!centerPoint) {
    return MAP_DEFAULT_VIEWPORT;
  }

  return {
    center: centerPoint,
    zoom: 16
  };
};

const getMapMarkerTone = (score) => {
  const scoreNumber = getScoreNumber(score);
  if (scoreNumber === null) {
    return 'warning';
  }
  if (scoreNumber >= 80) {
    return 'good';
  }
  if (scoreNumber >= 60) {
    return 'warning';
  }
  return 'danger';
};

const buildMapMarkers = (jobs, selectedJobId) =>
  jobs
    .filter((job) => job.mapPoint)
    .map((job) => ({
      id: job.id,
      label: job.company,
      displayLabel: getMapMarkerDisplayLabel(job.company),
      score: getScoreNumber(job.score),
      tone: getMapMarkerTone(job.score),
      isSelected: job.id === selectedJobId,
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
    id: COMMUTABLE_FILTER_ID,
    hidden: true,
    defaultValue: true,
    selectedValue: Boolean(selectedFilters[COMMUTABLE_FILTER_ID])
  },
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
    selectedValue: selectedFilters[COMMUTABLE_FILTER_ID] ? FILTER_ALL_VALUE : selectedFilters.region || FILTER_ALL_VALUE,
    disabled: Boolean(selectedFilters[COMMUTABLE_FILTER_ID])
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

const filterJobsByMapSearchQuery = (jobs, searchQuery) => {
  const terms = getComparableTerms(searchQuery);
  if (!terms.length) {
    return jobs;
  }

  return jobs.filter((job) => {
    const source = job.source || {};
    const searchableText = [
      job.title,
      job.company,
      job.region,
      job.companyInfo?.address,
      getJobTitle(source),
      getCompanyName(source),
      getWorkAddress(source)
    ].filter(Boolean).join(' ');

    return includesAnyTerm(searchableText, terms);
  });
};

export const filterAccessibilityMapJobs = (jobs, selectedFilters, jobCategories = [], selectedProfile = null) =>
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
      (selectedFilters[COMMUTABLE_FILTER_ID] || !regionTerms.length || includesAnyTerm(regionText, regionTerms)) &&
      (!selectedFilters[COMMUTABLE_FILTER_ID] || isCommutableJob(job, selectedProfile)) &&
      (!salaryTerms.length || selectedFilters.salaryType === FILTER_ALL_VALUE || includesAnyTerm(job.salaryType || getFirstPresentValue(source.salaryType, source.salary_type), salaryTerms))
    );
  });

const sortJobsByAccessibility = (jobs) =>
  [...jobs].sort((left, right) => (getScoreNumber(right.score) ?? -1) - (getScoreNumber(left.score) ?? -1));

const getRegisteredDateNumber = (job) => {
  const source = job?.source || {};
  const raw = getLastDateValue(
    getFirstPresentValue(
      source?.offerregDt,
      source?.offerreg_dt,
      source?.regDt,
      source?.reg_dt,
      source?.registeredAt,
      source?.registered_at
    )
  );
  return raw ? Number(raw) : -1;
};

const sortMapJobs = (jobs, sortMode) => {
  if (sortMode === 'latest_desc') {
    return [...jobs].sort((left, right) => getRegisteredDateNumber(right) - getRegisteredDateNumber(left));
  }
  return sortJobsByAccessibility(jobs);
};

const buildExplainPayload = ({ job, profileId, profile }) => {
  const source = job?.source || {};
  const recruitmentContext = getRecruitmentContext(source);
  const scoreDetail = job?.scoreDetail || {};
  const jobPostId = getJobPostId(source, job);
  const sourceId = getFirstInteger(source.sourceId, source.source_id, source.id, jobPostId);
  const totalScore = toIntegerOrNull(job?.totalScore ?? job?.score);
  const salaryType = getFirstPresentValue(source.salaryType, source.salary_type);
  const jobFitScore =
    toIntegerOrNull(scoreDetail?.job_fit_score) ?? toIntegerOrNull(scoreDetail?.jobFitScore) ?? totalScore ?? 0;
  const companyName = toSafeText(
    getFirstPresentValue(
      job?.company,
      source?.company_name,
      source?.companyName,
      source?.busplaName,
      source?.buspla_name
    ),
    ''
  );
  const jobTitle = toSafeText(
    getFirstPresentValue(
      job?.title,
      source?.job_title,
      source?.jobTitle,
      source?.jobNm,
      source?.job_nm
    ),
    ''
  );

  if (!companyName || !jobTitle || !profileId) {
    return null;
  }

  const normalizedProfileId = Number(profileId);
  const normalizedJobPostId = getFirstInteger(jobPostId, sourceId, 0) ?? 0;

  const explainProfile = {
    profile_id: Number.isFinite(normalizedProfileId) ? normalizedProfileId : null,
    user_id: Number.isFinite(Number(profile?.userId)) ? Number(profile.userId) : null,
    name: toNullableText(profile?.fullName || profile?.name),
    address: toNullableText(profile?.detailAddress || profile?.address),
    desired_jobs: [profile?.targetJob, profile?.desiredJob].filter((item) => toNullableText(item)),
    skills: splitToList(profile?.skills),
    education: toNullableText(profile?.highestEducation || profile?.educationSummary),
    career: toNullableText(profile?.careerSummary || profile?.majorCareer),
    major: toNullableText(profile?.majorCareer),
    licenses: splitToList(profile?.certifications),
    job_fit_statement: toNullableText(profile?.jobFitDescription),
    available_employment_types: splitToList(profile?.workTypes),
    desired_salary: extractInteger(profile?.expectedSalary),
    time_preference: toNullableText(profile?.workTimePreference),
    remote_work: typeof profile?.remoteAvailableYn === 'boolean' ? profile.remoteAvailableYn : null,
    disability_types: profile?.disabilityType ? [profile.disabilityType] : [],
    disability_severity: toNullableText(profile?.disabilitySeverity),
    is_registered_disabled: typeof profile?.disabilityRegisteredYn === 'boolean' ? profile.disabilityRegisteredYn : null,
    disability_description: toNullableText(profile?.disabilityDescription),
    assistive_devices: splitToList(profile?.assistiveDevices),
    required_supports: splitToList(profile?.requiredSupports || profile?.workSupportRequirements)
  };

  const evidenceItems = normalizeEvidenceItems(job?.evidenceItems);
  const recommendationReasons = Array.isArray(job?.recommendationReasons) ? job.recommendationReasons : [];
  const riskFactors = Array.isArray(job?.riskFactors) ? job.riskFactors : [];

  const explainJob = {
    job_post_id: normalizedJobPostId,
    company_name: companyName,
    job_title: jobTitle,
    work_address: toNullableText(getWorkAddress(source) || job.companyInfo.address),
    work_lat: getGeoLatitude(source) ?? null,
    work_lng: getGeoLongitude(source) ?? null,
    employment_type: toNullableText(getFirstPresentValue(source.empType, source.emp_type, source.employmentType, source.employment_type) || job.employmentType),
    enter_type: toNullableText(getFirstPresentValue(source.enterType, source.enter_type)),
    salary_type: toNullableText(salaryType),
    salary: toNullableText(source.salary),
    term_date: toNullableText(getJobDateField(source, 'termDate', 'term_date')),
    required_career: toNullableText(
      getFirstPresentValue(
        source.reqCareer,
        source.req_career,
        source.requiredCareer,
        source.required_career,
        recruitmentContext.req_career,
        recruitmentContext.reqCareer
      )
    ),
    required_education: toNullableText(
      getFirstPresentValue(
        source.reqEduc,
        source.req_educ,
        source.requiredEducation,
        source.required_education,
        recruitmentContext.req_educ,
        recruitmentContext.reqEduc
      )
    ),
    required_major: toNullableText(
      getFirstPresentValue(
        source.reqMajor,
        source.req_major,
        source.requiredMajor,
        source.required_major,
        recruitmentContext.req_major,
        recruitmentContext.reqMajor
      )
    ),
    required_licenses: toNullableText(
      getFirstPresentValue(
        source.reqLicens,
        source.req_licens,
        source.requiredLicenses,
        source.required_licenses,
        recruitmentContext.req_licens,
        recruitmentContext.reqLicens
      )
    ),
    agency_name: toNullableText(
      getFirstPresentValue(source.agencyName, source.agency_name, recruitmentContext.regagn_name, recruitmentContext.regagnName)
    ),
    registered_at: toNullableText(getJobDateField(source, 'regDt', 'reg_dt') || getJobDateField(source, 'offerregDt', 'offerreg_dt')),
    source_table: source.sourceTable || source.source_table || 'pd_kepad_recruitment',
    source_id: sourceId
  };

  const explainScoreDetail = buildExplainScoreDetail(scoreDetail);

  return {
    profile: explainProfile,
    job: explainJob,
    score_detail: explainScoreDetail,
    total_score: totalScore,
    job_fit_score: jobFitScore,
    reasons: recommendationReasons.length
      ? recommendationReasons
      : [`추천 지도 기준 총점은 ${job.totalScore ?? job.score}점입니다.`],
    risk_factors: riskFactors.length
      ? riskFactors
      : ['출퇴근 경로와 사업장 접근성 세부 정보는 지원 전 확인이 필요합니다.'],
    evidence_items: evidenceItems
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
    return jobs.map((job) => ({ job, aiResult: findAiMapResult(aiResults, job) }));
  }

  return aiResults
    .map((result) => result?.job ? { job: result.job, aiResult: result } : null)
    .filter(Boolean);
};

export const buildRecommendationStateFromPayload = (payload, aiEnabled = Boolean(payload?.aiEnabled ?? payload?.ai_enabled), profile = null) => {
  const aiResults = getPayloadAiResults(payload);
  const jobEntries = getPayloadJobs(payload, aiResults);
  const jobs = jobEntries.map(({ job, aiResult }) => normalizeMapJob(job, aiResults, aiEnabled, aiResult, profile));

  return {
    status: jobs.length ? 'success' : 'empty',
    error: '',
    payload,
    jobs
  };
};

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

  for (let offset = 0; offset < MAP_MAX_RESULTS; offset += MAP_PAGE_SIZE) {
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
    if (cachedState.jobs.length < MAP_PAGE_SIZE) {
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
    jobs: jobs.slice(0, MAP_MAX_RESULTS)
  };
};

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
  const [recommendationState, setRecommendationState] = useState({
    status: 'idle',
    error: '',
    payload: null,
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
    loadingTarget = Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS - offset)
  }) => {
    const incomingJobs = Array.isArray(nextState?.jobs) ? nextState.jobs.slice(0, MAP_MAX_RESULTS - offset) : [];

    if (!incomingJobs.length) {
      setRecommendationState((prev) => ({
        ...prev,
        status: replace ? 'empty' : prev.jobs.length ? 'success' : 'empty',
        error: '',
        payload: nextState?.payload || prev.payload,
        jobs: replace ? [] : prev.jobs
      }));
      setProfileOffPageState({
        hasMore: false,
        isLoadingMore: false,
        nextOffset: Math.min(offset, MAP_MAX_RESULTS),
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
          : [...baseJobs, job].slice(0, MAP_MAX_RESULTS);

        return {
          ...prev,
          status: keepLoading || loadingMore || showLoadingDuringAppend ? 'refetching' : 'success',
          error: '',
          payload: nextState.payload,
          jobs: mergedJobs
        };
      });
      if (didAppendJob) {
        setProfileOffPageState({
          hasMore: false,
          isLoadingMore: loadingMore,
          nextOffset: Math.min(offset + incomingJobs.length, MAP_MAX_RESULTS),
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
      payload: nextState.payload
    }));
    setProfileOffPageState({
      hasMore: keepLoading ? false : Boolean(hasMore) && offset + incomingJobs.length < MAP_MAX_RESULTS,
      isLoadingMore: keepLoading ? loadingMore : false,
      nextOffset: Math.min(offset + incomingJobs.length, MAP_MAX_RESULTS),
      loadingLoaded: Math.min(Math.max(0, offset + incomingJobs.length - offset), loadingTarget),
      loadingTarget
    });
  }, []);

  const applyMapStateImmediately = useCallback(({ nextState, replace = false, offset = 0, hasMore = false }) => {
    const incomingJobs = Array.isArray(nextState?.jobs) ? nextState.jobs.slice(0, MAP_MAX_RESULTS - offset) : [];

    setRecommendationState((prev) => {
      const baseJobs = replace ? [] : prev.jobs;
      const existingIds = new Set(baseJobs.map((job) => job.id));
      const mergedJobs = replace
        ? incomingJobs.slice(0, MAP_MAX_RESULTS)
        : [
            ...baseJobs,
            ...incomingJobs.filter((job) => !existingIds.has(job.id))
          ].slice(0, MAP_MAX_RESULTS);

      return {
        ...prev,
        status: mergedJobs.length ? 'success' : 'empty',
        error: '',
        payload: nextState?.payload || prev.payload,
        jobs: mergedJobs
      };
    });
    setProfileOffPageState({
      hasMore: Boolean(hasMore) && offset + incomingJobs.length < MAP_MAX_RESULTS,
      isLoadingMore: false,
      nextOffset: Math.min(offset + incomingJobs.length, MAP_MAX_RESULTS),
      loadingLoaded: 0,
      loadingTarget: Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS - offset)
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
            hasMore: cachedState.jobs.length < MAP_MAX_RESULTS && cachedState.jobs.length % MAP_PAGE_SIZE === 0,
            isLoadingMore: false,
            nextOffset: Math.min(cachedState.jobs.length, MAP_MAX_RESULTS),
            loadingLoaded: 0,
            loadingTarget: MAP_PAGE_SIZE
          });
        }
        return;
      }

      setProfileOffPageState({ hasMore: false, isLoadingMore: false, nextOffset: 0, loadingLoaded: 0, loadingTarget: Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS) });
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
            limit: MAP_PAGE_SIZE,
            offset: 0
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
                loadingTarget: Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS)
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
            hasMore: nextState.jobs.length > 0 && nextState.jobs.length < MAP_MAX_RESULTS && nextState.jobs.length % MAP_PAGE_SIZE === 0
          });
        } else {
          await appendMapJobsIncrementally({
            nextState,
            replace: false,
            offset: 0,
            hasMore: nextState.jobs.length === MAP_PAGE_SIZE && nextState.jobs.length < MAP_MAX_RESULTS,
            signal: controller.signal,
            showLoadingDuringAppend: true,
            loadingTarget: Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS)
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
      !profileOffPageState.hasMore ||
      profileOffPageState.isLoadingMore ||
      recommendationState.status !== 'success'
    ) {
      return;
    }

    const offset = profileOffPageState.nextOffset;
    if (offset >= MAP_MAX_RESULTS) {
      setProfileOffPageState((prev) => ({ ...prev, hasMore: false, isLoadingMore: false, loadingLoaded: 0 }));
      return;
    }

    const loadingTarget = Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS - offset);
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
          hasMore: cachedState.jobs.length === MAP_PAGE_SIZE && offset + cachedState.jobs.length < MAP_MAX_RESULTS
        });
        return;
      }

      let hasProgressResult = false;
      const completedResult = await requestMapRecommendationResult(
          callWithAuth,
          {
            aiEnabled: appliedAiEnabled,
            profileId: appliedAiEnabled ? selectedProfileId : undefined,
            limit: Math.min(MAP_PAGE_SIZE, MAP_MAX_RESULTS - offset),
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
          hasMore: nextState.jobs.length === MAP_PAGE_SIZE && offset + nextState.jobs.length < MAP_MAX_RESULTS
        });
      } else {
        await appendMapJobsIncrementally({
          nextState,
          replace: false,
          offset,
          hasMore: nextState.jobs.length === MAP_PAGE_SIZE && offset + nextState.jobs.length < MAP_MAX_RESULTS,
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
    selectedProfile,
    selectedProfileId,
    selectedProfileScoringSignature,
    selectedFilters
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
  }, [appliedAiEnabled, callWithAuth, recommendationState.status, selectedJob, selectedProfile, selectedProfileId, selectedProfileScoringSignature]);

  const reloadRecommendations = useCallback(() => {
    clearRecommendationCache();
    setReloadKey((current) => current + 1);
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
    target: Math.max(1, Math.min(profileOffPageState.loadingTarget || MAP_PAGE_SIZE, MAP_PAGE_SIZE))
  };

  return {
    jobs: filteredJobs,
    totalJobCount: profileOffPageState.hasMore ? MAP_MAX_RESULTS : allJobs.length,
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
    explanation: explanationState.data,
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
