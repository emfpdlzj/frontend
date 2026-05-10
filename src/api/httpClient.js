import { API_BASE_URL } from '../config/appConfig';
import { authStorage } from '../auth/authStorage';
import { createLogger } from '../utils/logger';

const logger = createLogger('http');
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 350;

export class ApiError extends Error {
  constructor(message, status, errorCode, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.payload = payload;
  }
}

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
    expectedErrorStatuses = []
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
        const message = payload?.message || payload?.error || `요청에 실패했습니다. (${response.status})`;
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
    } finally {
      requestSignal.cleanup();
    }
  };

  return runRequest();
}
