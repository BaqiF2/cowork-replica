/**
 * Theme CSS Variables Tests
 *
 * Tests for Obsidian Black theme CSS variable definitions:
 * - Scenario: 定义黑曜石黑主题 CSS 变量
 *
 * _Requirements: 基础 UI 布局实现_
 * _TaskGroup: 9_
 */

import { themeVariables, ThemeConfig, getThemeVariable } from '../theme';

describe('Obsidian Black Theme', () => {
  describe('Scenario: 定义黑曜石黑主题 CSS 变量', () => {
    describe('Background Colors', () => {
      it('should define bg-primary color', () => {
        expect(themeVariables.colors.bgPrimary).toBeDefined();
        expect(themeVariables.colors.bgPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define bg-secondary color', () => {
        expect(themeVariables.colors.bgSecondary).toBeDefined();
        expect(themeVariables.colors.bgSecondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define bg-tertiary color', () => {
        expect(themeVariables.colors.bgTertiary).toBeDefined();
        expect(themeVariables.colors.bgTertiary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define bg-elevated color', () => {
        expect(themeVariables.colors.bgElevated).toBeDefined();
        expect(themeVariables.colors.bgElevated).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should have dark background colors for obsidian theme', () => {
        // Obsidian black should have very dark backgrounds
        const primaryBrightness = getColorBrightness(themeVariables.colors.bgPrimary);
        expect(primaryBrightness).toBeLessThan(30); // Very dark
      });
    });

    describe('Border Colors', () => {
      it('should define border-subtle color', () => {
        expect(themeVariables.colors.borderSubtle).toBeDefined();
        expect(themeVariables.colors.borderSubtle).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define border-default color', () => {
        expect(themeVariables.colors.borderDefault).toBeDefined();
        expect(themeVariables.colors.borderDefault).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define border-strong color', () => {
        expect(themeVariables.colors.borderStrong).toBeDefined();
        expect(themeVariables.colors.borderStrong).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    describe('Text Colors', () => {
      it('should define text-primary color', () => {
        expect(themeVariables.colors.textPrimary).toBeDefined();
        expect(themeVariables.colors.textPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define text-secondary color', () => {
        expect(themeVariables.colors.textSecondary).toBeDefined();
        expect(themeVariables.colors.textSecondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define text-tertiary color', () => {
        expect(themeVariables.colors.textTertiary).toBeDefined();
        expect(themeVariables.colors.textTertiary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define text-disabled color', () => {
        expect(themeVariables.colors.textDisabled).toBeDefined();
        expect(themeVariables.colors.textDisabled).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should have light text colors for contrast on dark background', () => {
        const primaryBrightness = getColorBrightness(themeVariables.colors.textPrimary);
        expect(primaryBrightness).toBeGreaterThan(180); // Light text
      });
    });

    describe('Accent Colors', () => {
      it('should define accent-primary color', () => {
        expect(themeVariables.colors.accentPrimary).toBeDefined();
        expect(themeVariables.colors.accentPrimary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define accent-secondary color', () => {
        expect(themeVariables.colors.accentSecondary).toBeDefined();
        expect(themeVariables.colors.accentSecondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define accent-success color', () => {
        expect(themeVariables.colors.accentSuccess).toBeDefined();
        expect(themeVariables.colors.accentSuccess).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define accent-warning color', () => {
        expect(themeVariables.colors.accentWarning).toBeDefined();
        expect(themeVariables.colors.accentWarning).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define accent-error color', () => {
        expect(themeVariables.colors.accentError).toBeDefined();
        expect(themeVariables.colors.accentError).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      it('should define accent-info color', () => {
        expect(themeVariables.colors.accentInfo).toBeDefined();
        expect(themeVariables.colors.accentInfo).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    describe('Spacing Variables', () => {
      it('should define spacing scale', () => {
        expect(themeVariables.spacing).toBeDefined();
        expect(themeVariables.spacing.xs).toBeDefined();
        expect(themeVariables.spacing.sm).toBeDefined();
        expect(themeVariables.spacing.md).toBeDefined();
        expect(themeVariables.spacing.lg).toBeDefined();
        expect(themeVariables.spacing.xl).toBeDefined();
      });

      it('should have increasing spacing values', () => {
        const xs = parseInt(themeVariables.spacing.xs);
        const sm = parseInt(themeVariables.spacing.sm);
        const md = parseInt(themeVariables.spacing.md);
        const lg = parseInt(themeVariables.spacing.lg);
        const xl = parseInt(themeVariables.spacing.xl);

        expect(sm).toBeGreaterThan(xs);
        expect(md).toBeGreaterThan(sm);
        expect(lg).toBeGreaterThan(md);
        expect(xl).toBeGreaterThan(lg);
      });
    });

    describe('Border Radius Variables', () => {
      it('should define border radius scale', () => {
        expect(themeVariables.borderRadius).toBeDefined();
        expect(themeVariables.borderRadius.sm).toBeDefined();
        expect(themeVariables.borderRadius.md).toBeDefined();
        expect(themeVariables.borderRadius.lg).toBeDefined();
        expect(themeVariables.borderRadius.full).toBeDefined();
      });

      it('should have valid border radius values', () => {
        expect(themeVariables.borderRadius.sm).toMatch(/^\d+px$/);
        expect(themeVariables.borderRadius.md).toMatch(/^\d+px$/);
        expect(themeVariables.borderRadius.lg).toMatch(/^\d+px$/);
        expect(themeVariables.borderRadius.full).toBe('9999px');
      });
    });

    describe('Shadow Variables', () => {
      it('should define shadow scale', () => {
        expect(themeVariables.shadows).toBeDefined();
        expect(themeVariables.shadows.sm).toBeDefined();
        expect(themeVariables.shadows.md).toBeDefined();
        expect(themeVariables.shadows.lg).toBeDefined();
      });

      it('should have valid shadow values', () => {
        // Shadows should contain rgba or rgb values
        expect(themeVariables.shadows.sm).toContain('rgba');
        expect(themeVariables.shadows.md).toContain('rgba');
        expect(themeVariables.shadows.lg).toContain('rgba');
      });
    });

    describe('Typography Variables', () => {
      it('should define font family', () => {
        expect(themeVariables.typography.fontFamily).toBeDefined();
        expect(typeof themeVariables.typography.fontFamily).toBe('string');
      });

      it('should define font sizes', () => {
        expect(themeVariables.typography.fontSize).toBeDefined();
        expect(themeVariables.typography.fontSize.xs).toBeDefined();
        expect(themeVariables.typography.fontSize.sm).toBeDefined();
        expect(themeVariables.typography.fontSize.base).toBeDefined();
        expect(themeVariables.typography.fontSize.lg).toBeDefined();
        expect(themeVariables.typography.fontSize.xl).toBeDefined();
      });

      it('should define font weights', () => {
        expect(themeVariables.typography.fontWeight).toBeDefined();
        expect(themeVariables.typography.fontWeight.normal).toBeDefined();
        expect(themeVariables.typography.fontWeight.medium).toBeDefined();
        expect(themeVariables.typography.fontWeight.semibold).toBeDefined();
        expect(themeVariables.typography.fontWeight.bold).toBeDefined();
      });

      it('should define line heights', () => {
        expect(themeVariables.typography.lineHeight).toBeDefined();
        expect(themeVariables.typography.lineHeight.tight).toBeDefined();
        expect(themeVariables.typography.lineHeight.normal).toBeDefined();
        expect(themeVariables.typography.lineHeight.relaxed).toBeDefined();
      });
    });

    describe('ThemeConfig Interface', () => {
      it('should export ThemeConfig type', () => {
        const config: ThemeConfig = themeVariables;
        expect(config).toBeDefined();
      });
    });

    describe('getThemeVariable function', () => {
      it('should return CSS variable format for color', () => {
        const cssVar = getThemeVariable('colors', 'bgPrimary');
        expect(cssVar).toBe('var(--bg-primary)');
      });

      it('should return CSS variable format for spacing', () => {
        const cssVar = getThemeVariable('spacing', 'md');
        expect(cssVar).toBe('var(--spacing-md)');
      });

      it('should return CSS variable format for border radius', () => {
        const cssVar = getThemeVariable('borderRadius', 'lg');
        expect(cssVar).toBe('var(--border-radius-lg)');
      });
    });

    describe('CSS Custom Properties Generation', () => {
      it('should generate valid CSS custom properties string', () => {
        const { generateCSSVariables } = require('../theme');
        const cssString = generateCSSVariables();

        expect(cssString).toContain('--bg-primary:');
        expect(cssString).toContain('--text-primary:');
        expect(cssString).toContain('--accent-primary:');
        expect(cssString).toContain('--spacing-md:');
        expect(cssString).toContain('--border-radius-md:');
        expect(cssString).toContain('--shadow-md:');
      });
    });
  });
});

/**
 * Helper function to calculate color brightness (0-255)
 * Using the formula: (R * 299 + G * 587 + B * 114) / 1000
 */
function getColorBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
