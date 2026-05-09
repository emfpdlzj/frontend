import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

export async function fetchQuickJobRecommendations(accessToken, { aiEnabled = true, profileId, signal } = {}) {
  const body = {
    aiEnabled
  };

  if (profileId) {
    body.profileId = Number(profileId);
  }

  return unwrapApiResult(
    await httpRequest('/recommend/quick', {
      method: 'POST',
      token: accessToken,
      body,
      signal
    })
  );
}
