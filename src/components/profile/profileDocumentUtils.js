export const PROFILE_PDF_EXPORT_READY_EVENT = 'bridgework:profile-pdf-export-ready';
export const PROFILE_PDF_EXPORT_DATA_EVENT = 'bridgework:profile-pdf-export-data';

const PROFILE_DOCUMENT_DEFAULTS = Object.freeze({
  profileId: '',
  profileName: '',
  fullName: '',
  contactPhone: '',
  contactEmail: '',
  birthDate: '',
  genderType: '',
  ageGroup: '',
  detailAddress: '',
  emergencyContact: '',
  educationSummary: '',
  highestEducation: '',
  graduationStatus: '',
  majorCareer: '',
  careerSummary: '',
  careerDetail: '',
  careerGapReason: '',
  targetJob: '',
  skills: [],
  disabilityType: '',
  disabilitySeverity: '',
  disabilityRegisteredYn: null,
  disabilityDescription: '',
  assistiveDevices: '',
  workSupportRequirements: '',
  requiredSupports: [],
  workAvailability: '',
  workTypes: [],
  expectedSalary: '',
  workTimePreference: '',
  remoteAvailableYn: null,
  commuteRange: '',
  selfIntroduction: '',
  motivation: '',
  jobFitDescription: '',
  careerGoal: '',
  strengthsWeaknesses: '',
  militaryService: '',
  patrioticVeteranYn: null,
  snsUrl: '',
  educationEntries: [],
  careerEntries: [],
  projectEntries: [],
  certificationEntries: [],
  languageEntries: [],
  portfolioEntries: [],
  awardEntries: [],
  trainingEntries: []
});

function toTextOrEmpty(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? '').trim())
    .filter((item) => item.length > 0);
}

function toBooleanOrNull(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return null;
}

function toEntryArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({ ...entry }));
}

export function createProfilePdfExportChannelId() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `profile-pdf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeProfileDocumentData(profile) {
  return {
    ...PROFILE_DOCUMENT_DEFAULTS,
    ...profile,
    profileId: toTextOrEmpty(profile?.profileId ?? profile?.id),
    profileName: toTextOrEmpty(profile?.profileName),
    fullName: toTextOrEmpty(profile?.fullName),
    contactPhone: toTextOrEmpty(profile?.contactPhone),
    contactEmail: toTextOrEmpty(profile?.contactEmail),
    birthDate: toTextOrEmpty(profile?.birthDate),
    genderType: toTextOrEmpty(profile?.genderType),
    ageGroup: toTextOrEmpty(profile?.ageGroup),
    detailAddress: toTextOrEmpty(profile?.detailAddress),
    emergencyContact: toTextOrEmpty(profile?.emergencyContact),
    educationSummary: toTextOrEmpty(profile?.educationSummary),
    highestEducation: toTextOrEmpty(profile?.highestEducation),
    graduationStatus: toTextOrEmpty(profile?.graduationStatus),
    majorCareer: toTextOrEmpty(profile?.majorCareer),
    careerSummary: toTextOrEmpty(profile?.careerSummary),
    careerDetail: toTextOrEmpty(profile?.careerDetail),
    careerGapReason: toTextOrEmpty(profile?.careerGapReason),
    targetJob: toTextOrEmpty(profile?.targetJob),
    skills: toStringArray(profile?.skills),
    disabilityType: toTextOrEmpty(profile?.disabilityType),
    disabilitySeverity: toTextOrEmpty(profile?.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(profile?.disabilityRegisteredYn),
    disabilityDescription: toTextOrEmpty(profile?.disabilityDescription),
    assistiveDevices: toTextOrEmpty(profile?.assistiveDevices),
    workSupportRequirements: toTextOrEmpty(profile?.workSupportRequirements),
    requiredSupports: toStringArray(profile?.requiredSupports),
    workAvailability: toTextOrEmpty(profile?.workAvailability),
    workTypes: toStringArray(profile?.workTypes),
    expectedSalary: toTextOrEmpty(profile?.expectedSalary),
    workTimePreference: toTextOrEmpty(profile?.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(profile?.remoteAvailableYn),
    commuteRange: toTextOrEmpty(profile?.commuteRange),
    selfIntroduction: toTextOrEmpty(profile?.selfIntroduction),
    motivation: toTextOrEmpty(profile?.motivation),
    jobFitDescription: toTextOrEmpty(profile?.jobFitDescription),
    careerGoal: toTextOrEmpty(profile?.careerGoal),
    strengthsWeaknesses: toTextOrEmpty(profile?.strengthsWeaknesses),
    militaryService: toTextOrEmpty(profile?.militaryService),
    patrioticVeteranYn: toBooleanOrNull(profile?.patrioticVeteranYn),
    snsUrl: toTextOrEmpty(profile?.snsUrl),
    educationEntries: toEntryArray(profile?.educationEntries),
    careerEntries: toEntryArray(profile?.careerEntries),
    projectEntries: toEntryArray(profile?.projectEntries),
    certificationEntries: toEntryArray(profile?.certificationEntries),
    languageEntries: toEntryArray(profile?.languageEntries),
    portfolioEntries: toEntryArray(profile?.portfolioEntries),
    awardEntries: toEntryArray(profile?.awardEntries),
    trainingEntries: toEntryArray(profile?.trainingEntries)
  };
}
