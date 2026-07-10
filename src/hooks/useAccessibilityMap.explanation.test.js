import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../auth/AuthContext';
import { explainRecommendation, fetchMapJobRecommendations } from '../api/recommendApi';
import { useAccessibilityMap } from './useAccessibilityMap';
import { useJobFilterOptions } from './useJobFilterOptions';
import { useProfiles } from './useProfiles';

jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('./useProfiles', () => ({
  useProfiles: jest.fn()
}));

jest.mock('./useJobFilterOptions', () => ({
  useJobFilterOptions: jest.fn()
}));

jest.mock('../api/recommendApi', () => ({
  fetchMapJobRecommendations: jest.fn(),
  fetchRecommendTaskStatus: jest.fn(),
  explainRecommendation: jest.fn()
}));

jest.mock('../api/mapApi', () => ({
  mapApi: {
    getSupportAgencies: jest.fn()
  }
}));

jest.mock('../cache/recommendationCache', () => ({
  clearActiveRecommendationTask: jest.fn(),
  clearRecommendationCache: jest.fn(),
  getRecommendationExplanationCacheKey: jest.fn(() => 'recommendation:explanation:test'),
  getActiveRecommendationTask: jest.fn(() => null),
  getCachedRecommendation: jest.fn(() => null),
  getRecommendationCacheKey: jest.fn(() => 'recommendation:list:test'),
  setActiveRecommendationTask: jest.fn(),
  setCachedRecommendation: jest.fn()
}));

const mockedUseAuth = useAuth;
const mockedUseProfiles = useProfiles;
const mockedUseJobFilterOptions = useJobFilterOptions;
const mockedFetchMapJobRecommendations = fetchMapJobRecommendations;
const mockedExplainRecommendation = explainRecommendation;

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

const buildAiResultPayload = (count = 5) => ({
  aiEnabled: true,
  aiResponse: {
    result: {
      results: Array.from({ length: count }, (_, index) => ({
        total_score: 85 - index,
        score_detail: {
          accessibility_score: 80 - index
        },
        job: {
          job_post_id: index + 1,
          external_id: `job-${index + 1}`,
          job_nm: `사무 보조원 ${index + 1}`,
          buspla_name: '브릿지워크',
          comp_addr: '서울특별시 중구 세종대로 1',
          geo_latitude: '37.5665',
          geo_longitude: '126.9780',
          emp_type: '정규직',
          salary_type: '월급',
          salary: '220만원',
          term_date: '20260531'
        }
      }))
    }
  }
});

describe('useAccessibilityMap explanation loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      callWithAuth: (callback) => callback('access-token')
    });

    mockedUseProfiles.mockReturnValue({
      status: 'success',
      detailStatus: 'success',
      error: '',
      profiles: [
        {
          id: '1',
          profileId: 1,
          profileName: '기본 프로필',
          fullName: '홍길동',
          detailAddress: '서울특별시 강남구 테헤란로 123',
          targetJob: '사무 보조원'
        }
      ],
      selectedProfileId: '1',
      selectedProfile: {
        id: '1',
        profileId: 1,
        userId: 100,
        fullName: '홍길동',
        detailAddress: '서울특별시 강남구 테헤란로 123',
        targetJob: '사무 보조원'
      },
      selectProfile: jest.fn()
    });

    mockedUseJobFilterOptions.mockReturnValue({
      status: 'success',
      error: '',
      employmentTypes: [],
      jobCategories: [],
      jobOptions: [],
      regions: [],
      salaryTypes: []
    });
  });

  it('starts LLM explanation loading while recommendation list is still appending', async () => {
    const explanationDeferred = createDeferred();

    mockedFetchMapJobRecommendations.mockResolvedValue({
      status: 'COMPLETED',
      result: buildAiResultPayload()
    });
    mockedExplainRecommendation.mockReturnValue(explanationDeferred.promise);

    const { result } = renderHook(() => useAccessibilityMap());

    act(() => {
      result.current.applyFilters({
        jobCategory: '전체',
        region: '전체',
        employmentType: '전체',
        salaryType: '전체',
        commutableOnly: true
      });
    });

    await waitFor(() => expect(mockedFetchMapJobRecommendations).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(result.current.selectedJob?.id).toBe('job-1');
      expect(result.current.recommendationProgress.isLoading).toBe(true);
      expect(result.current.explanationViewState).toBe('loading');
    });

    expect(mockedExplainRecommendation).toHaveBeenCalledTimes(1);

    await act(async () => {
      explanationDeferred.resolve({
        shortSummary: '이동 경로와 업무 조건이 전반적으로 안정적입니다.'
      });
      await explanationDeferred.promise;
    });

    await waitFor(() => expect(result.current.explanationViewState).toBe('success'));
  });
});
