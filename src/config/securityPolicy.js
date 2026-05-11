export const TOKEN_STORAGE_POLICY = Object.freeze({
  accessToken: 'memory',
  refreshToken: 'sessionStorage',
  targetRefreshTokenStorage: 'httpOnlySecureSameSiteCookie',
  localStorageAllowed: false,
  rationale:
    'Access tokens stay in memory only. Refresh tokens use sessionStorage only as a frontend fallback until the Spring Backend issues HttpOnly Secure SameSite cookies.'
});

export const ADMIN_ROLE_VALUES = Object.freeze(['ADMIN', 'ROLE_ADMIN']);

export const FILE_UPLOAD_POLICY = Object.freeze({
  portfolioPdf: {
    allowedExtensions: Object.freeze(['.pdf']),
    allowedMimeTypes: Object.freeze(['application/pdf'])
  }
});
