import {
  ACCESSIBILITY_SETTINGS_STORAGE_KEY,
  applyAccessibilityPreferences,
  readAccessibilityPreferences
} from './accessibilityPreferences';

describe('accessibilityPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.bwFontSize;
    delete document.documentElement.dataset.bwContrast;
    delete document.documentElement.dataset.bwReduceMotion;
    delete document.documentElement.dataset.bwColorBlindMode;
    delete document.documentElement.dataset.bwMapColorAssist;
    delete document.documentElement.dataset.bwScoreDisplay;
    delete document.documentElement.dataset.bwScreenReaderMode;
  });

  it('migrates the legacy map color assist preference to color blind mode', () => {
    window.localStorage.setItem(
      ACCESSIBILITY_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        fontSize: 'xlarge',
        mapColorAssist: true
      })
    );

    expect(readAccessibilityPreferences()).toMatchObject({
      fontSize: 'xlarge',
      colorBlindMode: true,
      mapColorAssist: true
    });
  });

  it('applies the selected preferences to document dataset attributes', () => {
    applyAccessibilityPreferences({
      fontSize: 'large',
      contrast: true,
      reduceMotion: true,
      colorBlindMode: true,
      screenReaderMode: true
    });

    expect(document.documentElement.dataset.bwFontSize).toBe('large');
    expect(document.documentElement.dataset.bwContrast).toBe('on');
    expect(document.documentElement.dataset.bwReduceMotion).toBe('on');
    expect(document.documentElement.dataset.bwColorBlindMode).toBe('on');
    expect(document.documentElement.dataset.bwMapColorAssist).toBe('on');
    expect(document.documentElement.dataset.bwScreenReaderMode).toBe('on');
  });
});
