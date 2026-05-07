import { useEffect, useRef, useState } from 'react';
import { SocialLoginButtons } from './SocialLoginButtons';
import { StatusMessage } from '../common/StatusMessage';

export function LoginModal({ onClose }) {
  const closeButtonRef = useRef(null);
  const [error, setError] = useState('');

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
        className="login-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="login-modal__close"
          onClick={onClose}
          aria-label="로그인 창 닫기"
        >
          닫기
        </button>

        <div className="login-modal__body">
          <h2 id="login-modal-title">로그인</h2>
          <p id="login-modal-description">최초 로그인 시 자동으로 회원가입이 진행됩니다.</p>

          <SocialLoginButtons onError={setError} />
          <StatusMessage kind="error">{error}</StatusMessage>

          <p className="login-modal__notice">
            회원가입을 진행하면 <a href="/terms">이용약관</a> 및{' '}
            <a href="/privacy">개인정보 처리방침</a>에 동의하게 됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
