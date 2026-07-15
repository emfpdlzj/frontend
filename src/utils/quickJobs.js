import { getNextDailyCacheExpiryAt, isDailyCacheExpired } from '../cache/dailyCacheExpiry';
import {
  getCachedRecommendation,
  getRecommendationCacheKey
} from '../cache/recommendationCache';
import { QUICK_RECOMMENDATION } from '../constants/recommendation';
import { getAddressCoordinate, getAddressDistrict } from './addressCoordinates';

const QUICK_PAGE_SIZE = QUICK_RECOMMENDATION.pageSize;
const QUICK_MAX_RESULTS = QUICK_RECOMMENDATION.maxResults;
const QUICK_EXPLAIN_CACHE_STORAGE_KEY = 'bridgework.quick.explain.cache.v2';

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
  } catch {
    return {};
  }
};

export const getCachedQuickExplain = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }
  const cache = readQuickExplainCache();
  return cache[cacheKey]?.payload || null;
};

export const setCachedQuickExplain = (cacheKey, payload) => {
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
  } catch {
    // 캐시 저장 실패는 추천 상세 조회를 막지 않는다.
  }
};

export const toSafeText = (value, fallback = '없음') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

export const parseDateText = (value) => {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '';
  }
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
};

export const formatHomeNoticeDate = (value) => {
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

export const getRegionFromAddress = (address) => {
  const tokens = String(address ?? '').trim().split(/\s+/).filter(Boolean);
  return tokens[0] || '없음';
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

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
  if (minutes >= 75) {
    return '75분 이상';
  }
  if (minutes >= 75 * 60) {
    return '75시간 이상';
  }
  return `${Math.max(10, Math.round(minutes / 5) * 5)}분`;
};

export const estimateCommuteMinutes = (profile, job) => {
  const transitTime = job?.transitTime || job?.transit_time || {};
  const explicitMinutes = toNumberOrNull(
    transitTime?.durationMinutes
    ?? transitTime?.duration_minutes
    ?? job?.totalMinutes
    ?? job?.total_minutes
    ?? job?.commuteMinutes
    ?? job?.commute_minutes
  );
  if (explicitMinutes !== null) {
    const source = transitTime?.durationMinutes != null || transitTime?.duration_minutes != null ? 'transit_estimate' : 'provided';
    return { label: formatCommuteEstimate(explicitMinutes), minutes: explicitMinutes, source };
  }

  const homeAddress = firstNonBlank(profile?.detailAddress, profile?.address);
  const homeLatitude = toNumberOrNull(firstNonBlank(profile?.homeLat, profile?.home_lat));
  const homeLongitude = toNumberOrNull(firstNonBlank(profile?.homeLng, profile?.home_lng));
  const homeCoordinate = homeLatitude !== null && homeLongitude !== null
    ? { latitude: homeLatitude, longitude: homeLongitude }
    : getAddressCoordinate(homeAddress);
  const workCoordinate = (
    toNumberOrNull(job?.workLatitude) !== null && toNumberOrNull(job?.workLongitude) !== null
      ? { latitude: toNumberOrNull(job.workLatitude), longitude: toNumberOrNull(job.workLongitude) }
      : getAddressCoordinate(job?.location)
  );
  const distanceKm = getDistanceKm(homeCoordinate, workCoordinate);

  if (distanceKm === null) {
    return { label: '확인 필요', minutes: null, source: 'missing' };
  }

  const homeDistrict = getAddressDistrict(homeAddress);
  const workDistrict = getAddressDistrict(job?.location);
  if (homeDistrict && workDistrict && homeDistrict === workDistrict) {
    const minutes = 20 + distanceKm * 4;
    return { label: formatCommuteEstimate(minutes), minutes, source: 'estimated' };
  }

  const minutes = 18 + distanceKm * 5.2;
  return { label: formatCommuteEstimate(minutes), minutes, source: 'estimated' };
};

export const hasProfileCommuteOrigin = (profile) => {
  if (!profile) {
    return false;
  }

  const homeLatitude = toNumberOrNull(firstNonBlank(profile?.homeLat, profile?.home_lat));
  const homeLongitude = toNumberOrNull(firstNonBlank(profile?.homeLng, profile?.home_lng));
  if (homeLatitude !== null && homeLongitude !== null) {
    return true;
  }

  const homeAddress = firstNonBlank(profile?.detailAddress, profile?.address);
  return Boolean(getAddressCoordinate(homeAddress));
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

export const getProfileId = (profile) => String(profile?.profileId ?? profile?.id ?? '');

const getProfileLabel = (profile) => {
  if (!profile) {
    return '기본 프로필';
  }
  const baseName = profile.profileName || profile.fullName || profile.name || `프로필 ${getProfileId(profile)}`;
  const targetJob = profile.targetJob || profile.desiredJob;
  return targetJob ? `${baseName} · ${targetJob}` : baseName;
};
export const getProfileDisplayName = (profile) => {
  if (!profile) {
    return '';
  }
  return profile.profileName || profile.fullName || (getProfileId(profile) ? `프로필 ${getProfileId(profile)}` : '');
};

export const uniqueOptions = (options) => {
  const seen = new Set();

  return (Array.isArray(options) ? options : []).filter((option) => {
    if (!option?.label || seen.has(option.label)) {
      return false;
    }
    seen.add(option.label);
    return true;
  });
};

export const getPopularPostingSummary = (item) => ({
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

export const normalizePostingDetail = (detail) => ({
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

export const getPostingMapPreview = (detail) => {
  const mapLat = toNumberOrNull(detail?.geoLatitude);
  const mapLng = toNumberOrNull(detail?.geoLongitude);
  const hasMapPoint = mapLat !== null && mapLng !== null;

  return {
    available: hasMapPoint,
    lat: mapLat,
    lng: mapLng,
    label: hasMapPoint ? '연동된 지도 정보입니다.' : '지도 위치 데이터가 없습니다.',
    address: toSafeText(detail?.workAddress, '근무지 주소 확인 필요')
  };
};

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

export const buildQuickExplainPayload = ({ job, profile, detail }) => {
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

export const toQuickFallbackDetail = (job) => ({
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

export const getQuickGradeClassName = (grade) => {
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

export const getQuickScoreTone = (score) => {
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

export const getQuickScoreHeadline = (score) => {
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

export const getScoreRingOffset = (score) => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return 100;
  }
  return 100 - Math.max(0, Math.min(100, score));
};


const normalizeQuickJob = (item, index) => {
  const job = item?.job || item;
  const scoreDetail = item?.score_detail || item?.scoreDetail || {};
  const transitTime = item?.transit_time || item?.transitTime || job?.transit_time || job?.transitTime || {};
  const transitMinutes = transitTime?.duration_minutes ?? transitTime?.durationMinutes ?? null;
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
    transitTime,
    totalMinutes: transitMinutes ?? item?.total_minutes ?? item?.totalMinutes ?? scoreDetail?.total_minutes ?? scoreDetail?.totalMinutes ?? job?.total_minutes ?? job?.totalMinutes ?? null,
    commuteMinutes: transitMinutes ?? item?.commute_minutes ?? item?.commuteMinutes ?? job?.commute_minutes ?? job?.commuteMinutes ?? null,
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

export const parseQuickJobsFromResult = (result) => {
  const rows = Array.isArray(result?.results)
    ? result.results
    : Array.isArray(result?.aiResponse?.result?.results)
      ? result.aiResponse.result.results
      : Array.isArray(result?.jobs)
        ? result.jobs
        : [];
  return rows.map((item, index) => normalizeQuickJob(item, index));
};

export const getRecommendationTotalCount = (payload, fallback = 0) => {
  const candidates = [
    payload?.totalCount,
    payload?.total_count,
    payload?.result?.totalCount,
    payload?.result?.total_count,
    payload?.aiResponse?.totalCount,
    payload?.aiResponse?.total_count,
    payload?.aiResponse?.result?.totalCount,
    payload?.aiResponse?.result?.total_count,
    payload?.data?.totalCount,
    payload?.data?.total_count
  ];

  for (const value of candidates) {
    if (value == null || value === '') {
      continue;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return Math.max(0, Number(fallback) || 0);
};

export const getQuickJobKey = (job) => String(job?.postingId || job?.externalId || job?.id || '');

export const mergeUniqueQuickJobs = (currentJobs, nextJobs) => {
  const seenIds = new Set();
  return [...currentJobs, ...nextJobs].filter((job) => {
    const key = getQuickJobKey(job);
    if (!key || seenIds.has(key)) {
      return false;
    }
    seenIds.add(key);
    return true;
  });
};

export const sortQuickJobs = (jobs, aiEnabled) => {
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

export const getQuickPageCacheKey = ({ profileId, aiEnabled, profileSignature, offset = 0 }) =>
  getRecommendationCacheKey({
    profileId,
    aiEnabled,
    scope: `quick-home:${offset}`,
    profileSignature
  });

export const getCachedQuickPages = ({ profileId, aiEnabled, profileSignature }) => {
  const jobs = [];
  let totalCount = 0;

  for (let offset = 0; offset < QUICK_MAX_RESULTS; offset += QUICK_PAGE_SIZE) {
    const cachedPayload = getCachedRecommendation(getQuickPageCacheKey({
      profileId,
      aiEnabled,
      profileSignature,
      offset
    }));
    if (!cachedPayload) {
      break;
    }

    const pageJobs = parseQuickJobsFromResult(cachedPayload);
    totalCount = Math.max(totalCount, getRecommendationTotalCount(cachedPayload, offset + pageJobs.length));
    if (!pageJobs.length) {
      break;
    }

    jobs.push(...pageJobs);
    if (pageJobs.length < QUICK_PAGE_SIZE) {
      break;
    }
  }

  return {
    jobs: jobs.slice(0, QUICK_MAX_RESULTS),
    totalCount: Math.max(totalCount, jobs.length)
  };
};
