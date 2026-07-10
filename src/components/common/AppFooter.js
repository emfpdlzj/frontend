import { Link } from 'react-router-dom';
import logo from '../../assets/header/logo.png';
import logoText from '../../assets/header/logo-text.png';
import kakaoLogo from '../../assets/settings/kakao-logo.png';
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

const SUPPORT_EMAIL = 'emfpdlzj@gmail.com';
const KAKAO_CHANNEL_URL = 'http://pf.kakao.com/_uxoQxbX';

export function AppFooter() {
  const { localizePath, t } = useLocale();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <p className="app-footer__contact">
              <span>{t('footer.contactEmailLabel')}</span>{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </div>

          <div className="app-footer__support" aria-label={t('footer.support')}>
            <a
              className="app-footer__kakao-button"
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t('footer.kakaoChannelAriaLabel')}
            >
              <img src={kakaoLogo} alt={t('footer.kakaoIconAlt')} />
              {t('footer.kakaoChannel')}
            </a>
            <p className="app-footer__support-text">{t('footer.businessHours')}</p>
            <p className="app-footer__support-text">{t('footer.responseTime')}</p>
          </div>
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
