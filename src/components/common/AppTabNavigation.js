import { useState } from 'react';
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
import { LogoutConfirmModal } from '../auth/LogoutConfirmModal';

const primaryTabs = [
  { id: 'home', labelKey: 'nav.home', icon: homeIcon, to: ROUTE_PATHS.root },
  { id: 'map', labelKey: 'nav.map', icon: mapIcon, to: ROUTE_PATHS.accessibilityMap },
  { id: 'jobs', labelKey: 'nav.jobs', icon: docsIcon, to: ROUTE_PATHS.jobs },
  { id: 'business', labelKey: 'nav.business', icon: businesscardIcon, to: ROUTE_PATHS.profile }
];

const secondaryTabs = [{ id: 'settings', labelKey: 'nav.settings', icon: settingIcon, to: ROUTE_PATHS.settings }];

function TabIcon({ item, label }) {
  return <img src={item.icon} alt={`${label} 아이콘`} />;
}

function SessionActionTab({ onRequireLogin }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { localizePath, t } = useLocale();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const label = isAuthenticated ? t('header.logout') : t('header.login');

  const handleClick = () => {
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }

    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
      navigate(localizePath(ROUTE_PATHS.root), { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`app-tab-nav__link${isLogoutModalOpen ? ' is-active' : ''}`}
        aria-label={label}
        title={label}
        onClick={handleClick}
        disabled={isLoggingOut}
      >
        <TabIcon item={{ icon: profileIcon }} label={label} />
        <span className="app-tab-nav__label">{label}</span>
      </button>
      {isLogoutModalOpen ? (
        <LogoutConfirmModal
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogoutConfirm}
          pending={isLoggingOut}
        />
      ) : null}
    </>
  );
}

function TabLink({ item, onRequireLogin }) {
  const { isAuthenticated } = useAuth();
  const { localizePath, t } = useLocale();
  const label = t(item.labelKey);

  if (!item.to) {
    return (
      <button type="button" className="app-tab-nav__link" aria-label={label} title={label}>
        <TabIcon item={item} label={label} />
        <span className="app-tab-nav__label">{label}</span>
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
        <span className="app-tab-nav__label">{label}</span>
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
      <span className="app-tab-nav__label">{label}</span>
    </NavLink>
  );
}

export function AppTabNavigation() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLocale();

  return (
    <>
      <nav
        className={`app-tab-nav${isExpanded ? ' is-expanded' : ''}`}
        aria-label={t('nav.mainMenu')}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocusCapture={() => setIsExpanded(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsExpanded(false);
          }
        }}
      >
        <div className="app-tab-nav__group">
          {primaryTabs.map((item) => (
            <TabLink key={item.id} item={item} onRequireLogin={() => setIsLoginModalOpen(true)} />
          ))}
        </div>
        <div className="app-tab-nav__group app-tab-nav__group--bottom">
          <SessionActionTab onRequireLogin={() => setIsLoginModalOpen(true)} />
          {secondaryTabs.map((item) => (
            <TabLink key={item.id} item={item} onRequireLogin={() => setIsLoginModalOpen(true)} />
          ))}
        </div>
      </nav>
      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </>
  );
}
