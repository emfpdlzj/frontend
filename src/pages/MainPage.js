import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { noticeApi } from '../api/noticeApi';
import { postingApi } from '../api/postingApi';
import { profileApi } from '../api/profileApi';
import { explainRecommendation, fetchQuickJobRecommendations, fetchRecommendTaskStatus } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from '../cache/dailyCacheExpiry';
import { getCachedRecommendation, getRecommendationCacheKey, setCachedRecommendation } from '../cache/recommendationCache';
import { useJobFilterOptions } from '../hooks/useJobFilterOptions';
import arrowDown from '../assets/accessibility-map/arrow_down.png';
import profileIcon from '../assets/accessibility-map/profile-icon.png';
import settingIcon from '../assets/accessibility-map/setting-icon.png';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';
import { formatRecommendationExplanationList, formatRecommendationExplanationText } from '../utils/recommendationExplanationText';
import { getProfileScoringSignature } from '../utils/profileScoringSignature';
import { filterAccessibilityMapJobs } from '../hooks/useAccessibilityMap';
import { LoginModal } from '../components/auth/LoginModal';
import { DefinitionGrid } from '../components/jobs/JobDetailPanel';
import { AccessibilityScoreHelpButton } from '../components/accessibility-map/AccessibilityMapDetailPanel';
import { LlmExplanationProgress } from '../components/common/LlmExplanationProgress';
import { translateUiText } from '../i18n/uiTextTranslations';

const FILTER_ALL_VALUE = '전체';
const RECOMMEND_TASK_POLL_INTERVAL_MS = 2500;
const RECOMMEND_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;
const POPULAR_AUTOPLAY_INTERVAL_MS = 3600;
const QUICK_PAGE_SIZE = 20;
const QUICK_MAX_RESULTS = 100;
const QUICK_PENDING_TASK_STORAGE_KEY = 'bridgework.quick.pending.task';
const QUICK_EXPLAIN_CACHE_STORAGE_KEY = 'bridgework.quick.explain.cache.v2';

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;
const getTaskRequestId = (payload) => payload?.requestId || payload?.request_id || payload?.id || '';
const getTaskStatus = (payload) => payload?.status || payload?.taskStatus || payload?.task_status || '';
const getTaskErrorMessage = (payload) => payload?.errorMessage || payload?.error_message || payload?.message || '';
const normalizeTaskPayload = (payload) => {
  if (!payload) {
    return null;
  }

  // 추천 태스크 응답은 requestId/status/result를 최상위에 유지해야 하므로 이중 언랩을 방지한다.
  if (payload.requestId || payload.request_id || payload.status || payload.taskStatus || payload.task_status) {
    return payload;
  }

  return unwrapApiResult(payload);
};
const isDirectQuickResultPayload = (payload) =>
  Boolean(payload) && (
    Array.isArray(payload.results)
    || Array.isArray(payload.jobs)
    || Array.isArray(payload?.aiResponse?.result?.results)
  );

const readPendingQuickTask = () => {
  try {
    const raw = window.localStorage.getItem(QUICK_PENDING_TASK_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.requestId || isDailyCacheExpired(parsed.expiresAt)) {
      window.localStorage.removeItem(QUICK_PENDING_TASK_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

const writePendingQuickTask = (requestId, profileId, aiEnabled, filters) => {
  try {
    window.localStorage.setItem(
      QUICK_PENDING_TASK_STORAGE_KEY,
      JSON.stringify({
        requestId,
        profileId,
        aiEnabled,
        filters,
        expiresAt: getNextDailyCacheExpiryAt(),
        updatedAt: Date.now()
      })
    );
  } catch (error) {
    // 저장 실패는 동작을 막지 않는다.
  }
};

const clearPendingQuickTask = () => {
  try {
    window.localStorage.removeItem(QUICK_PENDING_TASK_STORAGE_KEY);
  } catch (error) {
    // 제거 실패는 동작을 막지 않는다.
  }
};

const readQuickExplainCache = () => {
  try {
    const raw = window.localStorage.getItem(QUICK_EXPLAIN_CACHE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const entries = Object.entries(parsed).filter(([, entry]) => (
      entry &&
      typeof entry === 'object' &&
      !isDailyCacheExpired(entry.expiresAt) &&
      entry.payload
    ));
    const nextCache = Object.fromEntries(entries);
    if (entries.length !== Object.keys(parsed).length) {
      window.localStorage.setItem(QUICK_EXPLAIN_CACHE_STORAGE_KEY, JSON.stringify(nextCache));
    }
    return nextCache;
  } catch (error) {
    return {};
  }
};

const getCachedQuickExplain = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }
  const cache = readQuickExplainCache();
  return cache[cacheKey]?.payload || null;
};

const setCachedQuickExplain = (cacheKey, payload) => {
  if (!cacheKey || !payload) {
    return;
  }
  const cache = readQuickExplainCache();
  cache[cacheKey] = {
    expiresAt: getNextDailyCacheExpiryAt(),
    payload
  };
  try {
    window.localStorage.setItem(QUICK_EXPLAIN_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    // 저장 실패는 동작을 막지 않는다.
  }
};

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

const formatHomeNoticeDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const getDateNumber = (value) => {
  const raw = String(value ?? '').replace(/\D/g, '');
  return raw.length === 8 ? Number(raw) : 0;
};

const getRegionFromAddress = (address) => {
  const tokens = String(address ?? '').trim().split(/\s+/).filter(Boolean);
  return tokens[0] || '없음';
};

const KNOWN_DISTRICT_COORDINATES = {
  강남구: { latitude: 37.5172, longitude: 127.0473 },
  강동구: { latitude: 37.5301, longitude: 127.1238 },
  강북구: { latitude: 37.6396, longitude: 127.0257 },
  강서구: { latitude: 37.5509, longitude: 126.8495 },
  관악구: { latitude: 37.4784, longitude: 126.9516 },
  광진구: { latitude: 37.5385, longitude: 127.0823 },
  구로구: { latitude: 37.4955, longitude: 126.8877 },
  금천구: { latitude: 37.4569, longitude: 126.8958 },
  노원구: { latitude: 37.6542, longitude: 127.0568 },
  도봉구: { latitude: 37.6688, longitude: 127.0471 },
  동대문구: { latitude: 37.5744, longitude: 127.0396 },
  동작구: { latitude: 37.5124, longitude: 126.9393 },
  마포구: { latitude: 37.5663, longitude: 126.9016 },
  서대문구: { latitude: 37.5791, longitude: 126.9368 },
  서초구: { latitude: 37.4837, longitude: 127.0324 },
  성동구: { latitude: 37.5633, longitude: 127.0371 },
  성북구: { latitude: 37.5894, longitude: 127.0167 },
  송파구: { latitude: 37.5145, longitude: 127.1059 },
  양천구: { latitude: 37.5169, longitude: 126.8664 },
  영등포구: { latitude: 37.5264, longitude: 126.8963 },
  용산구: { latitude: 37.5326, longitude: 126.9904 },
  은평구: { latitude: 37.6176, longitude: 126.9227 },
  종로구: { latitude: 37.5735, longitude: 126.9788 },
  중구: { latitude: 37.5636, longitude: 126.9976 },
  중랑구: { latitude: 37.6063, longitude: 127.0927 }
};

const parseAddressDistrict = (address) => {
  const tokens = String(address ?? '').trim().split(/\s+/).filter(Boolean);
  return tokens.find((token) => /[가-힣]+구$/.test(token)) || '';
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const resolveAddressCoordinate = (address) => KNOWN_DISTRICT_COORDINATES[parseAddressDistrict(address)] || null;

const getDistanceKm = (from, to) => {
  if (!from || !to) {
    return null;
  }

  const earthRadiusKm = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const formatCommuteEstimate = (minutes) => {
  if (!Number.isFinite(minutes)) {
    return '확인 필요';
  }
  return `${Math.max(10, Math.round(minutes / 5) * 5)}분`;
};

const estimateCommuteMinutes = (profile, job) => {
  const explicitMinutes = toNumberOrNull(
    job?.totalMinutes
    ?? job?.total_minutes
    ?? job?.commuteMinutes
    ?? job?.commute_minutes
  );
  if (explicitMinutes !== null) {
    return { label: formatCommuteEstimate(explicitMinutes), source: 'provided' };
  }

  const homeAddress = firstNonBlank(profile?.detailAddress, profile?.address);
  const homeCoordinate = resolveAddressCoordinate(homeAddress);
  const workCoordinate = (
    toNumberOrNull(job?.workLatitude) !== null && toNumberOrNull(job?.workLongitude) !== null
      ? { latitude: toNumberOrNull(job.workLatitude), longitude: toNumberOrNull(job.workLongitude) }
      : resolveAddressCoordinate(job?.location)
  );
  const distanceKm = getDistanceKm(homeCoordinate, workCoordinate);

  if (distanceKm === null) {
    return { label: '확인 필요', source: 'missing' };
  }

  const homeDistrict = parseAddressDistrict(homeAddress);
  const workDistrict = parseAddressDistrict(job?.location);
  if (homeDistrict && workDistrict && homeDistrict === workDistrict) {
    return { label: formatCommuteEstimate(20 + distanceKm * 4), source: 'estimated' };
  }

  return { label: formatCommuteEstimate(18 + distanceKm * 5.2), source: 'estimated' };
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
  const baseName = profile.profileName || profile.fullName || profile.name || `프로필 ${getProfileId(profile)}`;
  const targetJob = profile.targetJob || profile.desiredJob;
  return targetJob ? `${baseName} · ${targetJob}` : baseName;
};
const getProfileDisplayName = (profile) => {
  if (!profile) {
    return '';
  }
  return profile.profileName || profile.fullName || (getProfileId(profile) ? `프로필 ${getProfileId(profile)}` : '');
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
  region: getRegionFromAddress(item?.workAddress),
  employmentType: toSafeText(item?.employmentType),
  salaryText: [item?.salaryType, item?.salary].filter(Boolean).join(' ') || '없음',
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
  envBothHands: toSafeText(detail?.envBothHands),
  envEyesight: toSafeText(detail?.envEyesight),
  envLstnTalk: toSafeText(detail?.envLstnTalk),
  envHandWork: toSafeText(detail?.envHandWork),
  envLiftPower: toSafeText(detail?.envLiftPower),
  envStndWalk: toSafeText(detail?.envStndWalk),
  salaryType: toSafeText(detail?.salaryType),
  salary: toSafeText(detail?.salary),
  salaryText: [detail?.salaryType, detail?.salary].filter(Boolean).join(' ') || '없음',
  termDate: detail?.termDate || '',
  dueLabel: getDday(detail?.termDate),
  offerRegisteredAt: parseDateText(detail?.offerRegisteredAt),
  registeredAt: parseDateText(detail?.registeredAt),
  requiredCareer: toSafeText(detail?.requiredCareer),
  requiredEducation: toSafeText(detail?.requiredEducation),
  requiredMajor: toSafeText(detail?.requiredMajor),
  requiredLicenses: toSafeText(detail?.requiredLicenses),
  agencyName: toSafeText(detail?.agencyName),
  rno: toSafeText(detail?.rno),
  rnum: toSafeText(detail?.rnum),
  geoOriginalAddress: toSafeText(detail?.geoOriginalAddress),
  geoMatchedAddress: toSafeText(detail?.geoMatchedAddress),
  geoLatitude: detail?.geoLatitude,
  geoLongitude: detail?.geoLongitude,
  postingStatus: detail?.postingStatus || 'ACTIVE',
  closedAt: toSafeText(detail?.closedAt),
  statusUpdatedAt: toSafeText(detail?.statusUpdatedAt),
  createdAt: toSafeText(detail?.createdAt),
  updatedAt: toSafeText(detail?.updatedAt),
  scrapCount: Number(detail?.scrapCount || 0),
  scrappedByMe: Boolean(detail?.scrappedByMe)
});

const toNullableText = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const firstNonBlank = (...values) => {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) {
      return text;
    }
  }
  return '';
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

const resolveQuickExplainJobPostId = (job) => {
  const source = job?.source || {};
  const candidate = source.sourceId ?? source.source_id ?? job?.postingId ?? null;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildQuickExplainPayload = ({ job, profile, detail }) => {
  const profileId = Number(profile?.profileId ?? profile?.id ?? 0);
  const jobPostId = resolveQuickExplainJobPostId(job);
  const companyName = firstNonBlank(
    detail?.companyName,
    job?.company,
    job?.companyName,
    job?.source?.busplaName,
    job?.source?.companyName
  );
  const jobTitle = firstNonBlank(
    detail?.jobTitle,
    job?.title,
    job?.jobTitle,
    job?.source?.jobNm,
    job?.source?.jobTitle
  );
  const workAddress = firstNonBlank(
    detail?.workAddress,
    job?.location,
    job?.workAddress,
    job?.source?.compAddr
  );

  if (!companyName || !jobTitle) {
    return null;
  }

  const normalizedJobPostId = Number.isFinite(Number(jobPostId)) ? Number(jobPostId) : 0;

  const explainJob = {
    job_post_id: normalizedJobPostId,
    company_name: companyName,
    job_title: jobTitle,
    work_address: toNullableText(workAddress),
    work_lat: null,
    work_lng: null,
    employment_type: toNullableText(detail?.employmentType || job?.employmentType),
    enter_type: toNullableText(detail?.enterType || job?.source?.enterType),
    salary_type: toNullableText(detail?.salaryType || job?.salaryType),
    salary: toNullableText(detail?.salary || job?.salary),
    term_date: toNullableText(detail?.termDate || job?.termDate),
    required_career: toNullableText(detail?.requiredCareer || job?.requiredCareer),
    required_education: toNullableText(detail?.requiredEducation || job?.requiredEducation),
    required_major: toNullableText(detail?.requiredMajor || job?.source?.reqMajor),
    required_licenses: toNullableText(detail?.requiredLicenses || job?.source?.reqLicens),
    agency_name: toNullableText(detail?.agencyName || job?.agencyName),
    registered_at: toNullableText(detail?.registeredAt || job?.registeredAt),
    source_table: 'pd_kepad_recruitment',
    source_id: normalizedJobPostId
  };

  const explainProfile = {
    profile_id: Number.isFinite(profileId) && profileId > 0 ? profileId : null,
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

  return {
    profile: explainProfile,
    job: explainJob,
    job_fit_score: typeof job?.fitScore === 'number' ? job.fitScore : null,
    reasons: normalizeQuickList(job?.recommendationReasons),
    risk_factors: normalizeQuickList(job?.riskFactors),
    evidence_items: normalizeQuickEvidenceItems(job?.evidenceItems)
  };
};

const toQuickFallbackDetail = (job) => ({
  postingId: Number.isFinite(Number(job?.postingId)) ? Number(job.postingId) : null,
  externalId: toSafeText(job?.externalId),
  companyName: toSafeText(job?.company),
  jobTitle: toSafeText(job?.title),
  workAddress: toSafeText(job?.location),
  contactNumber: '없음',
  employmentType: toSafeText(job?.employmentType),
  enterType: toSafeText(job?.source?.enterType),
  envBothHands: '없음',
  envEyesight: '없음',
  envLstnTalk: '없음',
  envHandWork: '없음',
  envLiftPower: '없음',
  envStndWalk: '없음',
  salaryType: toSafeText(job?.salaryType),
  salary: toSafeText(job?.salary),
  salaryText: toSafeText(job?.salary),
  termDate: job?.termDate || '',
  dueLabel: getDday(job?.termDate),
  offerRegisteredAt: '',
  registeredAt: job?.registeredDateText || '없음',
  requiredCareer: toSafeText(job?.requiredCareer),
  requiredEducation: toSafeText(job?.requiredEducation),
  requiredMajor: toSafeText(job?.source?.reqMajor),
  requiredLicenses: toSafeText(job?.source?.reqLicens),
  agencyName: toSafeText(job?.agencyName),
  rno: '없음',
  rnum: '없음',
  geoOriginalAddress: '없음',
  geoMatchedAddress: '없음',
  geoLatitude: null,
  geoLongitude: null,
  postingStatus: 'ACTIVE',
  closedAt: '없음',
  statusUpdatedAt: '없음',
  createdAt: '없음',
  updatedAt: '없음',
  scrapCount: Number(job?.scrapCount || 0),
  scrappedByMe: Boolean(job?.scrappedByMe)
});

const getQuickFitScore = (item) => {
  const score = item?.job_fit_score ?? item?.jobFitScore ?? item?.score;
  return typeof score === 'number' && Number.isFinite(score) ? score : null;
};

function normalizeQuickList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeQuickEvidenceItems(value) {
  return normalizeQuickList(value).map((item) => ({
    source_type: item?.source_type || item?.sourceType || '',
    source_name: item?.source_name || item?.sourceName || '',
    description: item?.description || '',
    distance_meters: item?.distance_meters ?? item?.distanceMeters ?? null,
    source_table: item?.source_table || item?.sourceTable || null,
    record_id: item?.record_id ?? item?.recordId ?? null,
    fields: item?.fields && typeof item.fields === 'object' ? item.fields : {}
  })).filter((item) => item.source_type && item.source_name);
}


const getQuickGrade = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null;
  }
  if (score >= 80) {
    return 'A등급';
  }
  if (score >= 60) {
    return 'B등급';
  }
  return 'C등급';
};

const getQuickGradeClassName = (grade) => {
  if (grade === 'A등급') {
    return 'is-grade-a';
  }
  if (grade === 'B등급') {
    return 'is-grade-b';
  }
  if (grade === 'C등급') {
    return 'is-grade-c';
  }
  return '';
};

const getQuickScoreTone = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 'neutral';
  }
  if (score >= 80) {
    return 'good';
  }
  if (score >= 60) {
    return 'warning';
  }
  return 'danger';
};

const getQuickScoreHeadline = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return '확인 필요';
  }
  if (score >= 80) {
    return '높은 적합도';
  }
  if (score >= 60) {
    return '검토 가능';
  }
  return '추가 확인 필요';
};

const getScoreRingOffset = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 100;
  }
  return 100 - Math.max(0, Math.min(100, score));
};

function ScoreRing({
  className,
  score,
  animationKey = 0,
  enableAnimation = true,
  scoreRingRef = null
}) {
  return (
    <div
      ref={scoreRingRef}
      className={`${className || ''}${enableAnimation ? '' : ' score-ring--no-animate'}`.trim()}
      style={{ '--score-ring-offset': String(getScoreRingOffset(score)) }}
      aria-label={typeof score === 'number' ? `${score}점` : '점수 확인 필요'}
    >
      <svg className="score-ring__chart" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="score-ring__track" cx="60" cy="60" r="52" />
        <circle key={`${animationKey}-${score ?? 'empty'}`} className="score-ring__value" cx="60" cy="60" r="52" pathLength="100" />
      </svg>
      <strong>{typeof score === 'number' ? score : '-'}</strong>
      <span>{typeof score === 'number' ? '/ 100' : ''}</span>
    </div>
  );
}

function VisibilityTriggeredScoreRing({ className, score, observeKey }) {
  const scoreRingRef = useRef(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [enableAnimation, setEnableAnimation] = useState(false);

  useEffect(() => {
    setAnimationKey(0);
    setEnableAnimation(false);
  }, [observeKey, score]);

  useEffect(() => {
    const target = scoreRingRef.current;
    if (!target || enableAnimation) {
      return undefined;
    }

    if (typeof window.IntersectionObserver !== 'function') {
      setEnableAnimation(true);
      setAnimationKey((previous) => previous + 1);
      return undefined;
    }

    let frameId = 0;
    // 점수 링이 화면에 처음 보일 때만 애니메이션을 시작한다.
    const observer = new window.IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) {
        return;
      }
      observer.disconnect();
      frameId = window.requestAnimationFrame(() => {
        setEnableAnimation(true);
        setAnimationKey((previous) => previous + 1);
      });
    }, { threshold: 0.35 });

    observer.observe(target);

    return () => {
      observer.disconnect();
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [enableAnimation]);

  return (
    <ScoreRing
      className={className}
      score={score}
      animationKey={animationKey}
      enableAnimation={enableAnimation}
      scoreRingRef={scoreRingRef}
    />
  );
}

const normalizeQuickJob = (item, index) => {
  const job = item?.job || item;
  const scoreDetail = item?.score_detail || item?.scoreDetail || {};
  const postingIdCandidate = job?.job_post_id ?? job?.jobPostId ?? job?.source_id ?? job?.sourceId ?? null;
  const postingId = Number.isFinite(Number(postingIdCandidate)) ? Number(postingIdCandidate) : null;
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
  const fitGrade = getQuickGrade(fitScore);
  const fitTone = getQuickScoreTone(fitScore);
  const scrapCount = Number(item?.scrapCount ?? item?.scrap_count ?? job?.scrapCount ?? job?.scrap_count ?? 0);

  return {
    id: String(externalId || `${companyName}-${jobTitle}-${index}`),
    postingId,
    externalId: externalId || '',
    company: companyName,
    title: jobTitle,
    location: workAddress,
    employmentType,
    salaryType: salaryType || '없음',
    salary: [salaryType, salary].filter(Boolean).join(' ') || '없음',
    dueLabel: getDday(termDate),
    termDate,
    registeredAt,
    registeredDateText: parseDateText(registeredAt),
    fitScore,
    fitLabel: typeof fitScore === 'number' ? `${fitScore}점` : '없음',
    fitGrade,
    fitTone,
    scrapCount: Number.isFinite(scrapCount) ? scrapCount : 0,
    scrappedByMe: Boolean(item?.scrappedByMe ?? item?.scrapped_by_me ?? job?.scrappedByMe ?? job?.scrapped_by_me),
    recommendationReasons: normalizeQuickList(item?.reasons || item?.recommendationReasons),
    riskFactors: normalizeQuickList(item?.risk_factors || item?.riskFactors),
    evidenceItems: normalizeQuickEvidenceItems(item?.evidence_items || item?.evidenceItems || job?.evidence_items || job?.evidenceItems),
    totalMinutes: item?.total_minutes ?? item?.totalMinutes ?? scoreDetail?.total_minutes ?? scoreDetail?.totalMinutes ?? job?.total_minutes ?? job?.totalMinutes ?? null,
    workLatitude: job?.work_lat ?? job?.workLat ?? job?.geoLatitude ?? job?.geo_latitude ?? null,
    workLongitude: job?.work_lng ?? job?.workLng ?? job?.geoLongitude ?? job?.geo_longitude ?? null,
    source: {
      sourceId: postingId,
      reqMajor: job?.required_major || job?.requiredMajor,
      reqLicens: job?.required_licenses || job?.requiredLicenses,
      enterType: job?.enter_type || job?.enterType,
      empType: job?.employment_type || job?.employmentType,
      salaryType: job?.salary_type || job?.salaryType,
      compAddr: job?.work_address || job?.workAddress,
      workLat: job?.work_lat ?? job?.workLat ?? job?.geoLatitude ?? job?.geo_latitude,
      workLng: job?.work_lng ?? job?.workLng ?? job?.geoLongitude ?? job?.geo_longitude
    },
    requiredCareer: job?.required_career || job?.requiredCareer || '',
    requiredEducation: job?.required_education || job?.requiredEducation || '',
    agencyName: job?.agency_name || job?.agencyName || '',
    region: workAddress.split(' ')[0] || '없음',
    companyInfo: {
      address: workAddress
    }
  };
};

const parseQuickJobsFromResult = (result) => {
  const rows = Array.isArray(result?.results)
    ? result.results
    : Array.isArray(result?.aiResponse?.result?.results)
      ? result.aiResponse.result.results
      : Array.isArray(result?.jobs)
        ? result.jobs
        : [];
  return rows.map((item, index) => normalizeQuickJob(item, index));
};

const mergeUniqueQuickJobs = (currentJobs, nextJobs) => {
  const seenIds = new Set();
  return [...currentJobs, ...nextJobs].filter((job) => {
    const key = String(job.postingId || job.externalId || job.id || '');
    if (!key || seenIds.has(key)) {
      return false;
    }
    seenIds.add(key);
    return true;
  });
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
    const status = getTaskStatus(payload);

    if (status === 'COMPLETED' || status === 'FAILED') {
      return payload;
    }

    await delay(RECOMMEND_TASK_POLL_INTERVAL_MS);
  }

  return lastPayload;
}

async function requestQuickRecommendationResult(callWithAuth, request, signal) {
  const taskPayload = await callWithAuth((accessToken) =>
    fetchQuickJobRecommendations(accessToken, {
      ...request,
      signal,
      timeoutMs: RECOMMEND_REQUEST_TIMEOUT_MS
    })
  );
  const taskResult = normalizeTaskPayload(taskPayload);

  if (isDirectQuickResultPayload(taskResult)) {
    return taskResult;
  }

  if (getTaskStatus(taskResult) === 'FAILED') {
    throw new Error(getTaskErrorMessage(taskResult) || '퀵 추천을 불러오지 못했습니다.');
  }

  if (getTaskStatus(taskResult) === 'COMPLETED' && taskResult?.result) {
    return taskResult.result;
  }

  const taskRequestId = getTaskRequestId(taskResult);
  if (!taskRequestId) {
    throw new Error('퀵 추천 요청 상태를 확인할 수 없습니다.');
  }

  const completed = await waitForRecommendTask(callWithAuth, taskRequestId, signal);
  if (!completed || getTaskStatus(completed) === 'FAILED') {
    throw new Error(getTaskErrorMessage(completed) || '퀵 추천을 불러오지 못했습니다.');
  }
  return completed.result;
}

function HomeLoadingModal({ isOpen }) {
  const { locale } = useLocale();

  if (!isOpen) {
    return null;
  }

  const title = translateUiText('추천 결과를 준비하고 있습니다', locale);
  const description = translateUiText('요청이 끝날 때까지 페이지를 다시 열어도 진행 상태가 이어집니다.', locale);

  return (
    <div className="home-loading-modal" role="status" aria-live="polite" aria-label={translateUiText('추천 결과를 준비하고 있습니다.', locale)}>
      <div className="home-loading-modal__panel">
        <div className="loading-spinner" aria-hidden="true" />
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function PostingDetailInfoSection({ title, children }) {
  return (
    <section className="scrap-detail-card posting-detail-modal__info-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function PopularPostingDetailModal({
  detail,
  loading,
  error,
  quickFitScore = null,
  quickExplainState = { status: 'idle', error: '', data: null },
  onClose,
  onScrap
}) {
  const scrapButtonLabel = !detail?.postingId ? '스크랩 불가' : detail?.scrappedByMe ? '스크랩 완료' : '공고 스크랩';
  const isScrapDisabled = !detail?.postingId || detail?.scrappedByMe || detail?.postingStatus !== 'ACTIVE';
  const hasQuickFitScore = typeof quickFitScore === 'number';
  const deadlineText = detail ? parseDateText(detail.termDate) || '없음' : '';
  const registeredText = detail ? detail.offerRegisteredAt || detail.registeredAt || '없음' : '';
  const summaryItems = detail ? [
    ['근무지', detail.workAddress],
    ['연락처', detail.contactNumber],
    ['임금', detail.salaryText],
    ['모집마감일', deadlineText]
  ] : [];
  const workConditionItems = detail ? [
    ['고용형태', detail.employmentType],
    ['입사유형', detail.enterType],
    ['공고등록일', registeredText],
    ['담당기관', detail.agencyName],
    ['매칭 주소', detail.geoMatchedAddress]
  ] : [];
  const workEnvironmentItems = detail ? [
    ['양손 사용', detail.envBothHands],
    ['시력', detail.envEyesight],
    ['듣기·말하기', detail.envLstnTalk],
    ['손작업', detail.envHandWork],
    ['들어올리기', detail.envLiftPower],
    ['서기·걷기', detail.envStndWalk]
  ] : [];
  const requirementItems = detail ? [
    ['요구경력', detail.requiredCareer],
    ['요구학력', detail.requiredEducation],
    ['요구전공', detail.requiredMajor],
    ['요구자격증', detail.requiredLicenses]
  ] : [];
  const formattedQuickSummary = formatRecommendationExplanationText(quickExplainState.data?.shortSummary, quickFitScore);
  const formattedQuickNextStepSummary = formatRecommendationExplanationText(quickExplainState.data?.nextStepSummary, quickFitScore);
  const formattedQuickChecklist = formatRecommendationExplanationList(quickExplainState.data?.checklist, quickFitScore);
  const formattedQuickCautionPoints = formatRecommendationExplanationList(quickExplainState.data?.cautionPoints, quickFitScore);

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
                <h2 id="popular-posting-detail-title" className="login-modal__title" data-i18n-skip>{detail.jobTitle}</h2>
                <p data-i18n-skip>{detail.companyName}</p>
              </div>
              <div className="posting-detail-modal__summary">
                <div className="posting-detail-modal__summary-meta">
                  <span>{detail.postingStatus === 'ACTIVE' ? '진행중' : '마감'}</span>
                  <span className="posting-detail-modal__scrap-count" aria-label={`스크랩 ${detail.scrapCount}건`}>
                    <span>스크랩</span>
                    <strong>{detail.scrapCount}</strong>
                    <span>건</span>
                  </span>
                  {detail.dueLabel ? <span>{detail.dueLabel}</span> : null}
                </div>
                <button
                  type="button"
                  className="primary-button posting-detail-modal__scrap-button"
                  disabled={isScrapDisabled}
                  onClick={onScrap}
                >
                  {scrapButtonLabel}
                </button>
              </div>
              <section className="jobs-detail__summary posting-detail-modal__key-summary" aria-label="공고 핵심 요약">
                {summaryItems.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong data-i18n-skip>{value}</strong>
                  </div>
                ))}
              </section>
              {(hasQuickFitScore || quickExplainState.status !== 'idle') ? (
                <section className="jobs-detail__section" aria-label="직무 적합도 및 추천 설명">
                  <div className="jobs-detail__section-title">
                    <h3>AI 직무 적합도 및 추천 설명</h3>
                    <AccessibilityScoreHelpButton />
                  </div>
                  {(hasQuickFitScore || quickExplainState.status !== 'idle') ? (
                    <div className="jobs-detail__score-card">
                      <ScoreRing className={`jobs-detail__score-ring is-${getQuickScoreTone(quickFitScore)}`} score={quickFitScore} />
                      <div className="jobs-detail__score-summary">
                        <span>직무 적합도 점수</span>
                        <em>{hasQuickFitScore ? `${quickFitScore}점` : '확인 필요'}</em>
                        <p>
                          {hasQuickFitScore
                            ? (quickFitScore >= 70 ? '프로필 직무와 공고 조건이 유사합니다.' : '지원 전 직무 조건 확인이 필요합니다.')
                            : '추천 설명을 기준으로 공고 조건을 확인해 주세요.'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {quickExplainState.status === 'loading' ? (
                    <LlmExplanationProgress description="공고 조건과 선택한 프로필 기준으로 추천 이유를 생성하고 있습니다." />
                  ) : null}
                  {quickExplainState.status === 'error' ? <div className="jobs-feedback is-error" role="alert">{quickExplainState.error}</div> : null}
                  {quickExplainState.status === 'success' && quickExplainState.data ? (
                    <>
                      {formattedQuickSummary ? (
                        <div className="jobs-detail__notice jobs-detail__notice--quick">
                          <span className="jobs-detail__eyebrow">추천 요약</span>
                          <strong>{formattedQuickSummary}</strong>
                        </div>
                      ) : null}
                      {Array.isArray(quickExplainState.data.recommendedPrograms) && quickExplainState.data.recommendedPrograms.length ? (
                        <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                          <h3>이런 준비가 도움이 될 수 있어요</h3>
                          {formattedQuickNextStepSummary ? <p>{formattedQuickNextStepSummary}</p> : null}
                          <strong className="jobs-detail__subheading">교육·취업역량 추천</strong>
                          <ul className="jobs-detail__program-list">
                            {quickExplainState.data.recommendedPrograms.map((program, index) => (
                              <li key={`${program.sourceType || program.source_type}-${program.recordId || program.record_id}-${program.title}-${index}`}>
                                <strong>{program.title}</strong>
                                {program.reason ? <p>{program.reason}</p> : null}
                                {program.providerName || program.provider_name || program.startDate || program.start_date ? (
                                  <span>
                                    {[program.providerName || program.provider_name, program.startDate || program.start_date].filter(Boolean).join(' · ')}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {formattedQuickChecklist.length ? (
                        <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                          <h3>지원 전에 확인해보면 좋아요</h3>
                          <ul className="jobs-detail__bullet-list">
                            {formattedQuickChecklist.map((item) => (
                              <li key={`check-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {formattedQuickCautionPoints.length ? (
                        <div className="jobs-detail__section jobs-detail__explanation-card jobs-detail__explanation-card--quick">
                          <h3>참고해주세요</h3>
                          <ul className="jobs-detail__bullet-list">
                            {formattedQuickCautionPoints.map((item) => (
                              <li key={`caution-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </section>
              ) : null}
              <div className="posting-detail-modal__info-stack">
                <PostingDetailInfoSection title="근무 조건">
                  <DefinitionGrid items={workConditionItems} skipValues />
                </PostingDetailInfoSection>
                <PostingDetailInfoSection title="작업 환경">
                  <DefinitionGrid items={workEnvironmentItems} skipValues />
                </PostingDetailInfoSection>
                <PostingDetailInfoSection title="지원 요건">
                  <DefinitionGrid items={requirementItems} skipValues />
                </PostingDetailInfoSection>
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
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onConfirm();
              }}
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
    const defaultPrimary = safeCategories[0] || null;
    const defaultSecondary = defaultPrimary?.groups?.[0] || null;

    if (!value || value === FILTER_ALL_VALUE) {
      return { primary: defaultPrimary?.label || '', secondary: defaultSecondary?.label || '', job: '' };
    }

    for (const category of safeCategories) {
      if (category.label === value) {
        return { primary: category.label, secondary: '', job: '' };
      }

      for (const group of category.groups || []) {
        if (group.label === value) {
          return { primary: category.label, secondary: group.label, job: '' };
        }

        if ((group.jobs || []).includes(value)) {
          return { primary: category.label, secondary: group.label, job: value };
        }
      }
    }

    return { primary: defaultPrimary?.label || '', secondary: defaultSecondary?.label || '', job: '' };
  }, [safeCategories, value]);

  const [primaryValue, setPrimaryValue] = useState(selectedPath.primary);
  const [secondaryValue, setSecondaryValue] = useState(selectedPath.secondary);
  const primaryCategory = safeCategories.find((category) => category.label === primaryValue) || null;
  const secondaryGroup = primaryCategory?.groups?.find((group) => group.label === secondaryValue) || null;
  const selectedLabel = value && value !== FILTER_ALL_VALUE ? value : '전체';
  const selectedPathLabel = [selectedPath.primary, selectedPath.secondary, selectedPath.job].filter(Boolean).join(' > ') || selectedLabel;

  useEffect(() => {
    setPrimaryValue(selectedPath.primary);
    setSecondaryValue(selectedPath.secondary);
  }, [selectedPath.primary, selectedPath.secondary]);

  const handlePrimarySelect = (category) => {
    setPrimaryValue(category.label);
    setSecondaryValue(category.groups?.[0]?.label || '');
    onChange(category.label || FILTER_ALL_VALUE);
  };

  const handleSecondarySelect = (group) => {
    setSecondaryValue(group.label);
    onChange(group.label || primaryValue || FILTER_ALL_VALUE);
  };

  const handleReset = () => {
    const defaultPrimary = safeCategories[0] || null;
    setPrimaryValue(defaultPrimary?.label || '');
    setSecondaryValue(defaultPrimary?.groups?.[0]?.label || '');
    onChange(FILTER_ALL_VALUE);
  };

  return (
    <fieldset className="onboarding-choice-group onboarding-job-picker profile-job-picker home-quick__job-picker">
      <legend className="sr-only">희망 직무 1차, 2차, 3차 선택</legend>
      <div className={`home-quick__job-picker-summary${selectedLabel !== '전체' ? ' has-selection' : ''}`}>
        {selectedLabel === '전체' ? (
          <span>선택: 전체</span>
        ) : (
          <button type="button" className="home-quick__job-picker-path" onClick={handleReset} aria-label={`${selectedPathLabel} 선택 해제`}>
            <span>{selectedPathLabel}</span>
            <span aria-hidden="true">×</span>
          </button>
        )}
        <button type="button" className="home-quick__job-picker-reset" onClick={handleReset} disabled={selectedLabel === '전체'}>
          전체
        </button>
      </div>
      {safeCategories.length ? (
        <div className="onboarding-job-picker__box">
          <div className="onboarding-job-picker__columns">
            <JobPickerColumn title="1차 선택" description="분야 선택">
              {safeCategories.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  className={`onboarding-job-picker__option ${primaryValue === category.label ? 'is-active' : ''}`}
                  onClick={() => handlePrimarySelect(category)}
                >
                  <span>{category.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </JobPickerColumn>

            <JobPickerColumn title="2차 선택" description="세부 직군 선택">
              {primaryCategory?.groups?.map((group) => (
                <button
                  key={group.label}
                  type="button"
                  className={`onboarding-job-picker__option ${secondaryValue === group.label ? 'is-active' : ''}`}
                  onClick={() => handleSecondarySelect(group)}
                >
                  <span>{group.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              )) || <p className="home-quick__job-picker-empty">1차 직무를 선택해 주세요.</p>}
            </JobPickerColumn>

            <JobPickerColumn title="3차 선택" description="실제 수행 업무 선택">
              {secondaryGroup?.jobs?.map((job) => (
                <button
                  key={job}
                  type="button"
                  className={`onboarding-job-picker__option onboarding-job-picker__option--check ${selectedPath.job === job ? 'is-selected' : ''}`}
                  onClick={() => onChange(job)}
                  aria-pressed={selectedPath.job === job}
                >
                  <span>{job}</span>
                </button>
              )) || <p className="home-quick__job-picker-empty">2차 직군을 선택해 주세요.</p>}
            </JobPickerColumn>
          </div>
        </div>
      ) : (
        <p className="home-quick__job-picker-empty">선택 가능한 희망 직무 목록이 없습니다.</p>
      )}
    </fieldset>
  );
}

function JobPickerColumn({ title, description, children }) {
  return (
    <section className="onboarding-job-picker__column" aria-label={title}>
      <div className="onboarding-job-picker__column-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="onboarding-job-picker__list">{children}</div>
    </section>
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

export function MainPage({ view = 'home' }) {
  const isQuickPage = view === 'quick';
  const isHomePage = !isQuickPage;
  const { localizePath } = useLocale();
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
    rawJobs: [],
    hasMore: false,
    isLoadingMore: false,
    nextOffset: 0
  });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isQuickFilterCollapsed, setIsQuickFilterCollapsed] = useState(false);

  const autoRequestedRef = useRef(false);
  const quickProfileSelectRef = useRef(null);
  const quickLoadMoreSentinelRef = useRef(null);
  const quickExplainRequestSequenceRef = useRef(0);

  const selectedProfile = useMemo(
    () => profilesState.profiles.find((profile) => getProfileId(profile) === String(selectedProfileId)) || null,
    [profilesState.profiles, selectedProfileId]
  );
  const orderedProfiles = useMemo(() => {
    const profiles = [...profilesState.profiles];
    profiles.sort((left, right) => Number(Boolean(right?.isDefault)) - Number(Boolean(left?.isDefault)));
    return profiles;
  }, [profilesState.profiles]);
  const visibleSelectedProfile = selectedProfile || orderedProfiles[0] || null;
  const closedProfileLabel = getProfileDisplayName(visibleSelectedProfile);

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
  const orderedFilterGroups = useMemo(() => baseFilterGroups, [baseFilterGroups]);

  const filteredQuickJobs = useMemo(() => {
    const filtered = filterAccessibilityMapJobs(
      quickState.rawJobs,
      appliedFilters,
      filterOptions.jobCategories
    );
    return sortQuickJobs(filtered, appliedAiEnabled).map((job) => ({
      ...job,
      commuteEstimate: estimateCommuteMinutes(visibleSelectedProfile, job)
    }));
  }, [quickState.rawJobs, appliedFilters, filterOptions.jobCategories, appliedAiEnabled, visibleSelectedProfile]);

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
  }, [callWithAuth, isAuthenticated, isInitializing, isQuickPage]);

  const runQuickRecommendation = useCallback(async ({ profileId, aiEnabled, filters, signal, existingRequestId = '' }) => {
    if (!profileId) {
      setQuickState({ status: 'empty', error: '', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0 });
      return;
    }

    const selectedProfileObject = profilesState.profiles.find((profile) => getProfileId(profile) === String(profileId)) || null;
    const profileSignature = getProfileScoringSignature(selectedProfileObject);
    const cacheKey = getRecommendationCacheKey({
      profileId,
      aiEnabled,
      scope: 'quick-home:0',
      profileSignature
    });

    const cached = getCachedRecommendation(cacheKey);
    if (cached) {
      const cachedJobs = parseQuickJobsFromResult(cached);
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      setQuickState({
        status: cachedJobs.length ? 'success' : 'empty',
        error: '',
        rawJobs: cachedJobs.slice(0, QUICK_MAX_RESULTS),
        hasMore: cachedJobs.length === QUICK_PAGE_SIZE && cachedJobs.length < QUICK_MAX_RESULTS,
        isLoadingMore: false,
        nextOffset: Math.min(cachedJobs.length, QUICK_MAX_RESULTS)
      });
      return;
    }

    setQuickState((prev) => ({
      ...prev,
      status: prev.rawJobs.length ? 'refetching' : 'loading',
      error: ''
    }));

    const proceedTaskResult = async (taskResult) => {
      if (isDirectQuickResultPayload(taskResult)) {
        clearPendingQuickTask();
        setCachedRecommendation(cacheKey, taskResult);
        const directJobs = parseQuickJobsFromResult(taskResult);
        setAppliedAiEnabled(aiEnabled);
        setAppliedFilters(filters);
        setQuickState({
          status: directJobs.length ? 'success' : 'empty',
          error: '',
          rawJobs: directJobs.slice(0, QUICK_MAX_RESULTS),
          hasMore: directJobs.length === QUICK_PAGE_SIZE && directJobs.length < QUICK_MAX_RESULTS,
          isLoadingMore: false,
          nextOffset: Math.min(directJobs.length, QUICK_MAX_RESULTS)
        });
        return;
      }

      const taskStatus = getTaskStatus(taskResult);
      const taskRequestId = getTaskRequestId(taskResult);

      if (taskStatus === 'FAILED') {
        clearPendingQuickTask();
        setQuickState({ status: 'error', error: getTaskErrorMessage(taskResult) || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0 });
        return;
      }

      if (taskStatus === 'COMPLETED' && taskResult?.result) {
        clearPendingQuickTask();
        setCachedRecommendation(cacheKey, taskResult.result);
        const jobs = parseQuickJobsFromResult(taskResult.result);
        setAppliedAiEnabled(aiEnabled);
        setAppliedFilters(filters);
        setQuickState({
          status: jobs.length ? 'success' : 'empty',
          error: '',
          rawJobs: jobs.slice(0, QUICK_MAX_RESULTS),
          hasMore: jobs.length === QUICK_PAGE_SIZE && jobs.length < QUICK_MAX_RESULTS,
          isLoadingMore: false,
          nextOffset: Math.min(jobs.length, QUICK_MAX_RESULTS)
        });
        return;
      }

      if (!taskRequestId) {
        setQuickState({ status: 'error', error: '퀵 추천 요청 상태를 확인할 수 없습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0 });
        return;
      }

      writePendingQuickTask(taskRequestId, profileId, aiEnabled, filters);
      const completed = await waitForRecommendTask(callWithAuth, taskRequestId, signal);
      const completedStatus = getTaskStatus(completed);

      if (!completed || completedStatus === 'FAILED') {
        clearPendingQuickTask();
        setQuickState({ status: 'error', error: getTaskErrorMessage(completed) || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0 });
        return;
      }

      clearPendingQuickTask();
      setCachedRecommendation(cacheKey, completed.result);
      const jobs = parseQuickJobsFromResult(completed.result);
      setAppliedAiEnabled(aiEnabled);
      setAppliedFilters(filters);
      setQuickState({
        status: jobs.length ? 'success' : 'empty',
        error: '',
        rawJobs: jobs.slice(0, QUICK_MAX_RESULTS),
        hasMore: jobs.length === QUICK_PAGE_SIZE && jobs.length < QUICK_MAX_RESULTS,
        isLoadingMore: false,
        nextOffset: Math.min(jobs.length, QUICK_MAX_RESULTS)
      });
    };

    if (existingRequestId) {
      try {
        const existingPayload = await callWithAuth((accessToken) =>
          fetchRecommendTaskStatus(accessToken, existingRequestId, { signal })
        );
        await proceedTaskResult(normalizeTaskPayload(existingPayload));
        return;
      } catch (error) {
        clearPendingQuickTask();
      }
    }

    const taskPayload = await callWithAuth((accessToken) =>
      fetchQuickJobRecommendations(accessToken, {
        aiEnabled,
        profileId,
        limit: QUICK_PAGE_SIZE,
        offset: 0,
        signal
      })
    );
    const taskResult = normalizeTaskPayload(taskPayload);
    await proceedTaskResult(taskResult);
  }, [callWithAuth, profilesState.profiles]);

  const loadMoreQuickRecommendations = useCallback(async () => {
    if (
      !isQuickPage ||
      !selectedProfileId ||
      !quickState.hasMore ||
      quickState.isLoadingMore ||
      !['success', 'refetching'].includes(quickState.status)
    ) {
      return;
    }

    const offset = Math.max(quickState.nextOffset || quickState.rawJobs.length, quickState.rawJobs.length);
    if (offset >= QUICK_MAX_RESULTS) {
      setQuickState((prev) => ({ ...prev, hasMore: false, isLoadingMore: false, nextOffset: QUICK_MAX_RESULTS }));
      return;
    }

    const controller = new AbortController();
    setQuickState((prev) => ({ ...prev, isLoadingMore: true, error: '' }));

    try {
      const completedPayload = await requestQuickRecommendationResult(
        callWithAuth,
        {
          aiEnabled: appliedAiEnabled,
          profileId: appliedAiEnabled ? selectedProfileId : undefined,
          limit: Math.min(QUICK_PAGE_SIZE, QUICK_MAX_RESULTS - offset),
          offset
        },
        controller.signal
      );
      const nextJobs = parseQuickJobsFromResult(completedPayload);

      setQuickState((prev) => {
        const mergedJobs = mergeUniqueQuickJobs(prev.rawJobs, nextJobs).slice(0, QUICK_MAX_RESULTS);
        return {
          ...prev,
          status: mergedJobs.length ? 'success' : 'empty',
          error: '',
          rawJobs: mergedJobs,
          hasMore: nextJobs.length === QUICK_PAGE_SIZE && mergedJobs.length < QUICK_MAX_RESULTS,
          isLoadingMore: false,
          nextOffset: Math.min(offset + nextJobs.length, QUICK_MAX_RESULTS)
        };
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setQuickState((prev) => ({
        ...prev,
        status: prev.rawJobs.length ? 'success' : 'error',
        error: error.message || '퀵 추천을 불러오지 못했습니다.',
        isLoadingMore: false
      }));
    }
  }, [
    appliedAiEnabled,
    callWithAuth,
    isQuickPage,
    quickState.hasMore,
    quickState.isLoadingMore,
    quickState.nextOffset,
    quickState.rawJobs,
    quickState.status,
    selectedProfileId
  ]);

  useEffect(() => {
    if (!isQuickPage || !quickState.hasMore || quickState.isLoadingMore) {
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
  }, [isQuickPage, loadMoreQuickRecommendations, quickState.hasMore, quickState.isLoadingMore]);

  useEffect(() => {
    if (!isQuickPage) {
      return undefined;
    }

    if (!isAuthenticated || !selectedProfileId || autoRequestedRef.current) {
      return undefined;
    }

    autoRequestedRef.current = true;
    const controller = new AbortController();
    const pendingTask = readPendingQuickTask();
    const isSamePendingContext = Boolean(pendingTask)
      && String(pendingTask.profileId || '') === String(selectedProfileId)
      && Boolean(pendingTask.aiEnabled) === Boolean(isAiEnabled);
    const pendingRequestId = isSamePendingContext ? pendingTask?.requestId || '' : '';

    if (!isSamePendingContext) {
      clearPendingQuickTask();
    }
    if (isSamePendingContext && pendingTask?.filters) {
      setDraftFilters((prev) => ({ ...prev, ...pendingTask.filters }));
      setAppliedFilters((prev) => ({ ...prev, ...pendingTask.filters }));
    }

    runQuickRecommendation({
      profileId: selectedProfileId,
      aiEnabled: isAiEnabled,
      filters: draftFilters,
      signal: controller.signal,
      existingRequestId: pendingRequestId
    }).catch((error) => {
      if (error?.name === 'AbortError') {
        return;
      }
      setQuickState({
        status: 'error',
        error: error.message || '퀵 추천을 불러오지 못했습니다.',
        rawJobs: [],
        hasMore: false,
        isLoadingMore: false,
        nextOffset: 0
      });
    });

    return () => {
      controller.abort();
    };
  }, [draftFilters, isAiEnabled, isAuthenticated, isQuickPage, runQuickRecommendation, selectedProfileId]);

  const loadQuickExplanation = useCallback(async (job, profileObject, detailObject = null, options = {}) => {
    const { requireFitScore = true } = options;
    if (!job || !profileObject || !selectedProfileId || !appliedAiEnabled || (requireFitScore && typeof job.fitScore !== 'number')) {
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
      String(selectedProfileId),
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
      const response = await callWithAuth((accessToken) => explainRecommendation(accessToken, explainPayload));
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
  }, [appliedAiEnabled, callWithAuth, selectedProfileId]);

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

    const selectedProfileObject = profilesState.profiles.find((profile) => getProfileId(profile) === String(selectedProfileId)) || null;
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
      loadQuickExplanation(job, selectedProfileObject, null);
      return;
    }

    try {
      const detail = await callWithAuth((accessToken) => postingApi.getPostingDetail(postingId, { accessToken }));
      const normalizedDetail = normalizePostingDetail(detail);
      setDetailState({ status: 'success', error: '', data: normalizedDetail });
      loadQuickExplanation(job, selectedProfileObject, normalizedDetail);
    } catch (error) {
      const fallbackDetail = toQuickFallbackDetail(job);
      setDetailState({
        status: 'success',
        error: '',
        data: fallbackDetail
      });
      loadQuickExplanation(job, selectedProfileObject, fallbackDetail);
    }
  }, [callWithAuth, loadQuickExplanation, profilesState.profiles, selectedProfileId]);

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
      setIsQuickFilterCollapsed(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      setQuickState({ status: 'error', error: error.message || '퀵 추천을 불러오지 못했습니다.', rawJobs: [], hasMore: false, isLoadingMore: false, nextOffset: 0 });
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
  const isGuestUser = !isAuthenticated;
  const shouldShowQuickResults = !isGuestUser && filteredQuickJobs.length > 0 && ['success', 'refetching'].includes(quickState.status);
  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  return (
    <main className="main-page" aria-labelledby={isQuickPage ? 'quick-recommend-title' : 'main-page-title'}>
      <HomeLoadingModal isOpen={isQuickPage && isQuickLoading && !quickState.rawJobs.length} />
      <div className="main-page__inner">
        {isHomePage ? (
          <>
            <section className="home-overview" aria-labelledby="main-page-title">
              <div className="home-overview__heading">
                <p className="home-eyebrow">Home</p>
                <h1 id="main-page-title">현재 인기 공고</h1>
                <p>사람들이 많이 스크랩한 공고들을 스크랩 해보세요.</p>
              </div>
            </section>

            <section className="home-popular home-section-entrance home-section-entrance--popular" aria-labelledby="popular-postings-title">
              <div className="home-section-head">
                <div>
                  <div className="home-section-title-with-help">
                    <h2 id="popular-postings-title">인기 공고 TOP 20</h2>
                    <AccessibilityScoreHelpButton />
                  </div>
                </div>
              </div>

              {popularState.status === 'loading' ? <div className="home-feedback" role="status">인기 공고를 불러오는 중입니다.</div> : null}
              {popularState.status === 'error' ? <div className="home-feedback is-error" role="alert">{popularState.error}</div> : null}

              {popularState.status === 'success' ? (
                <div
                  ref={popularScrollerRef}
                  className="home-popular__scroller"
                  aria-label="인기 공고 목록"
                  onMouseEnter={() => setIsPopularCarouselPaused(true)}
                  onMouseLeave={() => setIsPopularCarouselPaused(false)}
                  onFocusCapture={() => setIsPopularCarouselPaused(true)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsPopularCarouselPaused(false);
                    }
                  }}
                >
                  {popularState.items.map((item) => (
                    <button
                      key={item.postingId}
                      type="button"
                      className="home-popular__card"
                      onClick={() => handleOpenPopularPosting(item.postingId)}
                    >
                      <div className="home-popular__card-top">
                        <strong>{item.companyName}</strong>
                      </div>
                      <h3>{item.jobTitle}</h3>
                      <p>{item.region}</p>
                      <div className="home-popular__card-meta">
                        <span>{item.employmentType}</span>
                        <span>{item.salaryText}</span>
                        {item.dueLabel ? <span>{item.dueLabel}</span> : null}
                      </div>
                      <div className="home-popular__card-scrap">스크랩 {item.scrapCount}건</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="home-notices home-section-entrance" aria-labelledby="home-notices-title">
              <div className="home-section-head">
                <div>
                  <h2 id="home-notices-title">공지사항</h2>
                  <p>서비스 운영과 이용에 필요한 안내입니다.</p>
                </div>
                <Link className="secondary-button home-notices__more" to={localizePath(ROUTE_PATHS.notices)}>
                  전체보기
                </Link>
              </div>

              {noticeState.status === 'loading' ? <div className="home-feedback" role="status">공지사항을 불러오는 중입니다.</div> : null}
              {noticeState.status === 'error' ? <div className="home-feedback is-error" role="alert">{noticeState.error}</div> : null}
              {noticeState.status === 'empty' ? <div className="home-feedback" role="status">등록된 공지사항이 없습니다.</div> : null}

              {noticeState.status === 'success' ? (
                <div className="home-notices__list">
                  {noticeState.items.map((notice) => (
                    <Link key={notice.id} className="home-notices__item" to={localizePath(`${ROUTE_PATHS.notices}/${notice.id}`)}>
                      <span className="home-notices__meta">
                        {notice.pinned ? <strong>고정</strong> : null}
                        {formatHomeNoticeDate(notice.createdAt) ? <time>{formatHomeNoticeDate(notice.createdAt)}</time> : null}
                      </span>
                      <span className="home-notices__title">{notice.title}</span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {isQuickPage ? (
          <section className="home-quick home-section-entrance home-section-entrance--quick" aria-labelledby="quick-recommend-title">
            <section className="home-overview home-overview--compact" aria-labelledby="quick-recommend-title">
              <div className="home-overview__heading">
                <div className="home-section-title-with-help">
                  <h1 id="quick-recommend-title">퀵 맞춤 일자리 추천</h1>
                  <AccessibilityScoreHelpButton />
                </div>
                <p>{isAiEnabled ? 'AI 직무 적합도 기반 추천 결과' : '최신 공고 기반 추천 결과'}</p>
              </div>
            </section>

            <div className="home-quick__controls">
              <aside className="accessibility-map__filter-panel home-quick__filter-panel home-quick__profile-panel" aria-label="프로필 선택">
                <header className="home-quick__filter-header">
                  <h3>프로필 선택</h3>
                </header>
                <div
                  ref={quickProfileSelectRef}
                  className={`accessibility-map__profile-select home-quick__profile-select${isProfileMenuOpen ? ' is-open' : ''}`}
                  aria-label="프로필 선택"
                >
                  <button
                    type="button"
                    className="accessibility-map__profile-trigger home-quick__profile-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isGuestUser ? false : isProfileMenuOpen}
                    onClick={() => {
                      if (isGuestUser) {
                        openLoginModal();
                        return;
                      }
                      setIsProfileMenuOpen((isOpen) => !isOpen);
                    }}
                  >
                    <span className="accessibility-map__profile-trigger-main">
                      <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
                      <span className="accessibility-map__profile-option-text">
                        {isGuestUser ? (
                          <strong>로그인 후 자신의 프로필을 선택해보세요.</strong>
                        ) : isProfileMenuOpen ? (
                          <strong>프로필을 선택하세요</strong>
                        ) : (
                          <>
                            <strong>{closedProfileLabel || '기본 프로필'}</strong>
                            {visibleSelectedProfile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                          </>
                        )}
                      </span>
                    </span>
                    <img src={arrowDown} alt="프로필 목록 펼치기 아이콘" loading="lazy" decoding="async" />
                  </button>
                  {isProfileMenuOpen && !isGuestUser ? (
                    <div className="accessibility-map__profile-menu" role="listbox" aria-label="프로필 목록">
                      {orderedProfiles.map((profile) => (
                        <button
                          key={getProfileId(profile)}
                          type="button"
                          className={`accessibility-map__profile-option${getProfileId(profile) === String(selectedProfileId) ? ' is-selected' : ''}`}
                          role="option"
                          aria-selected={getProfileId(profile) === String(selectedProfileId)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedProfileId(getProfileId(profile));
                            setIsProfileMenuOpen(false);
                          }}
                        >
                          <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
                          <span className="accessibility-map__profile-option-text">
                            <strong>{getProfileDisplayName(profile)}</strong>
                            {profile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                          </span>
                        </button>
                      ))}
                      <Link to={localizePath(ROUTE_PATHS.myProfile)} className="accessibility-map__profile-manage">
                        <img src={settingIcon} alt="프로필 관리 아이콘" loading="lazy" decoding="async" />
                        프로필 관리
                      </Link>
                    </div>
                  ) : null}
                </div>
              </aside>

              <aside className="accessibility-map__filter-panel home-quick__filter-panel" aria-label="퀵 추천 필터">
                <header className="home-quick__filter-header">
                  <h3>퀵 추천 필터</h3>
                  <button
                    type="button"
                    className="accessibility-map__collapse-button"
                    onClick={() => {
                      if (isGuestUser) {
                        openLoginModal();
                        return;
                      }
                      setIsQuickFilterCollapsed((prev) => !prev);
                    }}
                    aria-expanded={!isQuickFilterCollapsed}
                  >
                    {isQuickFilterCollapsed ? '필터 펼치기' : '필터 접기'}
                  </button>
                </header>

                {!isQuickFilterCollapsed ? (
                  <>
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
                        onClick={() => {
                          if (isGuestUser) {
                            openLoginModal();
                            return;
                          }
                          setIsAiEnabled((prev) => !prev);
                        }}
                      >
                        <span className="accessibility-map__ai-toggle-track" aria-hidden="true">
                          <span className="accessibility-map__ai-toggle-thumb" />
                        </span>
                        <span className="accessibility-map__ai-toggle-label">{isAiEnabled ? 'ON' : 'OFF'}</span>
                      </button>
                    </section>

                    <div className="accessibility-map__filter-list">
                      {orderedFilterGroups.map((group, index) => (
                        <section key={group.id} className="accessibility-map__filter-group">
                          <div className="accessibility-map__filter-title-row">
                            <div>
                              <h3>{`${index + 1}. ${group.title}`}</h3>
                              {group.type === 'jobCategoryCascade' ? (
                                <JobCategoryCascadeFilter
                                  categories={group.jobCategories}
                                  value={group.selectedValue}
                                  onChange={(value) => {
                                    if (isGuestUser) {
                                      openLoginModal();
                                      return;
                                    }
                                    setDraftFilters((prev) => ({ ...prev, [group.id]: value }));
                                  }}
                                />
                              ) : group.type === 'select' ? (
                                <SelectFilter
                                  label={group.title}
                                  options={group.options}
                                  value={group.selectedValue}
                                  onChange={(value) => {
                                    if (isGuestUser) {
                                      openLoginModal();
                                      return;
                                    }
                                    setDraftFilters((prev) => ({ ...prev, [group.id]: value }));
                                  }}
                                />
                              ) : (
                                <div className="accessibility-map__chip-row accessibility-map__chip-row--expanded">
                                  {group.chips.map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      className={`accessibility-map__chip${group.selectedValue === chip ? ' is-selected' : ''}`}
                                      aria-pressed={group.selectedValue === chip}
                                      onClick={() => {
                                        if (isGuestUser) {
                                          openLoginModal();
                                          return;
                                        }
                                        setDraftFilters((prev) => ({ ...prev, [group.id]: chip }));
                                      }}
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
                  </>
                ) : null}
              </aside>
            </div>

            <div className="home-quick__actions">
              <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
                <button
                  type="button"
                  className="secondary-button accessibility-map__filter-reset-button"
                  onClick={isGuestUser ? openLoginModal : handleResetQuickFilters}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="primary-button accessibility-map__filter-apply-button"
                  onClick={isGuestUser ? openLoginModal : handleApplyQuickFilters}
                  disabled={!isGuestUser && (isQuickLoading || !selectedProfileId)}
                >
                  {isQuickLoading ? '로딩중' : '검색'}
                </button>
              </div>
            </div>

            <section className="home-quick__results" aria-label="퀵 추천 결과">
              {shouldShowQuickResults ? (
                <div className="accessibility-map__results-header home-quick__results-header">
                  <h3>
                    <span>검색 결과 {filteredQuickJobs.length}개</span>
                    {quickState.hasMore || quickState.rawJobs.length > filteredQuickJobs.length ? <span> / 최대 {QUICK_MAX_RESULTS}개</span> : null}
                  </h3>
                  <span>{appliedAiEnabled ? '직무 적합도 높은순' : '최신순'}</span>
                </div>
              ) : null}
              {shouldShowQuickResults && (isQuickLoading || quickState.isLoadingMore) ? (
                <div className="home-quick__loading-bar" role="status" aria-live="polite">
                  <span className="home-quick__loading-track" aria-hidden="true" />
                  다음 공고 계산중
                </div>
              ) : null}
              {isGuestUser ? <div className="home-feedback" role="status">로그인 후 퀵 맞춤 일자리 추천 결과를 확인할 수 있습니다.</div> : null}
              {!isGuestUser && profilesState.status === 'loading' ? <div className="home-feedback" role="status">프로필을 불러오는 중입니다.</div> : null}
              {!isGuestUser && profilesState.status === 'error' ? <div className="home-feedback is-error" role="alert">{profilesState.error}</div> : null}
              {!isGuestUser && quickState.status === 'idle' ? <div className="home-feedback" role="status">검색을 누르면 퀵 추천 결과를 조회합니다.</div> : null}
              {!isGuestUser && (quickState.status === 'loading' || (quickState.status === 'refetching' && !quickState.rawJobs.length)) ? (
                <div className="home-feedback jobs-feedback--animated-dots" role="status" aria-live="polite">
                  로딩중
                  <span className="jobs-feedback__dots" aria-hidden="true" />
                </div>
              ) : null}
              {!isGuestUser && quickState.status === 'error' ? <div className="home-feedback is-error" role="alert">{quickState.error}</div> : null}
              {!isGuestUser && quickState.status === 'empty' ? <div className="home-feedback" role="status">현재 조건에 맞는 공고가 없습니다.</div> : null}

              {shouldShowQuickResults ? (
                <div className="home-job-list" aria-label="퀵 추천 공고 목록">
                  {filteredQuickJobs.map((job) => (
                    <button
                      type="button"
                      className={`home-job-card${appliedAiEnabled && typeof job.fitScore === 'number' && job.fitScore >= 80 ? ' is-recommended' : ''}`}
                      key={job.id}
                      onClick={() => handleOpenQuickPosting(job)}
                      aria-label={`${job.title} 상세 보기`}
                    >
                      <div className="home-job-card__main">
                        <div className="home-job-card__top">
                          <span className="home-job-company">{job.company}</span>
                          <span className={`home-job-scrap-count${job.scrappedByMe ? ' is-scrapped' : ''}`}>
                            {job.scrappedByMe ? '스크랩 완료' : `스크랩 ${job.scrapCount}건`}
                          </span>
                        </div>
                        <h3 data-i18n-skip>{job.title}</h3>
                        <p className="home-job-role" data-i18n-skip>{job.location}</p>
                        <dl className="home-job-meta" aria-label={`${job.title} 공고 정보`}>
                          <div>
                            <dt>통근</dt>
                            <dd>
                              <span data-i18n-skip>{job.commuteEstimate?.label || '확인 필요'}</span>
                              {job.commuteEstimate?.source === 'estimated' ? <span className="home-job-meta__hint">예상</span> : null}
                            </dd>
                          </div>
                          <div><dt>급여</dt><dd data-i18n-skip>{job.salary}</dd></div>
                          <div><dt>고용형태</dt><dd data-i18n-skip>{job.employmentType}</dd></div>
                          <div><dt>등록일</dt><dd>{job.registeredDateText || '없음'}</dd></div>
                          {job.dueLabel ? <div><dt>마감</dt><dd>{job.dueLabel}</dd></div> : null}
                        </dl>
                        <div className="home-job-tags">
                          {appliedAiEnabled ? (
                            <span className={`home-badge ${job.fitScore && job.fitScore >= 80 ? 'home-badge--match' : 'home-badge--neutral'}`}>
                              직무 적합도 {job.fitLabel}
                            </span>
                          ) : (
                            <span className="home-badge home-badge--neutral">최신 공고 순 정렬</span>
                          )}
                          {appliedAiEnabled && job.fitGrade ? (
                            <span className={`accessibility-map__mini-badge home-job-grade-badge is-grade ${getQuickGradeClassName(job.fitGrade)}`}>
                              {job.fitGrade}
                            </span>
                          ) : null}
                          <span className="home-badge home-badge--neutral">AI {appliedAiEnabled ? 'ON' : 'OFF'}</span>
                        </div>
                      </div>
                      {appliedAiEnabled ? (
                        <div className="home-job-score-panel" aria-label={`직무 적합도 점수 ${job.fitLabel}`}>
                          <div className="home-job-score-panel__header">
                            <strong>직무 적합도 점수</strong>
                            <AccessibilityScoreHelpButton interactive={false} />
                          </div>
                          <VisibilityTriggeredScoreRing
                            className={`home-job-score-ring is-${job.fitTone}`}
                            score={job.fitScore}
                            observeKey={`${job.id}-${job.fitScore ?? 'empty'}`}
                          />
                          <span className={`accessibility-map__score-badge is-${job.fitTone}`}>
                            {job.fitGrade ? `${job.fitGrade} · 직무 기준` : '확인 필요'}
                          </span>
                          <em>{getQuickScoreHeadline(job.fitScore)}</em>
                        </div>
                      ) : null}
                    </button>
                  ))}
                  <div ref={quickLoadMoreSentinelRef} className="home-quick__load-sentinel" aria-hidden="true" />
                  {quickState.isLoadingMore ? (
                    <div className="home-feedback jobs-feedback--animated-dots" role="status" aria-live="polite">
                      다음 공고 계산중
                      <span className="jobs-feedback__dots" aria-hidden="true" />
                    </div>
                  ) : null}
                  {quickState.hasMore && !quickState.isLoadingMore ? (
                    <div className="home-feedback" role="status">아래로 스크롤하면 다음 공고를 불러옵니다.</div>
                  ) : null}
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
          quickFitScore={quickDetailState.fitScore}
          quickExplainState={{
            status: quickDetailState.explainStatus,
            error: quickDetailState.explainError,
            data: quickDetailState.explainData
          }}
          onClose={() => {
            quickExplainRequestSequenceRef.current += 1;
            setDetailModalOpen(false);
            setSelectedPostingId(null);
            setDetailState({ status: 'idle', error: '', data: null });
            setQuickDetailState({
              mode: 'none',
              fitScore: null,
              explainStatus: 'idle',
              explainError: '',
              explainData: null
            });
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

export function QuickJobsPage() {
  return <MainPage view="quick" />;
}
