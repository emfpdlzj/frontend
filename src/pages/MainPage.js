import { Link } from 'react-router-dom';
import arrowDown from '../assets/accessibility-map/arrow_down.png';
import profileIcon from '../assets/accessibility-map/profile-icon.png';
import settingIcon from '../assets/accessibility-map/setting-icon.png';
import { LoginModal } from '../components/auth/LoginModal';
import { AccessibilityScoreHelpButton } from '../components/accessibility-map/AccessibilityMapDetailPanel';
import { PopularPostingDetailModal } from '../components/jobs/PopularPostingDetailModal';
import { ScrapConfirmModal } from '../components/jobs/ScrapConfirmModal';
import { JobCategoryCascadeFilter, SelectFilter } from '../components/quick-jobs/QuickJobFilters';
import { VisibilityTriggeredScoreRing } from '../components/quick-jobs/QuickScoreRing';
import { COMMUTABLE_FILTER_ID } from '../constants/accessibilityMap';
import { ROUTE_PATHS } from '../config/routes';
import { useMainPageController } from '../hooks/useMainPageController';
import {
  formatHomeNoticeDate,
  getProfileDisplayName,
  getProfileId,
  getQuickGradeClassName,
  getQuickScoreHeadline
} from '../utils/quickJobs';

export { PopularPostingDetailModal } from '../components/jobs/PopularPostingDetailModal';

export function MainPage({ view = 'home' }) {
  const {
    appliedAiEnabled,
    closedProfileLabel,
    detailModalOpen,
    detailModalQuickExplainState,
    detailState,
    draftFilters,
    effectiveSelectedProfileId,
    filteredQuickJobs,
    handleApplyQuickFilters,
    handleCloseDetailModal,
    handleOpenPopularPosting,
    handleOpenQuickPosting,
    handleOpenScrapConfirm,
    handleResetQuickFilters,
    handleScrapConfirm,
    handleToggleQuickAi,
    handleToggleQuickCommutableOnly,
    isAiEnabled,
    isGuestUser,
    isHomePage,
    isLoginModalOpen,
    isProfileMenuOpen,
    isQuickBatchLoading,
    isQuickCommutableOnlyApplied,
    isQuickCommutableToggleDisabled,
    isQuickFilterCollapsed,
    isQuickPage,
    isScrapping,
    localizePath,
    noticeState,
    openLoginModal,
    orderedFilterGroups,
    orderedProfiles,
    popularScrollerRef,
    popularState,
    profilesState,
    quickDetailState,
    quickLoadMoreSentinelRef,
    quickLoadingLoaded,
    quickLoadingTarget,
    quickProfileSelectRef,
    quickResultCount,
    quickResultListRef,
    quickState,
    scrapConfirmOpen,
    selectedProfileId,
    setDraftFilters,
    setIsLoginModalOpen,
    setIsPopularCarouselPaused,
    setIsProfileMenuOpen,
    setIsQuickFilterCollapsed,
    setScrapConfirmOpen,
    setSelectedProfileId,
    shouldShowQuickHeader,
    shouldShowQuickResults,
    supportOrganizations,
    supportSectionCopy,
    visibleSelectedProfile
  } = useMainPageController(view);

return (
    <main className={`main-page${isQuickPage ? ' main-page--quick' : ''}`} aria-labelledby={isQuickPage ? 'quick-recommend-title' : 'main-page-title'}>
      <div className="main-page__inner">
        {isHomePage ? (
          <>
            <section className="home-overview" aria-labelledby="main-page-title">
              <div className="home-overview__heading">
                <p className="home-eyebrow">홈화면</p>
                <h1 id="main-page-title">현재 인기 공고</h1>
                <p>사람들이 많이 스크랩한 공고들을 스크랩 해보세요.</p>
              </div>
            </section>

            <section className="home-popular home-section-entrance home-section-entrance--popular" aria-labelledby="popular-postings-title">
              <div className="home-section-head">
                <div>
                  <div className="home-section-title-with-help">
                    <h2 id="popular-postings-title">인기 공고 TOP 20</h2>
                    <AccessibilityScoreHelpButton />
                  </div>
                </div>
              </div>

              {popularState.status === 'loading' ? <div className="home-feedback" role="status">인기 공고를 불러오는 중입니다.</div> : null}
              {popularState.status === 'error' ? <div className="home-feedback is-error" role="alert">{popularState.error}</div> : null}

              {popularState.status === 'success' ? (
                <div
                  ref={popularScrollerRef}
                  className="home-popular__scroller"
                  aria-label="인기 공고 목록"
                  onMouseEnter={() => setIsPopularCarouselPaused(true)}
                  onMouseLeave={() => setIsPopularCarouselPaused(false)}
                  onFocusCapture={() => setIsPopularCarouselPaused(true)}
                  onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsPopularCarouselPaused(false);
                    }
                  }}
                >
                  {popularState.items.map((item) => (
                    <button
                      key={item.postingId}
                      type="button"
                      className="home-popular__card"
                      onClick={() => handleOpenPopularPosting(item.postingId)}
                    >
                      <div className="home-popular__card-top">
                        <strong>{item.companyName}</strong>
                      </div>
                      <h3>{item.jobTitle}</h3>
                      <p>{item.region}</p>
                      <div className="home-popular__card-meta">
                        <span>{item.employmentType}</span>
                        <span>{item.salaryText}</span>
                        {item.dueLabel ? <span>{item.dueLabel}</span> : null}
                      </div>
                      <div className="home-popular__card-scrap">스크랩 {item.scrapCount}건</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="home-notices home-section-entrance" aria-labelledby="home-notices-title">
              <div className="home-notices__intro">
                <div>
                  <h2 id="home-notices-title">공지사항</h2>
                  <p>서비스 운영과 이용에 필요한 안내입니다.</p>
                </div>
                <Link className="secondary-button home-notices__more" to={localizePath(ROUTE_PATHS.notices)}>
                  전체보기
                </Link>
              </div>

              <div className="home-notices__panel">
                {noticeState.status === 'loading' ? <div className="home-feedback" role="status">공지사항을 불러오는 중입니다.</div> : null}
                {noticeState.status === 'error' ? <div className="home-feedback is-error" role="alert">{noticeState.error}</div> : null}
                {noticeState.status === 'empty' ? <div className="home-feedback" role="status">등록된 공지사항이 없습니다.</div> : null}

                {noticeState.status === 'success' ? (
                  <div className="home-notices__content">
                    <div className="home-notices__list">
                      {noticeState.items.map((notice) => (
                        <Link key={notice.id} className="home-notices__item" to={localizePath(`${ROUTE_PATHS.notices}/${notice.id}`)}>
                          <span className="home-notices__meta">
                            {notice.pinned ? <strong>고정</strong> : null}
                            {formatHomeNoticeDate(notice.createdAt) ? <time>{formatHomeNoticeDate(notice.createdAt)}</time> : null}
                          </span>
                          <span className="home-notices__title">{notice.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="home-support-orgs home-section-entrance" aria-labelledby="home-support-orgs-title">
              <div className="home-section-head home-section-head--support">
                <div>
                  <h2 id="home-support-orgs-title">{supportSectionCopy.title}</h2>
                  <p>{supportSectionCopy.description}</p>
                </div>
              </div>

              <div className="home-support-orgs__grid" aria-label={supportSectionCopy.ariaLabel}>
                {supportOrganizations.map((organization) => (
                  <a
                    key={organization.id}
                    className="home-support-orgs__card"
                    href={organization.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${organization.nameLabel}, ${supportSectionCopy.newTabLabel}`}
                    style={{ '--support-accent': organization.accent }}
                  >
                    <div className="home-support-orgs__logo-panel">
                      <div className={`home-support-orgs__logo-shell${organization.logoVariant === 'icon' ? ' is-icon' : ''}${organization.logoClassName ? ` ${organization.logoClassName}` : ''}`}>
                        <img src={organization.logo} alt={organization.logoAlt} />
                      </div>
                    </div>
                    <strong className="home-support-orgs__category">{organization.categoryLabel}</strong>
                    <h3>{organization.nameLabel}</h3>
                    <p>{organization.descriptionLabel}</p>
                    <div className="home-support-orgs__card-link">
                      <span>{supportSectionCopy.cta}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {isQuickPage ? (
          <section className="home-quick home-section-entrance home-section-entrance--quick" aria-labelledby="quick-recommend-title">
            <section className="home-overview home-overview--compact" aria-labelledby="quick-recommend-title">
              <div className="home-overview__heading">
                <div className="home-section-title-with-help">
                  <h1 id="quick-recommend-title">퀵 맞춤 일자리 추천</h1>
                  <AccessibilityScoreHelpButton />
                </div>
                <p>{isAiEnabled ? 'AI 직무 적합도 기반 추천 결과' : '최신 공고 기반 추천 결과'}</p>
              </div>
            </section>

            <div className="home-quick__controls">
              <aside className="accessibility-map__filter-panel home-quick__filter-panel home-quick__profile-panel" aria-label="프로필 선택">
                <header className="home-quick__filter-header">
                  <h3>프로필 선택</h3>
                </header>
                <div
                  ref={quickProfileSelectRef}
                  className={`accessibility-map__profile-select home-quick__profile-select${isProfileMenuOpen ? ' is-open' : ''}`}
                  aria-label="프로필 선택"
                >
                  <button
                    type="button"
                    className="accessibility-map__profile-trigger home-quick__profile-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={isGuestUser ? false : isProfileMenuOpen}
                    onClick={() => {
                      if (isGuestUser) {
                        openLoginModal();
                        return;
                      }
                      setIsProfileMenuOpen((isOpen) => !isOpen);
                    }}
                  >
                    <span className="accessibility-map__profile-trigger-main">
                      <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
                      <span className="accessibility-map__profile-option-text">
                        {isGuestUser ? (
                          <strong>로그인 후 자신의 프로필을 선택해보세요.</strong>
                        ) : isProfileMenuOpen ? (
                          <strong>프로필을 선택하세요</strong>
                        ) : (
                          <>
                            <strong>{closedProfileLabel || '기본 프로필'}</strong>
                            {visibleSelectedProfile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                          </>
                        )}
                      </span>
                    </span>
                    <img src={arrowDown} alt="프로필 목록 펼치기 아이콘" loading="lazy" decoding="async" />
                  </button>
                  {isProfileMenuOpen && !isGuestUser ? (
                    <div className="accessibility-map__profile-menu" role="listbox" aria-label="프로필 목록">
                      {orderedProfiles.map((profile) => (
                        <button
                          key={getProfileId(profile)}
                          type="button"
                          className={`accessibility-map__profile-option${getProfileId(profile) === String(selectedProfileId) ? ' is-selected' : ''}`}
                          role="option"
                          aria-selected={getProfileId(profile) === String(selectedProfileId)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedProfileId(getProfileId(profile));
                            setIsProfileMenuOpen(false);
                          }}
                        >
                          <img src={profileIcon} alt="프로필 아이콘" loading="lazy" decoding="async" />
                          <span className="accessibility-map__profile-option-text">
                            <strong>{getProfileDisplayName(profile)}</strong>
                            {profile?.isDefault ? <small className="accessibility-map__profile-default-badge">기본 프로필</small> : null}
                          </span>
                        </button>
                      ))}
                      <Link to={localizePath(ROUTE_PATHS.myProfile)} className="accessibility-map__profile-manage">
                        <img src={settingIcon} alt="프로필 관리 아이콘" loading="lazy" decoding="async" />
                        프로필 관리
                      </Link>
                    </div>
                  ) : null}
                </div>
              </aside>

              <aside className="accessibility-map__filter-panel home-quick__filter-panel" aria-label="퀵 추천 필터">
                <header className="home-quick__filter-header">
                  <h3>퀵 추천 필터</h3>
                </header>

                <section className="accessibility-map__ai-toggle" aria-label="AI 직무 적합도 설정">
                  <div>
                    <strong>AI 직무 적합도</strong>
                    <span>{isAiEnabled ? '프로필 기반 직무 적합도 계산' : '최신 공고만 조회'}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAiEnabled}
                    className={isAiEnabled ? 'is-on' : ''}
                    onClick={handleToggleQuickAi}
                  >
                    <span className="accessibility-map__ai-toggle-track" aria-hidden="true">
                      <span className="accessibility-map__ai-toggle-thumb" />
                    </span>
                    <span className="accessibility-map__ai-toggle-label">{isAiEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </section>
                <section className="accessibility-map__ai-toggle" aria-label="통근 가능 기업 필터 설정">
                  <div>
                    <strong>통근 가능한 기업만 보기</strong>
                    <span>직선거리 25km 이내</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID])}
                    disabled={isQuickCommutableToggleDisabled}
                    className={[
                      isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID] ? 'is-on' : '',
                      isQuickCommutableToggleDisabled ? 'is-disabled' : ''
                    ].filter(Boolean).join(' ')}
                    onClick={handleToggleQuickCommutableOnly}
                  >
                    <span className="accessibility-map__ai-toggle-track" aria-hidden="true">
                      <span className="accessibility-map__ai-toggle-thumb" />
                    </span>
                    <span className="accessibility-map__ai-toggle-label">{isAiEnabled && draftFilters[COMMUTABLE_FILTER_ID] ? 'ON' : 'OFF'}</span>
                  </button>
                </section>

                {!isQuickFilterCollapsed ? (
                  <>
                    <div className="accessibility-map__filter-list">
                      {orderedFilterGroups.map((group, index) => (
                        <section key={group.id} className="accessibility-map__filter-group">
                          <div className="accessibility-map__filter-title-row">
                            <div>
                              <h3>{`${index + 1}. ${group.title}`}</h3>
                              {group.type === 'jobCategoryCascade' ? (
                                <JobCategoryCascadeFilter
                                  categories={group.jobCategories}
                                  value={group.selectedValue}
                                  onChange={(value) => {
                                    if (isGuestUser) {
                                      openLoginModal();
                                      return;
                                    }
                                    setDraftFilters((prev) => ({ ...prev, [group.id]: value }));
                                  }}
                                />
                              ) : group.type === 'select' ? (
                                <SelectFilter
                                  label={group.title}
                                  options={group.options}
                                  value={group.selectedValue}
                                  disabled={group.disabled}
                                  onChange={(value) => {
                                    if (isGuestUser) {
                                      openLoginModal();
                                      return;
                                    }
                                    setDraftFilters((prev) => ({ ...prev, [group.id]: value }));
                                  }}
                                />
                              ) : (
                                <div className="accessibility-map__chip-row accessibility-map__chip-row--expanded">
                                  {group.chips.map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      className={`accessibility-map__chip${group.selectedValue === chip ? ' is-selected' : ''}`}
                                      aria-pressed={group.selectedValue === chip}
                                      onClick={() => {
                                        if (isGuestUser) {
                                          openLoginModal();
                                          return;
                                        }
                                        setDraftFilters((prev) => ({ ...prev, [group.id]: chip }));
                                      }}
                                    >
                                      {chip}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      ))}
                    </div>
                  </>
                ) : null}

                <div className="home-quick__filter-collapse-row">
                  <button
                    type="button"
                    className="accessibility-map__collapse-button"
                    onClick={() => {
                      if (isGuestUser) {
                        openLoginModal();
                        return;
                      }
                      setIsQuickFilterCollapsed((prev) => !prev);
                    }}
                    aria-expanded={!isQuickFilterCollapsed}
                  >
                    {isQuickFilterCollapsed ? '필터 펼치기' : '필터 접기'}
                  </button>
                </div>
              </aside>
            </div>

            <div className="home-quick__actions">
              <div className="accessibility-map__filter-actions" aria-label="필터 검색 실행">
                <button
                  type="button"
                  className="secondary-button accessibility-map__filter-reset-button"
                  onClick={isGuestUser ? openLoginModal : handleResetQuickFilters}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="primary-button accessibility-map__filter-apply-button"
                  onClick={isGuestUser ? openLoginModal : handleApplyQuickFilters}
                  disabled={!isGuestUser && (isQuickBatchLoading || !effectiveSelectedProfileId)}
                >
                  {isQuickBatchLoading ? '로딩중' : '검색'}
                </button>
              </div>
            </div>

            <section className="home-quick__results" aria-label="퀵 추천 결과">
              {shouldShowQuickHeader ? (
                <div className="accessibility-map__results-header home-quick__results-header">
                  <div className="accessibility-map__results-title-row">
                    <div className="accessibility-map__results-title-stack">
                      <h3>
                        <span>검색 결과 {quickResultCount}개</span>
                      </h3>
                      {isQuickCommutableOnlyApplied ? (
                        <p className="accessibility-map__results-subtext">통근 가능한 기업 공고 {filteredQuickJobs.length}개</p>
                      ) : null}
                    </div>
                  </div>
                  <span>{appliedAiEnabled ? '직무 적합도 높은순' : '최신순'}</span>
                </div>
              ) : null}
              {shouldShowQuickHeader && isQuickBatchLoading ? (
                <div className="home-quick__loading-bar" role="status" aria-live="polite">
                  <span className="home-quick__loading-track" aria-hidden="true" />
                  <span className="recommendation-loading__label">불러오는 중 {quickLoadingLoaded}/{quickLoadingTarget}</span>
                </div>
              ) : null}
              {isGuestUser ? <div className="home-feedback" role="status">로그인 후 퀵 맞춤 일자리 추천 결과를 확인할 수 있습니다.</div> : null}
              {!isGuestUser && profilesState.status === 'loading' ? <div className="home-feedback" role="status">프로필을 불러오는 중입니다.</div> : null}
              {!isGuestUser && profilesState.status === 'error' ? <div className="home-feedback is-error" role="alert">{profilesState.error}</div> : null}
              {!isGuestUser && quickState.status === 'idle' ? <div className="home-feedback" role="status">검색을 누르면 퀵 추천 결과를 조회합니다.</div> : null}
              {!isGuestUser && quickState.status === 'error' ? <div className="home-feedback is-error" role="alert">{quickState.error}</div> : null}
              {!isGuestUser && quickState.status === 'empty' ? <div className="home-feedback" role="status">현재 조건에 맞는 공고가 없습니다.</div> : null}

              {shouldShowQuickResults ? (
                <div ref={quickResultListRef} className="home-job-list" aria-label="퀵 추천 공고 목록">
                  {filteredQuickJobs.map((job) => (
                    <button
                      type="button"
                      className={`home-job-card${appliedAiEnabled && typeof job.fitScore === 'number' && job.fitScore >= 80 ? ' is-recommended' : ''}`}
                      key={job.id}
                      data-job-id={job.id}
                      onClick={() => handleOpenQuickPosting(job)}
                      aria-label={`${job.title} 상세 보기`}
                    >
                      <div className="home-job-card__main">
                        <div className="home-job-card__top">
                          <span className="home-job-company">{job.company}</span>
                          <span className={`home-job-scrap-count${job.scrappedByMe ? ' is-scrapped' : ''}`}>
                            {job.scrappedByMe ? '스크랩 완료' : `스크랩 ${job.scrapCount}건`}
                          </span>
                        </div>
                        <h3 data-i18n-skip>{job.title}</h3>
                        <p className="home-job-role" data-i18n-skip>{job.location}</p>
                        <dl className="home-job-meta" aria-label={`${job.title} 공고 정보`}>
                          <div><dt>급여</dt><dd data-i18n-skip>{job.salary}</dd></div>
                          <div><dt>고용형태</dt><dd data-i18n-skip>{job.employmentType}</dd></div>
                          <div><dt>등록일</dt><dd>{job.registeredDateText || '없음'}</dd></div>
                          {job.dueLabel ? <div><dt>마감</dt><dd>{job.dueLabel}</dd></div> : null}
                        </dl>
                        {appliedAiEnabled ? (
                          <div className="home-job-tags">
                            <span className={`home-badge ${job.fitScore && job.fitScore >= 80 ? 'home-badge--match' : 'home-badge--neutral'}`}>
                              직무 적합도 {job.fitLabel}
                            </span>
                            {job.fitGrade ? (
                              <span className={`accessibility-map__mini-badge home-job-grade-badge is-grade ${getQuickGradeClassName(job.fitGrade)}`}>
                                {job.fitGrade}
                              </span>
                            ) : null}
                            <span className="home-badge home-badge--neutral">AI ON</span>
                          </div>
                        ) : null}
                      </div>
                      {appliedAiEnabled ? (
                        <div className="home-job-score-panel" aria-label={`직무 적합도 점수 ${job.fitLabel}`}>
                          <div className="home-job-score-panel__header">
                            <strong>직무 적합도 점수</strong>
                            <AccessibilityScoreHelpButton interactive={false} />
                          </div>
                          <VisibilityTriggeredScoreRing
                            className={`home-job-score-ring is-${job.fitTone}`}
                            score={job.fitScore}
                            observeKey={`${job.id}-${job.fitScore ?? 'empty'}`}
                          />
                          <span className={`accessibility-map__score-badge is-${job.fitTone}`}>
                            {job.fitGrade ? `${job.fitGrade} · 직무 기준` : '확인 필요'}
                          </span>
                          <em>{getQuickScoreHeadline(job.fitScore)}</em>
                        </div>
                      ) : null}
                    </button>
                  ))}
                  {!appliedAiEnabled ? <div ref={quickLoadMoreSentinelRef} className="home-quick__load-sentinel" aria-hidden="true" /> : null}
                  {quickState.hasMore && !appliedAiEnabled && !quickState.isLoadingMore ? (
                    <div className="home-feedback" role="status">아래로 스크롤하면 다음 공고를 불러옵니다.</div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </section>
        ) : null}
      </div>

      {detailModalOpen ? (
        <PopularPostingDetailModal
          detail={detailState.data}
          loading={detailState.status === 'loading'}
          error={detailState.status === 'error' ? detailState.error : ''}
          quickFitScore={quickDetailState.fitScore}
          quickExplainState={detailModalQuickExplainState}
          onClose={handleCloseDetailModal}
          onScrap={handleOpenScrapConfirm}
        />
      ) : null}

      {scrapConfirmOpen ? (
        <ScrapConfirmModal
          pending={isScrapping}
          onConfirm={handleScrapConfirm}
          onClose={() => setScrapConfirmOpen(false)}
        />
      ) : null}

      {isLoginModalOpen ? <LoginModal onClose={() => setIsLoginModalOpen(false)} /> : null}
    </main>
  );
}

export function QuickJobsPage() {
  return <MainPage view="quick" />;
}
