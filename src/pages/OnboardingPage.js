import { useMemo, useState } from 'react';
import checkCircleIcon from '../assets/signup/check_circle.png';
import stepBeforeIcon from '../assets/signup/item-before.png';
import stepCompleteIcon from '../assets/signup/item-completion.png';
import stepCurrentIcon from '../assets/signup/item-ing.png';

const STEPS = [
  { id: 1, title: '기본 정보' },
  { id: 2, title: '직무·경력' },
  { id: 3, title: '근무 조건' },
  { id: 4, title: '장애 정보' },
  { id: 5, title: '자기소개 (선택)' }
];

const educationOptions = ['고졸 이하', '초대졸', '대졸', '석사', '박사'];
const jobOptions = ['사무보조', '행정', '고객상담', '데이터 입력', '회계 보조', 'IT 지원', '디자인', '물류'];
const employmentOptions = ['정규직', '계약직', '무기계약직', '시간제', '일용직', '인턴', '파견/용역', '재택/원격'];
const disabilityTypes = ['지체', '시각', '청각', '발달', '뇌병변', '내부장애'];

const initialForm = {
  name: '',
  gender: '',
  phone: '',
  email: '',
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
};

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [form, setForm] = useState(initialForm);

  const progressWidth = useMemo(() => `${(currentStep / STEPS.length) * 100}%`, [currentStep]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayValue = (field, value) => {
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

  const goNext = () => {
    if (currentStep === STEPS.length) {
      setIsComplete(true);
      return;
    }

    setCurrentStep((step) => Math.min(STEPS.length, step + 1));
  };

  return (
    <main className="onboarding-page">
      <OnboardingHeader />

      {isComplete ? (
        <CompletionPanel onBack={() => setIsComplete(false)} />
      ) : (
        <section className="onboarding-main" aria-labelledby="onboarding-title">
          <div className="onboarding-intro">
            <p className="onboarding-step-count">
              <strong>{currentStep}단계</strong> / {STEPS.length}단계
            </p>
            <h1 id="onboarding-title">기본 정보 입력</h1>
            <p>추천을 시작하기 위해 꼭 필요한 정보만 먼저 입력해요. 자세한 접근성 조건은 다음 단계에서 설정합니다.</p>
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
                updateField={updateField}
                toggleArrayValue={toggleArrayValue}
              />

              <div className="onboarding-actions">
                <button
                  type="button"
                  className="onboarding-button onboarding-button--secondary"
                  onClick={goPrevious}
                  disabled={currentStep === 1}
                >
                  이전
                </button>
                <button type="button" className="onboarding-button onboarding-button--primary" onClick={goNext}>
                  다음 단계
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

function OnboardingHeader() {
  return (
    <header className="onboarding-header">
      <div className="onboarding-brand" aria-label="Bridgework">
        <img src="/logo.png" alt="" />
        <strong>Bridgework</strong>
      </div>
      <p>기본 프로필 생성은 가입 시 1회 필수입니다</p>
    </header>
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

function StepContent({ currentStep, form, updateField, toggleArrayValue }) {
  if (currentStep === 1) {
    return (
      <div className="onboarding-panel__content">
        <h2>기본 정보</h2>
        <div className="onboarding-form-grid">
          <TextField label="이름" required placeholder="홍길동" value={form.name} onChange={(value) => updateField('name', value)} />
          <ChoiceField
            label="성별"
            required
            options={['남성', '여성', '선택 안 함']}
            value={form.gender}
            onChange={(value) => updateField('gender', value)}
          />
          <TextField label="연락처" required placeholder="010-1234-5678" value={form.phone} onChange={(value) => updateField('phone', value)} />
          <TextField label="이메일" required placeholder="me@bridgework.kr" value={form.email} onChange={(value) => updateField('email', value)} />
          <TextField
            label="생년월일"
            required
            placeholder="YYYY.MM.DD"
            value={form.birthDate}
            onChange={(value) => updateField('birthDate', value)}
            icon="calendar"
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
        <MultiChoiceField
          label="지원 직무"
          required
          options={jobOptions}
          values={form.jobs}
          onToggle={(value) => toggleArrayValue('jobs', value)}
          compact
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
        <span>자기소개</span>
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

function TextField({ label, required, placeholder, value, onChange, hint, icon }) {
  return (
    <label className="onboarding-field">
      <span>
        {label} {required ? <em>*</em> : null}
      </span>
      <span className="onboarding-input-wrap">
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        {icon === 'calendar' ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="onboarding-input-icon">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15v8.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V10ZM5 6a.5.5 0 0 0-.5.5V8h15V6.5A.5.5 0 0 0 19 6H5Z" />
          </svg>
        ) : null}
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function ChoiceField({ label, required, options, value, onChange }) {
  return (
    <fieldset className="onboarding-choice-group">
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

function CompletionPanel({ onBack }) {
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
        <button type="button" className="onboarding-button onboarding-button--primary" onClick={onBack}>
          상세 정보 입력하기
        </button>
      </div>
      <p className="onboarding-complete__note">나중에 프로필 관리에서 언제든지 추가 및 수정할 수 있어요</p>
    </section>
  );
}
