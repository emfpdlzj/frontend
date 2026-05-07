import { httpRequest } from './httpClient';

export const authApi = {
  socialLogin(payload, signal) {
    return httpRequest('/auth/social/login', {
      method: 'POST',
      token: null,
      body: payload,
      signal
    });
  },

  completeSignup(payload, signal) {
    return httpRequest('/auth/social/signup/complete', {
      method: 'POST',
      token: null,
      body: payload,
      signal
    });
  },

  refreshToken(refreshToken, signal) {
    return httpRequest('/auth/token/refresh', {
      method: 'POST',
      token: null,
      body: { refreshToken },
      signal
    });
  },

  logout(accessToken, refreshToken, signal) {
    return httpRequest('/auth/logout', {
      method: 'POST',
      token: accessToken,
      body: { refreshToken },
      signal
    });
  },

  getMe(accessToken, signal) {
    return httpRequest('/auth/me', {
      token: accessToken,
      signal
    });
  }
};
