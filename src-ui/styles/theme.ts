/**
 * Obsidian Black Theme Configuration
 *
 * Defines all theme variables for the Cowork desktop application.
 * The theme follows a dark obsidian aesthetic with carefully chosen
 * colors for optimal readability and visual appeal.
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 定义黑曜石黑主题 CSS 变量_
 * _TaskGroup: 9_
 */

/**
 * Theme color definitions
 */
export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;

  // Border colors
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;

  // Accent colors
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;
  accentInfo: string;
}

/**
 * Theme spacing scale
 */
export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

/**
 * Theme border radius scale
 */
export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

/**
 * Theme shadow scale
 */
export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

/**
 * Theme typography configuration
 */
export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

/**
 * Complete theme configuration interface
 */
export interface ThemeConfig {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  typography: ThemeTypography;
}

/**
 * Obsidian Black Theme Variables
 *
 * A dark theme inspired by obsidian stone with:
 * - Deep black backgrounds for reduced eye strain
 * - Subtle gray borders for visual separation
 * - High contrast text for readability
 * - Vibrant accent colors for interactive elements
 */
export const themeVariables: ThemeConfig = {
  colors: {
    // Background colors - Deep obsidian blacks
    bgPrimary: '#0D0D0D',      // Main background - nearly pure black
    bgSecondary: '#141414',    // Secondary areas - slightly lighter
    bgTertiary: '#1A1A1A',     // Tertiary areas - subtle distinction
    bgElevated: '#1F1F1F',     // Elevated surfaces (cards, modals)

    // Border colors - Subtle grays
    borderSubtle: '#252525',   // Very subtle borders
    borderDefault: '#333333',  // Default border color
    borderStrong: '#444444',   // Strong/emphasized borders

    // Text colors - High contrast for readability
    textPrimary: '#FAFAFA',    // Primary text - near white
    textSecondary: '#A3A3A3',  // Secondary text - muted
    textTertiary: '#737373',   // Tertiary text - subtle
    textDisabled: '#525252',   // Disabled text - very muted

    // Accent colors - Vibrant but not harsh
    accentPrimary: '#6366F1',   // Indigo - primary actions
    accentSecondary: '#8B5CF6', // Violet - secondary accents
    accentSuccess: '#22C55E',   // Green - success states
    accentWarning: '#F59E0B',   // Amber - warnings
    accentError: '#EF4444',     // Red - errors
    accentInfo: '#3B82F6',      // Blue - informational
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  },

  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
};

/**
 * CSS variable name mapping from camelCase to kebab-case
 */
const colorVariableMap: Record<keyof ThemeColors, string> = {
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

const spacingVariableMap: Record<keyof ThemeSpacing, string> = {
  xs: '--spacing-xs',
  sm: '--spacing-sm',
  md: '--spacing-md',
  lg: '--spacing-lg',
  xl: '--spacing-xl',
  '2xl': '--spacing-2xl',
  '3xl': '--spacing-3xl',
};

const borderRadiusVariableMap: Record<keyof ThemeBorderRadius, string> = {
  sm: '--border-radius-sm',
  md: '--border-radius-md',
  lg: '--border-radius-lg',
  xl: '--border-radius-xl',
  full: '--border-radius-full',
};

const shadowVariableMap: Record<keyof ThemeShadows, string> = {
  sm: '--shadow-sm',
  md: '--shadow-md',
  lg: '--shadow-lg',
  xl: '--shadow-xl',
};

/**
 * Get a CSS variable reference for a theme property
 *
 * @param category - The theme category (colors, spacing, borderRadius, shadows)
 * @param key - The specific property key within that category
 * @returns CSS var() reference string
 *
 * @example
 * getThemeVariable('colors', 'bgPrimary') // returns 'var(--bg-primary)'
 * getThemeVariable('spacing', 'md') // returns 'var(--spacing-md)'
 */
export function getThemeVariable(
  category: 'colors' | 'spacing' | 'borderRadius' | 'shadows',
  key: string
): string {
  let cssVarName: string;

  switch (category) {
    case 'colors':
      cssVarName = colorVariableMap[key as keyof ThemeColors];
      break;
    case 'spacing':
      cssVarName = spacingVariableMap[key as keyof ThemeSpacing];
      break;
    case 'borderRadius':
      cssVarName = borderRadiusVariableMap[key as keyof ThemeBorderRadius];
      break;
    case 'shadows':
      cssVarName = shadowVariableMap[key as keyof ThemeShadows];
      break;
    default:
      throw new Error(`Unknown category: ${category}`);
  }

  if (!cssVarName) {
    throw new Error(`Unknown key "${key}" in category "${category}"`);
  }

  return `var(${cssVarName})`;
}

/**
 * Generate CSS custom properties string from theme variables
 *
 * @returns CSS string with all custom property definitions
 *
 * @example
 * const css = generateCSSVariables();
 * // Returns: "--bg-primary: #0D0D0D;\n--bg-secondary: #141414;\n..."
 */
export function generateCSSVariables(): string {
  const lines: string[] = [];

  // Colors
  for (const [key, value] of Object.entries(themeVariables.colors)) {
    const cssVar = colorVariableMap[key as keyof ThemeColors];
    lines.push(`${cssVar}: ${value};`);
  }

  // Spacing
  for (const [key, value] of Object.entries(themeVariables.spacing)) {
    const cssVar = spacingVariableMap[key as keyof ThemeSpacing];
    lines.push(`${cssVar}: ${value};`);
  }

  // Border Radius
  for (const [key, value] of Object.entries(themeVariables.borderRadius)) {
    const cssVar = borderRadiusVariableMap[key as keyof ThemeBorderRadius];
    lines.push(`${cssVar}: ${value};`);
  }

  // Shadows
  for (const [key, value] of Object.entries(themeVariables.shadows)) {
    const cssVar = shadowVariableMap[key as keyof ThemeShadows];
    lines.push(`${cssVar}: ${value};`);
  }

  // Typography
  lines.push(`--font-family: ${themeVariables.typography.fontFamily};`);

  for (const [key, value] of Object.entries(themeVariables.typography.fontSize)) {
    lines.push(`--font-size-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(themeVariables.typography.fontWeight)) {
    lines.push(`--font-weight-${key}: ${value};`);
  }

  for (const [key, value] of Object.entries(themeVariables.typography.lineHeight)) {
    lines.push(`--line-height-${key}: ${value};`);
  }

  return lines.join('\n');
}

/**
 * Generate complete CSS with :root selector
 *
 * @returns Complete CSS string ready to be injected into the document
 */
export function generateThemeCSS(): string {
  return `:root {\n  ${generateCSSVariables().split('\n').join('\n  ')}\n}`;
}

export default themeVariables;
