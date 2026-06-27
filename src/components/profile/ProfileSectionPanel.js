import { cloneElement, isValidElement, useEffect, useId, useMemo, useState } from 'react';
import basicProfile from '../../assets/profile/basic_profile.png';
import { BirthDateField } from '../common/BirthDateField';
import { useSignupOptions } from '../../hooks/useSignupOptions';

const fallbackText = '없음';
const MAX_JOB_SELECTIONS = 5;

const genderOptions = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '기타' },
  { value: 'NOT_DISCLOSED', label: '선택 안 함' }
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

const disabilityTypeOptions = [
  { value: 'PHYSICAL', label: '지체장애' },
  { value: 'BRAIN_LESION', label: '뇌병변장애' },
  { value: 'VISUAL', label: '시각장애' },
  { value: 'HEARING', label: '청각장애' },
  { value: 'SPEECH', label: '언어장애' },
  { value: 'INTELLECTUAL', label: '지적장애' },
  { value: 'AUTISM', label: '자폐성장애' },
  { value: 'MENTAL', label: '정신장애' },
  { value: 'KIDNEY', label: '신장장애' },
  { value: 'HEART', label: '심장장애' },
  { value: 'RESPIRATORY', label: '호흡기장애' },
  { value: 'LIVER', label: '간장애' },
  { value: 'FACE', label: '안면장애' },
  { value: 'STOMA_URINARY', label: '장루·요루장애' },
  { value: 'EPILEPSY', label: '뇌전증장애' },
  { value: 'OTHER', label: '기타' }
];

const disabilitySeverityOptions = [
  { value: 'SEVERE', label: '중증' },
  { value: 'MODERATE', label: '중등도' },
  { value: 'MILD', label: '경증' }
];

const workAvailabilityOptions = [
  { value: 'IMMEDIATE', label: '즉시 가능' },
  { value: 'WITHIN_TWO_WEEKS', label: '2주 이내' },
  { value: 'WITHIN_ONE_MONTH', label: '1개월 이내' },
  { value: 'NEGOTIABLE', label: '협의 가능' }
];

const workTypeOptions = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'INDEFINITE_CONTRACT', label: '무기계약직' },
  { value: 'PART_TIME', label: '시간제' },
  { value: 'DAILY', label: '일용직' },
  { value: 'INTERN', label: '인턴' },
  { value: 'DISPATCH_OUTSOURCING', label: '파견·용역' },
  { value: 'REMOTE', label: '재택·원격' }
];

const workTimePreferenceOptions = [
  { value: 'DAYTIME', label: '주간' },
  { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' },
  { value: 'EVENING', label: '야간' },
  { value: 'FLEXIBLE', label: '탄력근무' },
  { value: 'NEGOTIABLE', label: '협의 가능' }
];

const militaryServiceOptions = [
  { value: 'COMPLETED', label: '군필' },
  { value: 'EXEMPTED', label: '면제' },
  { value: 'NOT_APPLICABLE', label: '해당 없음' },
  { value: 'SERVING', label: '복무 중' }
];

const booleanOptions = [
  { value: true, label: '예' },
  { value: false, label: '아니오' }
];

const text = (value) => String(value ?? '').trim();

export function ProfileSectionPanel({
  activeSection,
  profile,
  onChange,
  validationErrors = {},
  onFieldBlur = () => {},
  isReadOnly = false
}) {
  if (!activeSection) {
    return null;
  }

  const props = { profile, onChange, validationErrors, onFieldBlur };
  const panels = {
    basic: <BasicInfoPanel {...props} />,
    education: <EducationPanel {...props} />,
    job: <JobPanel {...props} />,
    disability: <DisabilityPanel {...props} />,
    work: <WorkConditionPanel {...props} />,
    intro: <IntroPanel {...props} />,
    extra: <ExtraPanel {...props} />
  };

  return (
    <section className={`profile-section-panel profile-section-panel--${activeSection}`}>
      {isReadOnly ? (
        <fieldset className="profile-section-panel__fieldset" disabled>
          {panels[activeSection]}
        </fieldset>
      ) : (
        panels[activeSection]
      )}
    </section>
  );
}

function BasicInfoPanel({ profile, onChange, validationErrors, onFieldBlur }) {
  return (
    <div className="profile-basic-grid">
      <div className="profile-photo-field">
        <h2>프로필 사진</h2>
        <div className="profile-photo-preview">
          <img src={basicProfile} alt="프로필 사진" />
        </div>
      </div>
      <div className="profile-two-column">
        <Field label="이름" required error={validationErrors.fullName}>
          <Input
            value={profile.fullName}
            onChange={(value) => onChange('fullName', value)}
            onBlur={() => onFieldBlur('fullName')}
            aria-invalid={Boolean(validationErrors.fullName)}
          />
        </Field>
        <Field label="연락처" required error={validationErrors.contactPhone}>
          <Input
            value={profile.contactPhone}
            onChange={(value) => onChange('contactPhone', value)}
            onBlur={() => onFieldBlur('contactPhone')}
            placeholder="010-1234-5678"
            inputMode="numeric"
            autoComplete="tel"
            aria-invalid={Boolean(validationErrors.contactPhone)}
          />
        </Field>
        <Field label="성별" required>
          <PillGroup options={genderOptions} selected={profile.genderType} onChange={(value) => onChange('genderType', value)} />
        </Field>
        <Field label="이메일" required error={validationErrors.contactEmail}>
          <Input
            type="email"
            value={profile.contactEmail}
            onChange={(value) => onChange('contactEmail', value)}
            onBlur={() => onFieldBlur('contactEmail')}
            aria-invalid={Boolean(validationErrors.contactEmail)}
          />
        </Field>
        <BirthDateField
          id="profile-birth-date"
          label="생년월일"
          required
          value={profile.birthDate}
          onChange={(value) => onChange('birthDate', value)}
          onBlur={() => onFieldBlur('birthDate')}
          error={validationErrors.birthDate}
          outputFormat="iso"
          showAgeHint={false}
          className="profile-birth-date-picker"
        />
        <Field label="거주지 상세 주소" required hint="동·읍·면 단위까지 입력하면 통근 시간 계산이 정확해져요">
          <Input value={profile.detailAddress} onChange={(value) => onChange('detailAddress', value)} />
        </Field>
        <Field label="비상 연락처">
          <Input value={profile.emergencyContact} onChange={(value) => onChange('emergencyContact', value)} />
        </Field>
      </div>
    </div>
  );
}

function EducationPanel({ profile, onChange }) {
  return (
    <>
      <h2>학력</h2>
      <div className="profile-form-grid profile-form-grid--education">
        <Field label="최종 학력" required>
          <SelectBox value={profile.highestEducation} onChange={(value) => onChange('highestEducation', value)} options={educationOptions} />
        </Field>
        <Field label="졸업 여부" required>
          <SelectBox
            value={profile.graduationStatus}
            onChange={(value) => onChange('graduationStatus', value)}
            options={graduationStatusOptions}
          />
        </Field>
      </div>
      <Divider />
      <h2>경력</h2>
      <div className="profile-form-grid profile-form-grid--career">
        <Field label="주요 경력" required>
          <Input value={profile.majorCareer} onChange={(value) => onChange('majorCareer', value)} placeholder="없으면 신입" />
        </Field>
        <Field label="경력 요약">
          <Input value={profile.careerSummary} onChange={(value) => onChange('careerSummary', value)} />
        </Field>
      </div>
      <Divider />
      <div className="profile-form-grid profile-form-grid--intro-optional">
        <Field label="학력 요약">
          <TextArea value={profile.educationSummary} onChange={(value) => onChange('educationSummary', value)} rows={4} />
        </Field>
        <Field label="프로젝트 경험">
          <TextArea value={profile.projectExperience} onChange={(value) => onChange('projectExperience', value)} rows={4} />
        </Field>
        <Field label="공백 기간 사유">
          <TextArea value={profile.careerGapReason} onChange={(value) => onChange('careerGapReason', value)} rows={4} />
        </Field>
      </div>
    </>
  );
}

function JobPanel({ profile, onChange }) {
  const options = useSignupOptions();
  const selectedJobs = useMemo(
    () => resolveSelectedJobValues(profile.targetJob, options.jobCategories),
    [options.jobCategories, profile.targetJob]
  );

  useEffect(() => {
    if (options.status !== 'success') {
      return;
    }

    const normalizedTargetJob = selectedJobs.join(', ');
    if (normalizedTargetJob && normalizedTargetJob !== text(profile.targetJob)) {
      onChange('targetJob', normalizedTargetJob);
    }
  }, [onChange, options.status, profile.targetJob, selectedJobs]);

  const toggleTargetJob = (job) => {
    const nextJobs = selectedJobs.includes(job)
      ? selectedJobs.filter((item) => item !== job)
      : [...selectedJobs, job];

    onChange('targetJob', nextJobs.join(', '));
  };

  return (
    <>
      <h2>지원 직무</h2>
      <div className="profile-job-picker-area">
        {options.status === 'idle' || options.status === 'loading' ? (
          <ProfileOptionState kind="loading" message="지원 직무 목록을 불러오는 중입니다." />
        ) : options.status === 'error' ? (
          <ProfileOptionState kind="error" message={options.error || '지원 직무 목록을 불러오지 못했습니다.'} />
        ) : options.status === 'empty' ? (
          <ProfileOptionState kind="empty" message="선택 가능한 지원 직무 목록이 없습니다." />
        ) : (
          <ProfileJobCategoryField
            label="지원 직무"
            required
            categories={options.jobCategories}
            values={selectedJobs}
            onToggle={toggleTargetJob}
          />
        )}
      </div>
      <Field label="보유 기술 / 역량" required hint="Enter 또는 추가 버튼으로 항목을 추가합니다.">
        <ChipEditor value={profile.skills} onChange={(value) => onChange('skills', value)} placeholder="예) 엑셀" />
      </Field>
      <Divider />
      <div className="profile-form-grid profile-form-grid--job-extra">
        <Field label="자격증">
          <ChipEditor value={profile.certifications} onChange={(value) => onChange('certifications', value)} placeholder="예) 컴퓨터활용능력 2급" />
        </Field>
        <Field label="포트폴리오 URL">
          <Input value={profile.portfolioUrl} onChange={(value) => onChange('portfolioUrl', value)} />
        </Field>
        <Field label="수상 이력">
          <TextArea value={profile.awards} onChange={(value) => onChange('awards', value)} rows={4} />
        </Field>
        <Field label="교육 이수 내역">
          <TextArea value={profile.trainings} onChange={(value) => onChange('trainings', value)} rows={4} />
        </Field>
      </div>
    </>
  );
}

function splitJobValues(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function flattenJobOptions(categories = []) {
  return categories.flatMap((category) =>
    category.groups.flatMap((group) => group.jobs.map((job) => ({
      job,
      path: `${category.label} ${group.label} ${job}`
    })))
  );
}

function normalizeJobText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()[\]{}·ㆍ,./_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getSimilarityScore(source, target) {
  const sourceTerms = new Set(normalizeJobText(source).split(' ').filter((term) => term.length >= 2));
  const targetTerms = new Set(normalizeJobText(target).split(' ').filter((term) => term.length >= 2));

  if (!sourceTerms.size || !targetTerms.size) {
    return 0;
  }

  let score = 0;
  sourceTerms.forEach((term) => {
    targetTerms.forEach((candidate) => {
      if (term === candidate) {
        score += 3;
      } else if (term.includes(candidate) || candidate.includes(term)) {
        score += 1;
      }
    });
  });

  return score;
}

function resolveSelectedJobValues(value, categories = []) {
  const values = splitJobValues(value);
  const options = flattenJobOptions(categories);

  if (!options.length) {
    return values;
  }

  return values
    .map((item) => {
      const exactMatch = options.find(({ job }) => job === item);
      if (exactMatch) {
        return exactMatch.job;
      }

      const bestMatch = options
        .map((option) => ({
          job: option.job,
          score: Math.max(getSimilarityScore(item, option.job), getSimilarityScore(item, option.path))
        }))
        .sort((left, right) => right.score - left.score)[0];

      return bestMatch?.score > 0 ? bestMatch.job : item;
    })
    .filter((item, index, list) => item && list.indexOf(item) === index);
}

function ProfileOptionState({ kind, message }) {
  const role = kind === 'error' ? 'alert' : 'status';

  return (
    <div className={`profile-option-state profile-option-state--${kind}`} role={role}>
      {message}
    </div>
  );
}

function ProfileJobCategoryField({ label, required, categories, values, onToggle }) {
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

  useEffect(() => {
    setActivePrimary(categories[0]?.label || '');
    setActiveSecondary(categories[0]?.groups[0]?.label || '');
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
    <fieldset className="onboarding-choice-group onboarding-job-picker profile-job-picker" aria-describedby={limitMessage ? 'profile-job-picker-limit-message' : undefined}>
      <legend>
        {label} {required ? <RequiredMark /> : null}
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
        <p id="profile-job-picker-limit-message" className="onboarding-job-picker__limit" role="alert">
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

function DisabilityPanel({ profile, onChange }) {
  return (
    <>
      <h2>장애 정보</h2>
      <div className="profile-form-grid profile-form-grid--disability">
        <Field label="장애 유형" required>
          <SelectBox value={profile.disabilityType} onChange={(value) => onChange('disabilityType', value)} options={disabilityTypeOptions} />
        </Field>
        <Field label="장애 정도" required>
          <SelectBox
            value={profile.disabilitySeverity}
            onChange={(value) => onChange('disabilitySeverity', value)}
            options={disabilitySeverityOptions}
          />
        </Field>
        <Field label="장애 등록 여부" required>
          <RadioGroup
            options={booleanOptions}
            selected={profile.disabilityRegisteredYn}
            onChange={(value) => onChange('disabilityRegisteredYn', value)}
          />
        </Field>
      </div>
      <Divider />
      <div className="profile-disability-detail">
        <Field label="상세 장애 설명">
          <TextArea value={profile.disabilityDescription} onChange={(value) => onChange('disabilityDescription', value)} rows={5} />
        </Field>
        <div className="profile-disability-support-column">
          <Field label="보조기기">
            <Input value={profile.assistiveDevices} onChange={(value) => onChange('assistiveDevices', value)} />
          </Field>
          <Field label="근무 시 필요한 지원 사항">
            <TextArea value={profile.workSupportRequirements} onChange={(value) => onChange('workSupportRequirements', value)} rows={4} />
          </Field>
        </div>
      </div>
      <Field label="필요 지원 항목" hint="복수 입력 가능">
        <ChipEditor value={profile.requiredSupports} onChange={(value) => onChange('requiredSupports', value)} placeholder="예) 높이조절 책상" />
      </Field>
    </>
  );
}

function WorkConditionPanel({ profile, onChange }) {
  return (
    <>
      <h2>근무 조건</h2>
      <div className="profile-form-grid profile-form-grid--work-top">
        <Field label="근무 가능 시점">
          <RadioGroup
            options={[...workAvailabilityOptions, { value: null, label: '미선택' }]}
            selected={profile.workAvailability}
            onChange={(value) => onChange('workAvailability', value)}
          />
        </Field>
        <Field label="근무 형태 가능 범위" required>
          <CheckboxRow
            options={workTypeOptions}
            selectedOptions={profile.workTypes}
            onChange={(value) => onChange('workTypes', value)}
          />
        </Field>
      </div>
      <Divider />
      <div className="profile-form-grid profile-form-grid--work">
        <Field label="희망 연봉">
          <span className="profile-unit-input">
            <Input
              value={profile.expectedSalary}
              onChange={(value) => onChange('expectedSalary', value.replace(/\D/g, ''))}
              placeholder="예) 3200"
              inputMode="numeric"
            />
            <span className="profile-unit-input__unit">만원</span>
          </span>
        </Field>
        <Field label="근무 시간 선호">
          <SelectBox
            value={profile.workTimePreference}
            onChange={(value) => onChange('workTimePreference', value)}
            options={workTimePreferenceOptions}
          />
        </Field>
        <Field label="재택근무 가능 여부">
          <RadioGroup
            options={[...booleanOptions, { value: null, label: '협의 가능' }]}
            selected={profile.remoteAvailableYn}
            onChange={(value) => onChange('remoteAvailableYn', value)}
          />
        </Field>
        <Field label="통근 범위">
          <Input value={profile.commuteRange} onChange={(value) => onChange('commuteRange', value)} placeholder="예) 대중교통 50분 이내" />
        </Field>
      </div>
    </>
  );
}

function IntroPanel({ profile, onChange }) {
  return (
    <>
      <h2>자기소개 및 지원동기</h2>
      <div className="profile-form-grid profile-form-grid--intro">
        <Field label="자기소개" required>
          <TextArea value={profile.selfIntroduction} onChange={(value) => onChange('selfIntroduction', value)} rows={6} />
        </Field>
        <Field label="지원동기">
          <TextArea value={profile.motivation} onChange={(value) => onChange('motivation', value)} rows={6} />
        </Field>
      </div>
      <Divider />
      <div className="profile-form-grid profile-form-grid--intro-optional">
        <Field label="직무 적합성">
          <TextArea value={profile.jobFitDescription} onChange={(value) => onChange('jobFitDescription', value)} rows={5} />
        </Field>
        <Field label="커리어 목표">
          <TextArea value={profile.careerGoal} onChange={(value) => onChange('careerGoal', value)} rows={5} />
        </Field>
        <Field label="개인 강점/약점">
          <TextArea value={profile.strengthsWeaknesses} onChange={(value) => onChange('strengthsWeaknesses', value)} rows={5} />
        </Field>
      </div>
    </>
  );
}

function ExtraPanel({ profile, onChange }) {
  return (
    <>
      <h2>기타 정보</h2>
      <div className="profile-form-grid profile-form-grid--extra-top">
        <Field label="병역 여부">
          <SelectBox value={profile.militaryService} onChange={(value) => onChange('militaryService', value)} options={militaryServiceOptions} />
        </Field>
        <Field label="국가유공자 여부">
          <RadioGroup
            options={[...booleanOptions, { value: null, label: '미선택' }]}
            selected={profile.patrioticVeteranYn}
            onChange={(value) => onChange('patrioticVeteranYn', value)}
          />
        </Field>
      </div>
      <Field label="SNS / 개인 웹사이트">
        <Input value={profile.snsUrl} onChange={(value) => onChange('snsUrl', value)} placeholder="https://..." />
      </Field>
    </>
  );
}

function Field({ label, required = false, hint, error, children, width }) {
  const generatedId = useId();
  const fieldId = `profile-field-${generatedId}`;
  const isSingleControl = isValidElement(children);
  const labeledChildren = isSingleControl
    ? cloneElement(children, {
      id: children.props.id || fieldId,
      'aria-label': children.props['aria-label'] || label
    })
    : children;

  return (
    <div className={`profile-field${width ? ` profile-field--${width}` : ''}`}>
      <label className="profile-label" htmlFor={isSingleControl ? fieldId : undefined}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {labeledChildren}
      {error ? (
        <span className="profile-field-error" role="alert">
          {error}
        </span>
      ) : null}
      {hint ? <span className="profile-help">{hint}</span> : null}
    </div>
  );
}

function RequiredMark() {
  return <em aria-label="필수">*</em>;
}

function Input({ icon, suffix, onChange, value, ...props }) {
  return (
    <span className="profile-input-wrap">
      <input className="profile-input" {...props} value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
      {suffix ? <span className="profile-input-suffix">{suffix}</span> : null}
      {icon ? <img src={icon} alt="입력 항목 아이콘" /> : null}
    </span>
  );
}

function SelectBox({ value, onChange, options, placeholder = '선택해주세요.', ...props }) {
  return (
    <select className="profile-select" value={value || ''} onChange={(event) => onChange(event.target.value)} {...props}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TextArea({ rows, value, onChange, ...props }) {
  const textValue = value || '';

  return (
    <span className="profile-textarea-wrap">
      <textarea
        className="profile-textarea"
        rows={rows}
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      <span className="profile-textarea-count" aria-live="polite">
        {String(textValue).length.toLocaleString('ko-KR')}자
      </span>
    </span>
  );
}

function RadioGroup({ options, selected, onChange }) {
  return (
    <div className="profile-radio-row">
      {options.map((option) => (
        <label key={String(option.value)} className="profile-radio">
          <input
            type="radio"
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
          />
          <span aria-hidden="true" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function CheckboxRow({ options, selectedOptions = [], onChange }) {
  const toggle = (value) => {
    const nextValues = selectedOptions.includes(value)
      ? selectedOptions.filter((item) => item !== value)
      : [...selectedOptions, value];

    onChange(nextValues);
  };

  return (
    <div className="profile-checkbox-row">
      {options.map((option) => (
        <label key={option.value} className="profile-checkbox">
          <input type="checkbox" checked={selectedOptions.includes(option.value)} onChange={() => toggle(option.value)} />
          <span aria-hidden="true" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function PillGroup({ options, selected, onChange }) {
  return (
    <div className="profile-pill-row">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`profile-pill${selected === option.value ? ' is-selected' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ChipEditor({ value = [], onChange, placeholder, id, 'aria-label': ariaLabel }) {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const addValue = (rawValue) => {
    const nextValue = text(rawValue);

    if (!nextValue || value.includes(nextValue)) {
      return;
    }

    onChange([...value, nextValue]);
  };

  const removeValue = (item) => {
    onChange(value.filter((valueItem) => valueItem !== item));
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }
    if (isComposing || event.nativeEvent?.isComposing) {
      return;
    }

    event.preventDefault();
    addValue(inputValue);
    setInputValue('');
  };

  const handleAddClick = () => {
    addValue(inputValue);
    setInputValue('');
  };

  return (
    <div className="profile-chip-editor">
      <div className="profile-chip-list" aria-live="polite">
        {value.length ? (
          value.map((item) => (
            <button key={item} type="button" onClick={() => removeValue(item)} aria-label={`${item} 삭제`}>
              {item}
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <span>{fallbackText}</span>
        )}
      </div>
      <div className="profile-chip-input-row">
        <input
          id={id}
          className="profile-input"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />
        <button type="button" onClick={handleAddClick}>
          추가
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="profile-divider" />;
}
