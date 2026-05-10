import { useEffect, useRef } from 'react';
import logoBig from '../../assets/logo_big.png';

export function WithdrawalRestoredModal({ onClose }) {
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
        className="login-modal withdrawal-restored-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-restored-title"
        aria-describedby="withdrawal-restored-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="계정 복구 안내 닫기"
        >
          닫기
        </button>

        <div className="login-modal__body withdrawal-restored-modal__body">
          <div className="login-modal__brand-mark">
            <img className="login-modal__logo" src={logoBig} alt="Bridgework 로고" />
          </div>
          <div className="login-modal__heading">
            <h2 id="withdrawal-restored-title" className="login-modal__title">BridgeWork</h2>
            <p id="withdrawal-restored-description">
              회원탈퇴 신청 상태에서 다시 복귀되셨어요.
            </p>
          </div>
          <p className="withdrawal-restored-modal__notice">
            계정이 다시 활성화되어<br /> 기존처럼 서비스를 이용할 수 있습니다.
          </p>
          <button type="button" className="settings-button settings-button--primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}
