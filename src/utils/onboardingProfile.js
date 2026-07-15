import { ONBOARDING_STEPS } from '../constants/onboarding';
import { normalizeBirthDate } from './birthDate';
import { fieldFormats, getFieldFormatMessage } from './formValidation';

const STEPS = ONBOARDING_STEPS;

export const toInitialForm = (seed) => ({
  name: '',
  gender: '',
  phone: '',
  email: seed?.email || '',
  birthDate: '',
  address: '',
  education: '',
  graduationStatus: '',
  career: '',
  jobs: [],
  skills: '',
  employmentTypes: ['FULL_TIME'],
  disabilityType: '',
  disabilitySeverity: '',
  registeredYn: '',
  sensitiveInfoConsentYn: false,
  introduction: ''
});

const toBooleanFromChoice = (value, trueValue) => value === trueValue;

const hasText = (value) => Boolean(value.trim());

const withoutEmptyOptionalFields = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === null || value === undefined || value === '') {
        return false;
      }

      return !(Array.isArray(value) && value.length === 0);
    })
  );

export const formatValidationFields = Object.keys(fieldFormats);

export const getStepValidationMessage = (step, form) => {
  if (step === 1) {
    if (
      !hasText(form.name) ||
      !form.gender ||
      !hasText(form.phone) ||
      !hasText(form.email) ||
      !hasText(form.birthDate) ||
      !hasText(form.address)
    ) {
      return '이름, 성별, 연락처, 이메일, 생년월일, 거주지 상세 주소를 입력해 주세요.';
    }

    const formatValidationMessage =
      getFieldFormatMessage('name', form.name) ||
      getFieldFormatMessage('phone', form.phone) ||
      getFieldFormatMessage('email', form.email) ||
      getFieldFormatMessage('birthDate', form.birthDate);

    if (formatValidationMessage) {
      return formatValidationMessage;
    }

    return '';
  }

  if (step === 2) {
    if (!form.education || !form.graduationStatus || !hasText(form.career) || !form.jobs.length || !hasText(form.skills)) {
      return '최종 학력, 졸업 상태, 주요 경력, 지원 직무, 보유 기술/역량을 입력해 주세요.';
    }

    return '';
  }

  if (step === 3) {
    if (!form.employmentTypes.length) {
      return '가능한 고용형태를 선택해 주세요.';
    }

    return '';
  }

  if (step === 4) {
    if (form.sensitiveInfoConsentYn && (!form.disabilityType || !form.disabilitySeverity || !form.registeredYn)) {
      return '장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.';
    }

    return '';
  }

  if (step === 5) {
    if (!hasText(form.introduction)) {
      return '자기소개를 입력해 주세요.';
    }
  }

  return '';
};

export const getSignupValidationMessage = (form) => {
  const invalidStep = STEPS.find((step) => getStepValidationMessage(step.id, form));
  return invalidStep ? getStepValidationMessage(invalidStep.id, form) : '';
};

const onboardingInputFields = [
  { key: 'name', value: (form) => form.name },
  { key: 'gender', value: (form) => form.gender },
  { key: 'phone', value: (form) => form.phone },
  { key: 'email', value: (form) => form.email },
  { key: 'birthDate', value: (form) => form.birthDate },
  { key: 'address', value: (form) => form.address },
  { key: 'education', value: (form) => form.education },
  { key: 'graduationStatus', value: (form) => form.graduationStatus },
  { key: 'career', value: (form) => form.career },
  { key: 'jobs', value: (form) => form.jobs },
  { key: 'skills', value: (form) => form.skills },
  { key: 'employmentTypes', value: (form) => form.employmentTypes },
  { key: 'disabilityType', value: (form) => form.disabilityType },
  { key: 'disabilitySeverity', value: (form) => form.disabilitySeverity },
  { key: 'registeredYn', value: (form) => form.registeredYn },
  { key: 'introduction', value: (form) => form.introduction }
];

const detailProfileGroups = [
  {
    label: '추가 연락',
    fields: ['emergencyContact']
  },
  {
    label: '세부 학력·경력',
    fields: ['careerSummary', 'educationSummary', 'projectExperience', 'careerGapReason']
  },
  {
    label: '자격·포트폴리오',
    fields: ['certifications', 'portfolioUrl', 'awards', 'trainings']
  },
  {
    label: '상세 장애·지원',
    fields: ['disabilityDescription', 'assistiveDevices', 'workSupportRequirements', 'requiredSupports']
  },
  {
    label: '희망 근무조건',
    fields: ['workAvailability', 'expectedSalary', 'workTimePreference', 'remoteAvailableYn', 'commuteRange']
  },
  {
    label: '소개 보강',
    fields: ['motivation', 'jobFitDescription', 'careerGoal', 'strengthsWeaknesses']
  },
  {
    label: '기타 정보',
    fields: ['militaryService', 'patrioticVeteranYn', 'snsUrl']
  }
];

const hasCompletedValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return value !== null && value !== undefined && String(value).trim().length > 0;
};

export const getCompletionSummary = (form) => {
  const completedInputCount = onboardingInputFields.filter((field) => hasCompletedValue(field.value(form))).length;
  const remainingDetailGroupCount = detailProfileGroups.length;
  const remainingDetailFieldCount = detailProfileGroups.reduce((sum, group) => sum + group.fields.length, 0);
  const estimatedMinutes = Math.max(3, Math.ceil(remainingDetailFieldCount / 5));

  return {
    completedInputCount,
    remainingDetailGroupCount,
    remainingDetailFieldCount,
    estimatedMinutes,
    totalProfileSignals: completedInputCount + remainingDetailFieldCount
  };
};

export const toSignupProfile = (form) => {
  const trimmedName = form.name.trim();
  const trimmedAddress = form.address.trim();
  const trimmedCareer = form.career.trim();
  const trimmedIntroduction = form.introduction.trim();
  const selectedJobs = form.jobs;
  const skills = form.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  return withoutEmptyOptionalFields({
    fullName: trimmedName,
    contactPhone: form.phone.trim(),
    contactEmail: form.email.trim(),
    birthDate: normalizeBirthDate(form.birthDate),
    genderType: form.gender,
    detailAddress: trimmedAddress,
    highestEducation: form.education,
    graduationStatus: form.graduationStatus,
    majorCareer: trimmedCareer,
    targetJob: selectedJobs.join(', '),
    skills,
    disabilityType: form.sensitiveInfoConsentYn ? form.disabilityType : undefined,
    disabilitySeverity: form.sensitiveInfoConsentYn ? form.disabilitySeverity : undefined,
    disabilityRegisteredYn: form.sensitiveInfoConsentYn
      ? toBooleanFromChoice(form.registeredYn, '등록')
      : undefined,
    sensitiveInfoConsentYn: form.sensitiveInfoConsentYn === true,
    workTypes: form.employmentTypes,
    selfIntroduction: trimmedIntroduction
  });
};
