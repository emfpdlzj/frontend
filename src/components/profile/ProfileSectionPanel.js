import basicProfile from '../../assets/profile/basic_profile.png';
import calendarIcon from '../../assets/profile/calendar.png';
import searchIcon from '../../assets/profile/search.png';

export function ProfileSectionPanel({ activeSection }) {
  if (!activeSection) {
    return null;
  }

  const panels = {
    basic: <BasicInfoPanel />,
    education: <EducationPanel />,
    job: <JobPanel />,
    disability: <DisabilityPanel />,
    work: <WorkConditionPanel />,
    intro: <IntroPanel />,
    extra: <ExtraPanel />
  };

  return <section className={`profile-section-panel profile-section-panel--${activeSection}`}>{panels[activeSection]}</section>;
}

function BasicInfoPanel() {
  return (
    <>
      <div className="profile-basic-grid">
        <div className="profile-photo-field">
          <h2>프로필 사진</h2>
          <button type="button" className="profile-photo-button" aria-label="프로필 사진 변경">
            <img src={basicProfile} alt="" aria-hidden="true" />
          </button>
          <p>JPG, PNG / 5MB 이하</p>
        </div>
        <div className="profile-two-column">
          <Field label="이름" required>
            <Input value="홍길동" readOnly />
          </Field>
          <Field label="연락처" required>
            <Input value="010-1234-5678" readOnly />
          </Field>
          <Field label="성별" required>
            <PillGroup options={['남성', '여성', '선택 안 함']} selected="여성" />
          </Field>
          <Field label="이메일" required>
            <Input value="me@bridgework.kr" readOnly />
          </Field>
          <Field label="생년월일" required>
            <Input placeholder="YYYY.MM.DD" icon={calendarIcon} readOnly />
          </Field>
          <Field label="거주지 상세 주소" required hint="동·읍·면 단위까지 입력하면 통근 시간 계산이 정확해져요">
            <div className="profile-inline-input">
              <Input value="서울시 영등포구 OO로 12" readOnly />
              <button type="button">검색</button>
            </div>
          </Field>
          <Field label="비상 연락처">
            <Input placeholder="010-1234-5678" readOnly />
          </Field>
        </div>
      </div>
    </>
  );
}

function EducationPanel() {
  return (
    <>
      <PanelHeader title="학력" action="+ 학력 추가" />
      <div className="profile-form-grid profile-form-grid--education">
        <Field label="최종 학력" required>
          <Input value="한국대학교" icon={searchIcon} readOnly />
        </Field>
        <Field label="졸업 여부" required>
          <SelectBox value="졸업" />
        </Field>
      </div>
      <Divider />
      <PanelHeader title="경력" action="+ 경력 추가" />
      <div className="profile-form-grid profile-form-grid--career">
        <Field label="주요 경력" required>
          <Input value="(주)브릿지워크" readOnly />
        </Field>
        <Field label="직무" required>
          <Input value="백엔드 개발자" readOnly />
        </Field>
        <Field label="기간" required>
          <Input value="2021.03           ~   2024.06" icon={calendarIcon} readOnly />
        </Field>
        <button type="button" className="profile-row-delete">삭제</button>
      </div>
      <Divider />
      <OptionalStrip items={['세부 담당 업무', '프로젝트 경험', '공백 기간 사유']} />
    </>
  );
}

function JobPanel() {
  return (
    <>
      <h2>지원 직무</h2>
      <Field label="지원 직무" required width="narrow">
        <SelectBox placeholder="직무를 선택해주세요." />
      </Field>
      <Divider />
      <h2>보유 기술 / 역량 <RequiredMark /></h2>
      <div className="profile-skill-input">
        <span>기술 또는 역량을 검색 후 선택해주세요.</span>
        <button type="button">+ 직접 입력</button>
      </div>
      <Divider />
      <h2>지원 직무 (직무 관련 필수인 경우)</h2>
      <div className="profile-form-grid profile-form-grid--license">
        <Field label="자격증명" required>
          <Input placeholder="예) 정보처리기사" readOnly />
        </Field>
        <Field label="발급기관">
          <Input placeholder="예) 한국산업인력공단" readOnly />
        </Field>
        <Field label="취득일" required>
          <Input placeholder="YYYY.MM.DD" icon={calendarIcon} readOnly />
        </Field>
        <Field label="비고">
          <Input placeholder="선택 입력" readOnly />
        </Field>
        <button type="button" className="profile-row-delete">삭제</button>
      </div>
      <Divider />
      <OptionalStrip items={['포트폴리오', '수상 이력', '교육 이수 내역']} />
    </>
  );
}

function DisabilityPanel() {
  return (
    <>
      <h2>장애 여부</h2>
      <Field label="장애 여부" required>
        <PillGroup options={['있음', '없음']} selected="" />
      </Field>
      <div className="profile-form-grid profile-form-grid--disability">
        <Field label="장애 유형" required>
          <SelectBox placeholder="장애 유형을 선택해주세요." />
        </Field>
        <Field label="장애 등급 또는 정도" required>
          <SelectBox placeholder="선택해주세요." />
        </Field>
        <Field label="장애 등록 여부" required>
          <RadioGroup options={['등록됨', '등록 안됨']} selected="등록됨" />
        </Field>
      </div>
      <Divider />
      <h2>
        선택 정보 <span className="profile-section-caption">선택 정보는 선택 사항이며, 제공하지 않으셔도 불이익이 없습니다.</span>
      </h2>
      <div className="profile-disability-detail">
        <Field label="상세 장애 설명">
          <TextArea placeholder="상세 내용을 입력해주세요. (선택 사항)" rows={5} />
          <Counter max={500} />
        </Field>
        <div>
          <Field label="장애 등록 여부" required>
            <RadioGroup options={['사용함', '사용 안 함']} selected="사용함" />
          </Field>
          <Input placeholder="사용 중인 보조기기를 입력해주세요. (선택 사항)" readOnly />
          <p className="profile-help">예) 휠체어, 보청기, 점자 디스플레이 등</p>
        </div>
      </div>
      <Field label="근무 시 필요한 지원 사항" hint="복수 선택 가능">
        <CheckboxRow options={['휠체어 접근', '높이 조절 책상', '화면 확대/축소', '수어 통역', '문자 통역', '보정 지원', '점자 자료', '음성 지원', '기타 (직접 입력)']} />
        <Input placeholder="필요한 지원 사항을 직접 입력해주세요. (선택 사항)" readOnly />
      </Field>
    </>
  );
}

function WorkConditionPanel() {
  return (
    <>
      <h2>근무 조건</h2>
      <div className="profile-form-grid profile-form-grid--work-top">
        <Field label="근무 가능 여부" required>
          <RadioGroup options={['즉시 가능', '협의 가능']} selected="즉시 가능" />
        </Field>
        <Field label="근무 형태 가능 범위" required>
          <CheckboxRow options={['정규직', '계약직', '파트 타임', '인턴', '프리랜서']} selectedOptions={['인턴']} />
        </Field>
      </div>
      <Divider />
      <h2>
        선택 정보 <span className="profile-section-caption">선택 정보는 선택 사항이며, 제공하지 않으셔도 불이익이 없습니다.</span>
      </h2>
      <div className="profile-form-grid profile-form-grid--work">
        <Field label="희망 연봉" hint="연봉 범위를 입력하시면 더 정확한 매칭이 가능합니다.">
          <Input placeholder="예) 35,000,000" suffix="원" readOnly />
        </Field>
        <Field label="근무 시간 선호">
          <SelectBox placeholder="근무 시간 형태를 선택해주세요." />
        </Field>
        <Field label="재택근무 가능 여부">
          <RadioGroup options={['가능', '불가능', '협의 가능']} selected="가능" />
        </Field>
        <Field label="이동 가능 여부 (출퇴근 거리 등)">
          <SelectBox placeholder="이동 가능 범위를 선택해주세요." />
        </Field>
      </div>
      <Field label="추가 설명">
        <TextArea placeholder="근무 조건에 대해 추가로 설명하고 싶은 내용을 입력해주세요." rows={5} />
        <Counter max={500} />
      </Field>
    </>
  );
}

function IntroPanel() {
  return (
    <>
      <h2>자기소개 및 지원동기</h2>
      <div className="profile-form-grid profile-form-grid--intro">
        <Field label="자기소개" required hint="본인에 대해 자유롭게 소개해주세요.">
          <TextArea placeholder="자기소개 내용을 입력해주세요." rows={6} />
          <Counter max={1000} />
        </Field>
        <Field label="지원동기" required hint="해당 직무와 회사에 지원한 동기를 작성해주세요.">
          <TextArea placeholder="지원 동기 내용을 입력해주세요." rows={6} />
          <Counter max={1000} />
        </Field>
      </div>
      <Divider />
      <h2>
        선택 정보 <span className="profile-section-caption">선택 정보는 선택 사항이며, 제공하지 않으셔도 불이익이 없습니다.</span>
      </h2>
      <div className="profile-form-grid profile-form-grid--intro-optional">
        <Field label="직무 적합성" hint="본인의 경험, 역량이 해당 직무에 어떻게 적합한지 설명해주세요.">
          <TextArea placeholder="직무 적합성 내용을 입력해주세요." rows={5} />
          <Counter max={1000} />
        </Field>
        <Field label="커리어 목표" hint="입사 후 또는 장기적인 커리어 목표를 작성해주세요.">
          <TextArea placeholder="커리어 목표 내용을 입력해주세요." rows={5} />
          <Counter max={1000} />
        </Field>
        <Field label="개인 강점/약점" hint="본인의 강점과 약점을 구체적으로 작성해주세요.">
          <TextArea placeholder="강점과 약점 내용을 입력해주세요." rows={5} />
          <Counter max={1000} />
        </Field>
      </div>
    </>
  );
}

function ExtraPanel() {
  return (
    <>
      <h2>기타 정보</h2>
      <div className="profile-form-grid profile-form-grid--extra-top">
        <Field label="병역 여부">
          <SelectBox placeholder="선택해주세요." />
        </Field>
        <Field label="국가유공자 여부">
          <RadioGroup options={['해당없음', '해당', '비대상']} selected="해당없음" />
        </Field>
        <Field label="관련 사항" hint="국가유공자 해당 시 선택해주세요.">
          <SelectBox placeholder="선택해주세요." />
        </Field>
      </div>
      <Field label="추천인">
        <Input placeholder="추천인 이름 또는 연락처를 입력해주세요." readOnly />
      </Field>
      <Field label="SNS / 개인 웹사이트">
        <div className="profile-sns-list">
          {[0, 1].map((item) => (
            <div className="profile-sns-row" key={item}>
              <SelectBox placeholder="유형 선택" />
              <Input placeholder="URL을 입력해주세요." readOnly />
              <button type="button">삭제</button>
            </div>
          ))}
          <button type="button" className="profile-sns-add">+ 추가</button>
        </div>
      </Field>
    </>
  );
}

function PanelHeader({ title, action }) {
  return (
    <div className="profile-panel-header">
      <h2>{title}</h2>
      <button type="button">{action}</button>
    </div>
  );
}

function OptionalStrip({ items }) {
  return (
    <div>
      <h2>
        선택 정보 <span className="profile-section-caption">선택 정보는 선택 사항이며, 제공하지 않으셔도 불이익이 없습니다.</span>
      </h2>
      <div className="profile-optional-strip">
        {items.map((item) => (
          <button type="button" key={item}>
            <span>{item}</span>
            <strong aria-hidden="true">+</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, required = false, hint, children, width }) {
  return (
    <div className={`profile-field${width ? ` profile-field--${width}` : ''}`}>
      <span className="profile-label">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      {children}
      {hint ? <span className="profile-help">{hint}</span> : null}
    </div>
  );
}

function RequiredMark() {
  return <em aria-label="필수">*</em>;
}

function Input({ icon, suffix, ...props }) {
  return (
    <span className="profile-input-wrap">
      <input className="profile-input" {...props} />
      {suffix ? <span className="profile-input-suffix">{suffix}</span> : null}
      {icon ? <img src={icon} alt="" aria-hidden="true" /> : null}
    </span>
  );
}

function SelectBox({ value, placeholder }) {
  return (
    <button type="button" className="profile-select">
      <span>{value || placeholder}</span>
      <span aria-hidden="true" />
    </button>
  );
}

function TextArea({ rows, ...props }) {
  return <textarea className="profile-textarea" rows={rows} {...props} readOnly />;
}

function RadioGroup({ options, selected }) {
  return (
    <div className="profile-radio-row">
      {options.map((option) => (
        <label key={option} className="profile-radio">
          <input type="radio" checked={selected === option} readOnly />
          <span aria-hidden="true" />
          {option}
        </label>
      ))}
    </div>
  );
}

function CheckboxRow({ options, selectedOptions = [] }) {
  return (
    <div className="profile-checkbox-row">
      {options.map((option) => (
        <label key={option} className="profile-checkbox">
          <input type="checkbox" checked={selectedOptions.includes(option)} readOnly />
          <span aria-hidden="true" />
          {option}
        </label>
      ))}
    </div>
  );
}

function PillGroup({ options, selected }) {
  return (
    <div className="profile-pill-row">
      {options.map((option) => (
        <button key={option} type="button" className={`profile-pill${selected === option ? ' is-selected' : ''}`}>
          {option}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return <hr className="profile-divider" />;
}

function Counter({ max }) {
  return (
    <span className="profile-counter">
      <strong>0</strong>/{max.toLocaleString('ko-KR')}
    </span>
  );
}
