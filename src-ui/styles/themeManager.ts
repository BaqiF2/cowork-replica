/**
 * Theme Manager
 *
 * Provides functionality for:
 * - Theme switching between built-in themes
 * - User custom color overrides
 * - Runtime theme updates
 *
 * _Requirements: 基础 UI 布局实现_
 * _TaskGroup: 9_
 */

import {
  ThemeConfig,
  ThemeColors,
  themeVariables,
  generateCSSVariables,
} from './theme';

/**
 * Available built-in themes
 */
export type ThemeName = 'obsidian' | 'midnight' | 'charcoal';

/**
 * User color overrides - partial colors that override the base theme
 */
export type UserColorOverrides = Partial<ThemeColors>;

/**
 * Theme manager state
 */
interface ThemeManagerState {
  currentTheme: ThemeName;
  userOverrides: UserColorOverrides;
}

/**
 * Midnight Blue theme - a softer alternative to pure black
 */
const midnightTheme: ThemeColors = {
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgTertiary: '#334155',
  bgElevated: '#475569',
  borderSubtle: '#334155',
  borderDefault: '#475569',
  borderStrong: '#64748B',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textDisabled: '#64748B',
  accentPrimary: '#3B82F6',
  accentSecondary: '#6366F1',
  accentSuccess: '#22C55E',
  accentWarning: '#F59E0B',
  accentError: '#EF4444',
  accentInfo: '#0EA5E9',
};

/**
 * Charcoal theme - warm dark gray tones
 */
const charcoalTheme: ThemeColors = {
  bgPrimary: '#18181B',
  bgSecondary: '#27272A',
  bgTertiary: '#3F3F46',
  bgElevated: '#52525B',
  borderSubtle: '#3F3F46',
  borderDefault: '#52525B',
  borderStrong: '#71717A',
  textPrimary: '#FAFAFA',
  textSecondary: '#D4D4D8',
  textTertiary: '#A1A1AA',
  textDisabled: '#71717A',
  accentPrimary: '#A855F7',
  accentSecondary: '#EC4899',
  accentSuccess: '#10B981',
  accentWarning: '#FBBF24',
  accentError: '#F43F5E',
  accentInfo: '#06B6D4',
};

/**
 * Built-in theme registry
 */
const themeRegistry: Record<ThemeName, ThemeColors> = {
  obsidian: themeVariables.colors,
  midnight: midnightTheme,
  charcoal: charcoalTheme,
};

/**
 * ThemeManager class
 *
 * Manages theme state and provides methods for switching themes
 * and applying user customizations.
 */
export class ThemeManager {
  private state: ThemeManagerState;
  private listeners: Set<(state: ThemeManagerState) => void> = new Set();

  constructor(initialTheme: ThemeName = 'obsidian') {
    this.state = {
      currentTheme: initialTheme,
      userOverrides: {},
    };
  }

  /**
   * Get the current theme name
   */
  getCurrentTheme(): ThemeName {
    return this.state.currentTheme;
  }

  /**
   * Get the current user overrides
   */
  getUserOverrides(): UserColorOverrides {
    return { ...this.state.userOverrides };
  }

  /**
   * Get the effective colors (base theme + user overrides)
   */
  getEffectiveColors(): ThemeColors {
    const baseColors = themeRegistry[this.state.currentTheme];
    return {
      ...baseColors,
      ...this.state.userOverrides,
    };
  }

  /**
   * Switch to a different built-in theme
   */
  setTheme(themeName: ThemeName): void {
    if (!themeRegistry[themeName]) {
      throw new Error(`Unknown theme: ${themeName}`);
    }

    this.state = {
      ...this.state,
      currentTheme: themeName,
    };

    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Set user color overrides
   */
  setUserOverrides(overrides: UserColorOverrides): void {
    this.state = {
      ...this.state,
      userOverrides: { ...overrides },
    };

    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Update a single color override
   */
  setColorOverride<K extends keyof ThemeColors>(key: K, value: string): void {
    this.state = {
      ...this.state,
      userOverrides: {
        ...this.state.userOverrides,
        [key]: value,
      },
    };

    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Clear all user overrides
   */
  clearUserOverrides(): void {
    this.state = {
      ...this.state,
      userOverrides: {},
    };

    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (state: ThemeManagerState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Apply the current theme to the document
   */
  applyTheme(): void {
    if (typeof document === 'undefined') {
      return; // Skip in non-browser environments
    }

    const effectiveColors = this.getEffectiveColors();
    const root = document.documentElement;

    // Apply color variables
    const colorVarMap: Record<keyof ThemeColors, string> = {
      bgPrimary: '--bg-primary',
      bgSecondary: '--bg-secondary',
      bgTertiary: '--bg-tertiary',
      bgElevated: '--bg-elevated',
      borderSubtle: '--border-subtle',
      borderDefault: '--border-default',
      borderStrong: '--border-strong',
      textPrimary: '--text-primary',
      textSecondary: '--text-secondary',
      textTertiary: '--text-tertiary',
      textDisabled: '--text-disabled',
      accentPrimary: '--accent-primary',
      accentSecondary: '--accent-secondary',
      accentSuccess: '--accent-success',
      accentWarning: '--accent-warning',
      accentError: '--accent-error',
      accentInfo: '--accent-info',
    };

    for (const [key, cssVar] of Object.entries(colorVarMap)) {
      const value = effectiveColors[key as keyof ThemeColors];
      root.style.setProperty(cssVar, value);
    }
  }

  /**
   * Generate CSS for the current effective theme
   */
  generateCSS(): string {
    const effectiveColors = this.getEffectiveColors();
    const effectiveTheme: ThemeConfig = {
      ...themeVariables,
      colors: effectiveColors,
    };

    // Temporarily replace theme variables
    const originalColors = themeVariables.colors;
    Object.assign(themeVariables.colors, effectiveColors);
    const css = generateCSSVariables();
    Object.assign(themeVariables.colors, originalColors);

    return css;
  }

  /**
   * Export current state for persistence
   */
  exportState(): ThemeManagerState {
    return { ...this.state };
  }

  /**
   * Import state from persistence
   */
  importState(state: ThemeManagerState): void {
    if (!themeRegistry[state.currentTheme]) {
      throw new Error(`Unknown theme: ${state.currentTheme}`);
    }

    this.state = { ...state };
    this.applyTheme();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const state = { ...this.state };
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

/**
 * Get list of available theme names
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(themeRegistry) as ThemeName[];
}

/**
 * Get theme colors by name
 */
export function getThemeColors(themeName: ThemeName): ThemeColors {
  const colors = themeRegistry[themeName];
  if (!colors) {
    throw new Error(`Unknown theme: ${themeName}`);
  }
  return { ...colors };
}

/**
 * Validate a hex color string
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Default theme manager instance
 */
export const themeManager = new ThemeManager('obsidian');

export default themeManager;
