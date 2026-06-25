import { buildAlternateUrls, buildCanonicalPath, buildCanonicalUrl, getPageMetadata } from './pageMetadata';

describe('getPageMetadata', () => {
  it('returns route metadata for major pages', () => {
    expect(getPageMetadata('/jobs')).toMatchObject({
      title: '스크랩한 공고 | BridgeWork',
      path: '/jobs',
      robots: 'noindex,nofollow'
    });
    expect(getPageMetadata('/accessibility-map')).toMatchObject({
      title: '지역 접근성 지도 | BridgeWork',
      path: '/accessibility-map',
      robots: 'noindex,nofollow'
    });
    expect(getPageMetadata('/about')).toMatchObject({
      title: '서비스 소개 | BridgeWork',
      path: '/about',
      robots: 'index,follow'
    });
    expect(getPageMetadata('/faq')).toMatchObject({
      title: '자주 묻는 질문 | BridgeWork',
      path: '/faq',
      robots: 'index,follow'
    });
    expect(getPageMetadata('/notices')).toMatchObject({
      title: '공지사항 | BridgeWork',
      path: '/notices',
      robots: 'index,follow'
    });
    expect(getPageMetadata('/admin/notices')).toMatchObject({
      title: '공지사항 관리 | BridgeWork',
      path: '/admin/notices',
      robots: 'noindex,nofollow'
    });
    expect(getPageMetadata('/admin/login')).toMatchObject({
      title: '관리자 로그인 | BridgeWork',
      path: '/admin/login',
      robots: 'noindex,nofollow'
    });
  });

  it('returns notice detail metadata for notice detail pages', () => {
    expect(getPageMetadata('/notices/123')).toMatchObject({
      title: '공지사항 상세 | BridgeWork',
      path: '/notices/123',
      robots: 'index,follow'
    });
  });

  it('returns policy document metadata for policy detail pages', () => {
    expect(getPageMetadata('/settings/policies/privacy-policy')).toMatchObject({
      title: '개인정보 처리방침 | BridgeWork',
      description: 'Bridgework가 개인정보를 처리하는 기준, 보유 기간, 이용자 권리와 안전조치를 안내합니다.'
    });
  });

  it('returns not found metadata for unknown pages', () => {
    expect(getPageMetadata('/missing-page')).toMatchObject({
      title: '페이지를 찾을 수 없습니다 | BridgeWork',
      path: '/missing-page',
      robots: 'noindex,nofollow'
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
      'zh-CN': 'https://www.bridgework.cloud/zh-CN/privacy',
      en: 'https://www.bridgework.cloud/en/privacy',
      ja: 'https://www.bridgework.cloud/ja/privacy',
      'x-default': 'https://www.bridgework.cloud/ko/privacy'
    });
  });
});
