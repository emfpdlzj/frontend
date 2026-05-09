import { API_BASE_URL } from '../config/appConfig';
import { authStorage } from '../auth/authStorage';
import { createLogger } from '../utils/logger';

const logger = createLogger('http');

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
    timeoutMs
  } = options;

  const requestHeaders = buildHeaders(token, headers);
  const requestSignal = createRequestSignal(signal, timeoutMs);
  const requestOptions = {
    method,
    headers: requestHeaders,
    signal: requestSignal.signal
  };

  if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    requestOptions.body = requestHeaders['Content-Type'] === 'application/json'
      ? JSON.stringify(body)
      : body;
  }

  logger.debug('API request started.', {
    method,
    path,
    hasBody: body !== undefined && body !== null
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

      if (response.status >= 500) {
        logger.error('API request failed.', errorMeta);
      } else {
        logger.warn('API request failed.', errorMeta);
      }

      throw new ApiError(message, response.status, errorCode, payload);
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
}
