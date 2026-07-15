export const GENDER_OPTIONS = Object.freeze([
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '기타' },
  { value: 'NOT_DISCLOSED', label: '선택 안 함' }
]);

export const ONBOARDING_STEPS = Object.freeze([
  { id: 1, title: '기본 정보' },
  { id: 2, title: '직무·경력' },
  { id: 3, title: '근무 조건' },
  { id: 4, title: '장애 정보' },
  { id: 5, title: '자기소개' }
]);

export const EDUCATION_OPTIONS = Object.freeze([
  { value: 'HIGH_SCHOOL_OR_BELOW', label: '고졸 이하' },
  { value: 'HIGH_SCHOOL', label: '고졸' },
  { value: 'COLLEGE', label: '전문대졸' },
  { value: 'BACHELOR', label: '대졸' },
  { value: 'MASTER', label: '석사' },
  { value: 'DOCTOR', label: '박사' },
  { value: 'OTHER', label: '기타' }
]);

export const GRADUATION_STATUS_OPTIONS = Object.freeze([
  { value: 'GRADUATED', label: '졸업' },
  { value: 'EXPECTED', label: '졸업예정' },
  { value: 'ENROLLED', label: '재학' },
  { value: 'COMPLETED', label: '수료' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'OTHER', label: '기타' }
]);

export const MAX_ONBOARDING_JOB_SELECTIONS = 5;

export const DISABILITY_TYPE_OPTIONS = Object.freeze([
  { value: 'PHYSICAL', label: '지체' },
  { value: 'BRAIN_LESION', label: '뇌병변' },
  { value: 'VISUAL', label: '시각' },
  { value: 'HEARING', label: '청각' },
  { value: 'SPEECH', label: '언어' },
  { value: 'INTELLECTUAL', label: '지적' },
  { value: 'AUTISM', label: '자폐성' },
  { value: 'MENTAL', label: '정신' },
  { value: 'KIDNEY', label: '신장' },
  { value: 'HEART', label: '심장' },
  { value: 'RESPIRATORY', label: '호흡기' },
  { value: 'LIVER', label: '간' },
  { value: 'FACE', label: '안면' },
  { value: 'STOMA_URINARY', label: '장루·요루' },
  { value: 'EPILEPSY', label: '뇌전증' },
  { value: 'OTHER', label: '기타' }
]);

export const DISABILITY_SEVERITY_OPTIONS = Object.freeze([
  { value: 'SEVERE', label: '중증' },
  { value: 'MODERATE', label: '중등도' },
  { value: 'MILD', label: '경증' }
]);

export const DISABILITY_REGISTERED_OPTIONS = Object.freeze([
  { value: '등록', label: '등록됨' },
  { value: '미등록', label: '등록 안 됨' }
]);
