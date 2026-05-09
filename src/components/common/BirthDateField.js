import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MIN_WORKING_AGE_MESSAGE,
  addMonths,
  getBirthYearOptions,
  getCalendarDays,
  isUnderMinimumWorkingAge,
  monthOptions,
  normalizeBirthDate,
  toBirthDateDisplay,
  toCalendarDate,
  toDateValue,
  toMonthStart
} from '../../utils/birthDate';

const formatInputValue = (value) => {
  const normalized = normalizeBirthDate(value);
  return normalized ? toBirthDateDisplay(normalized) : value || '';
};

const formatOutputValue = (value, outputFormat) => {
  const normalized = normalizeBirthDate(value);

  if (!normalized) {
    return outputFormat === 'iso' ? '' : value;
  }

  return outputFormat === 'iso' ? normalized : toBirthDateDisplay(normalized);
};

export function BirthDateField({
  id = 'birth-date',
  label,
  required,
  placeholder = 'YYYY.MM.DD',
  value,
  onChange,
  onBlur = () => {},
  error,
  outputFormat = 'display',
  showAgeHint = true,
  className = ''
}) {
  const fieldRef = useRef(null);
  const dialogId = `${id}-calendar`;
  const [inputValue, setInputValue] = useState(() => formatInputValue(value));
  const selectedDate = toCalendarDate(inputValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [ageRestrictionError, setAgeRestrictionError] = useState('');
  const [openSelector, setOpenSelector] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => toMonthStart(selectedDate || new Date()));
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const yearOptions = useMemo(() => getBirthYearOptions(), []);
  const todayValue = toDateValue(new Date());
  const selectedValue = selectedDate ? toDateValue(selectedDate) : '';
  const visibleError = ageRestrictionError || error;

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatInputValue(value));
    }
  }, [isFocused, value]);

  useEffect(() => {
    const nextSelectedDate = toCalendarDate(selectedValue);

    if (nextSelectedDate) {
      setVisibleMonth(toMonthStart(nextSelectedDate));
    }
  }, [selectedValue]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!fieldRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenSelector('');
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDatePicker = () => {
    setIsOpen((open) => {
      if (open) {
        setOpenSelector('');
      }

      return !open;
    });
  };

  const commitBirthDate = (nextValue) => {
    const nextDate = toCalendarDate(nextValue);

    if (nextDate && isUnderMinimumWorkingAge(nextDate)) {
      setAgeRestrictionError(MIN_WORKING_AGE_MESSAGE);
      return false;
    }

    setAgeRestrictionError('');
    setInputValue(nextValue);

    if (outputFormat !== 'iso' || !nextValue || normalizeBirthDate(nextValue)) {
      onChange(formatOutputValue(nextValue, outputFormat));
    }

    return true;
  };

  const handleTextChange = (event) => {
    commitBirthDate(event.target.value);
  };

  const handleTextBlur = () => {
    setIsFocused(false);
    const normalized = normalizeBirthDate(inputValue);

    if (normalized) {
      const displayValue = toBirthDateDisplay(normalized);
      setInputValue(displayValue);
      onChange(formatOutputValue(displayValue, outputFormat));
    }

    onBlur();
  };

  const selectDate = (date) => {
    if (commitBirthDate(toBirthDateDisplay(toDateValue(date)))) {
      setIsOpen(false);
    }
  };

  const selectToday = () => {
    const today = new Date();
    if (commitBirthDate(toBirthDateDisplay(toDateValue(today)))) {
      setVisibleMonth(toMonthStart(today));
      setIsOpen(false);
    }
  };

  const clearDate = () => {
    setAgeRestrictionError('');
    setInputValue('');
    onChange('');
    setOpenSelector('');
    setIsOpen(false);
  };

  const updateVisibleYear = (year) => {
    setVisibleMonth((month) => new Date(year, month.getMonth(), 1));
    setOpenSelector('');
  };

  const updateVisibleMonth = (monthIndex) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), monthIndex, 1));
    setOpenSelector('');
  };

  const toggleSelector = (selector) => {
    setOpenSelector((current) => (current === selector ? '' : selector));
  };

  return (
    <div className={`onboarding-field onboarding-date-field ${className}`.trim()} ref={fieldRef}>
      {label ? (
        <span>
          <span className="onboarding-field-label">
            {label}
            {required ? <em aria-label="필수">*</em> : null}
          </span>
        </span>
      ) : null}
      <span className="onboarding-input-wrap onboarding-input-wrap--with-button">
        <input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          inputMode="numeric"
          autoComplete="bday"
          aria-label={label || '생년월일'}
          aria-describedby={visibleError ? `${id}-error` : undefined}
          onFocus={() => setIsFocused(true)}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
        />
        <button
          type="button"
          className="onboarding-date-picker-button"
          onClick={toggleDatePicker}
          aria-label="캘린더에서 생년월일 선택"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={dialogId}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="onboarding-input-icon">
            <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1.5A2.5 2.5 0 0 1 22 6.5v12A2.5 2.5 0 0 1 19.5 21h-15A2.5 2.5 0 0 1 2 18.5v-12A2.5 2.5 0 0 1 4.5 4H6V3a1 1 0 0 1 1-1Zm12.5 8h-15v8.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V10ZM5 6a.5.5 0 0 0-.5.5V8h15V6.5A.5.5 0 0 0 19 6H5Z" />
          </svg>
        </button>
        {isOpen ? (
          <div className="onboarding-calendar-popover" id={dialogId} role="dialog" aria-modal="false" aria-label="생년월일 달력">
            <div className="onboarding-calendar-head">
              <div className="onboarding-calendar-title" aria-live="polite">
                <div className="onboarding-calendar-select-wrap">
                  <button
                    type="button"
                    className="onboarding-calendar-select-button"
                    onClick={() => toggleSelector('year')}
                    aria-haspopup="listbox"
                    aria-expanded={openSelector === 'year'}
                  >
                    {visibleMonth.getFullYear()}년
                    <span aria-hidden="true">⌄</span>
                  </button>
                  {openSelector === 'year' ? (
                    <div className="onboarding-calendar-select-menu onboarding-calendar-select-menu--year" role="listbox" aria-label="연도 선택">
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type="button"
                          role="option"
                          aria-selected={visibleMonth.getFullYear() === year}
                          className={visibleMonth.getFullYear() === year ? 'is-selected' : ''}
                          onClick={() => updateVisibleYear(year)}
                        >
                          {year}년
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="onboarding-calendar-select-wrap">
                  <button
                    type="button"
                    className="onboarding-calendar-select-button"
                    onClick={() => toggleSelector('month')}
                    aria-haspopup="listbox"
                    aria-expanded={openSelector === 'month'}
                  >
                    {visibleMonth.getMonth() + 1}월
                    <span aria-hidden="true">⌄</span>
                  </button>
                  {openSelector === 'month' ? (
                    <div className="onboarding-calendar-select-menu" role="listbox" aria-label="월 선택">
                      {monthOptions.map((monthIndex) => (
                        <button
                          key={monthIndex}
                          type="button"
                          role="option"
                          aria-selected={visibleMonth.getMonth() === monthIndex}
                          className={visibleMonth.getMonth() === monthIndex ? 'is-selected' : ''}
                          onClick={() => updateVisibleMonth(monthIndex)}
                        >
                          {monthIndex + 1}월
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="onboarding-calendar-nav" aria-label="월 이동">
                <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, -1))} aria-label="이전 월">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M15.7 5.3a1 1 0 0 1 0 1.4L10.42 12l5.3 5.3a1 1 0 1 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" />
                  </svg>
                </button>
                <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} aria-label="다음 월">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M8.3 18.7a1 1 0 0 1 0-1.4l5.28-5.3-5.3-5.3A1 1 0 0 1 9.7 5.3l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.42 0Z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="onboarding-calendar-weekdays" aria-hidden="true">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="onboarding-calendar-grid" role="group" aria-label={`${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월 날짜 선택`}>
              {calendarDays.map((date) => {
                const dateValue = toDateValue(date);
                const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                const isSelected = dateValue === selectedValue;
                const isToday = dateValue === todayValue;

                return (
                  <button
                    key={dateValue}
                    type="button"
                    className={[
                      'onboarding-calendar-day',
                      isCurrentMonth ? '' : 'is-muted',
                      isSelected ? 'is-selected' : '',
                      isToday ? 'is-today' : ''
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => selectDate(date)}
                    aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일${isToday ? ', 오늘' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="onboarding-calendar-actions">
              <button type="button" className="onboarding-calendar-action onboarding-calendar-action--ghost" onClick={clearDate}>
                삭제
              </button>
              <button type="button" className="onboarding-calendar-action onboarding-calendar-action--primary" onClick={selectToday}>
                오늘
              </button>
            </div>
          </div>
        ) : null}
      </span>
      {visibleError ? (
        <small className="onboarding-field-error" id={`${id}-error`} role="alert">
          {visibleError}
        </small>
      ) : showAgeHint ? (
        <small className="onboarding-field-hint">{MIN_WORKING_AGE_MESSAGE}</small>
      ) : null}
    </div>
  );
}
