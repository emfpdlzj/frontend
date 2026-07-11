import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ACCESSIBILITY_SETTINGS_STORAGE_KEY,
  readAccessibilityPreferences
} from '../config/accessibilityPreferences';
import {
  AccessibilityPreferencesProvider,
  useAccessibilityPreferences
} from './AccessibilityPreferencesContext';

function PreferenceHarness() {
  const { preferences, updatePreference } = useAccessibilityPreferences();

  return (
    <button type="button" onClick={() => updatePreference('colorBlindMode', !preferences.colorBlindMode)}>
      색약 모드 토글
    </button>
  );
}

describe('AccessibilityPreferencesProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.bwColorBlindMode;
    delete document.documentElement.dataset.bwMapColorAssist;
  });

  it('persists updated preferences immediately', async () => {
    render(
      <AccessibilityPreferencesProvider>
        <PreferenceHarness />
      </AccessibilityPreferencesProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: '색약 모드 토글' }));

    await waitFor(() => {
      expect(readAccessibilityPreferences().colorBlindMode).toBe(true);
      expect(document.documentElement.dataset.bwColorBlindMode).toBe('on');
      expect(document.documentElement.dataset.bwMapColorAssist).toBe('on');
    });

    expect(window.localStorage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY)).toContain('"colorBlindMode":true');
  });
});
