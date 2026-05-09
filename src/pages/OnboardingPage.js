import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkCircleIcon from '../assets/signup/check_circle.png';
import stepBeforeIcon from '../assets/signup/item-before.png';
import stepCompleteIcon from '../assets/signup/item-completion.png';
import stepCurrentIcon from '../assets/signup/item-ing.png';
import { useAuth } from '../auth/AuthContext';
import { ROUTE_PATHS } from '../config/routes';
import { LoadingView } from '../components/common/LoadingView';
import { StatusMessage } from '../components/common/StatusMessage';
import { useSignupOptions } from '../hooks/useSignupOptions';

const genderOptions = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '기타' },
  { value: 'NOT_DISCLOSED', label: '선택 안 함' }
];

const STEPS = [
  { id: 1, title: '기본 정보' },
  { id: 2, title: '직무·경력' },
  { id: 3, title: '근무 조건' },
  { id: 4, title: '장애 정보' },
  { id: 5, title: '자기소개' }
];

const educationOptions = ['고졸 이하', '초대졸', '대졸', '석사', '박사'];
const MAX_JOB_SELECTIONS = 5;
const disabilityTypes = ['지체', '시각', '청각', '발달', '뇌병변', '내부장애', '확인 필요'];
const disabilitySeverityOptions = ['심한 장애 (1~3급)', '심하지 않은 장애 (4~6급)', '확인 필요'];
const disabilityRegisteredOptions = [
  { value: '등록', label: '등록됨' },
  { value: '미등록', label: '등록 안 됨' }
];
const EXCLUSIVE_DISABILITY_TYPES = ['확인 필요'];
const MIN_WORKING_AGE = 15;
const MIN_WORKING_AGE_MESSAGE = '근로기준법상 취업 가능한 노동 가능 연령은 원칙적으로 만 15세 이상입니다.';

const toInitialForm = (seed) => ({
  name: '',
  gender: '',
  phone: '',
  email: seed?.email || '',
  birthDate: '',
  region: '',
  address: '',
  education: '',
  career: '',
  jobs: [],
  employmentTypes: ['정규직'],
  salaryType: '',
  disabilityTypes: [],
  disabilitySeverity: '',
  registeredYn: '',
  introduction: '',
  motivation: ''
});

const normalizeBirthDate = (value) => {
  const match = value.trim().match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);

  if (!match) {
    return '';
  }

  const [, rawYear, rawMonth, rawDay] = match;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }

  return `${rawYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const toBirthDateDisplay = (value) => value.replaceAll('-', '.');

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const toCalendarDate = (value) => {
  const normalized = normalizeBirthDate(value);

  if (!normalized) {
    return null;
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

const toMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const getLatestAllowedBirthYear = (today = new Date()) => today.getFullYear() - MIN_WORKING_AGE;

const getBirthYearOptions = () => {
  const latestYear = getLatestAllowedBirthYear();
  const earliestYear = latestYear - 100;

  return Array.from({ length: latestYear - earliestYear + 1 }, (_, index) => latestYear - index);
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index);

const getFullAge = (birthDate, today = new Date()) => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

const isUnderMinimumWorkingAge = (birthDate) => getFullAge(birthDate) < MIN_WORKING_AGE;

const getCalendarDays = (monthDate) => {
  const firstDay = toMonthStart(monthDate);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

const toResidenceRegion = (region, address) => region || address.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(' ') || address.trim();

const toBooleanFromChoice = (value, trueValue) => value === trueValue;

const hasText = (value) => Boolean(value.trim());

const withoutEmptyOptionalFields = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== undefined));

const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const formatMismatchMessage = (example) => `형식이 일치하지 않아요. "${example}"의 형태로 입력해주세요.`;

const fieldFormats = {
  name: {
    example: '홍길동',
    isValid: (value) => /^[가-힣a-zA-Z\s]{2,30}$/.test(value.trim())
  },
  phone: {
    example: '010-1234-5678',
    isValid: (value) => /^01[016789]-\d{3,4}-\d{4}$/.test(value.trim())
  },
  email: {
    example: 'me@bridgework.com',
    isValid: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },
  birthDate: {
    example: 'YYYY.MM.DD',
    isValid: (value) => Boolean(normalizeBirthDate(value))
  }
};

const formatValidationFields = Object.keys(fieldFormats);

const getFieldFormatMessage = (field, value) => {
  const format = fieldFormats[field];

  if (!format || !hasText(value) || format.isValid(value)) {
    return '';
  }

  return formatMismatchMessage(format.example);
};

const getStepValidationMessage = (step, form) => {
  if (step === 1) {
    if (
      !hasText(form.name) ||
      !form.gender ||
      !hasText(form.phone) ||
      !hasText(form.email) ||
      !hasText(form.birthDate) ||
      !form.region ||
      !hasText(form.address)
    ) {
      return '이름, 성별, 연락처, 이메일, 생년월일, 근무지역, 거주지 상세 주소를 입력해 주세요.';
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
    if (!form.education || !form.jobs.length) {
      return '최종 학력과 지원 직무를 선택해 주세요.';
    }

    return '';
  }

  if (step === 3) {
    if (!form.employmentTypes.length) {
      return '가능한 고용형태를 하나 이상 선택해 주세요.';
    }

    return '';
  }

  if (step === 4) {
    if (!form.disabilityTypes.length || !form.disabilitySeverity || !form.registeredYn) {
      return '장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요. 아직 확인이 어렵다면 "확인 필요"를 선택해 주세요.';
    }

    return '';
  }

  if (step === 5) {
    if (!hasText(form.introduction)) {
      return '자기소개를 입력해 주세요.';
    }

    if (!hasText(form.motivation)) {
      return '지원동기를 입력해 주세요.';
    }
  }

  return '';
};

const getSignupValidationMessage = (form) => {
  const invalidStep = STEPS.find((step) => getStepValidationMessage(step.id, form));
  return invalidStep ? getStepValidationMessage(invalidStep.id, form) : '';
};

const toSignupProfile = (form) => {
  const trimmedName = form.name.trim();
  const trimmedAddress = form.address.trim();
  const trimmedIntroduction = form.introduction.trim() || '확인 필요';
  const trimmedMotivation = form.motivation.trim() || '확인 필요';
  const selectedJobs = form.jobs.length ? form.jobs : ['확인 필요'];

  return withoutEmptyOptionalFields({
    desiredJob: selectedJobs.join(', '),
    commuteRange: '확인 필요',
    preferredWorkEnvironments: ['확인 필요'],
    avoidedWorkEnvironments: ['확인 필요'],
    requiredSupports: ['확인 필요'],
    disabilityType: form.disabilityTypes.join(', ') || '확인 필요',
    careerSummary: form.career.trim() || '확인 필요',
    educationSummary: form.education || '확인 필요',
    employmentTypeSummary: form.employmentTypes.join(', '),
    fullName: trimmedName,
    contactPhone: form.phone.trim(),
    contactEmail: form.email.trim(),
    birthDate: normalizeBirthDate(form.birthDate),
    genderType: form.gender,
    ageGroup: null,
    residenceRegion: toResidenceRegion(form.region, trimmedAddress),
    detailAddress: trimmedAddress,
    emergencyContact: null,
    profileImageUrl: null,
    highestEducation: form.education,
    graduationStatus: '확인 필요',
    majorCareer: form.career.trim() || '확인 필요',
    careerDetail: null,
    projectExperience: null,
    careerGapReason: null,
    targetJob: selectedJobs.join(', '),
    skills: selectedJobs,
    certifications: [],
    portfolioUrl: null,
    awards: null,
    trainings: null,
    disabilitySeverity: form.disabilitySeverity || '확인 필요',
    disabilityRegisteredYn: toBooleanFromChoice(form.registeredYn, '등록'),
    disabilityDescription: null,
    assistiveDevices: null,
    workSupportRequirements: null,
    workAvailability: '확인 필요',
    workTypes: form.employmentTypes.length ? form.employmentTypes : ['확인 필요'],
    expectedSalary: form.salaryType || null,
    workTimePreference: null,
    remoteAvailableYn: null,
    mobilityRange: null,
    selfIntroduction: trimmedIntroduction,
    motivation: trimmedMotivation,
    jobFitDescription: null,
    careerGoal: null,
    strengthsWeaknesses: null,
    militaryService: null,
    patrioticVeteranYn: null,
    referrer: null,
    snsUrl: null
  });
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { pendingSignup, completeSignup } = useAuth();
  const signupOptions = useSignupOptions();
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState(() => toInitialForm(pendingSignup));
  const [formatValidationForm, setFormatValidationForm] = useState(form);
  const [formatValidationVisible, setFormatValidationVisible] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const progressWidth = useMemo(() => `${(currentStep / STEPS.length) * 100}%`, [currentStep]);
  const validationMessage = useMemo(() => getSignupValidationMessage(form), [form]);

  const retryLoadOptions = () => {
    window.location.reload();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFormatValidationForm(form);
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form]);

  const updateField = (field, value) => {
    setSubmitError('');
    setForm((prev) => {
      if (field === 'region') {
        const shouldSyncAddress = !prev.address.trim() || prev.address.trim() === prev.region;

        return {
          ...prev,
          region: value,
          address: shouldSyncAddress ? value : prev.address
        };
      }

      return {
        ...prev,
        [field]: field === 'phone' ? formatPhoneNumber(value) : value
      };
    });
  };

  const showFormatValidation = (field) => {
    setFormatValidationVisible((prev) => ({
      ...prev,
      [field]: true
    }));
    setFormatValidationForm((prev) => ({
      ...prev,
      [field]: form[field]
    }));
  };

  const toggleArrayValue = (field, value) => {
    setSubmitError('');
    setForm((prev) => {
      const values = prev[field];
      let nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

      if (field === 'disabilityTypes') {
        if (EXCLUSIVE_DISABILITY_TYPES.includes(value) && !values.includes(value)) {
          nextValues = [value];
        } else if (!EXCLUSIVE_DISABILITY_TYPES.includes(value)) {
          nextValues = nextValues.filter((item) => !EXCLUSIVE_DISABILITY_TYPES.includes(item));
        }
      }

      return {
        ...prev,
        [field]: nextValues
      };
    });
  };

  const goPrevious = () => {
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const goNext = async () => {
    setSubmitError('');
    const stepValidationMessage = getStepValidationMessage(currentStep, form);

    if (stepValidationMessage) {
      if (currentStep === 1) {
        setFormatValidationVisible((prev) =>
          formatValidationFields.reduce(
            (next, field) => ({
              ...next,
              [field]: true
            }),
            prev
          )
        );
        setFormatValidationForm(form);
      }
      setSubmitError(stepValidationMessage);
      return;
    }

    if (currentStep === STEPS.length) {
      if (validationMessage) {
        setSubmitError(validationMessage);
        return;
      }

      if (!pendingSignup?.signupToken) {
        setSubmitError('회원가입 세션을 확인할 수 없습니다. 다시 로그인해 주세요.');
        return;
      }

      try {
        setSubmitting(true);
        await completeSignup({
          signupToken: pendingSignup.signupToken,
          email: form.email.trim(),
          profile: toSignupProfile(form)
        });
        setIsComplete(true);
      } catch (error) {
        setSubmitError(error.message || '회원가입 처리에 실패했습니다.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setCurrentStep((step) => Math.min(STEPS.length, step + 1));
  };

  return (
    <main className="onboarding-page">
      {isComplete ? (
        <CompletionPanel
          onBack={() => navigate(ROUTE_PATHS.accessibilityMap)}
          onProfile={() => navigate(ROUTE_PATHS.myProfile)}
        />
      ) : (
        <section className="onboarding-main" aria-labelledby="onboarding-title">
          <div className="onboarding-intro">
            <p className="onboarding-step-count">
              <strong>{currentStep}단계</strong> / {STEPS.length}단계
            </p>
            <h1 id="onboarding-title">기본 정보 입력</h1>
            <p>처음이신가요?  브릿지워크를 시작하기 위해 꼭 필요한 정보만 먼저 입력해요. 기본 프로필 생성 후 자세한 내용을 입력해 나가요.</p>
          </div>

          <div className="onboarding-progress" aria-label={`전체 ${STEPS.length}단계 중 ${currentStep}단계`}>
            <span style={{ width: progressWidth }} />
          </div>

          <div className="onboarding-workspace">
            <StepRail currentStep={currentStep} />
            <section className="onboarding-panel" aria-label={`${currentStep}단계 입력 영역`}>
              {signupOptions.status === 'idle' || signupOptions.status === 'loading' ? (
                <LoadingView label="회원가입 옵션을 불러오는 중입니다..." />
              ) : signupOptions.status === 'error' ? (
                <OptionStatePanel
                  title="회원가입 옵션을 불러오지 못했습니다."
                  message={signupOptions.error}
                  actionLabel="다시 시도"
                  onAction={retryLoadOptions}
                />
              ) : signupOptions.status === 'empty' ? (
                <OptionStatePanel
                  title="회원가입 옵션을 확인할 수 없습니다."
                  message="고용형태, 희망 직무, 근무지역, 급여 방식 옵션을 다시 불러와 주세요."
                  actionLabel="다시 시도"
                  onAction={retryLoadOptions}
                />
              ) : (
                <StepContent
                  currentStep={currentStep}
                  form={form}
                  options={signupOptions}
                  formatValidationForm={formatValidationForm}
                  formatValidationVisible={formatValidationVisible}
                  updateField={updateField}
                  showFormatValidation={showFormatValidation}
                  toggleArrayValue={toggleArrayValue}
                />
              )}

              <StatusMessage kind="error">{submitError}</StatusMessage>

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-button onboarding-button--secondary"
                  onClick={goPrevious}
                  disabled={currentStep === 1 || submitting || signupOptions.status !== 'success'}
                >
                  이전
                </button>
                <button
                  type="button"
                  className="onboarding-button onboarding-button--primary"
                  onClick={goNext}
                  disabled={submitting || signupOptions.status !== 'success'}
                >
                  {currentStep === STEPS.length ? (submitting ? '가입 처리 중...' : '가입 완료') : '다음 단계'}
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

function StepRail({ currentStep }) {
  return (
    <nav className="onboarding-rail" aria-label="온보딩 단계">
      <ol>
        {STEPS.map((step) => {
          const status = step.id < currentStep ? 'complete' : step.id === currentStep ? 'current' : 'upcoming';
          const markerIcon = {
            complete: stepCompleteIcon,
            current: stepCurrentIcon,
            upcoming: stepBeforeIcon
          }[status];

          return (
            <li key={step.id} className={`onboarding-rail__item is-${status}`} aria-current={status === 'current' ? 'step' : undefined}>
              <span className="onboarding-rail__marker">
                <img src={markerIcon} alt="" aria-hidden="true" />
              </span>
              <span className="onboarding-rail__text">
                <span>{step.id}단계</span>
                <strong>{step.title}</strong>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function OptionStatePanel({ title, message, actionLabel, onAction }) {
  return (
    <div className="onboarding-panel__content onboarding-panel__content--short">
      <h2>{title}</h2>
      <StatusMessage kind="error">{message}</StatusMessage>
      <button type="button" className="onboarding-button onboarding-button--primary" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function StepContent({
  currentStep,
  form,
  options,
  formatValidationForm,
  formatValidationVisible,
  updateField,
  showFormatValidation,
  toggleArrayValue
}) {
  if (currentStep === 1) {
    const errors = {
      name: formatValidationVisible.name ? getFieldFormatMessage('name', formatValidationForm.name) : '',
      phone: formatValidationVisible.phone ? getFieldFormatMessage('phone', formatValidationForm.phone) : '',
      email: formatValidationVisible.email ? getFieldFormatMessage('email', formatValidationForm.email) : '',
      birthDate: formatValidationVisible.birthDate ? getFieldFormatMessage('birthDate', formatValidationForm.birthDate) : ''
    };
    const addressRegionGuide = form.region || '서울';

    return (
      <div className="onboarding-panel__content">
        <h2>기본 정보</h2>
        <div className="onboarding-form-grid">
          <TextField
            label="이름"
            required
            placeholder="홍길동"
            value={form.name}
            onChange={(value) => updateField('name', value)}
            onBlur={() => showFormatValidation('name')}
            error={errors.name}
          />
          <ChoiceField
            label="성별"
            required
            options={genderOptions}
            value={form.gender}
            onChange={(value) => updateField('gender', value)}
          />
          <TextField
            label="연락처"
            required
            placeholder="010-1234-5678"
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            onBlur={() => showFormatValidation('phone')}
            error={errors.phone}
            inputMode="numeric"
            autoComplete="tel"
          />
          <TextField
            label="이메일"
            required
            placeholder="me@bridgework.com"
            value={form.email}
            onChange={(value) => updateField('email', value)}
            onBlur={() => showFormatValidation('email')}
            error={errors.email}
          />
          <BirthDateField
            label="생년월일"
            required
            placeholder="YYYY.MM.DD"
            value={form.birthDate}
            onChange={(value) => updateField('birthDate', value)}
            onBlur={() => showFormatValidation('birthDate')}
            error={errors.birthDate}
          />
          <ChoiceField
            label="근무지역"
            required
            className="onboarding-choice-group--region"
            options={options.regions}
            value={form.region}
            onChange={(value) => updateField('region', value)}
          />
          <TextField
            label="거주지 상세 주소"
            required
            className="onboarding-field--address"
            placeholder={`${addressRegionGuide} OO구 OO동`}
            value={form.address}
            onChange={(value) => updateField('address', value)}
            hint={`예: 서울시 강남구 또는 서울시 강남구 역삼동`}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="onboarding-panel__content">
        <h2>직무·경력</h2>
        <ChoiceField
          label="최종 학력"
          required
          className="onboarding-choice-group--education"
          options={educationOptions}
          value={form.education}
          onChange={(value) => updateField('education', value)}
        />
        <TextField
          label="주요 경력 한 줄"
          placeholder="예) 수원시 청년센터 행정보조 2년"
          value={form.career}
          onChange={(value) => updateField('career', value)}
        />
        <JobCategoryField
          label="지원 직무"
          required
          categories={options.jobCategories}
          values={form.jobs}
          onToggle={(value) => toggleArrayValue('jobs', value)}
        />
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="onboarding-panel__content onboarding-panel__content--short">
        <h2>근무 조건</h2>
        <MultiChoiceField
          label="가능한 고용형태"
          required
          helper="다중 선택 가능"
          options={options.employmentTypes}
          values={form.employmentTypes}
          onToggle={(value) => toggleArrayValue('employmentTypes', value)}
        />
        <ChoiceField
          label="희망 급여 방식"
          helper="선택 입력"
          options={options.salaryTypes}
          value={form.salaryType}
          onChange={(value) => updateField('salaryType', value)}
        />
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="onboarding-panel__content">
        <h2>장애 정보</h2>
        <div className="onboarding-info-box onboarding-info-box--neutral">
          장애 정보는 추천 이유와 근무 지원사항 판단에 사용됩니다. 아직 확인이 어렵다면 “확인 필요”를 선택해 주세요.
        </div>
        <MultiChoiceField
          label="장애 유형"
          required
          helper="다중 선택 가능"
          options={disabilityTypes}
          values={form.disabilityTypes}
          onToggle={(value) => toggleArrayValue('disabilityTypes', value)}
        />
        <ChoiceField
          label="장애 정도"
          required
          options={disabilitySeverityOptions}
          value={form.disabilitySeverity}
          onChange={(value) => updateField('disabilitySeverity', value)}
        />
        <ChoiceField
          label="장애인 등록 여부"
          required
          options={disabilityRegisteredOptions}
          value={form.registeredYn}
          onChange={(value) => updateField('registeredYn', value)}
        />
      </div>
    );
  }

  return (
    <div className="onboarding-panel__content">
      <h2>자기소개</h2>
      <label className="onboarding-field onboarding-field--full onboarding-field--intro">
        <span>자기소개 <em>*</em></span>
        <textarea
          value={form.introduction}
          onChange={(event) => updateField('introduction', event.target.value)}
          placeholder="간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요."
          rows={9}
        />
      </label>
      <label className="onboarding-field onboarding-field--full onboarding-field--motivation">
        <span>지원동기 <em>*</em></span>
        <textarea
          value={form.motivation}
          onChange={(event) => updateField('motivation', event.target.value)}
          placeholder="지원하려는 이유와 기대하는 근무 방향을 적어 주세요."
          rows={6}
        />
      </label>
    </div>
  );
}

function BirthDateField({ label, required, placeholder, value, onChange, onBlur, error }) {
  const fieldRef = useRef(null);
  const inputId = 'signup-birth-date';
  const dialogId = 'signup-birth-date-calendar';
  const selectedDate = toCalendarDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [ageRestrictionError, setAgeRestrictionError] = useState('');
  const [openSelector, setOpenSelector] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthStart(selectedDate || new Date()));
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const yearOptions = useMemo(() => getBirthYearOptions(), []);
  const todayValue = toDateValue(new Date());
  const selectedValue = selectedDate ? toDateValue(selectedDate) : '';
  const visibleError = ageRestrictionError || error;

  useEffect(() => {
    const nextSelectedDate = toCalendarDate(selectedValue);

    if (nextSelectedDate) {
      setVisibleMonth(toMonthStart(nextSelectedDate));
    }
  }, [selectedValue]);

  useEffect(() => {
    setAgeRestrictionError('');
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!fieldRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenSelector('');
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDatePicker = () => {
    setIsOpen((open) => {
      if (open) {
        setOpenSelector('');
      }

      return !open;
    });
  };

  const commitBirthDate = (nextValue) => {
    const nextDate = toCalendarDate(nextValue);

    if (nextDate && isUnderMinimumWorkingAge(nextDate)) {
      setAgeRestrictionError(MIN_WORKING_AGE_MESSAGE);
      return false;
    }

    setAgeRestrictionError('');
    onChange(nextValue);
    return true;
  };

  const handleTextChange = (event) => {
    commitBirthDate(event.target.value);
  };

  const handleTextBlur = () => {
    const normalized = normalizeBirthDate(value);

    if (normalized) {
      onChange(toBirthDateDisplay(normalized));
    }

    onBlur();
  };

  const selectDate = (date) => {
    if (commitBirthDate(toBirthDateDisplay(toDateValue(date)))) {
      setIsOpen(false);
    }
  };

  const selectToday = () => {
    const today = new Date();
    if (commitBirthDate(toBirthDateDisplay(toDateValue(today)))) {
      setVisibleMonth(toMonthStart(today));
      setIsOpen(false);
    }
  };

  const clearDate = () => {
    setAgeRestrictionError('');
    onChange('');
    setOpenSelector('');
    setIsOpen(false);
  };

  const updateVisibleYear = (year) => {
    setVisibleMonth((month) => new Date(year, month.getMonth(), 1));
    setOpenSelector('');
  };

  const updateVisibleMonth = (monthIndex) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), monthIndex, 1));
    setOpenSelector('');
  };

  const toggleSelector = (selector) => {
    setOpenSelector((current) => (current === selector ? '' : selector));
  };

  return (
    <div className="onboarding-field onboarding-date-field" ref={fieldRef}>
      <span>
        <FieldLabel label={label} required={required} />
      </span>
      <span className="onboarding-input-wrap onboarding-input-wrap--with-button">
        <input
          id={inputId}
          value={value}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="bday"
          aria-label={label}
          aria-describedby={visibleError ? `${inputId}-error` : undefined}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
        />
        <button
          type="button"
          className="onboarding-date-picker-button"
          onClick={toggleDatePicker}
          aria-label="캘린더에서 생년월일 선택"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={dialogId}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="onboarding-input-icon">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15v8.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V10ZM5 6a.5.5 0 0 0-.5.5V8h15V6.5A.5.5 0 0 0 19 6H5Z" />
          </svg>
        </button>
        {isOpen ? (
          <div className="onboarding-calendar-popover" id={dialogId} role="dialog" aria-modal="false" aria-label="생년월일 달력">
            <div className="onboarding-calendar-head">
              <div className="onboarding-calendar-title" aria-live="polite">
                <div className="onboarding-calendar-select-wrap">
                  <button
                    type="button"
                    className="onboarding-calendar-select-button"
                    onClick={() => toggleSelector('year')}
                    aria-haspopup="listbox"
                    aria-expanded={openSelector === 'year'}
                  >
                    {visibleMonth.getFullYear()}년
                    <span aria-hidden="true">⌄</span>
                  </button>
                  {openSelector === 'year' ? (
                    <div className="onboarding-calendar-select-menu onboarding-calendar-select-menu--year" role="listbox" aria-label="연도 선택">
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          role="option"
                          aria-selected={visibleMonth.getFullYear() === year}
                          className={visibleMonth.getFullYear() === year ? 'is-selected' : ''}
                          onClick={() => updateVisibleYear(year)}
                        >
                          {year}년
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="onboarding-calendar-select-wrap">
                  <button
                    type="button"
                    className="onboarding-calendar-select-button"
                    onClick={() => toggleSelector('month')}
                    aria-haspopup="listbox"
                    aria-expanded={openSelector === 'month'}
                  >
                    {visibleMonth.getMonth() + 1}월
                    <span aria-hidden="true">⌄</span>
                  </button>
                  {openSelector === 'month' ? (
                    <div className="onboarding-calendar-select-menu" role="listbox" aria-label="월 선택">
                      {monthOptions.map((monthIndex) => (
                        <button
                          key={monthIndex}
                          type="button"
                          role="option"
                          aria-selected={visibleMonth.getMonth() === monthIndex}
                          className={visibleMonth.getMonth() === monthIndex ? 'is-selected' : ''}
                          onClick={() => updateVisibleMonth(monthIndex)}
                        >
                          {monthIndex + 1}월
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="onboarding-calendar-nav" aria-label="월 이동">
                <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, -1))} aria-label="이전 월">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.42 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" />
                  </svg>
                </button>
                <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} aria-label="다음 월">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8.3 18.7a1 1 0 0 1 0-1.4l5.28-5.3-5.3-5.3A1 1 0 0 1 9.7 5.3l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.42 0Z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="onboarding-calendar-weekdays" aria-hidden="true">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="onboarding-calendar-grid" role="group" aria-label={`${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월 날짜 선택`}>
              {calendarDays.map((date) => {
                const dateValue = toDateValue(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isSelected = dateValue === selectedValue;
                const isToday = dateValue === todayValue;

                return (
                  <button
                    key={dateValue}
                    type="button"
                    className={[
                      'onboarding-calendar-day',
                      isCurrentMonth ? '' : 'is-muted',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => selectDate(date)}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="onboarding-calendar-actions">
              <button type="button" className="onboarding-calendar-action onboarding-calendar-action--ghost" onClick={clearDate}>
                삭제
              </button>
              <button type="button" className="onboarding-calendar-action onboarding-calendar-action--primary" onClick={selectToday}>
                오늘
              </button>
            </div>
          </div>
        ) : null}
      </span>
      {visibleError ? (
        <small className="onboarding-field-error" id={`${inputId}-error`} role="alert">
          {visibleError}
        </small>
      ) : (
        <small className="onboarding-field-hint">{MIN_WORKING_AGE_MESSAGE}</small>
      )}
    </div>
  );
}

function TextField({ label, required, placeholder, value, onChange, onBlur, hint, icon, error, inputMode, autoComplete, className = '' }) {
  return (
    <label className={`onboarding-field ${className}`.trim()}>
      <span>
        <FieldLabel label={label} required={required} />
      </span>
      <span className="onboarding-input-wrap">
        <input
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        {icon === 'calendar' ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="onboarding-input-icon">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15v8.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V10ZM5 6a.5.5 0 0 0-.5.5V8h15V6.5A.5.5 0 0 0 19 6H5Z" />
          </svg>
        ) : null}
      </span>
      {error ? (
        <small className="onboarding-field-error" role="alert">
          {error}
        </small>
      ) : null}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function ChoiceField({ label, required, helper, options, value, onChange, className = '' }) {
  const isOptional = !required;

  return (
    <fieldset className={`onboarding-choice-group ${className}`.trim()}>
      <legend>
        <FieldLabel label={label} required={required} helper={helper} />
      </legend>
      <div className="onboarding-chip-row">
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;

          return (
            <button
              key={optionValue}
              type="button"
              className={`onboarding-chip ${value === optionValue ? 'is-selected' : ''}`}
              onClick={() => onChange(isOptional && value === optionValue ? '' : optionValue)}
              aria-pressed={value === optionValue}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function MultiChoiceField({ label, required, helper, options, values, onToggle, compact }) {
  return (
    <fieldset className={`onboarding-choice-group ${compact ? 'is-compact' : ''}`}>
      <legend>
        <FieldLabel label={label} required={required} helper={helper} />
      </legend>
      <div className="onboarding-chip-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`onboarding-chip ${values.includes(option) ? 'is-selected' : ''}`}
            onClick={() => onToggle(option)}
            aria-pressed={values.includes(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function JobCategoryField({ label, required, categories, values, onToggle }) {
  const [activePrimary, setActivePrimary] = useState(categories[0]?.label || '');
  const primary = categories.find((category) => category.label === activePrimary) || categories[0];
  const [activeSecondary, setActiveSecondary] = useState(primary?.groups[0]?.label || '');
  const secondary = primary?.groups.find((group) => group.label === activeSecondary) || primary?.groups[0];
  const [limitMessage, setLimitMessage] = useState('');
  const selectedPaths = useMemo(() => {
    const paths = new Map();

    categories.forEach((category) => {
      category.groups.forEach((group) => {
        group.jobs.forEach((job) => {
          if (!paths.has(job)) {
            paths.set(job, `${category.label} > ${group.label} > ${job}`);
          }
        });
      });
    });

    return paths;
  }, [categories]);

  const selectPrimary = (category) => {
    setActivePrimary(category.label);
    setActiveSecondary(category.groups[0]?.label || '');
  };

  const toggleJob = (job) => {
    if (!values.includes(job) && values.length >= MAX_JOB_SELECTIONS) {
      setLimitMessage(`지원 직무는 최대 ${MAX_JOB_SELECTIONS}개까지 선택할 수 있어요.`);
      return;
    }

    setLimitMessage('');
    onToggle(job);
  };

  return (
    <fieldset className="onboarding-choice-group onboarding-job-picker" aria-describedby={limitMessage ? 'job-picker-limit-message' : undefined}>
      <legend>
        <FieldLabel label={label} required={required} />
      </legend>
      {values.length ? (
        <div className="onboarding-job-picker__selected-paths" aria-label="선택 완료된 지원 직무 경로">
          {values.map((job) => (
            <button key={job} type="button" onClick={() => toggleJob(job)} aria-label={`${job} 선택 해제`}>
              <span>{selectedPaths.get(job) || job}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="onboarding-job-picker__empty">관심 있는 분야부터 실제 수행 업무까지 차례로 선택해 주세요.</p>
      )}
      {limitMessage ? (
        <p id="job-picker-limit-message" className="onboarding-job-picker__limit" role="alert">
          {limitMessage}
        </p>
      ) : null}
      <div className="onboarding-job-picker__box">
        <div className="onboarding-job-picker__columns">
          <JobPickerColumn title="1차 선택" description="분야 선택">
            {categories.map((category) => (
              <button
                key={category.label}
                type="button"
                className={`onboarding-job-picker__option ${primary?.label === category.label ? 'is-active' : ''}`}
                onClick={() => selectPrimary(category)}
              >
                <span>{category.label}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </JobPickerColumn>

          <JobPickerColumn title="2차 선택" description="세부 직군 선택">
            {primary?.groups.map((group) => (
              <button
                key={group.label}
                type="button"
                className={`onboarding-job-picker__option ${secondary?.label === group.label ? 'is-active' : ''}`}
                onClick={() => setActiveSecondary(group.label)}
              >
                <span>{group.label}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </JobPickerColumn>

          <JobPickerColumn title="3차 선택" description="실제 수행 업무 선택">
            {secondary?.jobs.map((job) => (
              <button
                key={job}
                type="button"
                className={`onboarding-job-picker__option onboarding-job-picker__option--check ${values.includes(job) ? 'is-selected' : ''}`}
                onClick={() => toggleJob(job)}
                aria-pressed={values.includes(job)}
              >
                <span>{job}</span>
              </button>
            ))}
          </JobPickerColumn>
        </div>
      </div>
      <p className="onboarding-job-picker__helper">최대 {MAX_JOB_SELECTIONS}개까지 선택할 수 있습니다.</p>
    </fieldset>
  );
}

function FieldLabel({ label, required, helper }) {
  const visibleHelper = helper || (!required ? '선택 입력' : '');

  return (
    <>
      {label}
      {visibleHelper ? <span className="onboarding-label-helper"> · {visibleHelper}</span> : null} {required ? <em>*</em> : null}
    </>
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

function CompletionPanel({ onBack, onProfile }) {
  return (
    <section className="onboarding-complete" aria-labelledby="onboarding-complete-title">
      <div className="onboarding-complete__icon" aria-hidden="true">
        <img src={checkCircleIcon} alt="" />
      </div>
      <h1 id="onboarding-complete-title">기본 정보 입력 완료!</h1>
      <p>
        지금부터 일자리를 추천받을 수 있어요.
        <br />더 정확한 추천을 위해 <strong>상세 정보</strong>를 추가하면
        <br />
        매칭 정확도가 평균 <strong>2.4배</strong> 높아져요.
      </p>
      <dl className="onboarding-complete__summary">
        <div>
          <dt>입력 항목</dt>
          <dd>10개</dd>
          <span>기본 입력</span>
        </div>
        <div>
          <dt>추가 기능</dt>
          <dd>7 카테고리</dd>
          <span>선택 입력</span>
        </div>
        <div>
          <dt>예상 시간</dt>
          <dd>약 5분</dd>
          <span>나중에도 가능</span>
        </div>
      </dl>
      <div className="onboarding-complete__actions">
        <button type="button" className="onboarding-button onboarding-button--secondary" onClick={onBack}>
          건너뛰고 시작하기
        </button>
        <button type="button" className="onboarding-button onboarding-button--primary" onClick={onProfile}>
          상세 정보 입력하기
        </button>
      </div>
      <p className="onboarding-complete__note">나중에 프로필 관리에서 언제든지 추가 및 수정할 수 있어요</p>
    </section>
  );
}
