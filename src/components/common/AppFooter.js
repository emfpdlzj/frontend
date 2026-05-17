import { Link } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import blogIcon from '../../assets/footer/blog-social.png';
import facebookIcon from '../../assets/footer/facebook-social.png';
import instagramIcon from '../../assets/footer/insta-social.png';
import twitterIcon from '../../assets/footer/twitter-social.png';
import youtubeIcon from '../../assets/footer/youtube-social.png';
import { getPolicyPath } from '../../config/policyDocuments';
import { ROUTE_PATHS } from '../../config/routes';
import { useLocale } from '../../i18n/LocaleContext';

const footerPolicies = [
  { id: 'about', label: '서비스 소개', to: ROUTE_PATHS.about },
  { id: 'faq', label: 'FAQ', to: ROUTE_PATHS.faq },
  { id: 'terms', labelKey: 'footer.terms', to: ROUTE_PATHS.terms },
  { id: 'privacy-policy', labelKey: 'footer.privacy', to: ROUTE_PATHS.privacy },
  { id: 'privacy-consent', labelKey: 'footer.privacyConsent', to: getPolicyPath('privacy-consent') },
  { id: 'marketing-consent', labelKey: 'footer.marketingConsent', to: getPolicyPath('marketing-consent') },
  { id: 'third-party', labelKey: 'footer.thirdParty', to: getPolicyPath('third-party') },
  { id: 'outsourcing', labelKey: 'footer.outsourcing', to: getPolicyPath('outsourcing') }
];

const footerSocials = [
  { id: 'instagram', label: 'Instagram', icon: instagramIcon },
  { id: 'youtube', label: 'YouTube', icon: youtubeIcon },
  { id: 'twitter', label: 'X', icon: twitterIcon },
  { id: 'facebook', label: 'Facebook', icon: facebookIcon },
  { id: 'blog', label: 'Blog', icon: blogIcon }
];

export function AppFooter() {
  const { localizePath, t } = useLocale();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSocialClick = () => {
    window.alert(t('footer.socialOpeningNotice'));
  };

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__top">
          <div className="app-footer__brand-group">
            <button className="app-footer__brand" type="button" onClick={scrollToTop} aria-label={t('footer.backToTop')}>
              <img className="app-footer__logo" src={logo} alt="Bridgework 로고 아이콘" />
              <img className="app-footer__logo-text" src={logoText} alt="Bridgework" />
            </button>
            <p className="app-footer__description">
              {t('footer.description')}
            </p>
          </div>

          <ul className="app-footer__social-list" aria-label={t('footer.socials')}>
            {footerSocials.map((social) => (
              <li key={social.id}>
                <button className="app-footer__social-item" type="button" aria-label={social.label} onClick={handleSocialClick}>
                  <img src={social.icon} alt={`${social.label} 아이콘`} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="app-footer__bottom">
          <div className="app-footer__policy-list" aria-label={t('footer.policies')}>
            {footerPolicies.map((policy) => (
              <Link key={policy.id} className="app-footer__policy" to={localizePath(policy.to)}>
                {policy.label || t(policy.labelKey)}
              </Link>
            ))}
          </div>
          <p className="app-footer__copyright">© 2026 Bridgework Project. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
