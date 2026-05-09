import { httpRequest } from './httpClient';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

const normalizeOptions = (payload) => {
  const result = unwrapApiResult(payload);

  if (!Array.isArray(result)) {
    return [];
  }

  return result
    .map((option) => ({
      value: String(option?.value ?? option?.code ?? option?.name ?? '').trim(),
      label: String(option?.label ?? option?.name ?? option?.value ?? '').trim()
    }))
    .filter((option) => option.value && option.label);
};

export const optionsApi = {
  async getEmploymentTypes(signal) {
    return normalizeOptions(await httpRequest('/options/employment-types', { token: null, signal }));
  },

  async getJobCategoryTree(signal) {
    const payload = await httpRequest('/options/job-categories/tree', { token: null, signal });
    const result = unwrapApiResult(payload);
    return Array.isArray(result) ? result : [];
  },

  async getRegions(signal) {
    return normalizeOptions(await httpRequest('/options/regions', { token: null, signal }));
  },

  async getSalaryTypes(signal) {
    return normalizeOptions(await httpRequest('/options/salary-types', { token: null, signal }));
  }
};
