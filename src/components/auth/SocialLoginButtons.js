import { oauthUtils } from '../../utils/oauth';

const providers = [
  {
    key: 'KAKAO',
    label: '카카오로 로그인',
    className: 'social-button kakao'
  },
  {
    key: 'NAVER',
    label: '네이버로 로그인',
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
          {provider.label}
        </button>
      ))}
    </div>
  );
}
