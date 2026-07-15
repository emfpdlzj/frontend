import { STORAGE_KEYS } from '../config/appConfig';
import { normalizeBirthDate } from './birthDate';
import { getFieldFormatMessage } from './formValidation';

const PROFILE_DRAFT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAJOR_CAREER = '신입';
const HIGHEST_EDUCATION_LABEL_MAP = {
  HIGH_SCHOOL_OR_BELOW: '고졸 이하',
  HIGH_SCHOOL: '고졸',
  COLLEGE: '전문대졸',
  BACHELOR: '대졸',
  MASTER: '석사',
  DOCTOR: '박사',
  OTHER: '기타'
};
const STRUCTURED_EDUCATION_LABEL_MAP = {
  HIGH_SCHOOL: '고등학교',
  COLLEGE_2_3: '전문대(2,3년제)',
  COLLEGE_4: '대학교(4년제)',
  MASTER: '대학원(석사)',
  DOCTOR: '대학원(박사)',
  BOOTCAMP: '부트캠프',
  OTHER: '기타'
};
const STRUCTURED_GRADUATION_STATUS_LABEL_MAP = {
  GRADUATED: '졸업',
  EXPECTED: '졸업예정',
  ENROLLED: '재학',
  COMPLETED: '수료',
  DROPPED_OUT: '중퇴',
  OTHER: '기타'
};
const STRUCTURED_PROJECT_TYPE_LABEL_MAP = {
  COMPANY_PROJECT: '실무 프로젝트',
  BOOTCAMP: '부트캠프',
  FREELANCE: '외주·프리랜서',
  HACKATHON: '해커톤',
  CONTEST: '공모전',
  CLUB: '동아리',
  VOLUNTEER: '봉사활동',
  PERSONAL: '개인 프로젝트',
  OTHER: '기타'
};
const STRUCTURED_EDUCATION_TO_HIGHEST_EDUCATION_MAP = {
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  COLLEGE_2_3: 'COLLEGE',
  COLLEGE_4: 'BACHELOR',
  MASTER: 'MASTER',
  DOCTOR: 'DOCTOR',
  BOOTCAMP: 'OTHER',
  OTHER: 'OTHER'
};
const LEGACY_TO_STRUCTURED_EDUCATION_MAP = {
  HIGH_SCHOOL_OR_BELOW: 'HIGH_SCHOOL',
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  COLLEGE: 'COLLEGE_2_3',
  BACHELOR: 'COLLEGE_4',
  MASTER: 'MASTER',
  DOCTOR: 'DOCTOR',
  OTHER: 'OTHER'
};
const STRUCTURED_GRADUATION_TO_PROFILE_MAP = {
  GRADUATED: 'GRADUATED',
  EXPECTED: 'EXPECTED',
  ENROLLED: 'ENROLLED',
  COMPLETED: 'COMPLETED',
  DROPPED_OUT: 'DROPPED_OUT',
  OTHER: 'OTHER'
};
const EDUCATION_PRIORITY_MAP = {
  HIGH_SCHOOL: 1,
  COLLEGE_2_3: 2,
  COLLEGE_4: 3,
  MASTER: 4,
  DOCTOR: 5,
  BOOTCAMP: 0,
  OTHER: 0
};
let structuredEntrySequence = 0;
const SAFE_PROFILE_DRAFT_FIELDS = [
  'desiredJob',
  'commuteRange',
  'preferredWorkEnvironments',
  'avoidedWorkEnvironments',
  'requiredSupports',
  'sensitiveInfoConsentYn',
  'educationEntries',
  'careerEntries',
  'projectEntries',
  'certificationEntries',
  'languageEntries',
  'portfolioEntries',
  'awardEntries',
  'trainingEntries',
  'careerSummary',
  'educationSummary',
  'employmentTypeSummary',
  'highestEducation',
  'graduationStatus',
  'majorCareer',
  'targetJob',
  'skills',
  'certifications',
  'workAvailability',
  'workTypes',
  'expectedSalary',
  'workTimePreference',
  'remoteAvailableYn'
];

const requiredFields = [
  ['profileName', '프로필 이름'],
  ['fullName', '이름'],
  ['contactPhone', '연락처'],
  ['contactEmail', '이메일'],
  ['birthDate', '생년월일'],
  ['genderType', '성별'],
  ['detailAddress', '상세 주소'],
  ['highestEducation', '최종 학력'],
  ['graduationStatus', '졸업 상태'],
  ['majorCareer', '주요 경력'],
  ['targetJob', '지원 직무'],
  ['selfIntroduction', '자기소개']
];

function createStructuredEntryId(prefix) {
  structuredEntrySequence += 1;
  return `${prefix}-${structuredEntrySequence}`;
}

function createEducationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('education'),
    schoolType: '',
    schoolName: '',
    admissionYear: '',
    graduationYear: '',
    graduationStatus: '',
    ...entry
  };
}

function createCareerEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('career'),
    companyName: '',
    departmentName: '',
    startYearMonth: '',
    endYearMonth: '',
    responsibilities: '',
    ...entry
  };
}

function createProjectEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('project'),
    projectType: '',
    projectName: '',
    startYearMonth: '',
    endYearMonth: '',
    projectDescription: '',
    ...entry
  };
}

function createCertificationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('certification'),
    issuer: '',
    certificationName: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createLanguageEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('language'),
    languageName: '',
    testName: '',
    scoreOrGrade: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createPortfolioEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('portfolio'),
    portfolioType: '',
    title: '',
    url: '',
    ...entry
  };
}

function createAwardEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('award'),
    awardName: '',
    awardingOrganization: '',
    awardYear: '',
    awardDescription: '',
    ...entry
  };
}

function createTrainingEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('training'),
    trainingType: '',
    trainingName: '',
    institutionName: '',
    startYearMonth: '',
    endYearMonth: '',
    trainingDescription: '',
    ...entry
  };
}

function ensureStructuredEntries(entries, entryFactory) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => entryFactory(entry || {}));
}

function limitText(value, maxLength) {
  const normalized = trimValue(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength);
}

function joinSegments(segments, separator = ' · ') {
  return segments.map((segment) => trimValue(segment)).filter(Boolean).join(separator);
}

function formatStructuredPeriod(start, end) {
  const startText = trimValue(start);
  const endText = trimValue(end);

  if (startText && endText) {
    return `${startText} - ${endText}`;
  }

  if (startText) {
    return `${startText} -`;
  }

  return endText ? `- ${endText}` : '';
}

function stripClientId(entry) {
  const { clientId: _clientId, ...rest } = entry || {};
  return rest;
}

function sanitizeEducationEntries(entries) {
  return ensureStructuredEntries(entries, createEducationEntry)
    .map((entry) => ({
      schoolType: trimValue(entry.schoolType),
      schoolName: trimValue(entry.schoolName),
      admissionYear: trimValue(entry.admissionYear),
      graduationYear: trimValue(entry.graduationYear),
      graduationStatus: trimValue(entry.graduationStatus)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeCareerEntries(entries) {
  return ensureStructuredEntries(entries, createCareerEntry)
    .map((entry) => ({
      companyName: trimValue(entry.companyName),
      departmentName: trimValue(entry.departmentName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      responsibilities: trimValue(entry.responsibilities)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeProjectEntries(entries) {
  return ensureStructuredEntries(entries, createProjectEntry)
    .map((entry) => ({
      projectType: trimValue(entry.projectType),
      projectName: trimValue(entry.projectName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      projectDescription: trimValue(entry.projectDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeCertificationEntries(entries) {
  return ensureStructuredEntries(entries, createCertificationEntry)
    .map((entry) => ({
      issuer: trimValue(entry.issuer),
      certificationName: trimValue(entry.certificationName),
      acquiredYearMonth: trimValue(entry.acquiredYearMonth)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeLanguageEntries(entries) {
  return ensureStructuredEntries(entries, createLanguageEntry)
    .map((entry) => ({
      languageName: trimValue(entry.languageName),
      testName: trimValue(entry.testName),
      scoreOrGrade: trimValue(entry.scoreOrGrade),
      acquiredYearMonth: trimValue(entry.acquiredYearMonth)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizePortfolioEntries(entries) {
  return ensureStructuredEntries(entries, createPortfolioEntry)
    .map((entry) => ({
      portfolioType: trimValue(entry.portfolioType),
      title: trimValue(entry.title),
      url: trimValue(entry.url)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeAwardEntries(entries) {
  return ensureStructuredEntries(entries, createAwardEntry)
    .map((entry) => ({
      awardName: trimValue(entry.awardName),
      awardingOrganization: trimValue(entry.awardingOrganization),
      awardYear: trimValue(entry.awardYear),
      awardDescription: trimValue(entry.awardDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function sanitizeTrainingEntries(entries) {
  return ensureStructuredEntries(entries, createTrainingEntry)
    .map((entry) => ({
      trainingType: trimValue(entry.trainingType),
      trainingName: trimValue(entry.trainingName),
      institutionName: trimValue(entry.institutionName),
      startYearMonth: trimValue(entry.startYearMonth),
      endYearMonth: trimValue(entry.endYearMonth),
      trainingDescription: trimValue(entry.trainingDescription)
    }))
    .filter((entry) => Object.values(entry).some(Boolean));
}

function deriveEducationEntries(profile) {
  const entries = ensureStructuredEntries(profile?.educationEntries, createEducationEntry);
  if (entries.length > 0) {
    return entries;
  }

  const highestEducation = trimValue(profile?.highestEducation);
  const graduationStatus = trimValue(profile?.graduationStatus);
  const educationSummary = trimValue(profile?.educationSummary);

  if (!highestEducation && !graduationStatus && !educationSummary) {
    return [];
  }

  return [
    createEducationEntry({
      schoolType: LEGACY_TO_STRUCTURED_EDUCATION_MAP[highestEducation] || '',
      schoolName: '',
      admissionYear: '',
      graduationYear: '',
      graduationStatus: graduationStatus || ''
    })
  ];
}

function deriveCareerEntries(profile) {
  const entries = ensureStructuredEntries(profile?.careerEntries, createCareerEntry);
  if (entries.length > 0) {
    return entries;
  }

  const majorCareer = trimValue(profile?.majorCareer);
  const careerSummary = trimValue(profile?.careerSummary);
  const careerDetail = trimValue(profile?.careerDetail);

  if (!majorCareer && !careerSummary && !careerDetail) {
    return [];
  }

  return [
    createCareerEntry({
      companyName: majorCareer,
      departmentName: '',
      startYearMonth: '',
      endYearMonth: '',
      responsibilities: careerDetail || careerSummary
    })
  ];
}

function deriveProjectEntries(profile) {
  const entries = ensureStructuredEntries(profile?.projectEntries, createProjectEntry);
  if (entries.length > 0) {
    return entries;
  }

  const projectExperience = trimValue(profile?.projectExperience);

  if (!projectExperience) {
    return [];
  }

  return [
    createProjectEntry({
      projectType: 'OTHER',
      projectName: '프로젝트 경험',
      startYearMonth: '',
      endYearMonth: '',
      projectDescription: projectExperience
    })
  ];
}

function deriveCertificationEntries(profile) {
  const entries = ensureStructuredEntries(profile?.certificationEntries, createCertificationEntry);
  if (entries.length > 0) {
    return entries;
  }

  const certifications = toStringArray(profile?.certifications);
  if (certifications.length === 0) {
    return [];
  }

  return certifications.map((certificationName) =>
    createCertificationEntry({
      issuer: '',
      certificationName,
      acquiredYearMonth: ''
    })
  );
}

function deriveLanguageEntries(profile) {
  return ensureStructuredEntries(profile?.languageEntries, createLanguageEntry);
}

function derivePortfolioEntries(profile) {
  const entries = ensureStructuredEntries(profile?.portfolioEntries, createPortfolioEntry);
  if (entries.length > 0) {
    return entries;
  }

  const portfolioUrl = trimValue(profile?.portfolioUrl);
  if (!portfolioUrl) {
    return [];
  }

  return [
    createPortfolioEntry({
      portfolioType: '',
      title: '',
      url: portfolioUrl
    })
  ];
}

function deriveAwardEntries(profile) {
  const entries = ensureStructuredEntries(profile?.awardEntries, createAwardEntry);
  if (entries.length > 0) {
    return entries;
  }

  const awards = trimValue(profile?.awards);
  if (!awards) {
    return [];
  }

  return [
    createAwardEntry({
      awardName: '',
      awardingOrganization: '',
      awardYear: '',
      awardDescription: awards
    })
  ];
}

function deriveTrainingEntries(profile) {
  const entries = ensureStructuredEntries(profile?.trainingEntries, createTrainingEntry);
  if (entries.length > 0) {
    return entries;
  }

  const trainings = trimValue(profile?.trainings);
  if (!trainings) {
    return [];
  }

  return [
    createTrainingEntry({
      trainingType: '',
      trainingName: '',
      institutionName: '',
      startYearMonth: '',
      endYearMonth: '',
      trainingDescription: trainings
    })
  ];
}

function hasSensitiveDisabilityContent(profile) {
  return [
    profile?.disabilityDescription,
    profile?.assistiveDevices,
    profile?.workSupportRequirements
  ].some((value) => trimValue(value).length > 0) || toStringArray(profile?.requiredSupports).length > 0;
}

function deriveEducationFields(profile, educationEntries) {
  const fallbackHighestEducation = trimValue(profile?.highestEducation);
  const fallbackGraduationStatus = trimValue(profile?.graduationStatus);
  const fallbackEducationSummary = normalizeEducationSummary(trimValue(profile?.educationSummary), fallbackHighestEducation);

  if (educationEntries.length === 0) {
    return {
      highestEducation: fallbackHighestEducation,
      graduationStatus: fallbackGraduationStatus,
      educationSummary: fallbackEducationSummary
    };
  }

  const representativeEntry = [...educationEntries].sort(
    (left, right) => (EDUCATION_PRIORITY_MAP[right.schoolType] || 0) - (EDUCATION_PRIORITY_MAP[left.schoolType] || 0)
  )[0];
  const highestEducation = STRUCTURED_EDUCATION_TO_HIGHEST_EDUCATION_MAP[representativeEntry.schoolType] || fallbackHighestEducation;
  const graduationStatus = STRUCTURED_GRADUATION_TO_PROFILE_MAP[representativeEntry.graduationStatus] || fallbackGraduationStatus;
  const educationSummary = limitText(
    educationEntries
      .map((entry) =>
        joinSegments([
          trimValue(entry.schoolName) || STRUCTURED_EDUCATION_LABEL_MAP[entry.schoolType],
          STRUCTURED_EDUCATION_LABEL_MAP[entry.schoolType],
          formatStructuredPeriod(entry.admissionYear, entry.graduationYear),
          STRUCTURED_GRADUATION_STATUS_LABEL_MAP[entry.graduationStatus]
        ])
      )
      .filter(Boolean)
      .join('\n'),
    500
  );

  return {
    highestEducation,
    graduationStatus,
    educationSummary: educationSummary || fallbackEducationSummary
  };
}

function deriveCareerFields(profile, careerEntries) {
  const fallbackMajorCareer = trimValue(profile?.majorCareer);
  const fallbackCareerSummary = trimValue(profile?.careerSummary) || fallbackMajorCareer;
  const fallbackCareerDetail = trimValue(profile?.careerDetail);

  if (careerEntries.length === 0) {
    const majorCareer = fallbackMajorCareer || DEFAULT_MAJOR_CAREER;
    return {
      majorCareer,
      careerSummary: fallbackCareerSummary || majorCareer,
      careerDetail: fallbackCareerDetail
    };
  }

  const representativeEntry = careerEntries[0];
  const majorCareer = limitText(
    joinSegments([
      representativeEntry.companyName,
      representativeEntry.departmentName,
      formatStructuredPeriod(representativeEntry.startYearMonth, representativeEntry.endYearMonth)
    ]),
    500
  );
  const careerSummary = limitText(
    careerEntries
      .map((entry) =>
        joinSegments([
          entry.companyName,
          entry.departmentName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth)
        ])
      )
      .filter(Boolean)
      .join('\n'),
    500
  );
  const careerDetail = careerEntries
    .map((entry) => joinSegments([entry.companyName, entry.responsibilities], ': '))
    .filter(Boolean)
    .join('\n\n');

  return {
    majorCareer: majorCareer || fallbackMajorCareer || DEFAULT_MAJOR_CAREER,
    careerSummary: careerSummary || fallbackCareerSummary || DEFAULT_MAJOR_CAREER,
    careerDetail: careerDetail || fallbackCareerDetail
  };
}

function deriveProjectFields(profile, projectEntries) {
  const fallbackProjectExperience = trimValue(profile?.projectExperience);

  if (projectEntries.length === 0) {
    return {
      projectExperience: fallbackProjectExperience
    };
  }

  return {
    projectExperience: projectEntries
      .map((entry) =>
        joinSegments([
          STRUCTURED_PROJECT_TYPE_LABEL_MAP[entry.projectType],
          entry.projectName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth),
          entry.projectDescription
        ])
      )
      .filter(Boolean)
      .join('\n\n')
  };
}

function deriveJobExtraFields(profile, certificationEntries, portfolioEntries, awardEntries, trainingEntries) {
  const fallbackCertifications = toStringArray(profile?.certifications);
  const fallbackPortfolioUrl = trimValue(profile?.portfolioUrl);
  const fallbackAwards = trimValue(profile?.awards);
  const fallbackTrainings = trimValue(profile?.trainings);

  const certifications = certificationEntries.length
    ? certificationEntries.map((entry) => entry.certificationName).filter(Boolean)
    : fallbackCertifications;

  const primaryPortfolio = portfolioEntries.find((entry) => trimValue(entry.url));
  const portfolioUrl = primaryPortfolio?.url || fallbackPortfolioUrl;
  const awards = awardEntries.length
    ? awardEntries
      .map((entry) =>
        joinSegments([
          entry.awardName,
          entry.awardingOrganization,
          entry.awardYear
        ])
      )
      .concat(awardEntries.map((entry) => trimValue(entry.awardDescription)).filter(Boolean))
      .filter(Boolean)
      .join('\n')
    : fallbackAwards;
  const trainings = trainingEntries.length
    ? trainingEntries
      .map((entry) =>
        joinSegments([
          entry.trainingType,
          entry.trainingName,
          entry.institutionName,
          formatStructuredPeriod(entry.startYearMonth, entry.endYearMonth)
        ])
      )
      .concat(trainingEntries.map((entry) => trimValue(entry.trainingDescription)).filter(Boolean))
      .filter(Boolean)
      .join('\n')
    : fallbackTrainings;

  return {
    certifications,
    portfolioUrl,
    awards,
    trainings
  };
}

export function normalizeStructuredProfileDraft(profile) {
  const nextProfile = {
    ...createEmptyProfileDraft(),
    ...profile
  };
  const educationEntries = deriveEducationEntries(nextProfile);
  const careerEntries = deriveCareerEntries(nextProfile);
  const projectEntries = deriveProjectEntries(nextProfile);
  const certificationEntries = deriveCertificationEntries(nextProfile);
  const languageEntries = deriveLanguageEntries(nextProfile);
  const portfolioEntries = derivePortfolioEntries(nextProfile);
  const awardEntries = deriveAwardEntries(nextProfile);
  const trainingEntries = deriveTrainingEntries(nextProfile);
  const educationFields = deriveEducationFields(nextProfile, sanitizeEducationEntries(educationEntries));
  const careerFields = deriveCareerFields(nextProfile, sanitizeCareerEntries(careerEntries));
  const projectFields = deriveProjectFields(nextProfile, sanitizeProjectEntries(projectEntries));
  const jobExtraFields = deriveJobExtraFields(
    nextProfile,
    sanitizeCertificationEntries(certificationEntries),
    sanitizePortfolioEntries(portfolioEntries),
    sanitizeAwardEntries(awardEntries),
    sanitizeTrainingEntries(trainingEntries)
  );

  return {
    ...nextProfile,
    educationEntries,
    careerEntries,
    projectEntries,
    certificationEntries,
    languageEntries,
    portfolioEntries,
    awardEntries,
    trainingEntries,
    sensitiveInfoConsentYn:
      typeof nextProfile.sensitiveInfoConsentYn === 'boolean'
        ? nextProfile.sensitiveInfoConsentYn
        : hasSensitiveDisabilityContent(nextProfile),
    ...educationFields,
    ...careerFields,
    ...projectFields,
    ...jobExtraFields
  };
}

export function createEmptyProfileDraft() {
  return {
    desiredJob: '',
    commuteRange: '',
    preferredWorkEnvironments: [],
    avoidedWorkEnvironments: [],
    requiredSupports: [],
    disabilityType: '',
    careerSummary: '',
    educationSummary: '',
    employmentTypeSummary: '',
    profileName: '',
    fullName: '',
    contactPhone: '',
    contactEmail: '',
    birthDate: '',
    genderType: '',
    ageGroup: '',
    detailAddress: '',
    emergencyContact: '',
    highestEducation: '',
    graduationStatus: '',
    educationEntries: [],
    majorCareer: '',
    careerEntries: [],
    careerDetail: '',
    projectEntries: [],
    projectExperience: '',
    careerGapReason: '',
    targetJob: '',
    skills: [],
    certificationEntries: [],
    certifications: [],
    languageEntries: [],
    portfolioEntries: [],
    portfolioUrl: '',
    awardEntries: [],
    awards: '',
    trainingEntries: [],
    trainings: '',
    disabilitySeverity: '',
    disabilityRegisteredYn: null,
    sensitiveInfoConsentYn: false,
    disabilityDescription: '',
    assistiveDevices: '',
    workSupportRequirements: '',
    workAvailability: '',
    workTypes: [],
    expectedSalary: '',
    workTimePreference: '',
    remoteAvailableYn: null,
    selfIntroduction: '',
    motivation: '',
    jobFitDescription: '',
    careerGoal: '',
    strengthsWeaknesses: '',
    militaryService: '',
    patrioticVeteranYn: null,
    snsUrl: ''
  };
}

export function toDraftProfile(profile) {
  const { referrer: _referrer, ...profileWithoutReferrer } = profile || {};

  return normalizeStructuredProfileDraft({
    ...createEmptyProfileDraft(),
    ...profileWithoutReferrer,
    preferredWorkEnvironments: profile?.preferredWorkEnvironments || [],
    avoidedWorkEnvironments: profile?.avoidedWorkEnvironments || [],
    requiredSupports: profile?.requiredSupports || [],
    skills: profile?.skills || [],
    certifications: profile?.certifications || [],
    workTypes: profile?.workTypes || [],
    disabilityRegisteredYn:
      typeof profile?.disabilityRegisteredYn === 'boolean' ? profile.disabilityRegisteredYn : null,
    remoteAvailableYn: typeof profile?.remoteAvailableYn === 'boolean' ? profile.remoteAvailableYn : null,
    patrioticVeteranYn: typeof profile?.patrioticVeteranYn === 'boolean' ? profile.patrioticVeteranYn : null
  });
}

function toTextOrEmpty(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function toBooleanOrNull(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

export function toExtractedDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return null;
  }

  return normalizeStructuredProfileDraft({
    desiredJob: toTextOrEmpty(draft.desiredJob),
    commuteRange: toTextOrEmpty(draft.commuteRange),
    preferredWorkEnvironments: toStringArray(draft.preferredWorkEnvironments),
    avoidedWorkEnvironments: toStringArray(draft.avoidedWorkEnvironments),
    requiredSupports: toStringArray(draft.requiredSupports),
    disabilityType: toTextOrEmpty(draft.disabilityType),
    careerSummary: toTextOrEmpty(draft.careerSummary),
    educationSummary: normalizeEducationSummary(toTextOrEmpty(draft.educationSummary), toTextOrEmpty(draft.highestEducation)),
    employmentTypeSummary: toTextOrEmpty(draft.employmentTypeSummary),
    profileName: toTextOrEmpty(draft.profileName),
    fullName: toTextOrEmpty(draft.fullName),
    contactPhone: toTextOrEmpty(draft.contactPhone),
    contactEmail: toTextOrEmpty(draft.contactEmail),
    birthDate: toTextOrEmpty(draft.birthDate),
    genderType: toTextOrEmpty(draft.genderType),
    ageGroup: toTextOrEmpty(draft.ageGroup),
    detailAddress: toTextOrEmpty(draft.detailAddress),
    emergencyContact: toTextOrEmpty(draft.emergencyContact),
    highestEducation: toTextOrEmpty(draft.highestEducation),
    graduationStatus: toTextOrEmpty(draft.graduationStatus),
    educationEntries: Array.isArray(draft.educationEntries) ? draft.educationEntries.map((entry) => stripClientId(createEducationEntry(entry))) : [],
    majorCareer: toTextOrEmpty(draft.majorCareer),
    careerEntries: Array.isArray(draft.careerEntries) ? draft.careerEntries.map((entry) => stripClientId(createCareerEntry(entry))) : [],
    careerDetail: toTextOrEmpty(draft.careerDetail),
    projectEntries: Array.isArray(draft.projectEntries) ? draft.projectEntries.map((entry) => stripClientId(createProjectEntry(entry))) : [],
    projectExperience: toTextOrEmpty(draft.projectExperience),
    careerGapReason: toTextOrEmpty(draft.careerGapReason),
    targetJob: toTextOrEmpty(draft.targetJob),
    skills: toStringArray(draft.skills),
    certificationEntries: Array.isArray(draft.certificationEntries)
      ? draft.certificationEntries.map((entry) => stripClientId(createCertificationEntry(entry)))
      : [],
    certifications: toStringArray(draft.certifications),
    languageEntries: Array.isArray(draft.languageEntries)
      ? draft.languageEntries.map((entry) => stripClientId(createLanguageEntry(entry)))
      : [],
    portfolioEntries: Array.isArray(draft.portfolioEntries)
      ? draft.portfolioEntries.map((entry) => stripClientId(createPortfolioEntry(entry)))
      : [],
    portfolioUrl: toTextOrEmpty(draft.portfolioUrl),
    awardEntries: Array.isArray(draft.awardEntries)
      ? draft.awardEntries.map((entry) => stripClientId(createAwardEntry(entry)))
      : [],
    awards: toTextOrEmpty(draft.awards),
    trainingEntries: Array.isArray(draft.trainingEntries)
      ? draft.trainingEntries.map((entry) => stripClientId(createTrainingEntry(entry)))
      : [],
    trainings: toTextOrEmpty(draft.trainings),
    disabilitySeverity: toTextOrEmpty(draft.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(draft.disabilityRegisteredYn),
    sensitiveInfoConsentYn: typeof draft.sensitiveInfoConsentYn === 'boolean' ? draft.sensitiveInfoConsentYn : false,
    disabilityDescription: toTextOrEmpty(draft.disabilityDescription),
    assistiveDevices: toTextOrEmpty(draft.assistiveDevices),
    workSupportRequirements: toTextOrEmpty(draft.workSupportRequirements),
    workAvailability: toTextOrEmpty(draft.workAvailability),
    workTypes: toStringArray(draft.workTypes),
    expectedSalary: toTextOrEmpty(draft.expectedSalary),
    workTimePreference: toTextOrEmpty(draft.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(draft.remoteAvailableYn),
    selfIntroduction: toTextOrEmpty(draft.selfIntroduction),
    motivation: toTextOrEmpty(draft.motivation),
    jobFitDescription: toTextOrEmpty(draft.jobFitDescription),
    careerGoal: toTextOrEmpty(draft.careerGoal),
    strengthsWeaknesses: toTextOrEmpty(draft.strengthsWeaknesses),
    militaryService: toTextOrEmpty(draft.militaryService),
    patrioticVeteranYn: toBooleanOrNull(draft.patrioticVeteranYn),
    snsUrl: toTextOrEmpty(draft.snsUrl)
  });
}

function trimValue(value) {
  return String(value ?? '').trim();
}

function compactPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null || value === undefined || value === '') {
        return false;
      }

      return !(Array.isArray(value) && value.length === 0);
    })
  );
}

export function toProfilePayload(profile) {
  const normalizedProfile = normalizeStructuredProfileDraft(profile);
  const educationEntries = sanitizeEducationEntries(normalizedProfile.educationEntries);
  const careerEntries = sanitizeCareerEntries(normalizedProfile.careerEntries);
  const projectEntries = sanitizeProjectEntries(normalizedProfile.projectEntries);
  const certificationEntries = sanitizeCertificationEntries(normalizedProfile.certificationEntries);
  const languageEntries = sanitizeLanguageEntries(normalizedProfile.languageEntries);
  const portfolioEntries = sanitizePortfolioEntries(normalizedProfile.portfolioEntries);
  const awardEntries = sanitizeAwardEntries(normalizedProfile.awardEntries);
  const trainingEntries = sanitizeTrainingEntries(normalizedProfile.trainingEntries);
  const payload = {
    profileName: trimValue(normalizedProfile.profileName),
    desiredJob: trimValue(normalizedProfile.desiredJob) || trimValue(normalizedProfile.targetJob),
    commuteRange: trimValue(normalizedProfile.commuteRange),
    preferredWorkEnvironments: toStringArray(normalizedProfile.preferredWorkEnvironments),
    avoidedWorkEnvironments: toStringArray(normalizedProfile.avoidedWorkEnvironments),
    requiredSupports: toStringArray(normalizedProfile.requiredSupports),
    disabilityType: trimValue(normalizedProfile.disabilityType),
    careerSummary: trimValue(normalizedProfile.careerSummary) || trimValue(normalizedProfile.majorCareer),
    educationSummary: normalizeEducationSummary(trimValue(normalizedProfile.educationSummary), trimValue(normalizedProfile.highestEducation)),
    employmentTypeSummary: trimValue(normalizedProfile.employmentTypeSummary) || normalizedProfile.workTypes.join(', '),
    fullName: trimValue(normalizedProfile.fullName),
    contactPhone: trimValue(normalizedProfile.contactPhone),
    contactEmail: trimValue(normalizedProfile.contactEmail),
    birthDate: normalizeBirthDate(normalizedProfile.birthDate),
    genderType: trimValue(normalizedProfile.genderType),
    ageGroup: trimValue(normalizedProfile.ageGroup),
    detailAddress: trimValue(normalizedProfile.detailAddress),
    emergencyContact: trimValue(normalizedProfile.emergencyContact),
    highestEducation: trimValue(normalizedProfile.highestEducation),
    graduationStatus: trimValue(normalizedProfile.graduationStatus),
    educationEntries,
    majorCareer: trimValue(normalizedProfile.majorCareer),
    careerEntries,
    careerDetail: trimValue(normalizedProfile.careerDetail),
    projectEntries,
    projectExperience: trimValue(normalizedProfile.projectExperience),
    careerGapReason: trimValue(normalizedProfile.careerGapReason),
    targetJob: trimValue(normalizedProfile.targetJob),
    skills: toStringArray(normalizedProfile.skills),
    certificationEntries,
    certifications: toStringArray(normalizedProfile.certifications),
    languageEntries,
    portfolioEntries,
    portfolioUrl: trimValue(normalizedProfile.portfolioUrl),
    awardEntries,
    awards: trimValue(normalizedProfile.awards),
    trainingEntries,
    trainings: trimValue(normalizedProfile.trainings),
    disabilitySeverity: trimValue(normalizedProfile.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(normalizedProfile.disabilityRegisteredYn),
    sensitiveInfoConsentYn: normalizedProfile.sensitiveInfoConsentYn === true,
    disabilityDescription: trimValue(normalizedProfile.disabilityDescription),
    assistiveDevices: trimValue(normalizedProfile.assistiveDevices),
    workSupportRequirements: trimValue(normalizedProfile.workSupportRequirements),
    workAvailability: trimValue(normalizedProfile.workAvailability),
    workTypes: toStringArray(normalizedProfile.workTypes),
    expectedSalary: trimValue(normalizedProfile.expectedSalary),
    workTimePreference: trimValue(normalizedProfile.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(normalizedProfile.remoteAvailableYn),
    selfIntroduction: trimValue(normalizedProfile.selfIntroduction),
    motivation: trimValue(normalizedProfile.motivation),
    jobFitDescription: trimValue(normalizedProfile.jobFitDescription),
    careerGoal: trimValue(normalizedProfile.careerGoal),
    strengthsWeaknesses: trimValue(normalizedProfile.strengthsWeaknesses),
    militaryService: trimValue(normalizedProfile.militaryService),
    patrioticVeteranYn: toBooleanOrNull(normalizedProfile.patrioticVeteranYn),
    snsUrl: trimValue(normalizedProfile.snsUrl)
  };

  return compactPayload(payload);
}

function normalizeEducationSummary(summary, highestEducation) {
  const trimmedSummary = trimValue(summary);
  if (trimmedSummary.length > 0) {
    return HIGHEST_EDUCATION_LABEL_MAP[trimmedSummary] || trimmedSummary;
  }

  const educationCode = trimValue(highestEducation);
  if (!educationCode) {
    return '';
  }

  return HIGHEST_EDUCATION_LABEL_MAP[educationCode] || educationCode;
}

export function getProfileDraftStorageKey(profileId) {
  return `${STORAGE_KEYS.profileDraftAutosave}:${profileId}`;
}

export function toSafeProfileDraft(profile) {
  return Object.fromEntries(
    SAFE_PROFILE_DRAFT_FIELDS
      .filter((field) => Object.prototype.hasOwnProperty.call(profile || {}, field))
      .map((field) => [field, profile[field]])
  );
}

export function readProfileDraftCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }

  try {
    const rawCache = window.sessionStorage.getItem(storageKey);

    if (!rawCache) {
      return null;
    }

    const parsed = JSON.parse(rawCache);

    if (!parsed?.draft || !parsed?.savedAt) {
      return null;
    }

    if (Date.now() - parsed.savedAt > PROFILE_DRAFT_CACHE_TTL_MS) {
      clearProfileDraftCache(storageKey);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readProfileDraftSummaries() {
  if (typeof window === 'undefined') {
    return [];
  }

  const prefix = `${STORAGE_KEYS.profileDraftAutosave}:`;
  const summaries = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index);

    if (!storageKey?.startsWith(prefix)) {
      continue;
    }

    const cached = readProfileDraftCache(storageKey);

    if (!cached?.draft) {
      continue;
    }

    summaries.push({
      storageKey,
      profileId: storageKey.slice(prefix.length),
      draft: cached.draft,
      savedAt: cached.savedAt
    });
  }

  return summaries.sort((a, b) => b.savedAt - a.savedAt);
}

export function writeProfileDraftCache(storageKey, value) {
  if (!storageKey || typeof window === 'undefined') {
    return false;
  }

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        ...value
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearProfileDraftCache(storageKey) {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // 로컬 임시저장 정리 실패는 실제 프로필 저장 흐름을 막지 않습니다.
  }
}

function hasText(value) {
  return trimValue(value).length > 0;
}

const profileFormatFields = [
  ['fullName', 'name'],
  ['contactPhone', 'phone'],
  ['contactEmail', 'email'],
  ['birthDate', 'birthDate']
];

function getProfileFormatMessage(profile) {
  const invalidField = profileFormatFields.find(([profileField, formatField]) => getFieldFormatMessage(formatField, profile[profileField]));
  return invalidField ? getFieldFormatMessage(invalidField[1], profile[invalidField[0]]) : '';
}

export function getVisibleValidationErrors(profile, visible) {
  if (!profile) {
    return {};
  }

  return Object.fromEntries(
    profileFormatFields
      .filter(([profileField]) => visible[profileField])
      .map(([profileField, formatField]) => [profileField, getFieldFormatMessage(formatField, profile[profileField])])
      .filter(([, message]) => message)
  );
}

export function getValidationMessage(profile) {
  const normalizedProfile = normalizeStructuredProfileDraft(profile);
  const missing = requiredFields.find(([field]) => !hasText(normalizedProfile[field]));

  if (missing) {
    return `${missing[1]} 항목을 입력해 주세요.`;
  }

  const formatMessage = getProfileFormatMessage(normalizedProfile);

  if (formatMessage) {
    return formatMessage;
  }

  if (!Array.isArray(normalizedProfile.skills) || normalizedProfile.skills.length === 0) {
    return '보유 기술/역량을 1개 이상 입력해 주세요.';
  }

  if (!Array.isArray(normalizedProfile.workTypes) || normalizedProfile.workTypes.length === 0) {
    return '근무 형태 가능 범위를 1개 이상 선택해 주세요.';
  }

  if (
    normalizedProfile.sensitiveInfoConsentYn === true &&
    (!hasText(normalizedProfile.disabilityType) ||
      !hasText(normalizedProfile.disabilitySeverity) ||
      typeof normalizedProfile.disabilityRegisteredYn !== 'boolean')
  ) {
    return '민감정보 처리에 동의한 경우 장애 유형, 장애 정도, 장애 등록 여부를 모두 입력해 주세요.';
  }

  return '';
}
