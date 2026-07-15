import {
  fetchMapJobRecommendations,
  fetchQuickJobRecommendations,
  fetchRecommendTaskStatus
} from '../api/recommendApi';
import {
  RECOMMEND_REQUEST_TIMEOUT_MS,
  RECOMMEND_TASK_POLL_INTERVAL_MS
} from '../constants/recommendation';

const delay = (ms) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;
export const getTaskRequestId = (payload) => payload?.requestId || payload?.request_id || payload?.id || '';
export const getTaskStatus = (payload) => payload?.status || payload?.taskStatus || payload?.task_status || '';
export const getTaskErrorMessage = (payload) => payload?.errorMessage || payload?.error_message || payload?.message || '';
export const isTaskCached = (payload) => Boolean(payload?.cached);

export const normalizeTaskPayload = (payload) => {
  if (!payload) {
    return null;
  }

  if (payload.requestId || payload.request_id || payload.status || payload.taskStatus || payload.task_status) {
    return payload;
  }

  return unwrapApiResult(payload);
};

export const isDirectQuickResultPayload = (payload) =>
  Boolean(payload) && (
    Array.isArray(payload.results)
    || Array.isArray(payload.jobs)
    || Array.isArray(payload?.aiResponse?.result?.results)
  );

export async function waitForRecommendTask(callWithAuth, requestId, signal, onProgress) {
  let lastPayload = null;

  while (!signal?.aborted) {
    const payload = await callWithAuth((accessToken) =>
      fetchRecommendTaskStatus(accessToken, requestId, { signal })
    );
    lastPayload = payload;
    const status = getTaskStatus(payload);

    if (status === 'PROCESSING' && payload?.result) {
      await onProgress?.(payload.result);
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      return payload;
    }

    await delay(RECOMMEND_TASK_POLL_INTERVAL_MS);
  }

  return lastPayload;
}

export async function requestQuickRecommendationResult(callWithAuth, request, signal, onProgress) {
  const taskPayload = await callWithAuth((accessToken) =>
    fetchQuickJobRecommendations(accessToken, {
      ...request,
      signal,
      timeoutMs: RECOMMEND_REQUEST_TIMEOUT_MS
    })
  );
  const taskResult = normalizeTaskPayload(taskPayload);

  if (isDirectQuickResultPayload(taskResult)) {
    return { payload: taskResult, cached: false, progressed: false };
  }

  if (getTaskStatus(taskResult) === 'FAILED') {
    throw new Error(getTaskErrorMessage(taskResult) || '퀵 추천을 불러오지 못했습니다.');
  }

  if (getTaskStatus(taskResult) === 'COMPLETED' && taskResult?.result) {
    return { payload: taskResult.result, cached: isTaskCached(taskResult), progressed: false };
  }

  const taskRequestId = getTaskRequestId(taskResult);
  if (!taskRequestId) {
    throw new Error('퀵 추천 요청 상태를 확인할 수 없습니다.');
  }

  let progressed = false;
  if (taskResult?.result) {
    progressed = true;
    await onProgress?.(taskResult.result);
  }

  const completed = await waitForRecommendTask(callWithAuth, taskRequestId, signal, async (progressResult) => {
    progressed = true;
    await onProgress?.(progressResult);
  });

  if (!completed || getTaskStatus(completed) === 'FAILED') {
    throw new Error(getTaskErrorMessage(completed) || '퀵 추천을 불러오지 못했습니다.');
  }

  return { payload: completed.result, cached: isTaskCached(completed), progressed };
}

export async function requestMapRecommendationResult(callWithAuth, request, signal, onProgress) {
  const taskPayload = await callWithAuth((accessToken) =>
    fetchMapJobRecommendations(accessToken, {
      ...request,
      signal,
      timeoutMs: RECOMMEND_REQUEST_TIMEOUT_MS
    })
  );

  if (getTaskStatus(taskPayload) === 'FAILED') {
    throw new Error(getTaskErrorMessage(taskPayload) || '지역 접근성 지도 추천을 불러오지 못했습니다.');
  }

  if (getTaskStatus(taskPayload) === 'COMPLETED' && taskPayload?.result) {
    return { payload: taskPayload.result, cached: isTaskCached(taskPayload), progressed: false };
  }

  const taskRequestId = getTaskRequestId(taskPayload);
  if (!taskRequestId) {
    throw new Error('추천 요청 상태를 확인할 수 없습니다.');
  }

  let progressed = false;
  if (taskPayload?.result) {
    progressed = true;
    await onProgress?.(taskPayload.result);
  }

  const completedTask = await waitForRecommendTask(callWithAuth, taskRequestId, signal, async (progressResult) => {
    progressed = true;
    await onProgress?.(progressResult);
  });

  if (!completedTask || getTaskStatus(completedTask) === 'FAILED') {
    throw new Error(getTaskErrorMessage(completedTask) || '지역 접근성 지도 추천을 불러오지 못했습니다.');
  }

  return { payload: completedTask.result, cached: isTaskCached(completedTask), progressed };
}
