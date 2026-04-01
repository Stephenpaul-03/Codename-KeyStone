import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeMode = 'light' | 'dark';

type ThemeModeContextValue = {
  /** Resolved theme mode (system or overridden). */
  mode: ThemeMode;
  /** True when using the system theme (no user override). */
  isFollowingSystem: boolean;
  /** Override system theme with an explicit mode. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light/dark and override system theme. */
  toggle: () => void;
  /** Clear override and follow the system theme again. */
  resetToSystem: () => void;
};

const ThemeModeContext = React.createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';

  const [overrideMode, setOverrideMode] = React.useState<ThemeMode | null>(null);
  const mode = overrideMode ?? systemMode;

  const setMode = React.useCallback((nextMode: ThemeMode) => {
    setOverrideMode(nextMode);
  }, []);

  const toggle = React.useCallback(() => {
    setOverrideMode((currentOverride) => {
      const currentMode = currentOverride ?? systemMode;
      return currentMode === 'dark' ? 'light' : 'dark';
    });
  }, [systemMode]);

  const resetToSystem = React.useCallback(() => {
    setOverrideMode(null);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      isFollowingSystem: overrideMode == null,
      setMode,
      toggle,
      resetToSystem,
    }),
    [mode, overrideMode, resetToSystem, setMode, toggle]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = React.useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
}
