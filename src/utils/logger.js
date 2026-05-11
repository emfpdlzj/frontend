const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const DEFAULT_LEVEL_BY_ENV = {
  development: 'debug',
  test: 'error',
  production: 'warn'
};

const normalizeLogLevel = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, normalized) ? normalized : null;
};

const resolveLogLevel = () => {
  const envLevel = normalizeLogLevel(process.env.REACT_APP_LOG_LEVEL);

  if (envLevel) {
    return envLevel;
  }

  return DEFAULT_LEVEL_BY_ENV[process.env.NODE_ENV] || 'info';
};

const ACTIVE_LOG_LEVEL = resolveLogLevel();
const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /authorization|password|passwd|token|secret|credential|api[-_]?key|session|jwt/i;

const shouldLog = (level) => LOG_LEVELS[level] <= LOG_LEVELS[ACTIVE_LOG_LEVEL];

const buildPrefix = (scope, level) => {
  const segments = ['[BridgeWork]', `[${level.toUpperCase()}]`];

  if (scope) {
    segments.push(`[${scope}]`);
  }

  return segments.join(' ');
};

const getConsoleMethod = (level) => {
  if (level === 'debug') {
    return console.debug;
  }

  if (level === 'info') {
    return console.info;
  }

  if (level === 'warn') {
    return console.warn;
  }

  return console.error;
};

export const sanitizeLogMeta = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      status: value.status,
      errorCode: value.errorCode,
      payload: sanitizeLogMeta(value.payload, seen)
    };
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogMeta(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_VALUE : sanitizeLogMeta(entryValue, seen)
    ])
  );
};

const writeLog = (scope, level, message, meta) => {
  if (!shouldLog(level)) {
    return;
  }

  const method = getConsoleMethod(level);
  const prefix = buildPrefix(scope, level);

  if (meta === undefined) {
    method(prefix, message);
    return;
  }

  method(prefix, message, sanitizeLogMeta(meta));
};

export const loggerConfig = {
  activeLevel: ACTIVE_LOG_LEVEL,
  levels: Object.keys(LOG_LEVELS)
};

export const createLogger = (scope) => ({
  error(message, meta) {
    writeLog(scope, 'error', message, meta);
  },
  warn(message, meta) {
    writeLog(scope, 'warn', message, meta);
  },
  info(message, meta) {
    writeLog(scope, 'info', message, meta);
  },
  debug(message, meta) {
    writeLog(scope, 'debug', message, meta);
  }
});
