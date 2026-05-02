import { API_BASE_URL } from '../config/appConfig';
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

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    token,
    body,
    headers,
    signal
  } = options;

  const requestHeaders = buildHeaders(token, headers);
  const requestOptions = {
    method,
    headers: requestHeaders,
    signal
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

  const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);

  const contentType = response.headers.get('content-type') || '';
  const canParseJson = contentType.includes('application/json');
  const payload = canParseJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `요청에 실패했습니다. (${response.status})`;
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
}
