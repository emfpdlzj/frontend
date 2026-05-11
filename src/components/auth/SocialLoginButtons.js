import { useState } from 'react';
import { useLocation } from 'react-router-dom';
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

export function SocialLoginButtons({ onError, navigateTo = (url) => window.location.assign(url) }) {
  const location = useLocation();
  const [pendingProvider, setPendingProvider] = useState('');

  const handleLoginClick = (provider) => {
    if (pendingProvider) {
      return;
    }

    try {
      setPendingProvider(provider);
      oauthUtils.saveReturnTo(`${location.pathname}${location.search}${location.hash}`);
      const authorizeUrl = oauthUtils.buildAuthorizeUrl(provider);
      navigateTo(authorizeUrl);
    } catch (error) {
      setPendingProvider('');
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
          disabled={Boolean(pendingProvider)}
          onClick={() => handleLoginClick(provider.key)}
        >
          <img className="social-button__logo" src={provider.logo} alt={`${provider.label} 로고`} />
          <span>{pendingProvider === provider.key ? '로그인 화면으로 이동 중...' : provider.label}</span>
        </button>
      ))}
    </div>
  );
}
