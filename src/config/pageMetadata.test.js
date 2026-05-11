import { buildAlternateUrls, buildCanonicalPath, buildCanonicalUrl, getPageMetadata } from './pageMetadata';

describe('getPageMetadata', () => {
  it('returns route metadata for major pages', () => {
    expect(getPageMetadata('/jobs')).toMatchObject({
      title: '맞춤 일자리 공고 | Bridge Work',
      path: '/jobs'
    });
    expect(getPageMetadata('/accessibility-map')).toMatchObject({
      title: '지역 접근성 지도 | Bridge Work',
      path: '/accessibility-map'
    });
  });

  it('returns policy document metadata for policy detail pages', () => {
    expect(getPageMetadata('/settings/policies/privacy-policy')).toMatchObject({
      title: '개인정보 처리방침 | Bridge Work',
      description: 'Bridgework가 개인정보를 처리하는 기준, 보유 기간, 이용자 권리와 안전조치를 안내합니다.'
    });
  });

  it('returns not found metadata for unknown pages', () => {
    expect(getPageMetadata('/missing-page')).toMatchObject({
      title: '페이지를 찾을 수 없습니다 | Bridge Work',
      path: '/missing-page'
    });
  });

  it('builds normalized canonical URLs for localized routes', () => {
    expect(buildCanonicalPath('/')).toBe('/ko');
    expect(buildCanonicalPath('/terms/')).toBe('/ko/terms');
    expect(buildCanonicalPath('/en/terms?utm_source=test')).toBe('/en/terms');
    expect(buildCanonicalUrl('/settings/policies/privacy-policy#top')).toBe(
      'https://www.bridgework.cloud/ko/settings/policies/privacy-policy'
    );
  });

  it('builds hreflang alternate URLs from the same canonical path', () => {
    expect(buildAlternateUrls('/en/privacy')).toMatchObject({
      ko: 'https://www.bridgework.cloud/ko/privacy',
      zh: 'https://www.bridgework.cloud/zh/privacy',
      en: 'https://www.bridgework.cloud/en/privacy',
      ja: 'https://www.bridgework.cloud/ja/privacy',
      'x-default': 'https://www.bridgework.cloud/ko/privacy'
    });
  });
});
