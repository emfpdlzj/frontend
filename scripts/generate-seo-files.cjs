const fs = require('fs');
const path = require('path');

const supportedLocales = ['ko', 'en', 'ja', 'zh'];
const defaultLocale = 'ko';
const publicRoutes = ['/', '/about', '/faq', '/terms', '/privacy'];
// TODO: 공개 채용 목록과 /jobs/:id 상세 라우트가 생기면 Spring Backend의 공고 API를
// 빌드 시점 또는 서버 엔드포인트에서 조회해 sitemap에 /jobs/{id}를 추가한다.
// 현재 /jobs는 로그인 후 스크랩 관리 화면이라 robots와 sitemap 색인 대상에서 제외한다.
const policyRoutes = [
  '/settings/policies/terms',
  '/settings/policies/privacy-policy',
  '/settings/policies/privacy-consent',
  '/settings/policies/sensitive-consent',
  '/settings/policies/marketing-consent',
  '/settings/policies/withdrawal-retention',
  '/settings/policies/third-party',
  '/settings/policies/outsourcing',
  '/settings/policies/location',
  '/settings/policies/cookies',
  '/settings/policies/ai-limit',
  '/settings/policies/public-data-limit',
  '/settings/policies/policy-change'
];

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const siteUrl = trimTrailingSlash(process.env.REACT_APP_SITE_URL || process.env.VITE_SITE_URL || 'https://www.bridgework.cloud');
const today = new Date().toISOString().slice(0, 10);
const publicDir = path.join(process.cwd(), 'public');

const localizePath = (route, locale = defaultLocale) => {
  const normalizedRoute = route === '/' ? '' : route;
  return `/${locale}${normalizedRoute}`;
};

const toUrlEntry = (route, priority, changefreq) =>
  supportedLocales
    .map((locale) => `  <url>
    <loc>${siteUrl}${localizePath(route, locale)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
    .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
  ...publicRoutes.map((route) => toUrlEntry(route, route === '/' ? '1.0' : '0.7', route === '/' ? 'weekly' : 'monthly')),
  ...policyRoutes.map((route) => toUrlEntry(route, '0.4', 'monthly'))
].join('\n')}
</urlset>
`;

const disallowLocalized = (route) => supportedLocales.map((locale) => `Disallow: /${locale}${route}`).join('\n');

const robots = `User-agent: *
Allow: /

# Authenticated, session-specific, or API-like client routes should not be indexed.
Disallow: /login
Disallow: /signup
Disallow: /profile
Disallow: /my/
Disallow: /jobs
Disallow: /accessibility-map
Disallow: /settings
Disallow: /auth/
Disallow: /api
${['/login', '/signup', '/profile', '/my/', '/jobs', '/accessibility-map', '/settings', '/auth/', '/api']
  .map(disallowLocalized)
  .join('\n')}

# Public policy documents live below /settings/policies and are safe to crawl.
Allow: /settings/policies/
${supportedLocales.map((locale) => `Allow: /${locale}/settings/policies/`).join('\n')}

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

console.log(`Generated SEO files for ${siteUrl}`);
