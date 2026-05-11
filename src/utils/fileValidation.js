const getFileExtension = (fileName = '') => {
  const normalizedName = String(fileName).trim().toLowerCase();
  const extensionStart = normalizedName.lastIndexOf('.');

  return extensionStart >= 0 ? normalizedName.slice(extensionStart) : '';
};

export const validateFileUpload = (file, policy) => {
  if (!file) {
    return { ok: false, reason: '파일을 선택해 주세요.' };
  }

  const extension = getFileExtension(file.name);
  const mimeType = String(file.type || '').toLowerCase();
  const allowedExtensions = policy?.allowedExtensions || [];
  const allowedMimeTypes = policy?.allowedMimeTypes || [];
  const hasAllowedExtension = allowedExtensions.includes(extension);
  const hasAllowedMimeType = mimeType ? allowedMimeTypes.includes(mimeType) : true;

  if (!hasAllowedExtension || !hasAllowedMimeType) {
    const allowedLabel = allowedExtensions
      .map((extension) => extension.replace(/^\./, '').toUpperCase())
      .join(', ');

    return {
      ok: false,
      reason: `${allowedLabel} 파일만 업로드할 수 있습니다.`
    };
  }

  return { ok: true };
};
