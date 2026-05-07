import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';

const BRIDGEWORK_HOME_URL = 'https://www.bridgework.cloud/';

export function AppHeader() {
  return (
    <header className="app-header">
      <a className="app-header__brand" href={BRIDGEWORK_HOME_URL} aria-label="Bridgework 홈페이지로 이동">
        <img className="app-header__logo" src={logo} alt="" aria-hidden="true" />
        <img className="app-header__logo-text" src={logoText} alt="Bridgework" />
      </a>
    </header>
  );
}
