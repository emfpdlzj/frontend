import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export const JOB_FILTER_ALL_VALUE = 'ALL';

const staticAdvancedFilters = [
  ['career', '경력 조건', ['신입', '경력', '무관']],
  ['education', '학력 조건', ['학력 무관', '고졸', '전문대졸', '대졸 이상']],
  ['deadline', '마감 임박 여부', ['마감 3일 이내', '마감 7일 이내']],
  ['standard', '표준사업장 여부', ['표준사업장']],
  ['disabled', '장애인 우대 여부', ['우대 공고']]
];
const fallbackOptions = [{ value: JOB_FILTER_ALL_VALUE, label: '전체' }];

function toLabelValueOptions(options) {
  return options?.length
    ? [
        { value: JOB_FILTER_ALL_VALUE, label: '전체' },
        ...options.map((option) => ({
          value: option.label,
          label: option.label
        }))
      ]
    : fallbackOptions;
}

function toStaticOptions(values) {
  return [
    { value: JOB_FILTER_ALL_VALUE, label: '전체' },
    ...values.map((item) => ({ value: item, label: item }))
  ];
}

function SearchFilterControl({ id, label, value, placeholder, onChange }) {
  const [localSearchValue, setLocalSearchValue] = useState(value || '');
  const debouncedSearchValue = useDebouncedValue(localSearchValue, 250);

  useEffect(() => {
    setLocalSearchValue(value || '');
  }, [value]);

  useEffect(() => {
    if (debouncedSearchValue !== value) {
      onChange(id, debouncedSearchValue);
    }
  }, [debouncedSearchValue, id, onChange, value]);

  return (
    <label className="jobs-filter__field" htmlFor={`jobs-filter-${id}`}>
      <span>{label}</span>
      <input
        id={`jobs-filter-${id}`}
        type="search"
        value={localSearchValue}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => setLocalSearchValue(event.target.value)}
      />
    </label>
  );
}

function FilterControl({ id, label, value, options, onChange }) {
  return (
    <label className="jobs-filter__field" htmlFor={`jobs-filter-${id}`}>
      <span>{label}</span>
      <select
        id={`jobs-filter-${id}`}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(id, event.target.value)}
      >
        {options.map((option) => (
          <option key={`${id}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function JobCategoryCascadeControl({ categories, primaryValue: selectedPrimaryValue, secondaryValue: selectedSecondaryValue, value, onChange }) {
  const selectedPath = useMemo(() => {
    for (const category of categories) {
      for (const group of category.groups) {
        if (group.jobs.includes(value)) {
          return {
            primary: category.label,
            secondary: group.label
          };
        }
      }
    }

    return {
      primary: selectedPrimaryValue || '',
      secondary: selectedSecondaryValue || ''
    };
  }, [categories, selectedPrimaryValue, selectedSecondaryValue, value]);
  const [primaryValue, setPrimaryValue] = useState(selectedPath.primary);
  const [secondaryValue, setSecondaryValue] = useState(selectedPath.secondary);
  const primaryCategory = categories.find((category) => category.label === primaryValue) || null;
  const secondaryGroup = primaryCategory?.groups.find((group) => group.label === secondaryValue) || null;

  useEffect(() => {
    setPrimaryValue(selectedPath.primary);
    setSecondaryValue(selectedPath.secondary);
  }, [selectedPath.primary, selectedPath.secondary]);

  const handlePrimaryChange = (nextPrimary) => {
    setPrimaryValue(nextPrimary);
    setSecondaryValue('');
    onChange({
      rolePrimary: nextPrimary,
      roleSecondary: '',
      role: JOB_FILTER_ALL_VALUE
    });
  };

  const handleSecondaryChange = (nextSecondary) => {
    setSecondaryValue(nextSecondary);
    onChange({
      rolePrimary: primaryValue,
      roleSecondary: nextSecondary,
      role: JOB_FILTER_ALL_VALUE
    });
  };

  return (
    <fieldset className="jobs-filter__cascade" aria-label="희망 직무 1차, 2차, 3차 선택">
      <legend>희망 직무</legend>
      <label htmlFor="jobs-filter-role-primary">
        <span>1차</span>
        <select
          id="jobs-filter-role-primary"
          value={primaryValue}
          onChange={(event) => handlePrimaryChange(event.target.value)}
        >
          <option value="">전체</option>
          {categories.map((category) => (
            <option key={category.label} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="jobs-filter-role-secondary">
        <span>2차</span>
        <select
          id="jobs-filter-role-secondary"
          value={secondaryValue}
          disabled={!primaryCategory}
          onChange={(event) => handleSecondaryChange(event.target.value)}
        >
          <option value="">전체</option>
          {primaryCategory?.groups.map((group) => (
            <option key={group.label} value={group.label}>
              {group.label}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="jobs-filter-role">
        <span>3차</span>
        <select
          id="jobs-filter-role"
          value={value && value !== JOB_FILTER_ALL_VALUE ? value : JOB_FILTER_ALL_VALUE}
          disabled={!secondaryGroup}
          onChange={(event) => onChange('role', event.target.value)}
        >
          <option value={JOB_FILTER_ALL_VALUE}>전체</option>
          {secondaryGroup?.jobs.map((job) => (
            <option key={job} value={job}>
              {job}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

export function JobFilterBar({
  isAdvancedOpen,
  filterValues,
  optionState,
  sortKey,
  onChangeFilter,
  onChangeSort,
  onResetFilters,
  onToggleAdvanced
}) {
  const regionOptions = toLabelValueOptions(optionState?.regions);
  const employmentOptions = toLabelValueOptions(optionState?.employmentTypes);
  const salaryOptions = toLabelValueOptions(optionState?.salaryTypes);
  const jobCategories = Array.isArray(optionState?.jobCategories) ? optionState.jobCategories : [];

  return (
    <aside className="jobs-filter" aria-label="공고 검색 및 필터">
      <header className="jobs-filter__header">
        <h2>공고 필터</h2>
        <p>최신 공고를 빠르게 좁혀보고, 선택 공고는 오른쪽에서 자세히 확인합니다.</p>
      </header>
      <div className="jobs-filter__main-row">
        <SearchFilterControl
          id="keyword"
          label="키워드 검색"
          value={filterValues.keyword}
          placeholder="직무명, 회사명, 지역 검색"
          onChange={onChangeFilter}
        />
        <JobCategoryCascadeControl
          categories={jobCategories}
          primaryValue={filterValues.rolePrimary}
          secondaryValue={filterValues.roleSecondary}
          value={filterValues.role}
          onChange={onChangeFilter}
        />
        <FilterControl id="region" label="희망 근무지역" value={filterValues.region} options={regionOptions} onChange={onChangeFilter} />
        <FilterControl
          id="employment"
          label="고용형태"
          value={filterValues.employment}
          options={employmentOptions}
          onChange={onChangeFilter}
        />
        <label className="jobs-filter__field jobs-filter__field--sort" htmlFor="jobs-filter-sort-main">
          <span>정렬 기준</span>
          <select
            id="jobs-filter-sort-main"
            value={sortKey}
            aria-label="정렬 기준"
            onChange={(event) => onChangeSort(event.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감임박순</option>
            <option value="match">직무 적합도 높은순</option>
            <option value="salary">임금 높은순</option>
          </select>
        </label>
        <button type="button" className="jobs-filter__reset-button" onClick={onResetFilters}>
          필터 초기화
        </button>
        <button
          type="button"
          className="jobs-filter__detail-button"
          aria-expanded={isAdvancedOpen}
          onClick={onToggleAdvanced}
        >
          {isAdvancedOpen ? '상세 필터 닫기' : '상세 필터 열기'}
        </button>
      </div>

      {isAdvancedOpen ? (
        <div className="jobs-filter__advanced" aria-label="상세 필터">
          <FilterControl
            id="salary"
            label="급여 방식"
            value={filterValues.salary}
            options={salaryOptions}
            onChange={onChangeFilter}
          />
          {staticAdvancedFilters.map(([id, label, values]) => (
            <FilterControl
              key={id}
              id={id}
              label={label}
              value={filterValues[id]}
              options={toStaticOptions(values)}
              onChange={onChangeFilter}
            />
          ))}
        </div>
      ) : null}

      {optionState?.status === 'loading' ? (
        <div className="jobs-filter__option-status" role="status">필터 옵션을 불러오는 중입니다.</div>
      ) : null}
      {optionState?.status === 'error' ? (
        <div className="jobs-filter__option-status is-error" role="alert">
          {optionState.error || '필터 옵션을 불러오지 못했습니다.'}
        </div>
      ) : null}
    </aside>
  );
}
