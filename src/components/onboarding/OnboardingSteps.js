import { useMemo, useState } from 'react';
import checkCircleIcon from '../../assets/signup/check_circle.png';
import stepBeforeIcon from '../../assets/signup/item-before.png';
import stepCompleteIcon from '../../assets/signup/item-completion.png';
import stepCurrentIcon from '../../assets/signup/item-ing.png';
import {
  DISABILITY_REGISTERED_OPTIONS as disabilityRegisteredOptions,
  DISABILITY_SEVERITY_OPTIONS as disabilitySeverityOptions,
  DISABILITY_TYPE_OPTIONS as disabilityTypes,
  EDUCATION_OPTIONS as educationOptions,
  GENDER_OPTIONS as genderOptions,
  GRADUATION_STATUS_OPTIONS as graduationStatusOptions,
  MAX_ONBOARDING_JOB_SELECTIONS as MAX_JOB_SELECTIONS,
  ONBOARDING_STEPS as STEPS
} from '../../constants/onboarding';
import { getFieldFormatMessage } from '../../utils/formValidation';
import { BirthDateField } from '../common/BirthDateField';
import { StatusMessage } from '../common/StatusMessage';

export function StepRail({ currentStep }) {
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

export function OptionStatePanel({ title, message, actionLabel, onAction }) {
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

export function StepContent({
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
        <TextField
          label="보유 기술/역량"
          required
          placeholder="예) 엑셀, 문서작성, 고객응대"
          value={form.skills}
          onChange={(value) => updateField('skills', value)}
          hint="여러 개는 쉼표(,)로 구분해 입력해 주세요."
          className="onboarding-field--full"
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
          장애 정보 제공은 선택 사항입니다. 동의하면 맞춤 추천과 근무 지원사항 안내에 사용하며, 동의하지 않아도 가입할 수 있습니다.
        </div>
        <label className="profile-sensitive-consent__toggle">
          <input
            type="checkbox"
            checked={form.sensitiveInfoConsentYn}
            onChange={(event) => updateField('sensitiveInfoConsentYn', event.target.checked)}
          />
          <span aria-hidden="true" />
          선택 민감정보 수집·이용에 동의합니다.
        </label>
        {form.sensitiveInfoConsentYn ? (
          <>
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
          </>
        ) : null}
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
          value={value ?? ''}
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

export function CompletionPanel({ summary, onBack, onProfile }) {
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
          <dd>{summary.remainingDetailFieldCount}개</dd>
          <span>{summary.remainingDetailGroupCount}개 묶음 선택 정보</span>
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
