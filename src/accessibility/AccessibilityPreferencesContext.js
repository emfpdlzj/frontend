import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ACCESSIBILITY_SETTINGS_STORAGE_KEY,
  applyAccessibilityPreferences,
  readAccessibilityPreferences,
  saveAccessibilityPreferences
} from '../config/accessibilityPreferences';

const AccessibilityPreferencesContext = createContext(null);

export function AccessibilityPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readAccessibilityPreferences);
  const [savedPreferences, setSavedPreferences] = useState(readAccessibilityPreferences);

  useEffect(() => {
    applyAccessibilityPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== ACCESSIBILITY_SETTINGS_STORAGE_KEY) {
        return;
      }

      const nextPreferences = readAccessibilityPreferences();
      setPreferences(nextPreferences);
      setSavedPreferences(nextPreferences);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updatePreference = useCallback((key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  }, []);

  const persistPreferences = useCallback(() => {
    saveAccessibilityPreferences(preferences);
    setSavedPreferences(preferences);
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      savedPreferences,
      updatePreference,
      persistPreferences
    }),
    [preferences, persistPreferences, savedPreferences, updatePreference]
  );

  return (
    <AccessibilityPreferencesContext.Provider value={value}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}

export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityPreferencesContext);

  if (!context) {
    throw new Error('useAccessibilityPreferences must be used within AccessibilityPreferencesProvider');
  }

  return context;
}
