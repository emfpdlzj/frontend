import { useEffect, useMemo, useState } from 'react';
import { useSignupOptions } from '../../hooks/useSignupOptions';
import {
  certificationIssuerOptions,
  languageOptions,
  MAX_JOB_SELECTIONS,
  portfolioTypeOptions,
  trainingTypeOptions
} from '../../constants/profileOptions';
import {
  createAwardEntry,
  createCertificationEntry,
  createLanguageEntry,
  createPortfolioEntry,
  createTrainingEntry,
  getLanguageTestOptions,
  normalizeYearInput,
  normalizeYearMonthInput
} from '../../utils/profileFormEntries';
import {
  ChipEditor,
  Divider,
  Field,
  Input,
  RepeatCard,
  RepeatEmptyState,
  RepeatSectionHeader,
  RequiredMark,
  SelectBox,
  TextArea
} from './ProfileFormControls';

const text = (value) => String(value ?? '').trim();

export function ProfileJobPanel({ profile, onChange }) {
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
