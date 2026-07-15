export function ScrapConfirmModal({ pending, onConfirm, onClose }) {
  return (
    <div className="login-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    }}>
      <section className="login-modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="scrap-confirm-title">
        <button type="button" className="login-modal__close" onClick={onClose} aria-label="스크랩 확인 창 닫기" disabled={pending}>
          닫기
        </button>
        <div className="login-modal__body logout-confirm-modal__body">
          <div className="login-modal__heading">
            <h2 id="scrap-confirm-title" className="login-modal__title">스크랩 확인</h2>
            <p>이 공고를 스크랩하시겠습니까?</p>
          </div>
          <div className="logout-confirm-modal__actions">
            <button type="button" className="logout-confirm-modal__button" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button
              type="button"
              className="logout-confirm-modal__button logout-confirm-modal__button--confirm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onConfirm();
              }}
              disabled={pending}
            >
              {pending ? '처리 중' : '스크랩'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
