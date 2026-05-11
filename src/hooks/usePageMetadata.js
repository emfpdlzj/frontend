import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildAbsoluteUrl, buildAlternateUrls, buildCanonicalUrl, getPageMetadata, SITE_NAME } from '../config/pageMetadata';
import { stripLocaleFromPathname } from '../i18n/locales';

function setMetaAttribute(selector, attribute, value) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    const [, key, attrValue] = selector.match(/meta\[(name|property)="([^"]+)"\]/) || [];

    if (key && attrValue) {
      element.setAttribute(key, attrValue);
    }

    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
}

function setLinkAttribute(selector, rel, href) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

function setAlternateLinks(alternateUrls) {
  document.head.querySelectorAll('link[data-managed-alternate="true"]').forEach((element) => {
    element.remove();
  });

  Object.entries(alternateUrls).forEach(([hreflang, href]) => {
    const element = document.createElement('link');
    element.setAttribute('rel', 'alternate');
    element.setAttribute('hreflang', hreflang);
    element.setAttribute('href', href);
    element.setAttribute('data-managed-alternate', 'true');
    document.head.appendChild(element);
  });
}

export function usePageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const pathname = stripLocaleFromPathname(location.pathname);
    const metadata = getPageMetadata(pathname);
    const canonicalUrl = buildCanonicalUrl(location.pathname);
    const alternateUrls = buildAlternateUrls(location.pathname);
    const imageUrl = buildAbsoluteUrl(metadata.imagePath);

    document.title = metadata.title;
    setLinkAttribute('link[rel="canonical"]', 'canonical', canonicalUrl);
    setAlternateLinks(alternateUrls);
    setMetaAttribute('meta[name="description"]', 'content', metadata.description);
    setMetaAttribute('meta[property="og:type"]', 'content', metadata.type);
    setMetaAttribute('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaAttribute('meta[property="og:site_name"]', 'content', SITE_NAME);
    setMetaAttribute('meta[property="og:title"]', 'content', metadata.title);
    setMetaAttribute('meta[property="og:description"]', 'content', metadata.description);
    setMetaAttribute('meta[property="og:image"]', 'content', imageUrl);
    setMetaAttribute('meta[property="og:image:secure_url"]', 'content', imageUrl);
    setMetaAttribute('meta[property="og:image:type"]', 'content', 'image/png');
    setMetaAttribute('meta[property="og:image:width"]', 'content', '1200');
    setMetaAttribute('meta[property="og:image:height"]', 'content', '630');
    setMetaAttribute('meta[property="og:image:alt"]', 'content', 'Bridge Work 서비스 소개 이미지');
    setMetaAttribute('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaAttribute('meta[name="twitter:title"]', 'content', metadata.title);
    setMetaAttribute('meta[name="twitter:description"]', 'content', metadata.description);
    setMetaAttribute('meta[name="twitter:url"]', 'content', canonicalUrl);
    setMetaAttribute('meta[name="twitter:image"]', 'content', imageUrl);
  }, [location.pathname]);
}
