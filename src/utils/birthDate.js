export const MIN_WORKING_AGE = 15;
export const MIN_WORKING_AGE_MESSAGE = '근로기준법상 취업 가능한 노동 가능 연령은 원칙적으로 만 15세 이상입니다.';

export const normalizeBirthDate = (value) => {
  const match = String(value ?? '')
    .trim()
    .match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/);

  if (!match) {
    return '';
  }

  const [, rawYear, rawMonth, rawDay] = match;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return '';
  }

  return `${rawYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const toBirthDateDisplay = (value) => value.replaceAll('-', '.');

export const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const toCalendarDate = (value) => {
  const normalized = normalizeBirthDate(value);

  if (!normalized) {
    return null;
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

export const toMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const getLatestAllowedBirthYear = (today = new Date()) => today.getFullYear() - MIN_WORKING_AGE;

export const getBirthYearOptions = () => {
  const latestYear = getLatestAllowedBirthYear();
  const earliestYear = latestYear - 100;

  return Array.from({ length: latestYear - earliestYear + 1 }, (_, index) => latestYear - index);
};

export const monthOptions = Array.from({ length: 12 }, (_, index) => index);

const getFullAge = (birthDate, today = new Date()) => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

export const isUnderMinimumWorkingAge = (birthDate) => getFullAge(birthDate) < MIN_WORKING_AGE;

export const getCalendarDays = (monthDate) => {
  const firstDay = toMonthStart(monthDate);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};
