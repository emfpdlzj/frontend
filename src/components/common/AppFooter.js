import { Link } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import blogIcon from '../../assets/footer/blog-social.png';
import facebookIcon from '../../assets/footer/facebook-social.png';
import instagramIcon from '../../assets/footer/insta-social.png';
import twitterIcon from '../../assets/footer/twitter-social.png';
import youtubeIcon from '../../assets/footer/youtube-social.png';

const footerPolicies = [
  { id: 'terms', label: '이용약관', to: '/terms' },
  { id: 'privacy', label: '개인정보처리방침', to: '/privacy' },
  { id: 'accessibility', label: '접근성 정책' },
  { id: 'data', label: '데이터 관리정책' }
];

const footerSocials = [
  { id: 'instagram', label: 'Instagram', icon: instagramIcon },
  { id: 'youtube', label: 'YouTube', icon: youtubeIcon },
  { id: 'twitter', label: 'X', icon: twitterIcon },
  { id: 'facebook', label: 'Facebook', icon: facebookIcon },
  { id: 'blog', label: 'Blog', icon: blogIcon }
];

export function AppFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__top">
          <div className="app-footer__brand-group">
            <button className="app-footer__brand" type="button" onClick={scrollToTop} aria-label="화면 맨 위로 이동">
              <img className="app-footer__logo" src={logo} alt="" aria-hidden="true" />
              <img className="app-footer__logo-text" src={logoText} alt="Bridgework" />
            </button>
            <p className="app-footer__description">
              노동을 잇는 다리, 브릿지워크
            </p>
          </div>

          <ul className="app-footer__social-list" aria-label="Bridgework 소셜 채널">
            {footerSocials.map((social) => (
              <li key={social.id}>
                <button className="app-footer__social-item" type="button" aria-label={social.label}>
                  <img src={social.icon} alt="" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="app-footer__bottom">
          <div className="app-footer__policy-list" aria-label="Bridgework 정책">
            {footerPolicies.map((policy) => (
              <Link key={policy.id} className="app-footer__policy" to={policy.to || '#'}>
                {policy.label}
              </Link>
            ))}
          </div>
          <p className="app-footer__copyright">© 2026 Bridgework Project. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
