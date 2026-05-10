export const ACCESSIBILITY_SETTINGS_STORAGE_KEY = 'bridgework.settings.preferences';

export const DEFAULT_ACCESSIBILITY_PREFERENCES = {
  fontSize: 'default',
  contrast: false,
  reduceMotion: false,
  mapColorAssist: true,
  scoreDisplay: 'text-color',
  showMapList: true,
  screenReaderMode: false,
  emailNotification: true,
  smsNotification: false,
  kakaoNotification: true,
  recommendationNotification: true,
  deadlineNotification: true,
  accessibilityUpdateNotification: true,
  serviceNoticeNotification: true,
  marketingConsent: false
};

const VALID_FONT_SIZES = new Set(['default', 'large', 'xlarge']);
const VALID_SCORE_DISPLAYS = new Set(['text-color', 'text-first']);

function normalizeAccessibilityPreferences(value) {
  const preferences = {
    ...DEFAULT_ACCESSIBILITY_PREFERENCES,
    ...(value && typeof value === 'object' ? value : {})
  };

  return {
    ...preferences,
    fontSize: VALID_FONT_SIZES.has(preferences.fontSize)
      ? preferences.fontSize
      : DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize,
    scoreDisplay: VALID_SCORE_DISPLAYS.has(preferences.scoreDisplay)
      ? preferences.scoreDisplay
      : DEFAULT_ACCESSIBILITY_PREFERENCES.scoreDisplay,
    showMapList: true
  };
}

export function readAccessibilityPreferences() {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY);
    return normalizeAccessibilityPreferences(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
}

export function saveAccessibilityPreferences(preferences) {
  window.localStorage.setItem(
    ACCESSIBILITY_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeAccessibilityPreferences(preferences))
  );
}

export function applyAccessibilityPreferences(preferences) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const normalizedPreferences = normalizeAccessibilityPreferences(preferences);

  root.dataset.bwFontSize = normalizedPreferences.fontSize;
  root.dataset.bwContrast = normalizedPreferences.contrast ? 'on' : 'off';
  root.dataset.bwReduceMotion = normalizedPreferences.reduceMotion ? 'on' : 'off';
  root.dataset.bwMapColorAssist = normalizedPreferences.mapColorAssist ? 'on' : 'off';
  root.dataset.bwScoreDisplay = normalizedPreferences.scoreDisplay;
  root.dataset.bwShowMapList = normalizedPreferences.showMapList ? 'on' : 'off';
  root.dataset.bwScreenReaderMode = normalizedPreferences.screenReaderMode ? 'on' : 'off';
}
