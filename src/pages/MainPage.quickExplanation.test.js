import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../api/noticeApi', () => ({
  noticeApi: {
    getNotices: jest.fn()
  }
}));

jest.mock('../api/postingApi', () => ({
  postingApi: {
    getPopularPostings: jest.fn(),
    getPostingDetail: jest.fn(),
    scrapPosting: jest.fn()
  }
}));

jest.mock('../api/profileApi', () => ({
  profileApi: {
    getProfiles: jest.fn(),
    getProfile: jest.fn()
  }
}));

jest.mock('../api/recommendApi', () => ({
  explainRecommendation: jest.fn(),
  fetchQuickJobRecommendations: jest.fn(),
  fetchRecommendTaskStatus: jest.fn()
}));

jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../cache/recommendationCache', () => ({
  clearActiveRecommendationTask: jest.fn(),
  getActiveRecommendationTask: jest.fn(() => null),
  getCachedRecommendation: jest.fn(() => null),
  getRecommendationCacheKey: jest.fn(() => 'recommendation:test'),
  setActiveRecommendationTask: jest.fn(),
  setCachedRecommendation: jest.fn()
}));

jest.mock('../hooks/useJobFilterOptions', () => ({
  useJobFilterOptions: jest.fn()
}));

jest.mock('../i18n/LocaleContext', () => ({
  useLocale: jest.fn()
}));

jest.mock('../components/auth/LoginModal', () => ({
  LoginModal: () => null
}));

jest.mock('../components/jobs/PostingMapPreview', () => ({
  PostingMapPreview: () => <div data-testid="posting-map-preview" />
}));

import { postingApi } from '../api/postingApi';
import { profileApi } from '../api/profileApi';
import { explainRecommendation, fetchQuickJobRecommendations, fetchRecommendTaskStatus } from '../api/recommendApi';
import { useAuth } from '../auth/AuthContext';
import { useJobFilterOptions } from '../hooks/useJobFilterOptions';
import { useLocale } from '../i18n/LocaleContext';
import { QuickJobsPage } from './MainPage';

const mockedPostingApi = postingApi;
const mockedProfileApi = profileApi;
const mockedExplainRecommendation = explainRecommendation;
const mockedFetchQuickJobRecommendations = fetchQuickJobRecommendations;
const mockedFetchRecommendTaskStatus = fetchRecommendTaskStatus;
const mockedUseAuth = useAuth;
const mockedUseJobFilterOptions = useJobFilterOptions;
const mockedUseLocale = useLocale;

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const buildQuickJobResult = () => ({
  results: [
    {
      job: {
        job_post_id: 101,
        company_name: '브릿지워크',
        job_title: '사무 보조',
        work_address: '서울특별시 중구 세종대로 1',
        employment_type: '정규직',
        salary_type: '월급',
        salary: '250만원',
        term_date: '20261231',
        registered_at: '20260711',
        agency_name: '브릿지워크'
      },
      job_fit_score: 84,
      reasons: ['직무 적합도가 높습니다.'],
      risk_factors: [],
      evidence_items: []
    }
  ],
  totalCount: 2
});

const buildPostingDetail = () => ({
  postingId: 101,
  externalId: '101',
  companyName: '브릿지워크',
  jobTitle: '사무 보조',
  workAddress: '서울특별시 중구 세종대로 1',
  contactNumber: '02-1234-5678',
  employmentType: '정규직',
  enterType: '신입',
  envBothHands: '확인 필요',
  envEyesight: '확인 필요',
  envLstnTalk: '확인 필요',
  envHandWork: '확인 필요',
  envLiftPower: '확인 필요',
  envStndWalk: '확인 필요',
  salaryType: '월급',
  salary: '250만원',
  salaryText: '월급 250만원',
  termDate: '20261231',
  offerRegisteredAt: '2026.07.11',
  registeredAt: '2026.07.11',
  requiredCareer: '무관',
  requiredEducation: '고졸',
  requiredMajor: '무관',
  requiredLicenses: '없음',
  agencyName: '브릿지워크',
  geoMatchedAddress: '서울특별시 중구 세종대로 1',
  geoLatitude: 37.5665,
  geoLongitude: 126.978,
  postingStatus: 'ACTIVE',
  closedAt: '',
  statusUpdatedAt: '',
  createdAt: '',
  updatedAt: '',
  scrapCount: 0,
  scrappedByMe: false
});

describe('QuickJobsPage explanation retry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    window.localStorage.clear();
    HTMLElement.prototype.animate = jest.fn(() => ({
      cancel: jest.fn()
    }));

    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
      callWithAuth: (callback, signal) => callback('access-token', signal)
    });
    mockedUseJobFilterOptions.mockReturnValue({
      status: 'success',
      error: '',
      employmentTypes: [],
      jobCategories: [],
      regions: [],
      salaryTypes: []
    });
    mockedUseLocale.mockReturnValue({
      locale: 'ko',
      localizePath: (path) => `/ko${path}`
    });

    mockedProfileApi.getProfiles.mockResolvedValue([
      {
        id: '1',
        profileId: 1,
        userId: 7,
        profileName: '기본 프로필',
        fullName: '홍길동',
        detailAddress: '서울특별시 강남구 테헤란로 123',
        targetJob: '사무 보조',
        skills: ['문서작성'],
        certifications: [],
        workTypes: ['FULL_TIME'],
        isDefault: true
      }
    ]);
    mockedProfileApi.getProfile.mockResolvedValue({
      id: '1',
      profileId: 1,
      userId: 7,
      profileName: '기본 프로필',
      fullName: '홍길동',
      detailAddress: '서울특별시 강남구 테헤란로 123',
      targetJob: '사무 보조',
      skills: ['문서작성'],
      certifications: [],
      workTypes: ['FULL_TIME'],
      isDefault: true
    });
    mockedPostingApi.getPostingDetail.mockResolvedValue(buildPostingDetail());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('retries the quick explanation after recommendation loading completes', async () => {
    const taskDeferred = createDeferred();

    mockedFetchQuickJobRecommendations.mockResolvedValue({
      status: 'PROCESSING',
      requestId: 'quick-task-1',
      result: buildQuickJobResult()
    });
    mockedFetchRecommendTaskStatus
      .mockResolvedValueOnce({
        status: 'PROCESSING',
        result: buildQuickJobResult()
      })
      .mockReturnValue(taskDeferred.promise);
    mockedExplainRecommendation
      .mockRejectedValueOnce(new Error('추천 설명을 불러오지 못했습니다.'))
      .mockResolvedValueOnce({
        shortSummary: '추천 요약',
        recommendationReasons: ['직무 경험과 공고 조건이 잘 맞아요.'],
        cautionPoints: [],
        checklist: [],
        recommendedPrograms: []
      });

    render(<QuickJobsPage />);

    await waitFor(() => expect(mockedProfileApi.getProfiles).toHaveBeenCalledTimes(1));

    const searchButton = await screen.findByRole('button', { name: '검색' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(searchButton);
    });

    await waitFor(() => expect(mockedFetchQuickJobRecommendations).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedFetchRecommendTaskStatus).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    const jobButton = await screen.findByRole('button', { name: '사무 보조 상세 보기' });
    await act(async () => {
      fireEvent.click(jobButton);
    });

    await waitFor(() => expect(mockedPostingApi.getPostingDetail).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockedExplainRecommendation).toHaveBeenCalledTimes(1));

    act(() => {
      taskDeferred.resolve({
        status: 'COMPLETED',
        result: buildQuickJobResult()
      });
    });

    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => expect(mockedExplainRecommendation).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getAllByText('추천 요약')).toHaveLength(2));
  });

  it('requests the quick explanation only once when opening the detail modal', async () => {
    mockedFetchQuickJobRecommendations.mockResolvedValue({
      status: 'COMPLETED',
      result: buildQuickJobResult()
    });

    mockedExplainRecommendation.mockImplementation(() => new Promise(() => {}));

    render(<QuickJobsPage />);

    await waitFor(() => expect(mockedProfileApi.getProfiles).toHaveBeenCalledTimes(1));

    const searchButton = await screen.findByRole('button', { name: '검색' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(searchButton);
    });

    const jobButton = await screen.findByRole('button', { name: '사무 보조 상세 보기' });
    await act(async () => {
      fireEvent.click(jobButton);
    });

    await waitFor(() => expect(mockedExplainRecommendation).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(mockedExplainRecommendation).toHaveBeenCalledTimes(1);
  });

  it('does not surface an abort error when the quick explanation request is canceled', async () => {
    mockedFetchQuickJobRecommendations.mockResolvedValue({
      status: 'COMPLETED',
      result: buildQuickJobResult()
    });
    mockedExplainRecommendation
      .mockRejectedValueOnce(new DOMException('signal is aborted without reason', 'AbortError'))
      .mockResolvedValueOnce({
        shortSummary: '추천 요약',
        recommendationReasons: ['직무 경험과 공고 조건이 잘 맞아요.'],
        cautionPoints: [],
        checklist: [],
        recommendedPrograms: []
      });

    render(<QuickJobsPage />);

    await waitFor(() => expect(mockedProfileApi.getProfiles).toHaveBeenCalledTimes(1));

    const searchButton = await screen.findByRole('button', { name: '검색' });
    await waitFor(() => expect(searchButton).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(searchButton);
    });

    const jobButton = await screen.findByRole('button', { name: '사무 보조 상세 보기' });
    await act(async () => {
      fireEvent.click(jobButton);
    });

    await waitFor(() => expect(mockedExplainRecommendation).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.queryByText('signal is aborted without reason')).not.toBeInTheDocument();
    });
  });
});
