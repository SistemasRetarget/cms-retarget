export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  contrast: 'normal' | 'enhanced';
}

export const DEFAULT_LIGHT_THEME: ThemeColors = {
  primary: '#8b7355',
  secondary: '#d4a574',
  accent: '#6b5344',
  background: '#ffffff',
  surface: '#f8f7f4',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const DEFAULT_DARK_THEME: ThemeColors = {
  primary: '#c4a57b',
  secondary: '#d4a574',
  accent: '#e8c8a0',
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#404040',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};

export const ENHANCED_CONTRAST_LIGHT: ThemeColors = {
  ...DEFAULT_LIGHT_THEME,
  primary: '#663300',
  text: '#000000',
  textSecondary: '#333333',
  border: '#999999',
};

export const ENHANCED_CONTRAST_DARK: ThemeColors = {
  ...DEFAULT_DARK_THEME,
  primary: '#ffe0cc',
  text: '#ffffff',
  textSecondary: '#e0e0e0',
  border: '#ffffff',
};

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'light-default',
    name: 'Light (Default)',
    mode: 'light',
    colors: DEFAULT_LIGHT_THEME,
    contrast: 'normal',
  },
  {
    id: 'dark-default',
    name: 'Dark',
    mode: 'dark',
    colors: DEFAULT_DARK_THEME,
    contrast: 'normal',
  },
  {
    id: 'light-enhanced',
    name: 'Light (High Contrast)',
    mode: 'light',
    colors: ENHANCED_CONTRAST_LIGHT,
    contrast: 'enhanced',
  },
  {
    id: 'dark-enhanced',
    name: 'Dark (High Contrast)',
    mode: 'dark',
    colors: ENHANCED_CONTRAST_DARK,
    contrast: 'enhanced',
  },
];

export function getThemeById(id: string): Theme | undefined {
  return BUILTIN_THEMES.find(t => t.id === id);
}

export function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(x => {
    x = x / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
