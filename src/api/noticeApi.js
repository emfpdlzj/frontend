import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;
const normalizeNoticeList = (value) => (Array.isArray(value) ? value : []);

export const noticeApi = {
  async getNotices({ limit = 20, signal } = {}) {
    const result = unwrapApiResult(await httpRequest(`/notices?limit=${encodeURIComponent(limit)}`, { signal }));
    return normalizeNoticeList(result);
  },

  async getNotice(noticeId, { signal } = {}) {
    return unwrapApiResult(await httpRequest(`/notices/${encodeURIComponent(noticeId)}`, { signal }));
  },

  async getAdminNotices(accessToken, { limit = 100, signal } = {}) {
    const result = unwrapApiResult(
      await httpRequest(`/admin/notices?limit=${encodeURIComponent(limit)}`, {
        token: accessToken,
        signal
      })
    );
    return normalizeNoticeList(result);
  },

  async createAdminNotice(accessToken, payload, { signal } = {}) {
    return unwrapApiResult(
      await httpRequest('/admin/notices', {
        method: 'POST',
        token: accessToken,
        body: payload,
        signal
      })
    );
  },

  async updateAdminNotice(accessToken, noticeId, payload, { signal } = {}) {
    return unwrapApiResult(
      await httpRequest(`/admin/notices/${encodeURIComponent(noticeId)}`, {
        method: 'PUT',
        token: accessToken,
        body: payload,
        signal
      })
    );
  },

  async deleteAdminNotice(accessToken, noticeId, { signal } = {}) {
    return unwrapApiResult(
      await httpRequest(`/admin/notices/${encodeURIComponent(noticeId)}`, {
        method: 'DELETE',
        token: accessToken,
        signal
      })
    );
  }
};
