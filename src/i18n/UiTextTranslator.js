import { useEffect } from 'react';
import { translateUiText } from './uiTextTranslations';

const TEXT_NODE = 3;
const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'alt', 'placeholder', 'title'];
const SKIP_SELECTOR = [
  'script',
  'style',
  'textarea',
  '[data-i18n-skip]',
  '.accessibility-map__job-title',
  '.accessibility-map__job-company',
  '.home-job-company',
  '.home-job-card h3',
  '.jobs-card__title',
  '.jobs-detail__title'
].join(',');

const originalTextNodes = new WeakMap();

function shouldSkipNode(node) {
  const element = node.nodeType === TEXT_NODE ? node.parentElement : node;
  return Boolean(element?.closest?.(SKIP_SELECTOR));
}

function translateTextNode(node, locale) {
  if (!node.nodeValue) {
    return;
  }

  const original = originalTextNodes.get(node) || node.nodeValue;

  if (!/[가-힣]/.test(original)) {
    return;
  }

  if (!originalTextNodes.has(node)) {
    originalTextNodes.set(node, original);
  }

  const translated = locale === 'ko' ? original : translateUiText(original, locale);

  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
}

function translateElementAttributes(element, locale) {
  TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
    const originalAttribute = `data-i18n-original-${attribute}`;
    const currentValue = element.getAttribute(attribute);
    const originalValue = element.getAttribute(originalAttribute) || currentValue;

    if (!originalValue || !/[가-힣]/.test(originalValue)) {
      return;
    }

    if (!element.hasAttribute(originalAttribute)) {
      element.setAttribute(originalAttribute, originalValue);
    }

    const translated = locale === 'ko' ? originalValue : translateUiText(originalValue, locale);

    if (currentValue !== translated) {
      element.setAttribute(attribute, translated);
    }
  });
}

function translateSubtree(root, locale) {
  if (!root || shouldSkipNode(root)) {
    return;
  }

  if (root.nodeType === TEXT_NODE) {
    translateTextNode(root, locale);
    return;
  }

  if (root.nodeType !== 1) {
    return;
  }

  translateElementAttributes(root, locale);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
  });

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === TEXT_NODE) {
      translateTextNode(node, locale);
    } else {
      translateElementAttributes(node, locale);
    }

    node = walker.nextNode();
  }
}

export function UiTextTranslator({ locale }) {
  useEffect(() => {
    translateSubtree(document.body, locale);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          translateSubtree(mutation.target, locale);
          return;
        }

        if (mutation.type === 'attributes') {
          translateSubtree(mutation.target, locale);
          return;
        }

        mutation.addedNodes.forEach((node) => translateSubtree(node, locale));
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
