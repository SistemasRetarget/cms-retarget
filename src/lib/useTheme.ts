'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Theme, ThemeMode } from './themes';
import { BUILTIN_THEMES, getThemeById, applyThemeToDocument } from './themes';

const THEME_STORAGE_KEY = 'cms-theme-preference';

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<ThemeMode>('system');

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      try {
        const { themeId, mode: storedMode } = JSON.parse(stored);
        setMode(storedMode || 'system');
        const t = getThemeById(themeId);
        if (t) {
          setTheme(t);
          applyThemeToDocument(t);
        }
      } catch (e) {
        console.warn('Failed to restore theme preference', e);
      }
    } else {
      // Default to light theme
      const defaultTheme = BUILTIN_THEMES[0];
      setTheme(defaultTheme);
      applyThemeToDocument(defaultTheme);
    }
  }, []);

  const selectTheme = useCallback((themeId: string) => {
    const t = getThemeById(themeId);
    if (t) {
      setTheme(t);
      applyThemeToDocument(t);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        themeId: t.id,
        mode: t.mode,
      }));
    }
  }, []);

  return { theme, selectTheme, availableThemes: BUILTIN_THEMES };
}
