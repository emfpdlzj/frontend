const fallbackOptions = [{ value: 'ALL', label: '전체' }];

const staticAdvancedFilters = [
  ['career', '경력 조건', ['전체', '신입', '경력', '무관']],
  ['education', '학력 조건', ['전체', '학력 무관', '고졸', '전문대졸', '대졸 이상']],
  ['deadline', '마감 임박 여부', ['전체', '마감 3일 이내', '마감 7일 이내']],
  ['standard', '표준사업장 여부', ['전체', '표준사업장']],
  ['disabled', '장애인 우대 여부', ['전체', '우대 공고']]
];

function toSelectOptions(options) {
  return options?.length ? [{ value: 'ALL', label: '전체' }, ...options] : fallbackOptions;
}

function FilterControl({ id, label, value, options, isSearch = false }) {
  return (
    <label className="jobs-filter__field" htmlFor={`jobs-filter-${id}`}>
      <span>{label}</span>
      {isSearch ? (
        <input id={`jobs-filter-${id}`} type="search" placeholder={value} aria-label={label} />
      ) : (
        <select id={`jobs-filter-${id}`} defaultValue="ALL" aria-label={label}>
          {options.map((option) => (
            <option key={`${id}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

export function JobFilterBar({
  selectedFilters,
  isAdvancedOpen,
  apiContract,
  optionState,
  sortKey,
  onChangeSort,
  onToggleAdvanced
}) {
  const jobOptions = toSelectOptions(optionState?.jobOptions);
  const regionOptions = toSelectOptions(optionState?.regions);
  const employmentOptions = toSelectOptions(optionState?.employmentTypes);
  const salaryOptions = toSelectOptions(optionState?.salaryTypes);

  return (
    <aside className="jobs-filter" aria-label="공고 검색 및 필터">
      <header className="jobs-filter__header">
        <h2>공고 필터</h2>
        <p>최신 공고를 빠르게 좁혀보고, 선택 공고는 오른쪽에서 자세히 확인합니다.</p>
      </header>
      <div className="jobs-filter__main-row">
        <FilterControl id="keyword" label="키워드 검색" value="직무명, 회사명, 지역 검색" isSearch />
        <FilterControl id="role" label="희망 직무" options={jobOptions} />
        <FilterControl id="region" label="희망 근무지역" options={regionOptions} />
        <FilterControl id="employment" label="고용형태" options={employmentOptions} />
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
          <FilterControl id="salary" label="급여 방식" options={salaryOptions} />
          {staticAdvancedFilters.map(([id, label, values]) => (
            <FilterControl
              key={id}
              id={id}
              label={label}
              options={values.map((item) => ({ value: item, label: item }))}
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

      <div className="jobs-filter__chips" aria-label="선택된 필터">
        {selectedFilters.map((filter) => (
          <button key={filter} type="button" className="jobs-filter__chip" aria-label={`${filter} 필터 제거`}>
            <span>{filter}</span>
            <strong aria-hidden="true">X</strong>
          </button>
        ))}
        <button type="button" className="jobs-filter__reset-button">
          전체 초기화
        </button>
      </div>

      <div className="jobs-filter__api-note">
        <strong>기능2 API</strong>
        <span>{apiContract?.endpoint}</span>
        <p>
          {apiContract?.request.aiEnabled
            ? apiContract.request.profileId
              ? `profileId ${apiContract.request.profileId} 기준 AI 적합도 사용`
              : '프로필 선택 후 AI 적합도 요청'
            : 'AI OFF · Spring DB 최신순 조회'}
        </p>
        {apiContract?.cacheTtlMinutes ? (
          <p>동일 조건 결과는 {apiContract.cacheTtlMinutes}분간 재사용합니다.</p>
        ) : null}
      </div>
    </aside>
  );
}
