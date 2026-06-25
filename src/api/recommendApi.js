import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

export async function fetchQuickJobRecommendations(accessToken, { aiEnabled = true, profileId, limit, offset, signal, timeoutMs } = {}) {
  const body = {
    aiEnabled
  };

  if (profileId) {
    body.profileId = Number(profileId);
  }
  if (Number.isFinite(Number(limit))) {
    body.limit = Number(limit);
  }
  if (Number.isFinite(Number(offset))) {
    body.offset = Number(offset);
  }

  return unwrapApiResult(
    await httpRequest('/recommend/quick', {
      method: 'POST',
      token: accessToken,
      body,
      signal,
      timeoutMs
    })
  );
}

export async function fetchMapJobRecommendations(accessToken, { aiEnabled = true, profileId, limit, offset, signal, timeoutMs } = {}) {
  const body = {
    aiEnabled
  };

  if (profileId) {
    body.profileId = Number(profileId);
  }
  if (Number.isFinite(Number(limit))) {
    body.limit = Number(limit);
  }
  if (Number.isFinite(Number(offset))) {
    body.offset = Number(offset);
  }

  return unwrapApiResult(
    await httpRequest('/recommend/map', {
      method: 'POST',
      token: accessToken,
      body,
      signal,
      timeoutMs
    })
  );
}

export async function fetchRecommendTaskStatus(accessToken, requestId, { signal } = {}) {
  if (!requestId) {
    throw new Error('추천 요청 ID가 필요합니다.');
  }

  return unwrapApiResult(
    await httpRequest(`/recommend/tasks/${requestId}`, {
      method: 'GET',
      token: accessToken,
      signal
    })
  );
}

export async function explainRecommendation(accessToken, payload, { signal } = {}) {
  return unwrapApiResult(
    await httpRequest('/recommend/explain', {
      method: 'POST',
      token: accessToken,
      body: payload,
      signal
    })
  );
}
