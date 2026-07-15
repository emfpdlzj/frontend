export const TOKEN_STORAGE_POLICY = Object.freeze({
  accessToken: 'memory',
  refreshToken: 'httpOnlySecureSameSiteCookie',
  localStorageAllowed: false,
  rationale:
    'Access tokens stay in memory only. Refresh tokens are managed exclusively by the Spring Backend in HttpOnly Secure SameSite cookies.'
});

export const ADMIN_ROLE_VALUES = Object.freeze(['ADMIN', 'ROLE_ADMIN']);

export const FILE_UPLOAD_POLICY = Object.freeze({
  portfolioPdf: {
    allowedExtensions: Object.freeze(['.pdf']),
    allowedMimeTypes: Object.freeze(['application/pdf'])
  }
});
