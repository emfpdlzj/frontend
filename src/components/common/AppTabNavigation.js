import { NavLink } from 'react-router-dom';
import homeIcon from '../../assets/tab/home_icon.png';
import mapIcon from '../../assets/tab/map_icon.png';
import docsIcon from '../../assets/tab/docs_icon.png';
import businesscardIcon from '../../assets/tab/businesscard_icon.png';
import profileIcon from '../../assets/tab/profile_icon.png';
import settingIcon from '../../assets/tab/setting_icon.png';
import { ROUTE_PATHS } from '../../config/routes';

const primaryTabs = [
  { id: 'home', label: '홈', icon: homeIcon, to: ROUTE_PATHS.root },
  { id: 'map', label: '접근성 지도', icon: mapIcon, to: ROUTE_PATHS.accessibilityMap },
  { id: 'docs', label: '문서', icon: docsIcon, to: ROUTE_PATHS.jobs },
  { id: 'business', label: '공고', icon: businesscardIcon, to: ROUTE_PATHS.jobs }
];

const secondaryTabs = [
  { id: 'profile', label: '내 정보', icon: profileIcon, to: ROUTE_PATHS.myProfile },
  { id: 'settings', label: '설정', icon: settingIcon, to: ROUTE_PATHS.settings }
];

function TabLink({ item }) {
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
