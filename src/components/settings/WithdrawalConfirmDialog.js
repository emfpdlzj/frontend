export function WithdrawalConfirmDialog({ isConfirmed, onConfirmChange, onClose }) {
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
          탈퇴 전에는 삭제되는 정보, 법정 보관 정보, 재가입 제한 여부를 반드시 확인해야 합니다. 실제 탈퇴 요청은
          본인 재인증 후 처리됩니다.
        </p>
        <div className="settings-dialog__notice" role="note">
          <strong>재인증 필요</strong>
          <span>소셜 로그인 또는 이메일 인증으로 본인 확인을 완료한 뒤 탈퇴 요청을 제출할 수 있습니다.</span>
        </div>
        <label className="settings-dialog__check">
          <input type="checkbox" checked={isConfirmed} onChange={(event) => onConfirmChange(event.target.checked)} />
          <span>탈퇴 시 일부 정보가 삭제되며, 법정 보관 정보는 분리 보관될 수 있음을 확인했습니다.</span>
        </label>
        <div className="settings-dialog__actions">
          <button type="button" className="settings-button settings-button--secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="settings-button settings-button--danger" disabled={!isConfirmed}>
            재인증 후 탈퇴 요청
          </button>
        </div>
      </div>
    </div>
  );
}
