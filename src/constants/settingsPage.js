import { POLICY_DOCUMENTS } from '../config/policyDocuments';

export const settingsMenu = [
  { id: 'account', label: '계정', group: '자주 사용' },
  { id: 'accessibility', label: '접근성', group: '자주 사용' },
  { id: 'privacy', label: '내 데이터', group: '개인정보' },
  { id: 'support', label: '고객센터', group: '도움말' },
  { id: 'policies', label: '약관', group: '정보' },
  { id: 'danger', label: '회원탈퇴', group: '위험' }
];

export const basePrivacyItems = [
  ['개인정보 수집·이용 동의', '정책 확인', 'neutral', '계정 생성과 서비스 제공에 필요한 처리 내용을 확인합니다.', 'privacy-consent'],
  ['제3자 제공 동의', '확인 필요', 'warning', '지원 또는 기업 공개 설정 시 제공 범위를 확인합니다.', 'third-party'],
  ['마케팅 정보 수신 동의', '선택 미동의', 'neutral', '선택 동의이며 서비스 이용에 필수는 아닙니다.', 'marketing-consent'],
  ['개인정보 다운로드 요청', '신청 가능', 'neutral', '내 계정 데이터를 파일로 요청할 수 있습니다.'],
  ['열람/수정/삭제 요청', '신청 가능', 'neutral', '개인정보 처리 요청 절차를 확인합니다.'],
  ['탈퇴 후 개인정보 파기/보관 안내', '확인 가능', 'neutral', '탈퇴 유예 기간, 삭제 대상, 분리 보관 대상을 확인합니다.', 'withdrawal-retention']
];

const highlightedPolicyIds = ['privacy-policy', 'privacy-consent', 'withdrawal-retention', 'marketing-consent'];
export const highlightedPolicyItems = highlightedPolicyIds
  .map((policyId) => POLICY_DOCUMENTS.find((policy) => policy.id === policyId))
  .filter(Boolean);

export const withdrawalRetentionItems = [
  {
    title: '탈퇴 시 삭제되는 정보',
    status: '삭제/비식별',
    description: '탈퇴 확정 후 계정 식별 정보, 프로필, 접근성 설정, 저장 공고, 추천 이력은 삭제 또는 비식별 처리 대상입니다.'
  },
  {
    title: '탈퇴 후 복구 가능 여부',
    status: '30일 내 가능',
    description: '탈퇴 신청 후 30일 안에 다시 로그인하면 계정 복구와 탈퇴 신청 취소를 진행할 수 있습니다.'
  },
  {
    title: '법정 보관 정보',
    status: '분리 보관',
    description: '법령 준수, 분쟁 대응, 보안 목적의 인증 기록, 처리 로그, 문의 이력은 일반 데이터와 분리 보관될 수 있습니다.'
  },
  {
    title: '재가입 제한 여부',
    status: '확인 필요',
    description: '재가입 제한 기간이나 동일 소셜 계정 재가입 조건은 운영 정책 확정 전까지 단정하지 않고 확인 필요로 안내합니다.'
  }
];
