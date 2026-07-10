import {
  formatRecommendationExplanationList,
  formatRecommendationNextStepSummary,
  formatRecommendationExplanationText,
  getRecommendationGradeFromScore
} from './recommendationExplanationText';

describe('recommendationExplanationText', () => {
  it('adds grade after total recommendation score', () => {
    expect(
      formatRecommendationExplanationText(
        '봉황기업의 “인쇄, 목재, 가구 및 기타 제조 분야 단순 종사원”은 종합 추천 점수 71점으로 나와 있어요.',
        71
      )
    ).toBe('봉황기업의 “인쇄, 목재, 가구 및 기타 제조 분야 단순 종사원”은 종합 추천 점수 71점(B등급)으로 나와 있어요.');
  });

  it('removes unsupported commute data sentence', () => {
    expect(
      formatRecommendationExplanationText(
        '지원 조건은 대체로 맞습니다. 다만 근무지 주변 이동·대중교통 통근 정보는 근거 데이터가 부족해서, 지원 전 확인이 필요해요.',
        71
      )
    ).toBe('지원 조건은 대체로 맞습니다.');
  });

  it('filters empty list items after formatting', () => {
    expect(
      formatRecommendationExplanationList([
        '다만 근무지 주변 이동·대중교통 통근 정보는 근거 데이터가 부족해서, 지원 전 확인이 필요해요.'
      ], 71)
    ).toEqual([]);
  });

  it('removes duplicated next-step heading from summary', () => {
    expect(
      formatRecommendationNextStepSummary(
        '이런 준비가 도움이 될 수 있어요: 지원 준비와 구직 역량을 정리하는 데 도움이 될 수 있어요.',
        71
      )
    ).toBe('지원 준비와 구직 역량을 정리하는 데 도움이 될 수 있어요.');
  });

  it('returns grade from score', () => {
    expect(getRecommendationGradeFromScore(71)).toBe('B등급');
  });
});
