import { httpRequest } from './httpClient';

export const onboardingApi = {
  getProfile(accessToken, signal) {
    return httpRequest('/onboarding/profile', {
      token: accessToken,
      signal
    });
  },

  upsertProfile(accessToken, payload, signal) {
    return httpRequest('/onboarding/profile', {
      method: 'PUT',
      token: accessToken,
      body: payload,
      signal
    });
  }
};
