import { useEffect, useMemo, useState } from 'react';
import { FILTER_ALL_VALUE } from '../../constants/accessibilityMap';

export function JobCategoryCascadeFilter({ categories, value, onChange }) {
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const selectedPath = useMemo(() => {
    if (!value || value === FILTER_ALL_VALUE) {
      return { primary: '', secondary: '', job: '' };
    }

    for (const category of safeCategories) {
      if (category.label === value) {
        return { primary: category.label, secondary: '', job: '' };
      }

      for (const group of category.groups || []) {
        if (group.label === value) {
          return { primary: category.label, secondary: group.label, job: '' };
        }

        if ((group.jobs || []).includes(value)) {
          return { primary: category.label, secondary: group.label, job: value };
        }
      }
    }

    return { primary: '', secondary: '', job: '' };
  }, [safeCategories, value]);

  const [primaryValue, setPrimaryValue] = useState(selectedPath.primary);
  const [secondaryValue, setSecondaryValue] = useState(selectedPath.secondary);
  const primaryCategory = safeCategories.find((category) => category.label === primaryValue) || null;
  const secondaryGroup = primaryCategory?.groups?.find((group) => group.label === secondaryValue) || null;
  const selectedLabel = value && value !== FILTER_ALL_VALUE ? value : '전체';
  const selectedPathLabel = [selectedPath.primary, selectedPath.secondary, selectedPath.job].filter(Boolean).join(' > ') || selectedLabel;

  useEffect(() => {
    setPrimaryValue(selectedPath.primary);
    setSecondaryValue(selectedPath.secondary);
  }, [selectedPath.primary, selectedPath.secondary]);

  const handlePrimarySelect = (category) => {
    setPrimaryValue(category.label);
    setSecondaryValue('');
    onChange(category.label || FILTER_ALL_VALUE);
  };

  const handleSecondarySelect = (group) => {
    setSecondaryValue(group.label);
    onChange(group.label || primaryValue || FILTER_ALL_VALUE);
  };

  const handleReset = () => {
    setPrimaryValue('');
    setSecondaryValue('');
    onChange(FILTER_ALL_VALUE);
  };

  return (
    <fieldset className="onboarding-choice-group onboarding-job-picker profile-job-picker home-quick__job-picker">
      <legend className="sr-only">희망 직무 1차, 2차, 3차 선택</legend>
      <div className={`home-quick__job-picker-summary${selectedLabel !== '전체' ? ' has-selection' : ''}`}>
        {selectedLabel === '전체' ? (
          <span>선택: 전체</span>
        ) : (
          <button type="button" className="home-quick__job-picker-path" onClick={handleReset} aria-label={`${selectedPathLabel} 선택 해제`}>
            <span>{selectedPathLabel}</span>
            <span aria-hidden="true">×</span>
          </button>
        )}
        <button type="button" className="home-quick__job-picker-reset" onClick={handleReset} disabled={selectedLabel === '전체'}>
          전체
        </button>
      </div>
      {safeCategories.length ? (
        <div className="onboarding-job-picker__box">
          <div className="onboarding-job-picker__columns">
            <JobPickerColumn title="1차 선택" description="분야 선택">
              {safeCategories.map((category) => (
                <button
                  key={category.label}
                  type="button"
                  className={`onboarding-job-picker__option ${primaryValue === category.label ? 'is-active' : ''}`}
                  onClick={() => handlePrimarySelect(category)}
                >
                  <span>{category.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </JobPickerColumn>

            <JobPickerColumn title="2차 선택" description="세부 직군 선택">
              {primaryCategory?.groups?.map((group) => (
                <button
                  key={group.label}
                  type="button"
                  className={`onboarding-job-picker__option ${secondaryValue === group.label ? 'is-active' : ''}`}
                  onClick={() => handleSecondarySelect(group)}
                >
                  <span>{group.label}</span>
                  <span aria-hidden="true">›</span>
                </button>
              )) || <p className="home-quick__job-picker-empty">1차 직무를 선택해 주세요.</p>}
            </JobPickerColumn>

            <JobPickerColumn title="3차 선택" description="실제 수행 업무 선택">
              {secondaryGroup?.jobs?.map((job) => (
                <button
                  key={job}
                  type="button"
                  className={`onboarding-job-picker__option onboarding-job-picker__option--check ${selectedPath.job === job ? 'is-selected' : ''}`}
                  onClick={() => onChange(job)}
                  aria-pressed={selectedPath.job === job}
                >
                  <span>{job}</span>
                </button>
              )) || <p className="home-quick__job-picker-empty">2차 직군을 선택해 주세요.</p>}
            </JobPickerColumn>
          </div>
        </div>
      ) : (
        <p className="home-quick__job-picker-empty">선택 가능한 희망 직무 목록이 없습니다.</p>
      )}
    </fieldset>
  );
}

function JobPickerColumn({ title, description, children }) {
  return (
    <section className="onboarding-job-picker__column" aria-label={title}>
      <div className="onboarding-job-picker__column-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="onboarding-job-picker__list">{children}</div>
    </section>
  );
}

export function SelectFilter({ label, options, value, onChange, disabled = false }) {
  return (
    <label className="accessibility-map__select-field">
      <span className="sr-only">{label}</span>
      <select value={value || FILTER_ALL_VALUE} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
