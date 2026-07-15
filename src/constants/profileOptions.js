export const fallbackText = '없음';
export const MAX_JOB_SELECTIONS = 5;

export const genderOptions = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
  { value: 'OTHER', label: '기타' },
  { value: 'NOT_DISCLOSED', label: '선택 안 함' }
];

export const graduationStatusOptions = [
  { value: 'GRADUATED', label: '졸업' },
  { value: 'EXPECTED', label: '졸업예정' },
  { value: 'ENROLLED', label: '재학' },
  { value: 'COMPLETED', label: '수료' },
  { value: 'DROPPED_OUT', label: '중퇴' },
  { value: 'OTHER', label: '기타' }
];

export const structuredEducationTypeOptions = [
  { value: 'HIGH_SCHOOL', label: '고등학교' },
  { value: 'COLLEGE_2_3', label: '전문대(2,3년제)' },
  { value: 'COLLEGE_4', label: '대학교(4년제)' },
  { value: 'MASTER', label: '대학원(석사)' },
  { value: 'DOCTOR', label: '대학원(박사)' },
  { value: 'BOOTCAMP', label: '부트캠프' },
  { value: 'OTHER', label: '기타' }
];

export const structuredProjectTypeOptions = [
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

export const certificationIssuerOptions = [
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

export const languageOptions = [
  { value: '영어', label: '영어' },
  { value: '일본어', label: '일본어' },
  { value: '중국어', label: '중국어' },
  { value: '스페인어', label: '스페인어' },
  { value: '프랑스어', label: '프랑스어' },
  { value: '독일어', label: '독일어' },
  { value: '베트남어', label: '베트남어' },
  { value: '기타', label: '기타' }
];

export const portfolioTypeOptions = [
  { value: '포트폴리오 사이트', label: '포트폴리오 사이트' },
  { value: 'GitHub', label: 'GitHub' },
  { value: 'Notion', label: 'Notion' },
  { value: 'Behance', label: 'Behance' },
  { value: '블로그', label: '블로그' },
  { value: 'PDF 링크', label: 'PDF 링크' },
  { value: '개인 웹사이트', label: '개인 웹사이트' },
  { value: '기타', label: '기타' }
];

export const trainingTypeOptions = [
  { value: '직업훈련', label: '직업훈련' },
  { value: '부트캠프', label: '부트캠프' },
  { value: '온라인 강의', label: '온라인 강의' },
  { value: '사내 교육', label: '사내 교육' },
  { value: '대학교·평생교육', label: '대학교·평생교육' },
  { value: '자격증 과정', label: '자격증 과정' },
  { value: '세미나·워크숍', label: '세미나·워크숍' },
  { value: '기타', label: '기타' }
];

export const languageTestOptionsByLanguage = {
  영어: ['TOEIC', 'TOEIC Speaking', 'OPIc', 'TOEFL iBT', 'IELTS', 'TEPS'],
  일본어: ['JLPT', 'JPT', 'SJPT', 'BJT'],
  중국어: ['HSK', 'HSKK', 'TSC'],
  스페인어: ['DELE', 'SIELE'],
  프랑스어: ['DELF', 'DALF', 'TCF'],
  독일어: ['Goethe-Zertifikat', 'TestDaF', 'telc'],
  베트남어: ['VSL', 'OPI 베트남어'],
  기타: ['기타']
};

export const disabilityTypeOptions = [
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

export const disabilitySeverityOptions = [
  { value: 'SEVERE', label: '중증' },
  { value: 'MODERATE', label: '중등도' },
  { value: 'MILD', label: '경증' }
];

export const workAvailabilityOptions = [
  { value: 'IMMEDIATE', label: '즉시 가능' },
  { value: 'WITHIN_TWO_WEEKS', label: '2주 이내' },
  { value: 'WITHIN_ONE_MONTH', label: '1개월 이내' },
  { value: 'NEGOTIABLE', label: '협의 가능' }
];

export const workTypeOptions = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'INDEFINITE_CONTRACT', label: '무기계약직' },
  { value: 'PART_TIME', label: '시간제' },
  { value: 'DAILY', label: '일용직' },
  { value: 'INTERN', label: '인턴' },
  { value: 'DISPATCH_OUTSOURCING', label: '파견·용역' },
  { value: 'REMOTE', label: '재택·원격' }
];

export const workTimePreferenceOptions = [
  { value: 'DAYTIME', label: '주간' },
  { value: 'MORNING', label: '오전' },
  { value: 'AFTERNOON', label: '오후' },
  { value: 'EVENING', label: '야간' },
  { value: 'FLEXIBLE', label: '탄력근무' },
  { value: 'NEGOTIABLE', label: '협의 가능' }
];

export const militaryServiceOptions = [
  { value: 'COMPLETED', label: '군필' },
  { value: 'EXEMPTED', label: '면제' },
  { value: 'NOT_APPLICABLE', label: '해당 없음' },
  { value: 'SERVING', label: '복무 중' }
];

export const booleanOptions = [
  { value: true, label: '예' },
  { value: false, label: '아니오' }
];

export const sensitiveConsentDetails = [
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
