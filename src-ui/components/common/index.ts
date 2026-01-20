/**
 * Common Components Index
 *
 * Exports all common UI components:
 * - Button: 5 variants, 3 sizes, state support
 * - Input: Focus border, placeholder styles, state support
 * - Modal: Backdrop, fade-in animation, 4 sizes
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 通用组件库_
 * _TaskGroup: 11_
 */

// Button exports
export {
  ButtonVariant,
  ButtonSize,
  ButtonStateStyles,
  ButtonConfig,
  getButtonConfig,
  getButtonVariants,
  getButtonStyles,
  generateButtonCSS,
} from './Button';

// Input exports
export {
  InputSize,
  InputStateStyles,
  InputConfig,
  getInputConfig,
  getInputStyles,
  generateInputCSS,
} from './Input';

// Modal exports
export {
  ModalSize,
  ModalAnimation,
  ModalConfig,
  getModalConfig,
  getModalStyles,
  getBackdropStyles,
  generateModalCSS,
} from './Modal';

/**
 * Component styles type
 */
export interface ComponentStyles {
  button: string;
  input: string;
  modal: string;
}

/**
 * Get all component styles
 */
export function getComponentStyles(): ComponentStyles {
  const { generateButtonCSS } = require('./Button');
  const { generateInputCSS } = require('./Input');
  const { generateModalCSS } = require('./Modal');

  return {
    button: generateButtonCSS(),
    input: generateInputCSS(),
    modal: generateModalCSS(),
  };
}

/**
 * Generate complete CSS for all components
 */
export function generateComponentCSS(): string {
  const { generateButtonCSS } = require('./Button');
  const { generateInputCSS } = require('./Input');
  const { generateModalCSS } = require('./Modal');

  return `
/* ========== Button Component ========== */
${generateButtonCSS()}

/* ========== Input Component ========== */
${generateInputCSS()}

/* ========== Modal Component ========== */
${generateModalCSS()}
`.trim();
}

export default {
  getComponentStyles,
  generateComponentCSS,
};
