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

const graduationStatusOptions = [
  { value: 'GRADUATED', label: '졸업' },
  { value: 'EXPECTED', label: '졸업예정' },
  { value: 'ENROLLED', label: '재학' },
  { value: 'COMPLETED', label: '수료' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'OTHER', label: '기타' }
];

const structuredEducationTypeOptions = [
  { value: 'HIGH_SCHOOL', label: '고등학교' },
  { value: 'COLLEGE_2_3', label: '전문대(2,3년제)' },
  { value: 'COLLEGE_4', label: '대학교(4년제)' },
  { value: 'MASTER', label: '대학원(석사)' },
  { value: 'DOCTOR', label: '대학원(박사)' },
  { value: 'BOOTCAMP', label: '부트캠프' },
  { value: 'OTHER', label: '기타' }
];

const structuredProjectTypeOptions = [
  { value: 'COMPANY_PROJECT', label: '실무 프로젝트' },
  { value: 'BOOTCAMP', label: '부트캠프' },
  { value: 'FREELANCE', label: '외주·프리랜서' },
  { value: 'HACKATHON', label: '해커톤' },
  { value: 'CONTEST', label: '공모전' },
  { value: 'CLUB', label: '동아리' },
  { value: 'VOLUNTEER', label: '봉사활동' },
  { value: 'PERSONAL', label: '개인 프로젝트' },
  { value: 'OTHER', label: '기타' }
];

const certificationIssuerOptions = [
  { value: '한국산업인력공단', label: '한국산업인력공단' },
  { value: '대한상공회의소', label: '대한상공회의소' },
  { value: '한국생산성본부', label: '한국생산성본부' },
  { value: '한국데이터산업진흥원', label: '한국데이터산업진흥원' },
  { value: '한국금융연수원', label: '한국금융연수원' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'Amazon Web Services', label: 'Amazon Web Services' },
  { value: 'Cisco', label: 'Cisco' },
  { value: '기타', label: '기타' }
];

const languageOptions = [
  { value: '영어', label: '영어' },
  { value: '일본어', label: '일본어' },
  { value: '중국어', label: '중국어' },
  { value: '스페인어', label: '스페인어' },
  { value: '프랑스어', label: '프랑스어' },
  { value: '독일어', label: '독일어' },
  { value: '베트남어', label: '베트남어' },
  { value: '기타', label: '기타' }
];

const portfolioTypeOptions = [
  { value: '포트폴리오 사이트', label: '포트폴리오 사이트' },
  { value: 'GitHub', label: 'GitHub' },
  { value: 'Notion', label: 'Notion' },
  { value: 'Behance', label: 'Behance' },
  { value: '블로그', label: '블로그' },
  { value: 'PDF 링크', label: 'PDF 링크' },
  { value: '개인 웹사이트', label: '개인 웹사이트' },
  { value: '기타', label: '기타' }
];

const trainingTypeOptions = [
  { value: '직업훈련', label: '직업훈련' },
  { value: '부트캠프', label: '부트캠프' },
  { value: '온라인 강의', label: '온라인 강의' },
  { value: '사내 교육', label: '사내 교육' },
  { value: '대학교·평생교육', label: '대학교·평생교육' },
  { value: '자격증 과정', label: '자격증 과정' },
  { value: '세미나·워크숍', label: '세미나·워크숍' },
  { value: '기타', label: '기타' }
];

const languageTestOptionsByLanguage = {
  영어: ['TOEIC', 'TOEIC Speaking', 'OPIc', 'TOEFL iBT', 'IELTS', 'TEPS'],
  일본어: ['JLPT', 'JPT', 'SJPT', 'BJT'],
  중국어: ['HSK', 'HSKK', 'TSC'],
  스페인어: ['DELE', 'SIELE'],
  프랑스어: ['DELF', 'DALF', 'TCF'],
  독일어: ['Goethe-Zertifikat', 'TestDaF', 'telc'],
  베트남어: ['VSL', 'OPI 베트남어'],
  기타: ['기타']
};

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
let structuredEntrySequence = 0;
const sensitiveConsentDetails = [
  {
    title: '수집 목적',
    body: '장애 유형, 보조기기, 필요 지원 정보를 바탕으로 맞춤 일자리 추천과 근무환경 적합성 안내 품질을 높이기 위해 활용합니다.'
  },
  {
    title: '수집 항목',
    body: '장애 유형, 장애 정도, 장애 등록 여부, 상세 장애 설명, 보조기기, 근무 시 필요한 지원 사항, 필요 지원 항목'
  },
  {
    title: '보관 기간',
    body: '회원 탈퇴 또는 민감정보 처리 동의 철회 시까지 보관하며, 법령상 별도 보관이 필요한 경우에는 해당 기간 동안 분리 보관합니다.'
  },
  {
    title: '동의 거부 시 영향',
    body: '동의를 거부할 수 있으나, 장애 특성을 반영한 추천 결과와 기업 매칭 정확도, 접근성 안내 기능이 제한될 수 있습니다.'
  }
];

function createStructuredEntryId(prefix) {
  structuredEntrySequence += 1;
  return `${prefix}-${structuredEntrySequence}`;
}

function createEducationEntry(entry = {}) {
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

function createCareerEntry(entry = {}) {
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

function createProjectEntry(entry = {}) {
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

function createCertificationEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('certification'),
    issuer: '',
    certificationName: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createLanguageEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('language'),
    languageName: '',
    testName: '',
    scoreOrGrade: '',
    acquiredYearMonth: '',
    ...entry
  };
}

function createPortfolioEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('portfolio'),
    portfolioType: '',
    title: '',
    url: '',
    ...entry
  };
}

function createAwardEntry(entry = {}) {
  return {
    clientId: entry.clientId || createStructuredEntryId('award'),
    awardName: '',
    awardingOrganization: '',
    awardYear: '',
    awardDescription: '',
    ...entry
  };
}

function createTrainingEntry(entry = {}) {
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

function normalizeYearInput(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 4);
}

function normalizeYearMonthInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 6);

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, 4)}.${digits.slice(4)}`;
}

function getLanguageTestOptions(languageName, currentValue = '') {
  const baseOptions = (languageTestOptionsByLanguage[languageName] || languageTestOptionsByLanguage.기타 || []).map((option) => ({
    value: option,
    label: option
  }));

  if (currentValue && !baseOptions.some((option) => option.value === currentValue)) {
    return [{ value: currentValue, label: currentValue }, ...baseOptions];
  }

  return baseOptions;
}

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
  const educationEntries = Array.isArray(profile.educationEntries) ? profile.educationEntries : [];
  const careerEntries = Array.isArray(profile.careerEntries) ? profile.careerEntries : [];
  const projectEntries = Array.isArray(profile.projectEntries) ? profile.projectEntries : [];

  const updateEducationEntries = (nextEntries) => onChange('educationEntries', nextEntries);
  const updateCareerEntries = (nextEntries) => onChange('careerEntries', nextEntries);
  const updateProjectEntries = (nextEntries) => onChange('projectEntries', nextEntries);

  const addEducationEntry = () => updateEducationEntries([...educationEntries, createEducationEntry()]);
  const addCareerEntry = () => updateCareerEntries([...careerEntries, createCareerEntry()]);
  const addProjectEntry = () => updateProjectEntries([...projectEntries, createProjectEntry()]);

  const updateEducationEntry = (entryIndex, field, value) => {
    updateEducationEntries(
      educationEntries.map((entry, index) =>
        index === entryIndex
          ? {
            ...entry,
            [field]: field === 'admissionYear' || field === 'graduationYear' ? normalizeYearInput(value) : value
          }
          : entry
      )
    );
  };

  const updateCareerEntry = (entryIndex, field, value) => {
    updateCareerEntries(
      careerEntries.map((entry, index) =>
        index === entryIndex
          ? {
            ...entry,
            [field]: field === 'startYearMonth' || field === 'endYearMonth' ? normalizeYearMonthInput(value) : value
          }
          : entry
      )
    );
  };

  const updateProjectEntry = (entryIndex, field, value) => {
    updateProjectEntries(
      projectEntries.map((entry, index) =>
        index === entryIndex
          ? {
            ...entry,
            [field]: field === 'startYearMonth' || field === 'endYearMonth' ? normalizeYearMonthInput(value) : value
          }
          : entry
      )
    );
  };

  return (
    <>
      <RepeatSectionHeader
        title="학력"
        description="최신 또는 대표 학력부터 순서대로 입력해 주세요."
        actionLabel="학력 추가"
        onAction={addEducationEntry}
      />
      {educationEntries.length ? (
        <div className="profile-repeat-list">
          {educationEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `education-${index}`}
              onRemove={() => updateEducationEntries(educationEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--education">
                <Field label="학교구분" required>
                  <SelectBox
                    value={entry.schoolType}
                    onChange={(value) => updateEducationEntry(index, 'schoolType', value)}
                    options={structuredEducationTypeOptions}
                  />
                </Field>
                <Field label="학교명">
                  <Input value={entry.schoolName} onChange={(value) => updateEducationEntry(index, 'schoolName', value)} />
                </Field>
                <Field label="입학연도">
                  <Input
                    value={entry.admissionYear}
                    onChange={(value) => updateEducationEntry(index, 'admissionYear', value)}
                    placeholder="YYYY"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="졸업연도">
                  <Input
                    value={entry.graduationYear}
                    onChange={(value) => updateEducationEntry(index, 'graduationYear', value)}
                    placeholder="YYYY"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="졸업상태" required>
                  <SelectBox
                    value={entry.graduationStatus}
                    onChange={(value) => updateEducationEntry(index, 'graduationStatus', value)}
                    options={graduationStatusOptions}
                  />
                </Field>
              </div>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="학력 정보를 추가하면 최종 학력과 졸업 상태가 자동으로 정리됩니다." />
      )}

      <Divider />
      <RepeatSectionHeader
        title="경력"
        description="회사명, 재직 기간, 담당 업무를 중심으로 실무 경험을 정리해 주세요."
        actionLabel="경력 추가"
        onAction={addCareerEntry}
      />
      {careerEntries.length ? (
        <div className="profile-repeat-list">
          {careerEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `career-${index}`}
              onRemove={() => updateCareerEntries(careerEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--career-entry">
                <Field label="회사명">
                  <Input value={entry.companyName} onChange={(value) => updateCareerEntry(index, 'companyName', value)} />
                </Field>
                <Field label="부서명">
                  <Input value={entry.departmentName} onChange={(value) => updateCareerEntry(index, 'departmentName', value)} />
                </Field>
                <Field label="입사연월">
                  <Input
                    value={entry.startYearMonth}
                    onChange={(value) => updateCareerEntry(index, 'startYearMonth', value)}
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="퇴사연월">
                  <Input
                    value={entry.endYearMonth}
                    onChange={(value) => updateCareerEntry(index, 'endYearMonth', value)}
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field label="담당업무">
                <TextArea
                  value={entry.responsibilities}
                  onChange={(value) => updateCareerEntry(index, 'responsibilities', value)}
                  rows={4}
                  placeholder="담당한 업무, 성과, 사용한 도구를 중심으로 작성해 주세요."
                />
              </Field>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="사무보조, 생산, 서비스 등 실제 근무 경험이 있다면 회사별로 나눠 적어 주세요." />
      )}

      <Divider />
      <RepeatSectionHeader
        title="프로젝트 경험"
        description="부트캠프, 공모전, 해커톤, 개인 프로젝트 등 직무와 연결되는 경험을 작성해 주세요."
        actionLabel="프로젝트 추가"
        onAction={addProjectEntry}
      />
      {projectEntries.length ? (
        <div className="profile-repeat-list">
          {projectEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `project-${index}`}
              onRemove={() => updateProjectEntries(projectEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--project">
                <Field label="활동유형">
                  <SelectBox
                    value={entry.projectType}
                    onChange={(value) => updateProjectEntry(index, 'projectType', value)}
                    options={structuredProjectTypeOptions}
                  />
                </Field>
                <Field label="활동명">
                  <Input value={entry.projectName} onChange={(value) => updateProjectEntry(index, 'projectName', value)} />
                </Field>
                <Field label="시작연월">
                  <Input
                    value={entry.startYearMonth}
                    onChange={(value) => updateProjectEntry(index, 'startYearMonth', value)}
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="종료연월">
                  <Input
                    value={entry.endYearMonth}
                    onChange={(value) => updateProjectEntry(index, 'endYearMonth', value)}
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field label="활동 내용">
                <TextArea
                  value={entry.projectDescription}
                  onChange={(value) => updateProjectEntry(index, 'projectDescription', value)}
                  rows={4}
                  placeholder="목표, 맡은 역할, 결과를 간단히 정리해 주세요."
                />
              </Field>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="실무 경력이 적다면 프로젝트 경험이 직무 적합성을 보여주는 핵심 정보가 됩니다." />
      )}

      <Divider />
      <Field label="공백 기간 사유">
        <TextArea
          value={profile.careerGapReason}
          onChange={(value) => onChange('careerGapReason', value)}
          rows={4}
          placeholder="필요한 경우에만 간단히 작성해 주세요."
        />
      </Field>
    </>
  );
}

function JobPanel({ profile, onChange }) {
  const options = useSignupOptions();
  const selectedJobs = useMemo(
    () => resolveSelectedJobValues(profile.targetJob, options.jobCategories),
    [options.jobCategories, profile.targetJob]
  );
  const certificationEntries = Array.isArray(profile.certificationEntries) ? profile.certificationEntries : [];
  const languageEntries = Array.isArray(profile.languageEntries) ? profile.languageEntries : [];
  const portfolioEntries = Array.isArray(profile.portfolioEntries) ? profile.portfolioEntries : [];
  const awardEntries = Array.isArray(profile.awardEntries) ? profile.awardEntries : [];
  const trainingEntries = Array.isArray(profile.trainingEntries) ? profile.trainingEntries : [];

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

  const updateCertificationEntries = (nextEntries) => onChange('certificationEntries', nextEntries);
  const updateLanguageEntries = (nextEntries) => onChange('languageEntries', nextEntries);
  const updatePortfolioEntries = (nextEntries) => onChange('portfolioEntries', nextEntries);
  const updateAwardEntries = (nextEntries) => onChange('awardEntries', nextEntries);
  const updateTrainingEntries = (nextEntries) => onChange('trainingEntries', nextEntries);

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
      <RepeatSectionHeader title="자격증" actionLabel="자격증 추가" onAction={() => updateCertificationEntries([...certificationEntries, createCertificationEntry()])} />
      {certificationEntries.length ? (
        <div className="profile-repeat-list">
          {certificationEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `certification-${index}`}
              onRemove={() => updateCertificationEntries(certificationEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--certificate">
                <Field label="발행처">
                  <SelectBox
                    value={entry.issuer}
                    onChange={(value) =>
                      updateCertificationEntries(
                        certificationEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, issuer: value } : item
                        )
                      )
                    }
                    options={certificationIssuerOptions}
                  />
                </Field>
                <Field label="자격증명">
                  <Input
                    value={entry.certificationName}
                    onChange={(value) =>
                      updateCertificationEntries(
                        certificationEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, certificationName: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="취득년월">
                  <Input
                    value={entry.acquiredYearMonth}
                    onChange={(value) =>
                      updateCertificationEntries(
                        certificationEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, acquiredYearMonth: normalizeYearMonthInput(value) } : item
                        )
                      )
                    }
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="보유 자격증을 최신순으로 추가해 주세요." />
      )}

      <Divider />
      <RepeatSectionHeader title="어학" actionLabel="어학 추가" onAction={() => updateLanguageEntries([...languageEntries, createLanguageEntry()])} />
      {languageEntries.length ? (
        <div className="profile-repeat-list">
          {languageEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `language-${index}`}
              onRemove={() => updateLanguageEntries(languageEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--language">
                <Field label="외국어명">
                  <SelectBox
                    value={entry.languageName}
                    onChange={(value) =>
                      updateLanguageEntries(
                        languageEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, languageName: value, testName: '' } : item
                        )
                      )
                    }
                    options={languageOptions}
                  />
                </Field>
                <Field label="시험명">
                  <SelectBox
                    value={entry.testName}
                    onChange={(value) =>
                      updateLanguageEntries(
                        languageEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, testName: value } : item
                        )
                      )
                    }
                    options={getLanguageTestOptions(entry.languageName, entry.testName)}
                  />
                </Field>
                <Field label="급수 / 점수">
                  <Input
                    value={entry.scoreOrGrade}
                    onChange={(value) =>
                      updateLanguageEntries(
                        languageEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, scoreOrGrade: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="취득년월">
                  <Input
                    value={entry.acquiredYearMonth}
                    onChange={(value) =>
                      updateLanguageEntries(
                        languageEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, acquiredYearMonth: normalizeYearMonthInput(value) } : item
                        )
                      )
                    }
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
              </div>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="어학 점수나 회화 자격이 있다면 함께 입력해 주세요." />
      )}

      <Divider />
      <RepeatSectionHeader title="포트폴리오 및 URL" actionLabel="링크 추가" onAction={() => updatePortfolioEntries([...portfolioEntries, createPortfolioEntry()])} />
      {portfolioEntries.length ? (
        <div className="profile-repeat-list">
          {portfolioEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `portfolio-${index}`}
              onRemove={() => updatePortfolioEntries(portfolioEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--portfolio">
                <Field label="유형">
                  <SelectBox
                    value={entry.portfolioType}
                    onChange={(value) =>
                      updatePortfolioEntries(
                        portfolioEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, portfolioType: value } : item
                        )
                      )
                    }
                    options={portfolioTypeOptions}
                  />
                </Field>
                <Field label="제목">
                  <Input
                    value={entry.title}
                    onChange={(value) =>
                      updatePortfolioEntries(
                        portfolioEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: value } : item
                        )
                      )
                    }
                    placeholder="예) GitHub 메인 저장소"
                  />
                </Field>
                <Field label="URL">
                  <Input
                    value={entry.url}
                    onChange={(value) =>
                      updatePortfolioEntries(
                        portfolioEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, url: value } : item
                        )
                      )
                    }
                    placeholder="https://"
                  />
                </Field>
              </div>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="GitHub, Notion, 개인 웹사이트 등 직무를 보여줄 수 있는 링크를 추가해 주세요." />
      )}

      <Divider />
      <RepeatSectionHeader title="수상" actionLabel="수상 추가" onAction={() => updateAwardEntries([...awardEntries, createAwardEntry()])} />
      {awardEntries.length ? (
        <div className="profile-repeat-list">
          {awardEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `award-${index}`}
              onRemove={() => updateAwardEntries(awardEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--award">
                <Field label="수상명">
                  <Input
                    value={entry.awardName}
                    onChange={(value) =>
                      updateAwardEntries(
                        awardEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, awardName: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="수여기관">
                  <Input
                    value={entry.awardingOrganization}
                    onChange={(value) =>
                      updateAwardEntries(
                        awardEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, awardingOrganization: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="수상연도">
                  <Input
                    value={entry.awardYear}
                    onChange={(value) =>
                      updateAwardEntries(
                        awardEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, awardYear: normalizeYearInput(value) } : item
                        )
                      )
                    }
                    placeholder="YYYY"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field label="수상 내용">
                <TextArea
                  value={entry.awardDescription}
                  onChange={(value) =>
                    updateAwardEntries(
                      awardEntries.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, awardDescription: value } : item
                      )
                    )
                  }
                  rows={4}
                  placeholder="수상 배경, 역할, 성과를 간단히 작성해 주세요."
                />
              </Field>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="직무 연관 수상이나 공모전 실적이 있다면 추가해 주세요." />
      )}

      <Divider />
      <RepeatSectionHeader title="교육" actionLabel="교육 추가" onAction={() => updateTrainingEntries([...trainingEntries, createTrainingEntry()])} />
      {trainingEntries.length ? (
        <div className="profile-repeat-list">
          {trainingEntries.map((entry, index) => (
            <RepeatCard
              key={entry.clientId || `training-${index}`}
              onRemove={() => updateTrainingEntries(trainingEntries.filter((_, targetIndex) => targetIndex !== index))}
            >
              <div className="profile-repeat-grid profile-repeat-grid--training">
                <Field label="교육구분">
                  <SelectBox
                    value={entry.trainingType}
                    onChange={(value) =>
                      updateTrainingEntries(
                        trainingEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, trainingType: value } : item
                        )
                      )
                    }
                    options={trainingTypeOptions}
                  />
                </Field>
                <Field label="교육명">
                  <Input
                    value={entry.trainingName}
                    onChange={(value) =>
                      updateTrainingEntries(
                        trainingEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, trainingName: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="교육기관">
                  <Input
                    value={entry.institutionName}
                    onChange={(value) =>
                      updateTrainingEntries(
                        trainingEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, institutionName: value } : item
                        )
                      )
                    }
                  />
                </Field>
                <Field label="시작년월">
                  <Input
                    value={entry.startYearMonth}
                    onChange={(value) =>
                      updateTrainingEntries(
                        trainingEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, startYearMonth: normalizeYearMonthInput(value) } : item
                        )
                      )
                    }
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="종료년월">
                  <Input
                    value={entry.endYearMonth}
                    onChange={(value) =>
                      updateTrainingEntries(
                        trainingEntries.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, endYearMonth: normalizeYearMonthInput(value) } : item
                        )
                      )
                    }
                    placeholder="YYYY.MM"
                    inputMode="numeric"
                  />
                </Field>
              </div>
              <Field label="교육 내용">
                <TextArea
                  value={entry.trainingDescription}
                  onChange={(value) =>
                    updateTrainingEntries(
                      trainingEntries.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, trainingDescription: value } : item
                      )
                    )
                  }
                  rows={4}
                  placeholder="핵심 커리큘럼이나 직무 연관 포인트를 작성해 주세요."
                />
              </Field>
            </RepeatCard>
          ))}
        </div>
      ) : (
        <RepeatEmptyState message="직무 연관 교육 이수 내역을 입력해 주세요." />
      )}
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
        <Field label="장애 유형" required={profile.sensitiveInfoConsentYn === true}>
          <SelectBox value={profile.disabilityType} onChange={(value) => onChange('disabilityType', value)} options={disabilityTypeOptions} />
        </Field>
        <Field label="장애 정도" required={profile.sensitiveInfoConsentYn === true}>
          <SelectBox
            value={profile.disabilitySeverity}
            onChange={(value) => onChange('disabilitySeverity', value)}
            options={disabilitySeverityOptions}
          />
        </Field>
        <Field label="장애 등록 여부" required={profile.sensitiveInfoConsentYn === true}>
          <RadioGroup
            options={booleanOptions}
            selected={profile.disabilityRegisteredYn}
            onChange={(value) => onChange('disabilityRegisteredYn', value)}
          />
        </Field>
      </div>
      <Divider />
      <div className="profile-sensitive-consent">
        <label className="profile-sensitive-consent__toggle">
          <input
            type="checkbox"
            checked={profile.sensitiveInfoConsentYn === true}
            onChange={(event) => onChange('sensitiveInfoConsentYn', event.target.checked)}
          />
          <span aria-hidden="true" />
          선택 민감정보 수집·이용에 동의합니다.
        </label>
        <div className="profile-sensitive-consent__detail" role="note">
          <p>동의를 해제하고 저장하면 기존 장애·지원 관련 정보가 삭제됩니다.</p>
          <ol>
            {sensitiveConsentDetails.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ol>
        </div>
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

function RepeatSectionHeader({ title, description, actionLabel, onAction }) {
  return (
    <div className="profile-repeat-section__header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <button type="button" className="profile-repeat-section__add-button" onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function RepeatCard({ title, subtitle, onRemove, children }) {
  return (
    <section className="profile-repeat-card">
      {title || subtitle ? (
        <div className="profile-repeat-card__head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="profile-repeat-card__body">{children}</div>
      <div className="profile-repeat-card__footer">
        <button type="button" className="profile-repeat-card__remove-button" onClick={onRemove}>
          삭제
        </button>
      </div>
    </section>
  );
}

function RepeatEmptyState({ message }) {
  return <div className="profile-repeat-empty">{message}</div>;
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
