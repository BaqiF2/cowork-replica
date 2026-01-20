/**
 * Input Component Configuration
 *
 * Defines input styles with:
 * - 3 sizes: sm, md, lg
 * - Focus border with accent color
 * - Placeholder styling
 * - State support: focus, disabled, error
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 通用组件库_
 * _TaskGroup: 11_
 */

/**
 * Input size types
 */
export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Input state styles
 */
export interface InputStateStyles {
  borderColor?: string;
  outline?: string;
  outlineOffset?: string;
  backgroundColor?: string;
  cursor?: string;
  opacity?: number;
}

/**
 * Input configuration interface
 */
export interface InputConfig {
  sizes: Record<InputSize, string>;
  states: {
    focus: InputStateStyles;
    disabled: InputStateStyles;
    error: InputStateStyles;
  };
  baseStyles: string;
  placeholderColor: string;
}

/**
 * Size styles
 */
const sizeStyles: Record<InputSize, string> = {
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
 * Base input styles
 */
const baseStyles = `
  display: block;
  width: 100%;
  font-family: var(--font-family);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-fast);
  outline: none;
`.trim();

/**
 * Placeholder color
 */
const placeholderColor = 'var(--text-tertiary)';

/**
 * Input state styles
 */
const stateStyles: InputConfig['states'] = {
  focus: {
    borderColor: 'var(--accent-primary)',
    outline: '2px solid var(--accent-primary)',
    outlineOffset: '-1px',
  },
  disabled: {
    backgroundColor: 'var(--bg-tertiary)',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  error: {
    borderColor: 'var(--accent-error)',
  },
};

/**
 * Get input configuration
 */
export function getInputConfig(): InputConfig {
  return {
    sizes: { ...sizeStyles },
    states: { ...stateStyles },
    baseStyles,
    placeholderColor,
  };
}

/**
 * Generate input styles for a specific size
 */
export function getInputStyles(size: InputSize): string {
  return `
    ${baseStyles}
    ${sizeStyles[size]}
  `.trim();
}

/**
 * Generate complete input CSS
 */
export function generateInputCSS(): string {
  const lines: string[] = [];

  // Base class
  lines.push(`.input {
  ${baseStyles}
}`);

  // Placeholder styling
  lines.push(`.input::placeholder {
  color: ${placeholderColor};
  opacity: 1;
}`);

  // Size classes
  for (const size of ['sm', 'md', 'lg'] as InputSize[]) {
    lines.push(`.input-${size} {
  ${sizeStyles[size]}
}`);
  }

  // Focus state
  lines.push(`.input:focus {
  border-color: ${stateStyles.focus.borderColor};
  outline: ${stateStyles.focus.outline};
  outline-offset: ${stateStyles.focus.outlineOffset};
}`);

  // Disabled state
  lines.push(`.input:disabled {
  background-color: ${stateStyles.disabled.backgroundColor};
  cursor: ${stateStyles.disabled.cursor};
  opacity: ${stateStyles.disabled.opacity};
}`);

  // Error state
  lines.push(`.input-error,
.input.error {
  border-color: ${stateStyles.error.borderColor};
}`);

  lines.push(`.input-error:focus,
.input.error:focus {
  border-color: ${stateStyles.error.borderColor};
  outline-color: var(--accent-error);
}`);

  return lines.join('\n\n');
}

export default {
  getInputConfig,
  getInputStyles,
  generateInputCSS,
};
