import { useMemo, useRef, useState } from 'react';
import { BOOLEAN_OPTIONS } from '../../config/appConfig';
import { toBooleanOrNull } from '../../utils/formUtils';
import { ChipInput, Field, FieldRow, SelectInput, TextAreaInput, TextInput } from '../common/FormFields';
import { StatusMessage } from '../common/StatusMessage';

const WORK_AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATE', label: '즉시 가능' },
  { value: 'WITHIN_1_MONTH', label: '1개월 이내' },
  { value: 'NEGOTIABLE', label: '협의 가능' }
];

const DISABILITY_SEVERITY_OPTIONS = [
  { value: 'SEVERE', label: '중증' },
  { value: 'MODERATE', label: '중등도' },
  { value: 'MILD', label: '경증' }
];

const graduationOptions = [
  { value: 'GRADUATED', label: '졸업' },
  { value: 'EXPECTED', label: '졸업예정' },
  { value: 'COMPLETION', label: '수료' },
  { value: 'DROPOUT', label: '중퇴' }
];

const defaults = {
  desiredJob: '',
  commuteRange: '',
  preferredWorkEnvironments: [],
  avoidedWorkEnvironments: [],
  requiredSupports: [],
  disabilityType: '',
  careerSummary: '',
  educationSummary: '',
  employmentTypeSummary: '',
  fullName: '',
  contactPhone: '',
  contactEmail: '',
  birthDate: '',
  ageGroup: '',
  residenceRegion: '',
  detailAddress: '',
  emergencyContact: '',
  profileImageUrl: '',
  highestEducation: '',
  graduationStatus: '',
  majorCareer: '',
  careerDetail: '',
  projectExperience: '',
  careerGapReason: '',
  targetJob: '',
  skills: [],
  certifications: [],
  portfolioUrl: '',
  awards: '',
  trainings: '',
  disabilityYn: '',
  disabilitySeverity: '',
  disabilityRegisteredYn: '',
  disabilityDescription: '',
  assistiveDevices: '',
  workSupportRequirements: '',
  workAvailability: '',
  workTypes: [],
  expectedSalary: '',
  workTimePreference: '',
  remoteAvailableYn: '',
  selfIntroduction: '',
  motivation: '',
  jobFitDescription: '',
  careerGoal: '',
  strengthsWeaknesses: '',
  militaryService: '',
  patrioticVeteranYn: '',
  referrer: '',
  snsUrl: ''
};

const normalizeForm = (source) => ({
  ...defaults,
  ...source,
  preferredWorkEnvironments: source?.preferredWorkEnvironments || [],
  avoidedWorkEnvironments: source?.avoidedWorkEnvironments || [],
  requiredSupports: source?.requiredSupports || [],
  skills: source?.skills || [],
  certifications: source?.certifications || [],
  workTypes: source?.workTypes || [],
  disabilityYn: source?.disabilityYn === true ? 'true' : source?.disabilityYn === false ? 'false' : '',
  disabilityRegisteredYn:
    source?.disabilityRegisteredYn === true ? 'true' : source?.disabilityRegisteredYn === false ? 'false' : '',
  remoteAvailableYn: source?.remoteAvailableYn === true ? 'true' : source?.remoteAvailableYn === false ? 'false' : '',
  patrioticVeteranYn:
    source?.patrioticVeteranYn === true ? 'true' : source?.patrioticVeteranYn === false ? 'false' : '',
  birthDate: source?.birthDate || ''
});

const trim = (value) => String(value ?? '').trim();

const nullable = (value) => {
  const normalized = trim(value);
  return normalized || null;
};

const hasValue = (value) => trim(value).length > 0;

export function OnboardingProfileForm({ initialValue, onSubmit, submitting, aiTags }) {
  const [form, setForm] = useState(() => normalizeForm(initialValue));
  const [error, setError] = useState('');
  const submitInFlightRef = useRef(false);

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validationMessage = useMemo(() => {
    const requiredTextFields = [
      'desiredJob',
      'commuteRange',
      'disabilityType',
      'careerSummary',
      'educationSummary',
      'employmentTypeSummary',
      'fullName',
      'contactPhone',
      'contactEmail',
      'residenceRegion',
      'highestEducation',
      'graduationStatus',
      'majorCareer',
      'targetJob',
      'disabilitySeverity',
      'workAvailability',
      'selfIntroduction',
      'motivation'
    ];

    if (requiredTextFields.some((key) => !hasValue(form[key]))) {
      return '필수 텍스트 항목을 입력해 주세요.';
    }

    if (!form.preferredWorkEnvironments.length || !form.avoidedWorkEnvironments.length || !form.requiredSupports.length) {
      return '근무환경/지원사항 목록은 각각 1개 이상 필요합니다.';
    }

    if (!form.skills.length || !form.workTypes.length) {
      return '보유 기술과 근무 형태는 각각 1개 이상 필요합니다.';
    }

    if (!hasValue(form.birthDate) && !hasValue(form.ageGroup)) {
      return '생년월일 또는 연령대 중 하나를 입력해 주세요.';
    }

    if (toBooleanOrNull(form.disabilityYn) === null || toBooleanOrNull(form.disabilityRegisteredYn) === null) {
      return '장애 여부와 등록 여부를 선택해 주세요.';
    }

    return '';
  }, [form]);

  const submitPayload = () => ({
    desiredJob: trim(form.desiredJob),
    commuteRange: trim(form.commuteRange),
    preferredWorkEnvironments: form.preferredWorkEnvironments,
    avoidedWorkEnvironments: form.avoidedWorkEnvironments,
    requiredSupports: form.requiredSupports,
    disabilityType: trim(form.disabilityType),
    careerSummary: trim(form.careerSummary),
    educationSummary: trim(form.educationSummary),
    employmentTypeSummary: trim(form.employmentTypeSummary),
    fullName: trim(form.fullName),
    contactPhone: trim(form.contactPhone),
    contactEmail: trim(form.contactEmail),
    birthDate: nullable(form.birthDate),
    ageGroup: nullable(form.ageGroup),
    residenceRegion: trim(form.residenceRegion),
    detailAddress: nullable(form.detailAddress),
    emergencyContact: nullable(form.emergencyContact),
    profileImageUrl: nullable(form.profileImageUrl),
    highestEducation: trim(form.highestEducation),
    graduationStatus: trim(form.graduationStatus),
    majorCareer: trim(form.majorCareer),
    careerDetail: nullable(form.careerDetail),
    projectExperience: nullable(form.projectExperience),
    careerGapReason: nullable(form.careerGapReason),
    targetJob: trim(form.targetJob),
    skills: form.skills,
    certifications: form.certifications,
    portfolioUrl: nullable(form.portfolioUrl),
    awards: nullable(form.awards),
    trainings: nullable(form.trainings),
    disabilityYn: toBooleanOrNull(form.disabilityYn),
    disabilitySeverity: trim(form.disabilitySeverity),
    disabilityRegisteredYn: toBooleanOrNull(form.disabilityRegisteredYn),
    disabilityDescription: nullable(form.disabilityDescription),
    assistiveDevices: nullable(form.assistiveDevices),
    workSupportRequirements: nullable(form.workSupportRequirements),
    workAvailability: trim(form.workAvailability),
    workTypes: form.workTypes,
    expectedSalary: nullable(form.expectedSalary),
    workTimePreference: nullable(form.workTimePreference),
    remoteAvailableYn: toBooleanOrNull(form.remoteAvailableYn),
    selfIntroduction: trim(form.selfIntroduction),
    motivation: trim(form.motivation),
    jobFitDescription: nullable(form.jobFitDescription),
    careerGoal: nullable(form.careerGoal),
    strengthsWeaknesses: nullable(form.strengthsWeaknesses),
    militaryService: nullable(form.militaryService),
    patrioticVeteranYn: toBooleanOrNull(form.patrioticVeteranYn),
    referrer: nullable(form.referrer),
    snsUrl: nullable(form.snsUrl)
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || submitInFlightRef.current) {
      return;
    }

    setError('');

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    submitInFlightRef.current = true;
    try {
      await onSubmit(submitPayload());
    } catch (submitError) {
      setError(submitError.message || '온보딩 저장에 실패했습니다.');
    } finally {
      submitInFlightRef.current = false;
    }
  };

  return (
    <form className="form-layout" onSubmit={handleSubmit}>
      <section className="form-section">
        <h2>기본 희망 정보</h2>
        <FieldRow>
          <Field label="희망 직무" required>
            <TextInput value={form.desiredJob} onChange={(value) => update('desiredJob', value)} />
          </Field>
          <Field label="통근 범위" required>
            <TextInput value={form.commuteRange} onChange={(value) => update('commuteRange', value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="선호 업무환경" required hint="항목 추가 버튼 또는 Enter로 입력">
            <ChipInput
              value={form.preferredWorkEnvironments}
              onChange={(value) => update('preferredWorkEnvironments', value)}
              placeholder="예: 조용한 사무실"
            />
          </Field>
          <Field label="기피 업무환경" required>
            <ChipInput
              value={form.avoidedWorkEnvironments}
              onChange={(value) => update('avoidedWorkEnvironments', value)}
              placeholder="예: 소음이 큰 환경"
            />
          </Field>
        </FieldRow>
        <Field label="필요 지원사항" required>
          <ChipInput
            value={form.requiredSupports}
            onChange={(value) => update('requiredSupports', value)}
            placeholder="예: 화면 낭독기"
          />
        </Field>
      </section>

      <section className="form-section">
        <h2>개인 정보</h2>
        <FieldRow>
          <Field label="이름" required>
            <TextInput value={form.fullName} onChange={(value) => update('fullName', value)} />
          </Field>
          <Field label="연락처" required>
            <TextInput value={form.contactPhone} onChange={(value) => update('contactPhone', value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="이메일" required>
            <TextInput type="email" value={form.contactEmail} onChange={(value) => update('contactEmail', value)} />
          </Field>
          <Field label="거주지" required>
            <TextInput value={form.residenceRegion} onChange={(value) => update('residenceRegion', value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="생년월일" hint="또는 연령대 중 하나 필수">
            <TextInput type="date" value={form.birthDate} onChange={(value) => update('birthDate', value)} />
          </Field>
          <Field label="연령대" hint="예: 20대 후반">
            <TextInput value={form.ageGroup} onChange={(value) => update('ageGroup', value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="상세 주소">
            <TextInput value={form.detailAddress} onChange={(value) => update('detailAddress', value)} />
          </Field>
          <Field label="비상연락처">
            <TextInput value={form.emergencyContact} onChange={(value) => update('emergencyContact', value)} />
          </Field>
        </FieldRow>
      </section>

      <section className="form-section">
        <h2>학력·경력</h2>
        <FieldRow>
          <Field label="최종 학력" required>
            <TextInput value={form.highestEducation} onChange={(value) => update('highestEducation', value)} />
          </Field>
          <Field label="졸업 상태" required>
            <SelectInput value={form.graduationStatus} onChange={(value) => update('graduationStatus', value)} options={graduationOptions} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="주요 경력" required>
            <TextInput value={form.majorCareer} onChange={(value) => update('majorCareer', value)} />
          </Field>
          <Field label="경력 요약" required>
            <TextAreaInput value={form.careerSummary} onChange={(value) => update('careerSummary', value)} rows={3} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="학력 요약" required>
            <TextAreaInput value={form.educationSummary} onChange={(value) => update('educationSummary', value)} rows={3} />
          </Field>
          <Field label="희망 고용형태" required>
            <TextAreaInput value={form.employmentTypeSummary} onChange={(value) => update('employmentTypeSummary', value)} rows={3} />
          </Field>
        </FieldRow>
      </section>

      <section className="form-section">
        <h2>직무 역량</h2>
        <FieldRow>
          <Field label="지원 직무" required>
            <TextInput value={form.targetJob} onChange={(value) => update('targetJob', value)} />
          </Field>
          <Field label="장애 유형" required>
            <TextInput value={form.disabilityType} onChange={(value) => update('disabilityType', value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="보유 기술/역량" required>
            <ChipInput value={form.skills} onChange={(value) => update('skills', value)} placeholder="예: OA, 고객응대" />
          </Field>
          <Field label="자격증">
            <ChipInput
              value={form.certifications}
              onChange={(value) => update('certifications', value)}
              placeholder="예: 컴활 2급"
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="근무 형태" required>
            <ChipInput value={form.workTypes} onChange={(value) => update('workTypes', value)} placeholder="예: 정규직" />
          </Field>
          <Field label="근무 가능 시점" required>
            <SelectInput
              value={form.workAvailability}
              onChange={(value) => update('workAvailability', value)}
              options={WORK_AVAILABILITY_OPTIONS}
            />
          </Field>
        </FieldRow>
      </section>

      <section className="form-section">
        <h2>장애·지원 정보</h2>
        <FieldRow>
          <Field label="장애 여부" required>
            <SelectInput value={form.disabilityYn} onChange={(value) => update('disabilityYn', value)} options={BOOLEAN_OPTIONS} />
          </Field>
          <Field label="장애 등록 여부" required>
            <SelectInput
              value={form.disabilityRegisteredYn}
              onChange={(value) => update('disabilityRegisteredYn', value)}
              options={BOOLEAN_OPTIONS}
            />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="장애 정도" required>
            <SelectInput
              value={form.disabilitySeverity}
              onChange={(value) => update('disabilitySeverity', value)}
              options={DISABILITY_SEVERITY_OPTIONS}
            />
          </Field>
          <Field label="재택 가능 여부">
            <SelectInput value={form.remoteAvailableYn} onChange={(value) => update('remoteAvailableYn', value)} options={BOOLEAN_OPTIONS} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="지원 요구사항">
            <TextAreaInput
              value={form.workSupportRequirements}
              onChange={(value) => update('workSupportRequirements', value)}
              rows={3}
            />
          </Field>
          <Field label="보조기기">
            <TextAreaInput value={form.assistiveDevices} onChange={(value) => update('assistiveDevices', value)} rows={3} />
          </Field>
        </FieldRow>
      </section>

      <section className="form-section">
        <h2>자기소개</h2>
        <Field label="자기소개" required>
          <TextAreaInput value={form.selfIntroduction} onChange={(value) => update('selfIntroduction', value)} rows={5} />
        </Field>
        <Field label="지원 동기" required>
          <TextAreaInput value={form.motivation} onChange={(value) => update('motivation', value)} rows={4} />
        </Field>
        <FieldRow>
          <Field label="직무 적합성 설명">
            <TextAreaInput value={form.jobFitDescription} onChange={(value) => update('jobFitDescription', value)} rows={3} />
          </Field>
          <Field label="중장기 커리어 목표">
            <TextAreaInput value={form.careerGoal} onChange={(value) => update('careerGoal', value)} rows={3} />
          </Field>
        </FieldRow>
      </section>

      {aiTags ? (
        <section className="form-section">
          <h2>AI 추천 태그</h2>
          <div className="tag-panels">
            <TagPanel title="직무" items={aiTags.aiJobTags} />
            <TagPanel title="환경" items={aiTags.aiEnvironmentTags} />
            <TagPanel title="지원" items={aiTags.aiSupportTags} />
          </div>
        </section>
      ) : null}

      <StatusMessage kind="error">{error}</StatusMessage>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? '저장 중...' : '온보딩 저장'}
      </button>
    </form>
  );
}

function TagPanel({ title, items = [] }) {
  return (
    <div className="tag-panel">
      <strong>{title}</strong>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>아직 생성되지 않았습니다.</p>
      )}
    </div>
  );
}
