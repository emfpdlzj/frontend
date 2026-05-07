import { oauthUtils } from '../../utils/oauth';
import kakaoLogo from '../../assets/login/kakao-logo.png';
import naverLogo from '../../assets/login/naver-logo.png';

const providers = [
  {
    key: 'KAKAO',
    label: '카카오로 시작하기',
    logo: kakaoLogo,
    className: 'social-button kakao'
  },
  {
    key: 'NAVER',
    label: '네이버로 시작하기',
    logo: naverLogo,
    className: 'social-button naver'
  }
];

export function SocialLoginButtons({ onError }) {
  const handleLoginClick = (provider) => {
    try {
      const authorizeUrl = oauthUtils.buildAuthorizeUrl(provider);
      window.location.assign(authorizeUrl);
    } catch (error) {
      onError?.(error.message);
    }
  };

  return (
    <div className="social-login-buttons">
      {providers.map((provider) => (
        <button
          key={provider.key}
          type="button"
          className={provider.className}
          onClick={() => handleLoginClick(provider.key)}
        >
          <img className="social-button__logo" src={provider.logo} alt="" aria-hidden="true" />
          <span>{provider.label}</span>
        </button>
      ))}
    </div>
  );
}
