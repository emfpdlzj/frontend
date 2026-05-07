import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import { useAuth } from '../../auth/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import { accessibilityMapMockData } from '../../config/accessibilityMapMockData';

const BRIDGEWORK_HOME_URL = 'https://www.bridgework.cloud/';

export function AppHeader() {
  const navigate = useNavigate();
  const { isAuthenticated, isInitializing, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="app-header">
      <a className="app-header__brand" href={BRIDGEWORK_HOME_URL} aria-label="Bridgework 홈페이지로 이동">
        <img className="app-header__logo" src={logo} alt="" aria-hidden="true" />
        <img className="app-header__logo-text" src={logoText} alt="Bridgework" />
      </a>

      <form className="app-header__map-search" role="search" aria-label="접근성 지도 출발지 검색">
        <label className="sr-only" htmlFor="app-header-map-search">
          접근성 지도 출발지 입력
        </label>
        <input
          id="app-header-map-search"
          type="search"
          placeholder={accessibilityMapMockData.searchPlaceholder}
        />
      </form>

      <div className="app-header__actions" aria-label="사용자 메뉴">
        {isAuthenticated ? (
          <button
            className="app-header__auth-button app-header__auth-button--logout"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? '로그아웃 중' : '로그아웃'}
          </button>
        ) : (
          <button
            className="app-header__auth-button app-header__auth-button--login"
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            disabled={isInitializing}
          >
            로그인
          </button>
        )}
      </div>

      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </header>
  );
}
