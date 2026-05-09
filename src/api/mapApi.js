import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

export const mapApi = {
  async getSupportAgencies(accessToken, signal) {
    const result = unwrapApiResult(await httpRequest('/map/support-agencies', { token: accessToken, signal }));
    return Array.isArray(result) ? result : [];
  }
};
