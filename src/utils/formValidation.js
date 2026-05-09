import { normalizeBirthDate } from './birthDate';

export const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

export const formatMismatchMessage = (example) => `형식이 일치하지 않아요. "${example}"의 형태로 입력해주세요.`;

export const fieldFormats = {
  name: {
    example: '홍길동',
    isValid: (value) => /^[가-힣a-zA-Z\s]{2,30}$/.test(value.trim())
  },
  phone: {
    example: '010-1234-5678',
    isValid: (value) => /^01[016789]-\d{3,4}-\d{4}$/.test(value.trim())
  },
  email: {
    example: 'me@bridgework.com',
    isValid: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },
  birthDate: {
    example: 'YYYY.MM.DD',
    isValid: (value) => Boolean(normalizeBirthDate(value))
  }
};

export const getFieldFormatMessage = (field, value) => {
  const format = fieldFormats[field];
  const text = String(value ?? '').trim();

  if (!format || !text || format.isValid(text)) {
    return '';
  }

  return formatMismatchMessage(format.example);
};
