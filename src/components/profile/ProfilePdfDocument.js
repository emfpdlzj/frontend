const genderLabelMap = Object.freeze({
  MALE: '남성',
  FEMALE: '여성',
  OTHER: '기타',
  NOT_DISCLOSED: '선택 안 함'
});

const educationTypeLabelMap = Object.freeze({
  HIGH_SCHOOL: '고등학교',
  COLLEGE_2_3: '전문대(2,3년제)',
  COLLEGE_4: '대학교(4년제)',
  MASTER: '대학원(석사)',
  DOCTOR: '대학원(박사)',
  BOOTCAMP: '부트캠프',
  OTHER: '기타',
  HIGH_SCHOOL_OR_BELOW: '고졸 이하',
  COLLEGE: '전문대졸',
  BACHELOR: '대졸'
});

const graduationStatusLabelMap = Object.freeze({
  GRADUATED: '졸업',
  EXPECTED: '졸업예정',
  ENROLLED: '재학',
  COMPLETED: '수료',
  DROPPED_OUT: '중퇴',
  OTHER: '기타'
});

const projectTypeLabelMap = Object.freeze({
  COMPANY_PROJECT: '실무 프로젝트',
  BOOTCAMP: '부트캠프',
  FREELANCE: '외주·프리랜서',
  HACKATHON: '해커톤',
  CONTEST: '공모전',
  CLUB: '동아리',
  VOLUNTEER: '봉사활동',
  PERSONAL: '개인 프로젝트',
  OTHER: '기타'
});

const disabilityTypeLabelMap = Object.freeze({
  PHYSICAL: '지체장애',
  BRAIN_LESION: '뇌병변장애',
  VISUAL: '시각장애',
  HEARING: '청각장애',
  SPEECH: '언어장애',
  INTELLECTUAL: '지적장애',
  AUTISM: '자폐성장애',
  MENTAL: '정신장애',
  KIDNEY: '신장장애',
  HEART: '심장장애',
  RESPIRATORY: '호흡기장애',
  LIVER: '간장애',
  FACE: '안면장애',
  STOMA_URINARY: '장루·요루장애',
  EPILEPSY: '뇌전증장애',
  OTHER: '기타'
});

const disabilitySeverityLabelMap = Object.freeze({
  SEVERE: '중증',
  MODERATE: '중등도',
  MILD: '경증'
});

const workAvailabilityLabelMap = Object.freeze({
  IMMEDIATE: '즉시 가능',
  WITHIN_TWO_WEEKS: '2주 이내',
  WITHIN_ONE_MONTH: '1개월 이내',
  NEGOTIABLE: '협의 가능'
});

const workTypeLabelMap = Object.freeze({
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INDEFINITE_CONTRACT: '무기계약직',
  PART_TIME: '시간제',
  DAILY: '일용직',
  INTERN: '인턴',
  DISPATCH_OUTSOURCING: '파견·용역',
  REMOTE: '재택·원격'
});

const workTimePreferenceLabelMap = Object.freeze({
  DAYTIME: '주간',
  MORNING: '오전',
  AFTERNOON: '오후',
  EVENING: '야간',
  FLEXIBLE: '탄력근무',
  NEGOTIABLE: '협의 가능'
});

const militaryServiceLabelMap = Object.freeze({
  COMPLETED: '군필',
  EXEMPTED: '면제',
  NOT_APPLICABLE: '해당 없음',
  SERVING: '복무 중'
});

function text(value) {
  return String(value ?? '').trim();
}

function hasValue(value) {
  if (typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasValue(item));
  }

  return text(value).length > 0;
}

function hasEntryContent(entry) {
  return Object.entries(entry || {}).some(([key, value]) => key !== 'clientId' && hasValue(value));
}

function formatMappedValue(value, labelMap) {
  const normalized = text(value);
  if (!normalized) {
    return '';
  }

  return labelMap[normalized] || normalized;
}

function formatBoolean(value, labels = { yes: '예', no: '아니오', unset: '' }) {
  if (value === true) {
    return labels.yes;
  }

  if (value === false) {
    return labels.no;
  }

  return labels.unset;
}

function formatBirthDate(value) {
  const normalized = text(value);
  if (!normalized) {
    return '';
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized.replaceAll('-', '.') : normalized;
}

function formatYearRange(start, end) {
  const startText = text(start);
  const endText = text(end);

  if (!startText && !endText) {
    return '';
  }

  if (startText && endText) {
    return `${startText} - ${endText}`;
  }

  return startText || endText;
}

function formatArray(values, labelMap) {
  if (!Array.isArray(values) || !values.length) {
    return '';
  }

  return values
    .map((value) => formatMappedValue(value, labelMap))
    .filter(Boolean)
    .join(', ');
}

function formatSalary(value) {
  const normalized = text(value);
  return normalized ? `${normalized}만원` : '';
}

function formatUrl(value) {
  const normalized = text(value);
  if (!normalized) {
    return '';
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}

function buildItems(items) {
  return items.filter((item) => hasValue(item.value));
}

function buildEntrySections(entries, renderEntry) {
  return Array.isArray(entries) ? entries.filter(hasEntryContent).map(renderEntry) : [];
}

export function ProfilePdfDocument({ profile }) {
  const basicItems = buildItems([
    { label: '프로필 이름', value: profile.profileName },
    { label: '이름', value: profile.fullName },
    { label: '연락처', value: profile.contactPhone },
    { label: '이메일', value: profile.contactEmail },
    { label: '생년월일', value: formatBirthDate(profile.birthDate) },
    { label: '성별', value: formatMappedValue(profile.genderType, genderLabelMap) },
    { label: '연령대', value: profile.ageGroup },
    { label: '거주지 상세 주소', value: profile.detailAddress },
    { label: '비상 연락처', value: profile.emergencyContact }
  ]);

  const educationSummaryItems = buildItems([
    { label: '최종 학력', value: formatMappedValue(profile.highestEducation || profile.educationSummary, educationTypeLabelMap) },
    { label: '졸업 상태', value: formatMappedValue(profile.graduationStatus, graduationStatusLabelMap) },
    { label: '주요 경력', value: profile.majorCareer || profile.careerSummary },
    { label: '공백 기간 사유', value: profile.careerGapReason }
  ]);

  const jobSummaryItems = buildItems([
    { label: '지원 직무', value: profile.targetJob },
    { label: '보유 기술 / 역량', value: Array.isArray(profile.skills) ? profile.skills.join(', ') : '' }
  ]);

  const disabilityItems = buildItems([
    { label: '장애 유형', value: formatMappedValue(profile.disabilityType, disabilityTypeLabelMap) },
    { label: '장애 정도', value: formatMappedValue(profile.disabilitySeverity, disabilitySeverityLabelMap) },
    { label: '장애 등록 여부', value: formatBoolean(profile.disabilityRegisteredYn, { yes: '예', no: '아니오', unset: '미선택' }) },
    { label: '보조기기', value: profile.assistiveDevices },
    { label: '필요 지원 항목', value: Array.isArray(profile.requiredSupports) ? profile.requiredSupports.join(', ') : '' }
  ]);

  const workItems = buildItems([
    { label: '근무 가능 시점', value: formatMappedValue(profile.workAvailability, workAvailabilityLabelMap) },
    { label: '근무 형태 가능 범위', value: formatArray(profile.workTypes, workTypeLabelMap) },
    { label: '희망 연봉', value: formatSalary(profile.expectedSalary) },
    { label: '근무 시간 선호', value: formatMappedValue(profile.workTimePreference, workTimePreferenceLabelMap) },
    { label: '재택근무 가능 여부', value: formatBoolean(profile.remoteAvailableYn, { yes: '가능', no: '불가능', unset: '협의 가능' }) },
    { label: '통근 범위', value: profile.commuteRange }
  ]);

  const introBlocks = buildItems([
    { label: '자기소개', value: profile.selfIntroduction },
    { label: '지원동기', value: profile.motivation },
    { label: '직무 적합성', value: profile.jobFitDescription },
    { label: '커리어 목표', value: profile.careerGoal },
    { label: '개인 강점 / 약점', value: profile.strengthsWeaknesses }
  ]);

  const extraItems = buildItems([
    { label: '병역 여부', value: formatMappedValue(profile.militaryService, militaryServiceLabelMap) },
    { label: '국가유공자 여부', value: formatBoolean(profile.patrioticVeteranYn, { yes: '예', no: '아니오', unset: '미선택' }) }
  ]);

  const educationEntries = buildEntrySections(profile.educationEntries, (entry, index) => ({
    key: entry.clientId || `education-${index}`,
    title: entry.schoolName || formatMappedValue(entry.schoolType, educationTypeLabelMap) || `학력 ${index + 1}`,
    subtitle: buildItems([
      { label: '학교구분', value: formatMappedValue(entry.schoolType, educationTypeLabelMap) },
      { label: '입학연도', value: text(entry.admissionYear) },
      { label: '졸업연도', value: text(entry.graduationYear) },
      { label: '졸업상태', value: formatMappedValue(entry.graduationStatus, graduationStatusLabelMap) }
    ])
  }));

  const careerEntries = buildEntrySections(profile.careerEntries, (entry, index) => ({
    key: entry.clientId || `career-${index}`,
    title: entry.companyName || `경력 ${index + 1}`,
    subtitle: buildItems([
      { label: '부서명', value: entry.departmentName },
      { label: '재직기간', value: formatYearRange(entry.startYearMonth, entry.endYearMonth) }
    ]),
    body: entry.responsibilities
  }));

  const projectEntries = buildEntrySections(profile.projectEntries, (entry, index) => ({
    key: entry.clientId || `project-${index}`,
    title: entry.projectName || `프로젝트 ${index + 1}`,
    subtitle: buildItems([
      { label: '활동유형', value: formatMappedValue(entry.projectType, projectTypeLabelMap) },
      { label: '기간', value: formatYearRange(entry.startYearMonth, entry.endYearMonth) }
    ]),
    body: entry.projectDescription
  }));

  const certificationEntries = buildEntrySections(profile.certificationEntries, (entry, index) => ({
    key: entry.clientId || `certification-${index}`,
    title: entry.certificationName || `자격증 ${index + 1}`,
    subtitle: buildItems([
      { label: '발행처', value: entry.issuer },
      { label: '취득년월', value: entry.acquiredYearMonth }
    ])
  }));

  const languageEntries = buildEntrySections(profile.languageEntries, (entry, index) => ({
    key: entry.clientId || `language-${index}`,
    title: entry.languageName || `어학 ${index + 1}`,
    subtitle: buildItems([
      { label: '시험명', value: entry.testName },
      { label: '급수 / 점수', value: entry.scoreOrGrade },
      { label: '취득년월', value: entry.acquiredYearMonth }
    ])
  }));

  const portfolioEntries = buildEntrySections(profile.portfolioEntries, (entry, index) => ({
    key: entry.clientId || `portfolio-${index}`,
    title: entry.title || entry.url || `링크 ${index + 1}`,
    subtitle: buildItems([
      { label: '유형', value: entry.portfolioType },
      { label: 'URL', value: entry.url }
    ])
  }));

  const awardEntries = buildEntrySections(profile.awardEntries, (entry, index) => ({
    key: entry.clientId || `award-${index}`,
    title: entry.awardName || `수상 ${index + 1}`,
    subtitle: buildItems([
      { label: '수여기관', value: entry.awardingOrganization },
      { label: '수상연도', value: entry.awardYear }
    ]),
    body: entry.awardDescription
  }));

  const trainingEntries = buildEntrySections(profile.trainingEntries, (entry, index) => ({
    key: entry.clientId || `training-${index}`,
    title: entry.trainingName || `교육 ${index + 1}`,
    subtitle: buildItems([
      { label: '교육구분', value: entry.trainingType },
      { label: '교육기관', value: entry.institutionName },
      { label: '기간', value: formatYearRange(entry.startYearMonth, entry.endYearMonth) }
    ]),
    body: entry.trainingDescription
  }));

  return (
    <article className="profile-pdf-document">
      <header className="profile-pdf-document__hero">
        <div>
          <p className="profile-pdf-document__eyebrow">BridgeWork Profile</p>
          <h1>{text(profile.profileName) || text(profile.fullName) || '브릿지워크 프로필'}</h1>
          <p className="profile-pdf-document__subtitle">
            브릿지워크 프로필 입력 내용을 A4 문서 형식으로 정리한 PDF 미리보기입니다.
          </p>
        </div>
        <div className="profile-pdf-document__hero-meta">
          {hasValue(profile.fullName) ? <span>{profile.fullName}</span> : null}
          {hasValue(profile.contactEmail) ? <span>{profile.contactEmail}</span> : null}
          {hasValue(profile.contactPhone) ? <span>{profile.contactPhone}</span> : null}
        </div>
      </header>

      <ProfilePdfSection title="기본 정보">
        <ProfilePdfKeyValueGrid items={basicItems} emptyMessage="입력된 기본 정보가 없습니다." />
      </ProfilePdfSection>

      <ProfilePdfSection title="학력 / 경력">
        <ProfilePdfKeyValueGrid items={educationSummaryItems} />
        <ProfilePdfEntryGroup title="학력" entries={educationEntries} emptyMessage="입력된 학력 정보가 없습니다." />
        <ProfilePdfEntryGroup title="경력" entries={careerEntries} emptyMessage="입력된 경력 정보가 없습니다." />
        <ProfilePdfEntryGroup title="프로젝트 경험" entries={projectEntries} emptyMessage="입력된 프로젝트 경험이 없습니다." />
      </ProfilePdfSection>

      <ProfilePdfSection title="직무">
        <ProfilePdfKeyValueGrid items={jobSummaryItems} emptyMessage="입력된 직무 정보가 없습니다." />
        <ProfilePdfEntryGroup title="자격증" entries={certificationEntries} emptyMessage="입력된 자격증 정보가 없습니다." />
        <ProfilePdfEntryGroup title="어학" entries={languageEntries} emptyMessage="입력된 어학 정보가 없습니다." />
        <ProfilePdfEntryGroup title="포트폴리오 및 URL" entries={portfolioEntries} emptyMessage="입력된 포트폴리오 및 URL 정보가 없습니다." />
        <ProfilePdfEntryGroup title="수상" entries={awardEntries} emptyMessage="입력된 수상 정보가 없습니다." />
        <ProfilePdfEntryGroup title="교육" entries={trainingEntries} emptyMessage="입력된 교육 정보가 없습니다." />
      </ProfilePdfSection>

      <ProfilePdfSection title="장애">
        <ProfilePdfKeyValueGrid items={disabilityItems} emptyMessage="입력된 장애 정보가 없습니다." />
        <ProfilePdfNarrative label="상세 장애 설명" value={profile.disabilityDescription} />
        <ProfilePdfNarrative label="근무 시 필요한 지원 사항" value={profile.workSupportRequirements} />
      </ProfilePdfSection>

      <ProfilePdfSection title="근무 조건">
        <ProfilePdfKeyValueGrid items={workItems} emptyMessage="입력된 근무 조건 정보가 없습니다." />
      </ProfilePdfSection>

      <ProfilePdfSection title="자기소개 및 지원 동기">
        <ProfilePdfNarrativeGroup items={introBlocks} emptyMessage="입력된 자기소개 및 지원 동기 정보가 없습니다." />
      </ProfilePdfSection>

      <ProfilePdfSection title="기타 정보">
        <ProfilePdfKeyValueGrid items={extraItems} emptyMessage="입력된 기타 정보가 없습니다." />
        <ProfilePdfNarrative label="SNS / 개인 웹사이트" value={profile.snsUrl} isLink />
      </ProfilePdfSection>
    </article>
  );
}

function ProfilePdfSection({ title, children }) {
  return (
    <section className="profile-pdf-section">
      <div className="profile-pdf-section__header">
        <h2>{title}</h2>
      </div>
      <div className="profile-pdf-section__body">{children}</div>
    </section>
  );
}

function ProfilePdfKeyValueGrid({ items, emptyMessage = '' }) {
  if (!items.length) {
    return emptyMessage ? <ProfilePdfEmpty message={emptyMessage} /> : null;
  }

  return (
    <dl className="profile-pdf-key-value-grid">
      {items.map((item) => (
        <div key={item.label} className="profile-pdf-key-value-grid__item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProfilePdfNarrativeGroup({ items, emptyMessage = '' }) {
  if (!items.length) {
    return emptyMessage ? <ProfilePdfEmpty message={emptyMessage} /> : null;
  }

  return (
    <div className="profile-pdf-narrative-group">
      {items.map((item) => (
        <ProfilePdfNarrative key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function ProfilePdfNarrative({ label, value, isLink = false }) {
  if (!hasValue(value)) {
    return null;
  }

  const normalizedUrl = isLink ? formatUrl(value) : '';

  return (
    <section className="profile-pdf-narrative">
      <h3>{label}</h3>
      {isLink ? (
        <a href={normalizedUrl} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <p>{value}</p>
      )}
    </section>
  );
}

function ProfilePdfEntryGroup({ title, entries, emptyMessage = '' }) {
  return (
    <div className="profile-pdf-entry-group">
      <h3>{title}</h3>
      {entries.length ? (
        <div className="profile-pdf-entry-group__list">
          {entries.map((entry) => (
            <article key={entry.key} className="profile-pdf-entry-card">
              <div className="profile-pdf-entry-card__header">
                <h4>{entry.title}</h4>
              </div>
              {entry.subtitle?.length ? (
                <dl className="profile-pdf-entry-card__meta">
                  {entry.subtitle.map((item) => (
                    <div key={`${entry.key}-${item.label}`}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.label === 'URL' ? (
                          <a href={formatUrl(item.value)} target="_blank" rel="noreferrer">
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {hasValue(entry.body) ? <p className="profile-pdf-entry-card__body">{entry.body}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <ProfilePdfEmpty message={emptyMessage} />
      )}
    </div>
  );
}

function ProfilePdfEmpty({ message }) {
  return <p className="profile-pdf-empty">{message}</p>;
}
