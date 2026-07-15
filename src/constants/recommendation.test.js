import { hasMoreRecommendationPages } from './recommendation';

describe('hasMoreRecommendationPages', () => {
  it('continues paging beyond the previous 1000 item cap', () => {
    expect(hasMoreRecommendationPages({
      pageSize: 100,
      loadedCount: 100,
      offset: 1000,
      totalCount: 1250
    })).toBe(true);
  });

  it('stops after the final partial page reaches totalCount', () => {
    expect(hasMoreRecommendationPages({
      pageSize: 100,
      loadedCount: 50,
      offset: 1200,
      totalCount: 1250
    })).toBe(false);
  });
});
