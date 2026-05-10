import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import homeIcon from '../../assets/tab/home_icon.png';
import mapIcon from '../../assets/tab/map_icon.png';
import docsIcon from '../../assets/tab/docs_icon.png';
import businesscardIcon from '../../assets/tab/businesscard_icon.png';
import profileIcon from '../../assets/tab/profile_icon.png';
import settingIcon from '../../assets/tab/setting_icon.png';
import { useAuth } from '../../auth/AuthContext';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';
import { LoginModal } from '../auth/LoginModal';

const primaryTabs = [
  { id: 'home', labelKey: 'nav.home', icon: homeIcon, to: ROUTE_PATHS.root },
  { id: 'map', labelKey: 'nav.map', icon: mapIcon, to: ROUTE_PATHS.accessibilityMap },
  { id: 'jobs', labelKey: 'nav.jobs', icon: docsIcon, to: ROUTE_PATHS.jobs },
  { id: 'business', labelKey: 'nav.business', icon: businesscardIcon, to: ROUTE_PATHS.profile }
];

const secondaryTabs = [
  { id: 'profile', labelKey: 'nav.profile', icon: profileIcon, type: 'user-menu' },
  { id: 'settings', labelKey: 'nav.settings', icon: settingIcon, to: ROUTE_PATHS.settings }
];

function TabIcon({ item, label }) {
  return <img src={item.icon} alt={`${label} 아이콘`} />;
}

function UserMenuTab({ item, onRequireLogin }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { localizePath, t } = useLocale();
  const label = t(item.labelKey);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 80, top: 0 });
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const updateMenuPosition = () => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();

    if (!triggerRect) {
      return;
    }

    setMenuPosition({
      left: triggerRect.right + 16,
      top: triggerRect.top + triggerRect.height / 2
    });
  };

  const openMenu = () => {
    if (!isAuthenticated) {
      return;
    }

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    updateMenuPosition();
    setIsMenuOpen(true);
  };

  const handleTriggerClick = () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }

    openMenu();
  };

  const scheduleCloseMenu = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      closeTimerRef.current = null;
    }, 180);
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    updateMenuPosition();

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const handleLayoutChange = () => {
      updateMenuPosition();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [isMenuOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      navigate(localizePath(ROUTE_PATHS.root), { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="app-tab-nav__user-menu"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleCloseMenu}
      onFocus={openMenu}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`app-tab-nav__link${isMenuOpen ? ' is-active' : ''}`}
        aria-label={label}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        title={label}
        onClick={handleTriggerClick}
      >
        <TabIcon item={item} label={label} />
      </button>

      {isMenuOpen ? (
        <div
          className="app-tab-nav__logout-popover"
          role="menu"
          aria-label={label}
          style={{ left: menuPosition.left, top: menuPosition.top }}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleCloseMenu}
        >
          <button
            type="button"
            className="app-tab-nav__logout-button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? t('header.loggingOut') : t('header.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TabLink({ item, onRequireLogin }) {
  const { isAuthenticated } = useAuth();
  const { localizePath, t } = useLocale();
  const label = t(item.labelKey);

  if (item.type === 'user-menu') {
    return <UserMenuTab item={item} onRequireLogin={onRequireLogin} />;
  }

  if (!item.to) {
    return (
      <button type="button" className="app-tab-nav__link" aria-label={label} title={label}>
        <TabIcon item={item} label={label} />
      </button>
    );
  }

  if (!isAuthenticated && item.to !== ROUTE_PATHS.root) {
    return (
      <button
        type="button"
        className="app-tab-nav__link"
        aria-label={`${label} ${t('nav.loginRequired')}`}
        title={label}
        onClick={onRequireLogin}
      >
        <TabIcon item={item} label={label} />
      </button>
    );
  }

  return (
    <NavLink
      to={localizePath(item.to)}
      className={({ isActive }) => `app-tab-nav__link${isActive ? ' is-active' : ''}`}
      aria-label={label}
      title={label}
    >
      <TabIcon item={item} label={label} />
    </NavLink>
  );
}

export function AppTabNavigation() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { t } = useLocale();

  return (
    <>
      <nav className="app-tab-nav" aria-label={t('nav.mainMenu')}>
        <div className="app-tab-nav__group">
          {primaryTabs.map((item) => (
            <TabLink key={item.id} item={item} onRequireLogin={() => setIsLoginModalOpen(true)} />
          ))}
        </div>
        <div className="app-tab-nav__group app-tab-nav__group--bottom">
          {secondaryTabs.map((item) => (
            <TabLink key={item.id} item={item} onRequireLogin={() => setIsLoginModalOpen(true)} />
          ))}
        </div>
      </nav>
      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </>
  );
}
