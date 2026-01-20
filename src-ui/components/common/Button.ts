/**
 * Button Component Configuration
 *
 * Defines button styles with:
 * - 5 variants: primary, secondary, outline, ghost, danger
 * - 3 sizes: sm, md, lg
 * - State support: hover, focus, active, disabled
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 通用组件库_
 * _TaskGroup: 11_
 */

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button state styles
 */
export interface ButtonStateStyles {
  opacity?: number;
  cursor?: string;
  outline?: string;
  outlineOffset?: string;
  transform?: string;
  filter?: string;
}

/**
 * Button configuration interface
 */
export interface ButtonConfig {
  variants: Record<ButtonVariant, string>;
  sizes: Record<ButtonSize, string>;
  states: {
    hover: ButtonStateStyles;
    focus: ButtonStateStyles;
    active: ButtonStateStyles;
    disabled: ButtonStateStyles;
  };
  baseStyles: string;
}

/**
 * Available button variants
 */
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];

/**
 * Variant styles
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    background-color: var(--accent-primary);
    color: var(--text-primary);
    border: none;
  `.trim(),

  secondary: `
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    border: none;
  `.trim(),

  outline: `
    background-color: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  `.trim(),

  ghost: `
    background-color: transparent;
    color: var(--text-primary);
    border: none;
  `.trim(),

  danger: `
    background-color: var(--accent-error);
    color: var(--text-primary);
    border: none;
  `.trim(),
};

/**
 * Size styles
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: `
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
    height: 32px;
  `.trim(),

  md: `
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    height: 40px;
  `.trim(),

  lg: `
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
    height: 48px;
  `.trim(),
};

/**
 * Base button styles
 */
const baseStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-family: var(--font-family);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
`.trim();

/**
 * Button state styles
 */
const stateStyles: ButtonConfig['states'] = {
  hover: {
    filter: 'brightness(1.1)',
  },
  focus: {
    outline: '2px solid var(--accent-primary)',
    outlineOffset: '2px',
  },
  active: {
    transform: 'scale(0.98)',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

/**
 * Get button configuration
 */
export function getButtonConfig(): ButtonConfig {
  return {
    variants: { ...variantStyles },
    sizes: { ...sizeStyles },
    states: { ...stateStyles },
    baseStyles,
  };
}

/**
 * Get available button variants
 */
export function getButtonVariants(): ButtonVariant[] {
  return [...BUTTON_VARIANTS];
}

/**
 * Generate button styles for a specific variant and size
 */
export function getButtonStyles(variant: ButtonVariant, size: ButtonSize): string {
  return `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
  `.trim();
}

/**
 * Generate complete button CSS
 */
export function generateButtonCSS(): string {
  const lines: string[] = [];

  // Base class
  lines.push(`.btn {
  ${baseStyles}
}`);

  // Variant classes
  for (const variant of BUTTON_VARIANTS) {
    lines.push(`.btn-${variant} {
  ${variantStyles[variant]}
}`);
  }

  // Size classes
  for (const size of ['sm', 'md', 'lg'] as ButtonSize[]) {
    lines.push(`.btn-${size} {
  ${sizeStyles[size]}
}`);
  }

  // State classes
  lines.push(`.btn:hover:not(:disabled) {
  filter: ${stateStyles.hover.filter};
}`);

  lines.push(`.btn:focus-visible {
  outline: ${stateStyles.focus.outline};
  outline-offset: ${stateStyles.focus.outlineOffset};
}`);

  lines.push(`.btn:active:not(:disabled) {
  transform: ${stateStyles.active.transform};
}`);

  lines.push(`.btn:disabled {
  opacity: ${stateStyles.disabled.opacity};
  cursor: ${stateStyles.disabled.cursor};
}`);

  return lines.join('\n\n');
}

export default {
  getButtonConfig,
  getButtonVariants,
  getButtonStyles,
  generateButtonCSS,
};
