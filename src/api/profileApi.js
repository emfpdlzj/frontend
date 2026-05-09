import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

export const profileApi = {
  async getProfiles(accessToken, signal) {
    const result = unwrapApiResult(await httpRequest('/profiles', { token: accessToken, signal }));
    return Array.isArray(result) ? result : [];
  },

  async getProfile(accessToken, profileId, signal) {
    return unwrapApiResult(await httpRequest(`/profiles/${profileId}`, { token: accessToken, signal }));
  },

  async createProfile(accessToken, payload, signal) {
    return unwrapApiResult(
      await httpRequest('/profiles', {
        method: 'POST',
        token: accessToken,
        body: payload,
        signal
      })
    );
  },

  async updateProfile(accessToken, profileId, payload, signal) {
    return unwrapApiResult(
      await httpRequest(`/profiles/${profileId}`, {
        method: 'PUT',
        token: accessToken,
        body: payload,
        signal
      })
    );
  },

  deleteProfile(accessToken, profileId, signal) {
    return httpRequest(`/profiles/${profileId}`, {
      method: 'DELETE',
      token: accessToken,
      signal
    });
  },

  async setDefaultProfile(accessToken, profileId, signal) {
    return unwrapApiResult(
      await httpRequest(`/profiles/${profileId}/set-default`, {
        method: 'PATCH',
        token: accessToken,
        signal
      })
    );
  }
};
