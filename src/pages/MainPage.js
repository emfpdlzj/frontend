import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { profileApi } from '../api/profileApi';
import { fetchQuickJobRecommendations } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import {
  getCachedRecommendation,
  getRecommendationCacheKey,
  setCachedRecommendation
} from '../cache/recommendationCache';
import { NAVER_MAP_CONFIG } from '../config/appConfig';
import { ROUTE_PATHS } from '../config/routes';
import { useLocale } from '../i18n/LocaleContext';
import { loadNaverMapScript } from '../utils/naverMapSdk';

const NAVER_MAP_SCRIPT_ID = 'bridgework-naver-map-sdk';
const NAVER_MAP_READY_CALLBACK = '__bridgeworkNaverMapReady__';

const shortcuts = [
  { id: 'quick', icon: '↗', label: '퀵 맞춤 추천', href: '#recommended-jobs-title' },
  { id: 'map', icon: '⌖', label: '접근성 지도 추천', to: ROUTE_PATHS.accessibilityMap },
  { id: 'help', icon: '?', label: '고객센터', to: ROUTE_PATHS.settings }
];

const loggedOutPreviewJobs = [
  {
    id: 'logged-out-preview-1',
    company: '프로필 기반 추천',
    title: '로그인하면 내 조건에 맞는 공고를 바로 비교할 수 있습니다.',
    role: '희망 직무 · 근무조건 · 접근성 기준 반영',
    meta: ['직무 적합도 표시', '마감일 비교', '접근성 지도 연계']
  },
  {
    id: 'logged-out-preview-2',
    company: '접근성 참고 정보',
    title: '지도 좌표가 있는 공고는 접근성 지도에서 이어서 확인합니다.',
    role: '근무지 좌표 · 대중교통 · 지원기관 정보 참고',
    meta: ['위치 데이터 확인', '상세 접근성 확인 필요', '지원 전 기업 확인']
  },
  {
    id: 'logged-out-preview-3',
    company: '지원 전 체크',
    title: '추천 점수는 참고용으로 보고 상세 조건을 함께 확인하세요.',
    role: '급여 · 고용형태 · 요구경력 · 마감일',
    meta: ['조건 비교', '저장 후 검토', '지원 전 확인']
  }
];

const getProfileId = (profile) => profile?.profileId ?? profile?.id ?? '';

const unwrapApiResult = (payload) => payload?.result || payload?.data || payload;

function parseDateText(value) {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '';
  }

  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

function getDateNumber(value) {
  const raw = String(value ?? '').replace(/\D/g, '');
  return raw.length === 8 ? Number(raw) : 0;
}

function getDday(value) {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw.length !== 8) {
    return '';
  }

  const deadline = new Date(Number(raw.slice(0, 4)), Number(raw.slice(4, 6)) - 1, Number(raw.slice(6, 8)));
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.ceil((deadline - normalizedToday) / 86400000);

  if (Number.isNaN(diff)) {
    return '';
  }

  if (diff < 0) {
    return '마감';
  }

  if (diff === 0) {
    return '오늘 마감';
  }

  return `D-${diff}`;
}

function getFitMap(aiResponse) {
  const results = aiResponse?.result?.results ?? aiResponse?.results ?? [];

  if (!Array.isArray(results)) {
    return new Map();
  }

  return new Map(
    results
      .map((item) => [
        item?.job?.external_id || item?.job?.externalId || item?.job?.externalId,
        item?.job_fit_score ??
          item?.jobFitScore ??
          item?.score_detail?.job_fit_score ??
          item?.scoreDetail?.jobFitScore ??
          item?.total_score ??
          item?.totalScore ??
          item?.score
      ])
      .filter(([externalId]) => externalId)
  );
}

function buildHomeRecommendationState(result, profile) {
  const fitMap = getFitMap(result?.aiResponse);
  const jobs = Array.isArray(result?.jobs)
    ? result.jobs.map((job) => normalizeRecommendJob(job, fitMap))
    : [];

  return {
    status: jobs.length ? 'success' : 'empty',
    error: '',
    profile,
    jobs,
    aiEnabled: Boolean(result?.aiEnabled ?? true)
  };
}

function normalizeRecommendJob(job, fitMap) {
  const externalId = job?.externalId || job?.external_id || job?.id || '';
  const fitScore = fitMap.get(externalId);
  const location = job?.compAddr || job?.workAddress || job?.location || '근무지역 확인 필요';
  const latitude = Number(job?.geoLatitude);
  const longitude = Number(job?.geoLongitude);
  const hasGeo = Number.isFinite(latitude) && Number.isFinite(longitude);
  const registeredAt = job?.offerregDt || job?.regDt || job?.registeredAt;

  return {
    id: String(externalId || `${job?.busplaName}-${job?.jobNm}`),
    company: job?.busplaName || job?.companyName || '기업명 확인 필요',
    title: job?.jobNm || job?.jobTitle || '공고명 확인 필요',
    role: job?.jobNm || job?.jobTitle || '직무 확인 필요',
    location,
    salary: [job?.salaryType, job?.salary].filter(Boolean).join(' ') || '급여 확인 필요',
    employmentType: job?.empType || '고용형태 확인 필요',
    enterType: job?.enterType || '',
    dueLabel: getDday(job?.termDate),
    deadlineText: parseDateText(job?.termDate),
    deadlineValue: getDateNumber(job?.termDate),
    registeredValue: getDateNumber(registeredAt),
    fitScore,
    fitLabel: fitScore ? `직무 적합도 ${fitScore}점` : '적합도 확인 필요',
    hasGeo,
    latitude: hasGeo ? latitude : null,
    longitude: hasGeo ? longitude : null,
    accessNotes: [
      hasGeo ? '근무지 좌표 확인됨' : '근무지 위치 확인 필요',
      '접근성 상세는 지도에서 확인'
    ],
    raw: job
  };
}

function HomeNaverMapPreview({ job }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState(() => (NAVER_MAP_CONFIG.clientId ? 'idle' : 'missing-client-id'));

  const hasPosition = Boolean(job?.hasGeo && job?.latitude && job?.longitude);

  useEffect(() => {
    if (!hasPosition) {
      setStatus(NAVER_MAP_CONFIG.clientId ? 'no-position' : 'missing-client-id');
      return undefined;
    }

    if (!NAVER_MAP_CONFIG.clientId) {
      setStatus('missing-client-id');
      return undefined;
    }

    let isMounted = true;
    setStatus('loading');

    loadNaverMapScript({
      clientId: NAVER_MAP_CONFIG.clientId,
      scriptId: NAVER_MAP_SCRIPT_ID,
      callbackName: NAVER_MAP_READY_CALLBACK
    })
      .then(() => {
        if (isMounted) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasPosition]);

  useEffect(() => {
    if (status !== 'ready' || !mapElementRef.current || !hasPosition || !window.naver?.maps) {
      return undefined;
    }

    const position = new window.naver.maps.LatLng(job.latitude, job.longitude);

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.naver.maps.Map(mapElementRef.current, {
        center: position,
        zoom: 15,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
        zoomControl: false,
        scrollWheel: false,
        draggable: false,
        disableDoubleClickZoom: true
      });
    } else {
      mapInstanceRef.current.setCenter(position);
    }

    if (!markerRef.current) {
      markerRef.current = new window.naver.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: job.title
      });
    } else {
      markerRef.current.setPosition(position);
      markerRef.current.setMap(mapInstanceRef.current);
    }

    return undefined;
  }, [hasPosition, job, status]);

  useEffect(
    () => () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapElementRef.current) {
        mapElementRef.current.innerHTML = '';
      }
      markerRef.current = null;
      mapInstanceRef.current = null;
    },
    []
  );

  if (status === 'missing-client-id') {
    return (
      <div className="home-map-thumb is-feedback" role="status">
        네이버 지도 Client ID가 설정되지 않았습니다.
      </div>
    );
  }

  if (status === 'no-position') {
    return (
      <div className="home-map-thumb is-feedback" role="status">
        추천 공고에 지도 좌표가 없어 미니맵을 표시하지 않습니다.
      </div>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="home-map-thumb is-feedback" role="status">
        네이버 지도를 불러오는 중입니다.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="home-map-thumb is-feedback" role="alert">
        네이버 지도를 표시하지 못했습니다.
      </div>
    );
  }

  return (
    <div className="home-map-thumb" aria-label={`${job.location} 근무지 미니 지도`}>
      <div ref={mapElementRef} className="home-map-naver" />
    </div>
  );
}

function getProfileSummary(profile) {
  const targetJob = profile?.targetJob || profile?.desiredJob || '기본 프로필';
  const skills = Array.isArray(profile?.skills) ? profile.skills.filter(Boolean) : [];

  if (skills.length) {
    return `${targetJob} · ${skills.slice(0, 2).join(', ')}`;
  }

  return targetJob;
}

function useHomeRecommendations() {
  const { callWithAuth, isAuthenticated, isInitializing } = useAuth();
  const [state, setState] = useState({
    status: 'idle',
    error: '',
    profile: null,
    jobs: [],
    aiEnabled: true
  });

  useEffect(() => {
    if (isInitializing) {
      return undefined;
    }

    if (!isAuthenticated) {
      setState({
        status: 'disabled',
        error: '로그인 후 추천 공고를 확인할 수 있습니다.',
        profile: null,
        jobs: [],
        aiEnabled: true
      });
      return undefined;
    }

    const controller = new AbortController();

    const loadHome = async () => {
      setState((prev) => ({
        ...prev,
        status: prev.jobs.length ? 'refetching' : 'loading',
        error: ''
      }));

      try {
        const profiles = await callWithAuth((accessToken) => profileApi.getProfiles(accessToken, controller.signal));
        const defaultProfile = profiles.find((profile) => profile?.isDefault) ?? profiles[0] ?? null;
        const profileId = getProfileId(defaultProfile);

        if (!profileId) {
          setState({
            status: 'emptyProfile',
            error: '',
            profile: null,
            jobs: [],
            aiEnabled: true
          });
          return;
        }

        const cacheKey = getRecommendationCacheKey({ profileId });
        const cachedPayload = getCachedRecommendation(cacheKey);

        if (cachedPayload) {
          setState(buildHomeRecommendationState(cachedPayload, defaultProfile));
          return;
        }

        const payload = await callWithAuth((accessToken) =>
          fetchQuickJobRecommendations(accessToken, {
            aiEnabled: true,
            profileId,
            signal: controller.signal
          })
        );
        const result = unwrapApiResult(payload);

        setCachedRecommendation(cacheKey, result);
        setState(buildHomeRecommendationState(result, defaultProfile));
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }

        setState((prev) => ({
          ...prev,
          status: 'error',
          error: error.message || '추천 공고를 불러오지 못했습니다.'
        }));
      }
    };

    loadHome();

    return () => {
      controller.abort();
    };
  }, [callWithAuth, isAuthenticated, isInitializing]);

  return state;
}

function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`home-badge home-badge--${tone}`}>{children}</span>;
}

function ShortcutLink({ shortcut }) {
  const { localizePath } = useLocale();
  const content = (
    <>
      <span aria-hidden="true">{shortcut.icon}</span>
      <strong>{shortcut.label}</strong>
    </>
  );

  if (shortcut.href) {
    return (
      <a className="home-shortcut" href={shortcut.href}>
        {content}
      </a>
    );
  }

  return (
    <Link className="home-shortcut" to={localizePath(shortcut.to)}>
      {content}
    </Link>
  );
}

function HomeFeedback({ status, error, variant = 'block' }) {
  const { localizePath } = useLocale();

  if (status === 'loading' || status === 'refetching') {
    return <div className="home-feedback" role="status">내 프로필 기준 추천 공고를 불러오는 중입니다.</div>;
  }

  if (status === 'disabled') {
    return (
      <div className={`home-feedback${variant === 'inline' ? ' is-inline' : ''}`} role="status">
        <span>로그인하면 프로필 기반 추천 공고를 확인할 수 있습니다.</span>
        <Link className="home-feedback__link" to={localizePath(ROUTE_PATHS.login)}>
          로그인하기
        </Link>
      </div>
    );
  }

  if (status === 'emptyProfile') {
    return (
      <div className="home-feedback" role="status">
        추천 정확도를 높이려면 프로필을 먼저 입력해주세요.
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="home-feedback" role="status">
        현재 조건에 맞는 추천 공고가 없습니다. 프로필 또는 조건을 조금 넓혀보세요.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="home-feedback is-error" role="alert">
        {error || '추천 공고를 불러오지 못했습니다.'}
      </div>
    );
  }

  return null;
}

export function MainPage() {
  const { localizePath } = useLocale();
  const { status, error, profile, jobs, aiEnabled } = useHomeRecommendations();
  const visibleJobs = useMemo(() => jobs.slice(0, 5), [jobs]);
  const isLoggedOut = status === 'disabled';
  const deadlineSoonCount = jobs.filter((job) => job.dueLabel.startsWith('D-') && Number(job.dueLabel.slice(2)) <= 7).length;
  const geoReadyCount = jobs.filter((job) => job.hasGeo).length;
  const recentJobs = visibleJobs.slice(0, 3);
  const topJob = visibleJobs[0];
  const canShowJobs = status === 'success' || status === 'refetching';

  const summaryItems = useMemo(
    () => [
      {
        id: 'profile',
        title: profile ? `추천 기준 ${getProfileSummary(profile)}` : '추천 기준 프로필',
        text: profile ? '기본 프로필 기준으로 공고를 정렬했습니다.' : '로그인 후 프로필을 선택하면 맞춤 추천을 볼 수 있습니다.'
      },
      {
        id: 'recommended',
        title: profile ? `추천 공고 ${jobs.length}건` : '추천 공고 미리보기',
        text: profile ? (aiEnabled ? 'AI 직무 적합도를 함께 표시합니다.' : '최신 공고 순으로 확인합니다.') : '홈 구조는 로그인 후 실제 추천 결과로 채워집니다.'
      },
      {
        id: 'deadline',
        title: profile ? `마감 임박 ${deadlineSoonCount}건` : '마감일 비교',
        text: profile ? '지원 전 근무조건과 마감일을 확인하세요.' : '추천 공고에서 마감 임박 공고를 먼저 확인할 수 있습니다.'
      },
      {
        id: 'map',
        title: profile ? `지도 확인 ${geoReadyCount}건` : '접근성 지도 연계',
        text: profile ? '좌표가 있는 공고는 접근성 지도에서 이어서 볼 수 있습니다.' : '좌표가 있는 공고는 지도에서 이어서 탐색합니다.'
      }
    ],
    [aiEnabled, deadlineSoonCount, geoReadyCount, jobs.length, profile]
  );

  return (
    <main className="main-page" aria-labelledby="main-page-title">
      <div className="main-page__inner">
        <section className="home-overview" aria-labelledby="main-page-title">
          <div className="home-overview__heading">
            <p className="home-eyebrow">Home</p>
            <h1 id="main-page-title">지원 가능한 최신형 맞춤 공고</h1>
            <p>BridgeWork에서 내 프로필에 맞는 공고를 먼저 비교하고, 접근성 정보는 참고용으로 함께 확인하세요.</p>
          </div>
          <div className="home-overview__actions" aria-label="주요 행동">
            <a className="home-button home-button--primary" href="#recommended-jobs-title">
              추천 공고 보기
            </a>
            <Link className="home-button home-button--ghost" to={localizePath(ROUTE_PATHS.accessibilityMap)}>
              지도에서 탐색
            </Link>
          </div>
        </section>

        <section className="home-summary-grid" aria-label="내 추천 현황 요약">
          {summaryItems.map((item) => (
            <article className="home-summary-item" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <div className="home-layout">
          <section className="home-recommendations" aria-labelledby="recommended-jobs-title">
            <div className="home-section-head">
              <div>
                <p className="home-section-kicker">추천 → 비교 → 지원</p>
                <h2 id="recommended-jobs-title">내 프로필 기반 추천 공고</h2>
              </div>
              <div className="home-section-actions">
                <span className="home-section-count">
                  {isLoggedOut ? '로그인 필요' : `${jobs.length}건 중 ${visibleJobs.length}건`}
                </span>
                <Link className="home-more-link" to={localizePath(isLoggedOut ? ROUTE_PATHS.login : ROUTE_PATHS.jobs)}>
                  더보기
                </Link>
              </div>
            </div>

            <HomeFeedback status={status} error={error} variant={isLoggedOut ? 'inline' : 'block'} />

            {canShowJobs ? (
              <div className="home-job-list" aria-label="추천 공고 목록">
                {visibleJobs.map((job) => (
                  <article className="home-job-card" key={job.id}>
                    <div className="home-job-card__main">
                      <div className="home-job-card__top">
                        <span className="home-job-company">{job.company}</span>
                      </div>
                      <h3>{job.title}</h3>
                      <p className="home-job-role">{job.role}</p>

                      <dl className="home-job-meta" aria-label={`${job.title} 공고 기본 정보`}>
                        <div className="home-job-meta__salary">
                          <dt>급여</dt>
                          <dd>{job.salary}</dd>
                        </div>
                        <div>
                          <dt>지역</dt>
                          <dd>{job.location}</dd>
                        </div>
                        <div>
                          <dt>고용형태</dt>
                          <dd>{job.employmentType}</dd>
                        </div>
                        {job.dueLabel ? (
                          <div>
                            <dt>마감</dt>
                            <dd>{job.dueLabel}</dd>
                          </div>
                        ) : null}
                      </dl>

                      <div className="home-job-tags" aria-label="공고 평가 정보">
                        <StatusBadge tone={job.fitScore ? 'match' : 'neutral'}>{job.fitLabel}</StatusBadge>
                        {job.enterType ? <StatusBadge tone="workplace">{job.enterType}</StatusBadge> : null}
                        {job.deadlineText ? <StatusBadge tone="neutral">마감일 {job.deadlineText}</StatusBadge> : null}
                      </div>

                      <div className="home-access-summary">
                        <strong>접근성 참고</strong>
                        <ul aria-label="접근성 핵심 요약">
                          {job.accessNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                        <span>상세에서 확인</span>
                      </div>
                    </div>

                    <div className="home-job-card__actions">
                      {job.dueLabel ? <StatusBadge tone="deadline">{job.dueLabel}</StatusBadge> : null}
                      <button type="button" className="home-apply-button">
                        지원하기
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {isLoggedOut ? (
              <div className="home-preview-list" aria-label="로그인 전 추천 공고 안내">
                {loggedOutPreviewJobs.map((item) => (
                  <article className="home-preview-card" key={item.id}>
                    <span>{item.company}</span>
                    <h3>{item.title}</h3>
                    <p>{item.role}</p>
                    <div>
                      {item.meta.map((meta) => (
                        <StatusBadge key={meta} tone="neutral">{meta}</StatusBadge>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {canShowJobs && jobs.length > visibleJobs.length ? (
              <div className="home-more-row">
                <Link className="home-button home-button--secondary" to={localizePath(ROUTE_PATHS.jobs)}>
                  추천 공고 더보기
                </Link>
              </div>
            ) : null}
          </section>

          <aside className="home-side-rail" aria-label="홈 보조 정보">
            <section className="home-shortcuts" aria-labelledby="shortcuts-title">
              <div className="home-section-head home-section-head--compact">
                <h2 id="shortcuts-title">빠른 이동</h2>
              </div>
              <div className="home-shortcut-grid">
                {shortcuts.map((shortcut) => (
                  <ShortcutLink shortcut={shortcut} key={shortcut.id} />
                ))}
              </div>
            </section>

            <section className="home-map-preview" aria-labelledby="map-preview-title">
              <div className="home-section-head home-section-head--compact">
                <div>
                  <h2 id="map-preview-title">접근성 지도</h2>
                  <p>{isLoggedOut ? '로그인 후 추천 공고 좌표 기준으로 표시됩니다.' : `${topJob?.location ?? '추천 지역'} 좌표 기준으로 지도에서 이어서 확인합니다.`}</p>
                </div>
              </div>
              {isLoggedOut ? (
                <div className="home-map-thumb is-feedback" role="status">
                  로그인 후 추천 공고의 근무지 좌표로 미니맵을 표시합니다.
                </div>
              ) : (
                <HomeNaverMapPreview job={topJob} />
              )}
              <div className="home-map-legend" aria-label="지도 범례">
                <span><i className="is-good" /> 접근 양호</span>
                <span><i className="is-caution" /> 확인 필요</span>
                <span><i className="is-agency" /> 지원기관</span>
              </div>
              <Link className="home-button home-button--secondary home-button--wide" to={localizePath(ROUTE_PATHS.accessibilityMap)}>
                지도에서 자세히 보기
              </Link>
            </section>

            <section className="home-accessibility-summary" aria-labelledby="accessibility-summary-title">
              <div className="home-section-head home-section-head--compact">
                <h2 id="accessibility-summary-title">접근성 요약</h2>
              </div>
              <p className="home-safe-note">추천 공고의 위치 데이터 기준 참고용 정보입니다.</p>
              <ul>
                <li>{isLoggedOut ? '로그인 후 지도 좌표 공고 확인 가능' : `지도 좌표 확인 공고 ${geoReadyCount}건`}</li>
                <li>상세 접근성은 지도에서 확인 필요</li>
                <li>기업 내부 편의시설은 지원 전 확인 필요</li>
              </ul>
            </section>
          </aside>
        </div>

        <section className="home-lower-grid" aria-label="최근 활동과 안내">
          <div className="home-activity">
            <div className="home-section-head home-section-head--compact">
              <h2 id="recent-activity-title">최근 확인한 추천 공고</h2>
            </div>
            <ul className="home-activity-list">
              {!isLoggedOut && recentJobs.length ? recentJobs.map((job) => (
                <li key={job.id}>
                  <span>{job.company}</span>
                  <strong>{job.title}</strong>
                  <em>{[job.location, job.dueLabel].filter(Boolean).join(' · ')}</em>
                </li>
              )) : (
                <li>
                  <span>추천 공고</span>
                  <strong>{isLoggedOut ? '로그인 후 최근 확인한 추천 공고가 표시됩니다.' : '표시할 공고가 없습니다.'}</strong>
                  <em>{isLoggedOut ? '프로필 기반 추천과 저장 공고를 이어서 볼 수 있습니다.' : '프로필 또는 로그인 상태를 확인해주세요.'}</em>
                </li>
              )}
            </ul>
          </div>

          <div className="home-inline-notices">
            <p>추천 공고는 현재 기본 프로필 기준으로 표시됩니다.</p>
            <p>추천 점수와 접근성 정보는 참고용이며, 지원 전 상세 조건 확인이 필요합니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
