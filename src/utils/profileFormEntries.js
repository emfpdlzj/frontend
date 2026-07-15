import { languageTestOptionsByLanguage } from '../constants/profileOptions';

let structuredEntrySequence = 0;

function createStructuredEntryId(prefix) {
  structuredEntrySequence += 1;
  return `${prefix}-${structuredEntrySequence}`;
}

export function createEducationEntry(entry = {}) {
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

export function createCareerEntry(entry = {}) {
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

export function createProjectEntry(entry = {}) {
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

export function createCertificationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('certification'),
    issuer: '',
    certificationName: '',
    acquiredYearMonth: '',
    ...entry
  };
}

export function createLanguageEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('language'),
    languageName: '',
    testName: '',
    scoreOrGrade: '',
    acquiredYearMonth: '',
    ...entry
  };
}

export function createPortfolioEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('portfolio'),
    portfolioType: '',
    title: '',
    url: '',
    ...entry
  };
}

export function createAwardEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('award'),
    awardName: '',
    awardingOrganization: '',
    awardYear: '',
    awardDescription: '',
    ...entry
  };
}

export function createTrainingEntry(entry = {}) {
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

export function normalizeYearInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4);
}

export function normalizeYearMonthInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 6);

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 4)}.${digits.slice(4)}`;
}

export function getLanguageTestOptions(languageName, currentValue = '') {
  const baseOptions = (languageTestOptionsByLanguage[languageName] || languageTestOptionsByLanguage.기타 || []).map((option) => ({
    value: option,
    label: option
  }));

  if (currentValue && !baseOptions.some((option) => option.value === currentValue)) {
    return [{ value: currentValue, label: currentValue }, ...baseOptions];
  }

  return baseOptions;
}
