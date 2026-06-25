import { httpRequest } from './httpClient';

const withoutSocialAccountEmail = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const { email, ...signupPayload } = payload;
  return signupPayload;
};

export const authApi = {
  adminLogin(payload, signal) {
    return httpRequest('/auth/admin/login', {
      method: 'POST',
      token: null,
      body: payload,
      signal
    });
  },

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
      body: withoutSocialAccountEmail(payload),
      signal
    });
  },

  refreshToken(refreshToken, signal, options = {}) {
    return httpRequest('/auth/token/refresh', {
      method: 'POST',
      token: null,
      body: { refreshToken },
      signal,
      expectedErrorStatuses: options.expectedErrorStatuses
    });
  },

  logout(accessToken, refreshToken, signal) {
    return httpRequest('/auth/logout', {
      method: 'POST',
      token: accessToken,
      body: refreshToken ? { refreshToken } : undefined,
      signal
    });
  },

  withdraw(accessToken, signal) {
    return httpRequest('/auth/withdraw', {
      method: 'DELETE',
      token: accessToken,
      signal
    });
  },

  cancelWithdraw(withdrawalCancelToken, signal) {
    return httpRequest('/auth/withdraw/cancel', {
      method: 'POST',
      token: null,
      body: { withdrawalCancelToken },
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
