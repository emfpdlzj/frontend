import { useEffect, useRef } from 'react';

export function LogoutConfirmModal({ onClose, onConfirm, pending = false, error = '' }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="login-modal-backdrop" onMouseDown={handleBackdropClick}>
      <section
        className="login-modal logout-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="로그아웃 확인 창 닫기"
          disabled={pending}
        >
          닫기
        </button>

        <div className="login-modal__body logout-confirm-modal__body">
          <div className="login-modal__heading">
            <h2 id="logout-confirm-title" className="login-modal__title">로그아웃 확인</h2>
            <p id="logout-confirm-description">정말 로그아웃하시겠습니까?</p>
          </div>

          <div className="logout-confirm-modal__actions">
            <button type="button" className="logout-confirm-modal__button" onClick={onClose} disabled={pending}>
              취소
            </button>
            <button
              type="button"
              className="logout-confirm-modal__button logout-confirm-modal__button--confirm"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? '로그아웃 중' : '로그아웃'}
            </button>
          </div>
          {error ? <p role="alert" className="form-error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
