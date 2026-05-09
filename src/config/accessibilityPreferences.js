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

export function readAccessibilityPreferences() {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY);
    return raw
      ? { ...DEFAULT_ACCESSIBILITY_PREFERENCES, ...JSON.parse(raw) }
      : DEFAULT_ACCESSIBILITY_PREFERENCES;
  } catch (error) {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
}

export function saveAccessibilityPreferences(preferences) {
  window.localStorage.setItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
}

export function applyAccessibilityPreferences(preferences) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.bwFontSize = preferences.fontSize || DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize;
  root.dataset.bwContrast = preferences.contrast ? 'on' : 'off';
  root.dataset.bwReduceMotion = preferences.reduceMotion ? 'on' : 'off';
  root.dataset.bwMapColorAssist = preferences.mapColorAssist ? 'on' : 'off';
  root.dataset.bwScoreDisplay = preferences.scoreDisplay || DEFAULT_ACCESSIBILITY_PREFERENCES.scoreDisplay;
  root.dataset.bwShowMapList = preferences.showMapList ? 'on' : 'off';
  root.dataset.bwScreenReaderMode = preferences.screenReaderMode ? 'on' : 'off';
}
