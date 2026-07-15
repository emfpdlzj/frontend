import basicProfile from '../../assets/profile/basic_profile.png';
import { BirthDateField } from '../common/BirthDateField';
import { ProfileJobPanel } from './ProfileJobPanel';
import {
  CheckboxRow,
  ChipEditor,
  Divider,
  Field,
  Input,
  PillGroup,
  RadioGroup,
  RepeatCard,
  RepeatEmptyState,
  RepeatSectionHeader,
  SelectBox,
  TextArea
} from './ProfileFormControls';
import {
  booleanOptions,
  disabilitySeverityOptions,
  disabilityTypeOptions,
  genderOptions,
  graduationStatusOptions,
  militaryServiceOptions,
  sensitiveConsentDetails,
  structuredEducationTypeOptions,
  structuredProjectTypeOptions,
  workAvailabilityOptions,
  workTimePreferenceOptions,
  workTypeOptions
} from '../../constants/profileOptions';
import {
  createCareerEntry,
  createEducationEntry,
  createProjectEntry,
  normalizeYearInput,
  normalizeYearMonthInput
} from '../../utils/profileFormEntries';

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
    job: <ProfileJobPanel {...props} />,
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
