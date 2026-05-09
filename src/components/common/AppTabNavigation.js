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

const primaryTabs = [
  { id: 'home', label: '홈', icon: homeIcon, to: ROUTE_PATHS.root },
  { id: 'map', label: '접근성 지도', icon: mapIcon, to: ROUTE_PATHS.accessibilityMap },
  { id: 'docs', label: '문서', icon: docsIcon, to: ROUTE_PATHS.jobs },
  { id: 'business', label: '공고', icon: businesscardIcon, to: ROUTE_PATHS.jobs }
];

const secondaryTabs = [
  { id: 'profile', label: '사용자 메뉴', icon: profileIcon, type: 'user-menu' },
  { id: 'settings', label: '설정', icon: settingIcon, to: ROUTE_PATHS.settings }
];

function UserMenuTab({ item }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
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
      navigate(ROUTE_PATHS.login, { replace: true });
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
        aria-label={item.label}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        title={item.label}
        onClick={openMenu}
      >
        <img src={item.icon} alt="" aria-hidden="true" />
      </button>

      {isMenuOpen ? (
        <div
          className="app-tab-nav__logout-popover"
          role="menu"
          aria-label="사용자 메뉴"
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
            {isLoggingOut ? '로그아웃 중' : '로그아웃'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TabLink({ item }) {
  if (item.type === 'user-menu') {
    return <UserMenuTab item={item} />;
  }

  if (!item.to) {
    return (
      <button type="button" className="app-tab-nav__link" aria-label={item.label} title={item.label}>
        <img src={item.icon} alt="" aria-hidden="true" />
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => `app-tab-nav__link${isActive ? ' is-active' : ''}`}
      aria-label={item.label}
      title={item.label}
    >
      <img src={item.icon} alt="" aria-hidden="true" />
    </NavLink>
  );
}

export function AppTabNavigation() {
  return (
    <nav className="app-tab-nav" aria-label="주요 메뉴">
      <div className="app-tab-nav__group">
        {primaryTabs.map((item) => (
          <TabLink key={item.id} item={item} />
        ))}
      </div>
      <div className="app-tab-nav__group app-tab-nav__group--bottom">
        {secondaryTabs.map((item) => (
          <TabLink key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}
