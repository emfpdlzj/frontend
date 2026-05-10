const withdrawalNoticeItems = [
  {
    title: '삭제되는 정보',
    description: '계정 식별 정보, 프로필, 접근성 설정, 저장 공고, 추천 이력은 탈퇴 확정 후 삭제 또는 비식별 처리됩니다.'
  },
  {
    title: '복구 가능 여부',
    description: '탈퇴 신청 후 30일 안에 다시 로그인하면 계정 복구와 탈퇴 신청 취소를 진행할 수 있습니다.'
  },
  {
    title: '법정 보관 정보',
    description: '법령 준수, 분쟁 대응, 보안 목적의 인증 기록, 처리 로그, 문의 이력은 분리 보관될 수 있습니다.'
  },
  {
    title: '재가입 제한 여부',
    description: '재가입 제한 기간이나 동일 소셜 계정 재가입 조건은 확정 전까지 확인 필요 항목으로 안내합니다.'
  }
];

export function WithdrawalConfirmDialog({
  isConfirmed,
  onConfirmChange,
  onClose,
  onSubmit,
  isSubmitting = false,
  errorMessage = ''
}) {
  return (
    <div className="settings-dialog-backdrop" role="presentation">
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-dialog-title"
        aria-describedby="withdrawal-dialog-description"
      >
        <div className="settings-dialog__header">
          <h2 id="withdrawal-dialog-title">회원탈퇴 확인</h2>
          <button type="button" className="settings-dialog__close" onClick={onClose} aria-label="회원탈퇴 확인 창 닫기">
            ×
          </button>
        </div>
        <p id="withdrawal-dialog-description">
          탈퇴 전에는 삭제되는 정보, 복구 가능 여부, 법정 보관 정보, 재가입 제한 여부를 반드시 확인해야 합니다.
          확인 후 탈퇴 신청이 서버에 접수됩니다.
        </p>
        <div className="settings-dialog__notice-list" role="list" aria-label="탈퇴 전 유의사항">
          {withdrawalNoticeItems.map((item) => (
            <div key={item.title} className="settings-dialog__notice" role="listitem">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
        <label className="settings-dialog__check">
          <input
            type="checkbox"
            checked={isConfirmed}
            disabled={isSubmitting}
            onChange={(event) => onConfirmChange(event.target.checked)}
          />
          <span>
            탈퇴 시 삭제되는 정보, 30일 내 복구 가능 여부, 법정 보관 정보, 재가입 제한 확인 필요 항목을 모두
            확인했습니다.
          </span>
        </label>
        {errorMessage ? (
          <p className="settings-dialog__error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="settings-dialog__actions">
          <button type="button" className="settings-button settings-button--secondary" onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          <button
            type="button"
            className="settings-button settings-button--danger"
            disabled={!isConfirmed || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? '탈퇴 신청 중' : '탈퇴 신청'}
          </button>
        </div>
      </div>
    </div>
  );
}
