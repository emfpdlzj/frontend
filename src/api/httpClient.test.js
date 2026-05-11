import { ApiError, httpRequest } from './httpClient';

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) => (name.toLowerCase() === 'content-type' ? 'application/json' : '')
  },
  json: jest.fn().mockResolvedValue(payload)
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('maps 403 responses to a permission error message', async () => {
  fetch.mockResolvedValue(createJsonResponse(403, {}));

  await expect(httpRequest('/secure-area', { dedupe: false })).rejects.toMatchObject({
    status: 403,
    message: '접근 권한이 없습니다. 필요한 권한을 확인해 주세요.'
  });
});

test('maps 500 responses to a common server error message', async () => {
  fetch.mockResolvedValue(createJsonResponse(500, {}));

  await expect(httpRequest('/server-error', { dedupe: false })).rejects.toMatchObject({
    status: 500,
    message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  });
});

test('maps network failures to a user-facing network message', async () => {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));

  await expect(httpRequest('/offline', { dedupe: false })).rejects.toMatchObject({
    status: 0,
    errorCode: 'NETWORK_ERROR',
    message: '네트워크 연결을 확인할 수 없습니다. 인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.'
  });
});

test('maps request timeout aborts to an ApiError', async () => {
  jest.useFakeTimers();
  fetch.mockImplementation((_, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason));
    })
  );

  const request = httpRequest('/slow', { timeoutMs: 10, dedupe: false });

  jest.advanceTimersByTime(10);

  await expect(request).rejects.toBeInstanceOf(ApiError);
  await expect(request).rejects.toMatchObject({
    status: 408,
    errorCode: 'REQUEST_TIMEOUT',
    message: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
  });
});

test('reuses an in-flight duplicate API request', async () => {
  let resolveFetch;
  fetch.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );

  const firstRequest = httpRequest('/same?value=1');
  const secondRequest = httpRequest('/same?value=1');

  expect(fetch).toHaveBeenCalledTimes(1);

  resolveFetch(createJsonResponse(200, { result: 'ok' }));

  await expect(firstRequest).resolves.toEqual({ result: 'ok' });
  await expect(secondRequest).resolves.toEqual({ result: 'ok' });
});
