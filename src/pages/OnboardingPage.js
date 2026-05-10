import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkCircleIcon from '../assets/signup/check_circle.png';
import stepBeforeIcon from '../assets/signup/item-before.png';
import stepCompleteIcon from '../assets/signup/item-completion.png';
import stepCurrentIcon from '../assets/signup/item-ing.png';
import { useAuth } from '../auth/AuthContext';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';
import { LoadingView } from '../components/common/LoadingView';
import { StatusMessage } from '../components/common/StatusMessage';
import { BirthDateField } from '../components/common/BirthDateField';
import { useSignupOptions } from '../hooks/useSignupOptions';
import { normalizeBirthDate } from '../utils/birthDate';
import { fieldFormats, formatPhoneNumber, getFieldFormatMessage } from '../utils/formValidation';

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

const educationOptions = [
  { value: 'HIGH_SCHOOL_OR_BELOW', label: '고졸 이하' },
  { value: 'HIGH_SCHOOL', label: '고졸' },
  { value: 'COLLEGE', label: '전문대졸' },
  { value: 'BACHELOR', label: '대졸' },
  { value: 'MASTER', label: '석사' },
  { value: 'DOCTOR', label: '박사' },
  { value: 'OTHER', label: '기타' }
];
const graduationStatusOptions = [
  { value: 'GRADUATED', label: '졸업' },
  { value: 'EXPECTED', label: '졸업예정' },
  { value: 'ENROLLED', label: '재학' },
  { value: 'COMPLETED', label: '수료' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'OTHER', label: '기타' }
];
const MAX_JOB_SELECTIONS = 5;
const disabilityTypes = [
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
];
const disabilitySeverityOptions = [
  { value: 'SEVERE', label: '중증' },
  { value: 'MODERATE', label: '중등도' },
  { value: 'MILD', label: '경증' }
];
const disabilityRegisteredOptions = [
  { value: '등록', label: '등록됨' },
  { value: '미등록', label: '등록 안 됨' }
];
const toInitialForm = (seed) => ({
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
  employmentTypes: ['FULL_TIME'],
  disabilityType: '',
  disabilitySeverity: '',
  registeredYn: '',
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

const formatValidationFields = Object.keys(fieldFormats);

const getStepValidationMessage = (step, form) => {
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
    if (!form.education || !form.graduationStatus || !hasText(form.career) || !form.jobs.length) {
      return '최종 학력, 졸업 상태, 주요 경력, 지원 직무를 입력해 주세요.';
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
    if (!form.disabilityType || !form.disabilitySeverity || !form.registeredYn) {
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

const getSignupValidationMessage = (form) => {
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
  { key: 'employmentTypes', value: (form) => form.employmentTypes },
  { key: 'disabilityType', value: (form) => form.disabilityType },
  { key: 'disabilitySeverity', value: (form) => form.disabilitySeverity },
  { key: 'registeredYn', value: (form) => form.registeredYn },
  { key: 'introduction', value: (form) => form.introduction }
];

const detailProfileGroups = [
  {
    label: '통근·근무환경',
    fields: ['commuteRange', 'preferredWorkEnvironments', 'avoidedWorkEnvironments', 'requiredSupports']
  },
  {
    label: '세부 경력',
    fields: ['careerDetail', 'projectExperience', 'careerGapReason']
  },
  {
    label: '자격·포트폴리오',
    fields: ['certifications', 'portfolioUrl', 'awards', 'trainings']
  },
  {
    label: '상세 장애·지원',
    fields: ['disabilityDescription', 'assistiveDevices', 'workSupportRequirements']
  },
  {
    label: '희망 근무조건',
    fields: ['expectedSalary', 'workTimePreference', 'remoteAvailableYn', 'mobilityRange']
  },
  {
    label: '소개 보강',
    fields: ['jobFitDescription', 'careerGoal', 'strengthsWeaknesses']
  },
  {
    label: '추가 연락·기타',
    fields: ['emergencyContact', 'militaryService', 'patrioticVeteranYn', 'snsUrl']
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

const getCompletionSummary = (form) => {
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

const toSignupProfile = (form) => {
  const trimmedName = form.name.trim();
  const trimmedAddress = form.address.trim();
  const trimmedCareer = form.career.trim();
  const trimmedIntroduction = form.introduction.trim();
  const selectedJobs = form.jobs;

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
    skills: selectedJobs,
    disabilityType: form.disabilityType,
    disabilitySeverity: form.disabilitySeverity,
    disabilityRegisteredYn: toBooleanFromChoice(form.registeredYn, '등록'),
    workTypes: form.employmentTypes,
    selfIntroduction: trimmedIntroduction
  });
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { localizePath } = useLocale();
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
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

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
          summary={getCompletionSummary(form)}
          onBack={() => navigate(localizePath(ROUTE_PATHS.accessibilityMap))}
          onProfile={() => navigate(localizePath(ROUTE_PATHS.myProfile))}
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
                  message="고용형태, 희망 직무 옵션을 다시 불러와 주세요."
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
                <img src={markerIcon} alt={`${step.title} ${status === 'complete' ? '완료' : status === 'current' ? '진행 중' : '예정'} 아이콘`} />
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
            id="signup-birth-date"
            label="생년월일"
            required
            placeholder="YYYY.MM.DD"
            value={form.birthDate}
            onChange={(value) => updateField('birthDate', value)}
            onBlur={() => showFormatValidation('birthDate')}
            error={errors.birthDate}
          />
          <TextField
            label="거주지 상세 주소"
            required
            className="onboarding-field--address"
            placeholder="서울 OO구 OO동"
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
        <ChoiceField
          label="졸업 상태"
          required
          options={graduationStatusOptions}
          value={form.graduationStatus}
          onChange={(value) => updateField('graduationStatus', value)}
        />
        <TextField
          label="주요 경력 한 줄"
          required
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
      <div className="onboarding-panel__content">
        <h2>근무 조건</h2>
        <MultiChoiceField
          label="가능한 고용형태"
          required
          helper="다중 선택 가능"
          options={options.employmentTypes}
          values={form.employmentTypes}
          onToggle={(value) => toggleArrayValue('employmentTypes', value)}
        />
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="onboarding-panel__content">
        <h2>장애 정보</h2>
        <div className="onboarding-info-box onboarding-info-box--neutral">
          장애 정보는 추천 이유와 근무 지원사항 판단에 사용됩니다. 분류가 명확하지 않다면 기타를 선택하고 설명에 필요한 내용을 남겨 주세요.
        </div>
        <ChoiceField
          label="장애 유형"
          required
          options={disabilityTypes}
          value={form.disabilityType}
          onChange={(value) => updateField('disabilityType', value)}
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
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;

          return (
            <button
              key={optionValue}
              type="button"
              className={`onboarding-chip ${values.includes(optionValue) ? 'is-selected' : ''}`}
              onClick={() => onToggle(optionValue)}
              aria-pressed={values.includes(optionValue)}
            >
              {optionLabel}
            </button>
          );
        })}
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

function CompletionPanel({ summary, onBack, onProfile }) {
  return (
    <section className="onboarding-complete" aria-labelledby="onboarding-complete-title">
      <div className="onboarding-complete__icon">
        <img src={checkCircleIcon} alt="입력 완료 아이콘" />
      </div>
      <h1 id="onboarding-complete-title">기본 정보 입력 완료!</h1>
      <p>
        지금부터 일자리를 추천받을 수 있어요.
        <br />더 정확한 추천을 위해 <strong>상세 정보</strong>를 추가하면
        <br />
        추천 판단에 쓰이는 정보가 최대 <strong>{summary.totalProfileSignals}개</strong>까지 늘어나요.
      </p>
      <dl className="onboarding-complete__summary">
        <div>
          <dt>입력 항목</dt>
          <dd>{summary.completedInputCount}개</dd>
          <span>방금 완료한 정보</span>
        </div>
        <div>
          <dt>추가 항목</dt>
          <dd>{summary.remainingDetailGroupCount}개 묶음</dd>
          <span>{summary.remainingDetailFieldCount}개 선택 정보</span>
        </div>
        <div>
          <dt>예상 시간</dt>
          <dd>약 {summary.estimatedMinutes}분</dd>
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
