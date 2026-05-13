import { API_BASE_URL } from '../config/appConfig';
import { authStorage } from '../auth/authStorage';
import { createLogger } from '../utils/logger';

const logger = createLogger('http');
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 350;
const inFlightRequests = new Map();

export class ApiError extends Error {
  constructor(message, status, errorCode, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.payload = payload;
  }
}

const HTTP_STATUS_MESSAGES = {
  401: '페이지가 유효하지 않습니다. 다시 로그인해 주세요.',
  403: '접근 권한이 없습니다. 필요한 권한을 확인해 주세요.',
  404: '요청한 정보를 찾을 수 없습니다.',
  408: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
};

const NETWORK_ERROR_MESSAGE = '네트워크 연결을 확인할 수 없습니다. 인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.';

const stableStringify = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${key}:${stableStringify(value[key])}`)
    .join(',')}}`;
};

const getStatusMessage = (status, fallbackMessage) => {
  if (status === 401) {
    return HTTP_STATUS_MESSAGES[401];
  }

  if (typeof fallbackMessage === 'string' && /jwt|token/i.test(fallbackMessage)) {
    return HTTP_STATUS_MESSAGES[status] || '페이지가 유효하지 않습니다. 다시 로그인해 주세요.';
  }

  if (fallbackMessage) {
    return fallbackMessage;
  }

  if (HTTP_STATUS_MESSAGES[status]) {
    return HTTP_STATUS_MESSAGES[status];
  }

  if (status >= 500) {
    return HTTP_STATUS_MESSAGES[500];
  }

  return `요청에 실패했습니다. (${status})`;
};

const getRequestKey = ({ method, path, token, requestBody, dedupe, isFormDataBody }) => {
  if (!dedupe || isFormDataBody) {
    return '';
  }

  return stableStringify({
    method,
    path,
    token: token === undefined ? authStorage.readTokens()?.accessToken || '' : token || '',
    body: requestBody
  });
};

const buildHeaders = (token, extraHeaders = {}) => {
  const headers = {
    ...extraHeaders
  };

  const accessToken = token === undefined ? authStorage.readTokens()?.accessToken : token;

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
};

const createAbortError = (message) => {
  if (typeof DOMException === 'function') {
    return new DOMException(message, 'AbortError');
  }

  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

const createRequestSignal = (signal, timeoutMs) => {
  if (!timeoutMs || timeoutMs <= 0) {
    return {
      signal,
      cleanup: () => {}
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(createAbortError('요청 시간이 초과되었습니다.'));
  }, timeoutMs);

  const abortRequest = () => {
    controller.abort(signal?.reason || createAbortError('요청이 취소되었습니다.'));
  };

  if (signal?.aborted) {
    abortRequest();
  } else {
    signal?.addEventListener('abort', abortRequest, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortRequest);
    }
  };
};

export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    headers,
    signal,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    retry = method === 'GET' ? 1 : 0,
    expectedErrorStatuses = [],
    dedupe = true
  } = options;

  const requestHeaders = buildHeaders(token, headers);
  const expectedErrorStatusSet = new Set(expectedErrorStatuses);
  const isFormDataBody = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestBody = body !== undefined && body !== null
    ? (isFormDataBody
        ? body
        : requestHeaders['Content-Type'] === 'application/json' || !requestHeaders['Content-Type']
        ? JSON.stringify(body)
        : body)
    : undefined;

  if (requestBody !== undefined && !isFormDataBody) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  const requestKey = getRequestKey({ method, path, token, requestBody, dedupe, isFormDataBody });

  if (requestKey && inFlightRequests.has(requestKey)) {
    logger.debug('API duplicate request reused.', { method, path });
    return inFlightRequests.get(requestKey);
  }

  const runRequest = async (attempt = 0) => {
    const requestSignal = createRequestSignal(signal, timeoutMs);
    const requestOptions = {
      method,
      headers: requestHeaders,
      signal: requestSignal.signal,
      credentials: 'include'
    };

    if (requestBody !== undefined) {
      requestOptions.body = requestBody;
    }

    logger.debug('API request started.', {
      method,
      path,
      hasBody: body !== undefined && body !== null,
      attempt
    });

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);

      const contentType = response.headers.get('content-type') || '';
      const canParseJson = contentType.includes('application/json');
      const payload = canParseJson ? await response.json() : null;

      if (!response.ok) {
        const message = getStatusMessage(response.status, payload?.message || payload?.error);
        const errorCode = payload?.errorCode || 'HTTP_ERROR';
        const errorMeta = {
          method,
          path,
          status: response.status,
          errorCode
        };

        if (!expectedErrorStatusSet.has(response.status)) {
          if (response.status >= 500) {
            logger.error('API request failed.', errorMeta);
          } else {
            logger.warn('API request failed.', errorMeta);
          }
        }

        const apiError = new ApiError(message, response.status, errorCode, payload);

        if (attempt < retry && RETRYABLE_STATUS_CODES.has(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
          return runRequest(attempt + 1);
        }

        throw apiError;
      }

      logger.info('API request succeeded.', {
        method,
        path,
        status: response.status
      });

      return payload;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      const abortReason = requestSignal.signal?.reason;
      const abortMessage = abortReason?.message || '';

      if (error?.name === 'AbortError' && abortMessage.includes('초과')) {
        throw new ApiError(HTTP_STATUS_MESSAGES[408], 408, 'REQUEST_TIMEOUT');
      }

      if (error?.name === 'AbortError') {
        throw error;
      }

      logger.warn('API network request failed.', {
        method,
        path,
        apiBaseUrl: API_BASE_URL,
        errorName: error?.name,
        errorMessage: error?.message,
        isOnline: typeof navigator === 'undefined' ? undefined : navigator.onLine
      });

      throw new ApiError(NETWORK_ERROR_MESSAGE, 0, 'NETWORK_ERROR', {
        originalMessage: error?.message
      });
    } finally {
      requestSignal.cleanup();
    }
  };

  const requestPromise = runRequest().finally(() => {
    if (requestKey && inFlightRequests.get(requestKey) === requestPromise) {
      inFlightRequests.delete(requestKey);
    }
  });

  if (requestKey) {
    inFlightRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
}
