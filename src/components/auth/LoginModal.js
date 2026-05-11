import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoBig from '../../assets/logo_big.png';
import { SocialLoginButtons } from './SocialLoginButtons';
import { StatusMessage } from '../common/StatusMessage';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';

export function LoginModal({ onClose }) {
  const { localizePath } = useLocale();
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
          <div className="login-modal__brand-mark">
            <img className="login-modal__logo" src={logoBig} alt="Bridgework 로고" loading="lazy" decoding="async" />
          </div>
          <div className="login-modal__heading">
            <h2 id="login-modal-title" className="login-modal__title">BridgeWork</h2>
            <p id="login-modal-description">
              장애 유형과 접근성을 고려한 맞춤 일자리 추천 서비스
            </p>
          </div>

          <SocialLoginButtons onError={setError} />
          <StatusMessage kind="error">{error}</StatusMessage>

          <p className="login-modal__signup-note">처음 이용해도 별도 가입 절차 없이 바로 시작할 수 있어요.</p>
          <p className="login-modal__notice">
            회원가입을 진행하면{' '}
            <Link to={localizePath(ROUTE_PATHS.terms)} onClick={onClose}>
              이용약관
            </Link>{' '}
            및{' '}
            <Link to={localizePath(ROUTE_PATHS.privacy)} onClick={onClose}>
              개인정보 처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
