import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

export const postingApi = {
  async getPopularPostings({ limit = 20, signal } = {}) {
    const result = unwrapApiResult(await httpRequest(`/postings/popular?limit=${encodeURIComponent(limit)}`, { signal }));
    return Array.isArray(result) ? result : [];
  },

  async getPostingDetail(postingId, { accessToken, signal } = {}) {
    return unwrapApiResult(
      await httpRequest(`/postings/${postingId}`, {
        token: accessToken,
        signal
      })
    );
  },

  async scrapPosting(accessToken, postingId, signal) {
    return unwrapApiResult(
      await httpRequest(`/postings/${postingId}/scraps`, {
        method: 'POST',
        token: accessToken,
        signal
      })
    );
  },

  async deleteScrap(accessToken, postingId, signal) {
    return unwrapApiResult(
      await httpRequest(`/postings/${postingId}/scraps`, {
        method: 'DELETE',
        token: accessToken,
        signal
      })
    );
  },

  async submitPostingFeedback(accessToken, postingId, body, signal) {
    return unwrapApiResult(
      await httpRequest(`/postings/${postingId}/feedback`, {
        method: 'POST',
        token: accessToken,
        body,
        signal
      })
    );
  },

  async getMyScraps(accessToken, signal) {
    const result = unwrapApiResult(await httpRequest('/me/scraps', { token: accessToken, signal }));
    return Array.isArray(result) ? result : [];
  }
};
