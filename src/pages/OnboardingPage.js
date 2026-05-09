import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import checkCircleIcon from '../assets/signup/check_circle.png';
import stepBeforeIcon from '../assets/signup/item-before.png';
import stepCompleteIcon from '../assets/signup/item-completion.png';
import stepCurrentIcon from '../assets/signup/item-ing.png';
import { useAuth } from '../auth/AuthContext';
import { StatusMessage } from '../components/common/StatusMessage';

const STEPS = [
  { id: 1, title: '기본 정보' },
  { id: 2, title: '직무·경력' },
  { id: 3, title: '근무 조건' },
  { id: 4, title: '장애 정보' },
  { id: 5, title: '자기소개' }
];

const educationOptions = ['고졸 이하', '초대졸', '대졸', '석사', '박사'];
const MAX_JOB_SELECTIONS = 5;
const jobCategories = [
  {
    label: '기획·전략',
    groups: [
      { label: '기획', jobs: ['서비스 기획', '사업기획', '전략기획', '문서 작성'] },
      { label: '운영지원', jobs: ['사무보조', '운영보조', '자료 정리', '일정 관리'] }
    ]
  },
  {
    label: '법무·사무·총무',
    groups: [
      { label: '사무·총무', jobs: ['사무보조', '행정', '총무', '문서관리'] },
      { label: '비서·안내', jobs: ['접수', '안내', '비서', '사무지원'] }
    ]
  },
  {
    label: '회계·세무',
    groups: [
      { label: '회계', jobs: ['회계 보조', '전표 입력', '정산 보조', '경리'] },
      { label: '세무', jobs: ['세무 보조', '자료 입력', '급여 관리', '매입매출 관리'] }
    ]
  },
  {
    label: 'AI·개발·데이터',
    groups: [
      { label: '데이터', jobs: ['데이터 입력', '데이터 라벨링', '데이터 검수', '자료 수집'] },
      { label: 'IT 지원', jobs: ['IT 지원', '헬프데스크', 'QA 보조', '시스템 운영 보조'] }
    ]
  },
  {
    label: '디자인',
    groups: [
      { label: '디자인', jobs: ['디자인', '웹디자인', '편집디자인', '콘텐츠 디자인'] },
      { label: '콘텐츠', jobs: ['이미지 편집', '상세페이지 제작', '영상 보조', 'SNS 콘텐츠'] }
    ]
  },
  {
    label: '물류·무역',
    groups: [
      { label: '물류', jobs: ['물류', '입출고 관리', '재고 관리', '포장·분류'] },
      { label: '무역사무', jobs: ['무역사무 보조', '수출입 서류', '배송 관리', '발주 관리'] }
    ]
  },
  {
    label: '고객상담·TM',
    groups: [
      { label: '고객상담', jobs: ['고객상담', 'CS', '인바운드 상담', '채팅 상담'] },
      { label: 'TM', jobs: ['전화상담', '예약 안내', '고객관리', '민원 응대'] }
    ]
  },
  {
    label: '공공·복지',
    groups: [
      { label: '공공행정', jobs: ['행정', '민원 안내', '공공기관 사무보조', '자료 정리'] },
      { label: '복지', jobs: ['복지 행정', '상담 보조', '프로그램 운영 보조', '기관 안내'] }
    ]
  }
];
const employmentOptions = ['정규직', '계약직', '무기계약직', '시간제', '일용직', '인턴', '파견/용역', '재택/원격'];
const disabilityTypes = ['지체', '시각', '청각', '발달', '뇌병변', '내부장애'];

const toInitialForm = (seed) => ({
  name: '',
  gender: '',
  phone: '',
  email: seed?.email || '',
  birthDate: '',
  address: '',
  education: '',
  career: '',
  jobs: [],
  employmentTypes: ['정규직'],
  disabilityYn: '있음',
  disabilityTypes: [],
  disabilitySeverity: '',
  registeredYn: '',
  introduction: ''
});

const normalizeBirthDate = (value) => {
  const normalized = value.trim().replaceAll('.', '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  return '';
};

const toBirthDateDisplay = (value) => value.replaceAll('-', '.');

const toResidenceRegion = (address) => {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(' ') || address.trim();
};

const toBooleanFromChoice = (value, trueValue) => value === trueValue;

const hasText = (value) => Boolean(value.trim());

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
    example: 'me@bridgework.kr',
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
    if (!hasText(form.name) || !form.gender || !hasText(form.phone) || !hasText(form.email) || !hasText(form.address)) {
      return '이름, 성별, 연락처, 이메일, 거주지 상세 주소를 입력해 주세요.';
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
    if (!form.disabilityYn) {
      return '장애 여부를 선택해 주세요.';
    }

    if (form.disabilityYn === '있음' && (!form.disabilityTypes.length || !form.disabilitySeverity || !form.registeredYn)) {
      return '장애 유형, 장애 정도, 장애인 등록 여부를 함께 선택해 주세요.';
    }

    return '';
  }

  if (step === 5 && !hasText(form.introduction)) {
    return '자기소개를 입력해 주세요.';
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
  const selectedJobs = form.jobs.length ? form.jobs : ['확인 필요'];
  const disabilityYn = toBooleanFromChoice(form.disabilityYn, '있음');

  return {
    desiredJob: selectedJobs.join(', '),
    commuteRange: '확인 필요',
    preferredWorkEnvironments: ['확인 필요'],
    avoidedWorkEnvironments: ['확인 필요'],
    requiredSupports: ['확인 필요'],
    disabilityType: disabilityYn ? form.disabilityTypes.join(', ') || '확인 필요' : '해당 없음',
    careerSummary: form.career.trim() || '확인 필요',
    educationSummary: form.education || '확인 필요',
    employmentTypeSummary: form.employmentTypes.join(', '),
    fullName: trimmedName,
    contactPhone: form.phone.trim(),
    contactEmail: form.email.trim(),
    birthDate: normalizeBirthDate(form.birthDate),
    ageGroup: null,
    residenceRegion: toResidenceRegion(trimmedAddress),
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
    disabilityYn,
    disabilitySeverity: disabilityYn ? form.disabilitySeverity || '확인 필요' : '해당 없음',
    disabilityRegisteredYn: toBooleanFromChoice(form.registeredYn, '등록'),
    disabilityDescription: null,
    assistiveDevices: null,
    workSupportRequirements: null,
    workAvailability: '확인 필요',
    workTypes: form.employmentTypes.length ? form.employmentTypes : ['확인 필요'],
    expectedSalary: null,
    workTimePreference: null,
    remoteAvailableYn: null,
    mobilityRange: null,
    selfIntroduction: form.introduction.trim() || '확인 필요',
    motivation: null,
    jobFitDescription: null,
    careerGoal: null,
    strengthsWeaknesses: null,
    militaryService: null,
    patrioticVeteranYn: null,
    referrer: null,
    snsUrl: null
  };
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { pendingSignup, completeSignup } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState(() => toInitialForm(pendingSignup));
  const [formatValidationForm, setFormatValidationForm] = useState(form);
  const [formatValidationVisible, setFormatValidationVisible] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const progressWidth = useMemo(() => `${(currentStep / STEPS.length) * 100}%`, [currentStep]);
  const validationMessage = useMemo(() => getSignupValidationMessage(form), [form]);

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
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
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
        <CompletionPanel onBack={() => navigate('/home')} onProfile={() => navigate('/profile')} />
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
              <StepContent
                currentStep={currentStep}
                form={form}
                formatValidationForm={formatValidationForm}
                formatValidationVisible={formatValidationVisible}
                updateField={updateField}
                showFormatValidation={showFormatValidation}
                toggleArrayValue={toggleArrayValue}
              />

              <StatusMessage kind="error">{submitError}</StatusMessage>

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-button onboarding-button--secondary"
                  onClick={goPrevious}
                  disabled={currentStep === 1 || submitting}
                >
                  이전
                </button>
                <button
                  type="button"
                  className="onboarding-button onboarding-button--primary"
                  onClick={goNext}
                  disabled={submitting}
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

function StepContent({
  currentStep,
  form,
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
            options={['남성', '여성', '선택 안 함']}
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
          />
          <TextField
            label="이메일"
            required
            placeholder="me@bridgework.kr"
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
          <TextField
            label="거주지 상세 주소"
            required
            placeholder="서울시 영등포구 OO로 12"
            value={form.address}
            onChange={(value) => updateField('address', value)}
            hint="동·읍·면 단위까지 입력하면 통근 시간 계산이 정확해져요"
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
          placeholder="예) OO센터 행정보조 2년"
          value={form.career}
          onChange={(value) => updateField('career', value)}
          hint="없으면 비워두셔도 됩니다"
        />
        <JobCategoryField
          label="지원 직무"
          required
          categories={jobCategories}
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
          helper="여러 개 선택 가능"
          options={employmentOptions}
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
        <p className="onboarding-info-box">민감 정보입니다. 입력하지 않으셔도 가입은 가능하며, 입력하시면 접근성 점수와 맞춤 추천 정확도가 높아집니다.</p>
        <ChoiceField
          label="장애 여부"
          required
          options={['있음', '없음']}
          value={form.disabilityYn}
          onChange={(value) => updateField('disabilityYn', value)}
        />
        <MultiChoiceField
          label="장애 유형"
          options={disabilityTypes}
          values={form.disabilityTypes}
          onToggle={(value) => toggleArrayValue('disabilityTypes', value)}
        />
        <ChoiceField
          label="장애 정도"
          options={['심한 장애 (1~3급)', '심하지 않은 장애 (4~6급)']}
          value={form.disabilitySeverity}
          onChange={(value) => updateField('disabilitySeverity', value)}
        />
        <ChoiceField
          label="장애인 등록 여부"
          options={['등록', '미등록']}
          value={form.registeredYn}
          onChange={(value) => updateField('registeredYn', value)}
        />
      </div>
    );
  }

  return (
    <div className="onboarding-panel__content">
      <h2>자기소개</h2>
      <label className="onboarding-field onboarding-field--full">
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

function BirthDateField({ label, required, placeholder, value, onChange, onBlur, error }) {
  const pickerRef = useRef(null);
  const pickerValue = normalizeBirthDate(value);

  const openDatePicker = () => {
    if (!pickerRef.current) {
      return;
    }

    if (typeof pickerRef.current.showPicker === 'function') {
      pickerRef.current.showPicker();
      return;
    }

    pickerRef.current.click();
  };

  return (
    <div className="onboarding-field">
      <span>
        {label} {required ? <em>*</em> : null}
      </span>
      <span className="onboarding-input-wrap onboarding-input-wrap--with-button">
        <input
          value={value}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="bday"
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <button type="button" className="onboarding-date-picker-button" onClick={openDatePicker} aria-label="캘린더에서 생년월일 선택">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="onboarding-input-icon">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15v8.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V10ZM5 6a.5.5 0 0 0-.5.5V8h15V6.5A.5.5 0 0 0 19 6H5Z" />
          </svg>
        </button>
        <input
          ref={pickerRef}
          className="onboarding-native-date-input"
          type="date"
          value={pickerValue}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => onChange(toBirthDateDisplay(event.target.value))}
        />
      </span>
      {error ? (
        <small className="onboarding-field-error" role="alert">
          {error}
        </small>
      ) : null}
    </div>
  );
}

function TextField({ label, required, placeholder, value, onChange, onBlur, hint, icon, error }) {
  return (
    <label className="onboarding-field">
      <span>
        {label} {required ? <em>*</em> : null}
      </span>
      <span className="onboarding-input-wrap">
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} />
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

function ChoiceField({ label, required, options, value, onChange, className = '' }) {
  return (
    <fieldset className={`onboarding-choice-group ${className}`.trim()}>
      <legend>
        {label} {required ? <em>*</em> : null}
      </legend>
      <div className="onboarding-chip-row">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`onboarding-chip ${value === option ? 'is-selected' : ''}`}
            onClick={() => onChange(option)}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultiChoiceField({ label, required, helper, options, values, onToggle, compact }) {
  return (
    <fieldset className={`onboarding-choice-group ${compact ? 'is-compact' : ''}`}>
      <legend>
        {label}
        {helper ? <span> · {helper}</span> : null} {required ? <em>*</em> : null}
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
        {label} {required ? <em>*</em> : null}
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
      {limitMessage ? (
        <p id="job-picker-limit-message" className="onboarding-job-picker__limit" role="alert">
          {limitMessage}
        </p>
      ) : null}
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
