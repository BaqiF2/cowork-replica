/**
 * Accessibility Utilities
 *
 * Provides accessibility (a11y) utilities for common components:
 * - ARIA attributes
 * - Keyboard navigation
 * - Focus management
 * - Screen reader support
 *
 * _Requirements: 基础 UI 布局实现_
 * _TaskGroup: 11_
 */

/**
 * ARIA role types for common components
 */
export type AriaRole =
  | 'button'
  | 'textbox'
  | 'dialog'
  | 'alert'
  | 'alertdialog'
  | 'presentation'
  | 'none';

/**
 * ARIA attributes interface
 */
export interface AriaAttributes {
  role?: AriaRole;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'listbox';
  'aria-modal'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-busy'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-pressed'?: boolean | 'mixed';
}

/**
 * Button accessibility attributes
 */
export interface ButtonA11yProps extends AriaAttributes {
  tabIndex?: number;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Input accessibility attributes
 */
export interface InputA11yProps extends AriaAttributes {
  tabIndex?: number;
  autoComplete?: string;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

/**
 * Modal accessibility attributes
 */
export interface ModalA11yProps extends AriaAttributes {
  tabIndex?: number;
}

/**
 * Get accessibility attributes for Button
 */
export function getButtonA11yProps(options: {
  disabled?: boolean;
  loading?: boolean;
  pressed?: boolean;
  label?: string;
  describedBy?: string;
}): ButtonA11yProps {
  const props: ButtonA11yProps = {
    role: 'button',
    type: 'button',
    tabIndex: options.disabled ? -1 : 0,
  };

  if (options.disabled) {
    props['aria-disabled'] = true;
  }

  if (options.loading) {
    props['aria-busy'] = true;
  }

  if (options.pressed !== undefined) {
    props['aria-pressed'] = options.pressed;
  }

  if (options.label) {
    props['aria-label'] = options.label;
  }

  if (options.describedBy) {
    props['aria-describedby'] = options.describedBy;
  }

  return props;
}

/**
 * Get accessibility attributes for Input
 */
export function getInputA11yProps(options: {
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  errorId?: string;
}): InputA11yProps {
  const props: InputA11yProps = {
    role: 'textbox',
    tabIndex: options.disabled ? -1 : 0,
  };

  if (options.disabled) {
    props['aria-disabled'] = true;
  }

  if (options.required) {
    props['aria-required'] = true;
  }

  if (options.invalid) {
    props['aria-invalid'] = true;
    if (options.errorId) {
      props['aria-describedby'] = options.errorId;
    }
  }

  if (options.label) {
    props['aria-label'] = options.label;
  }

  if (options.labelledBy) {
    props['aria-labelledby'] = options.labelledBy;
  }

  if (options.describedBy && !options.invalid) {
    props['aria-describedby'] = options.describedBy;
  }

  return props;
}

/**
 * Get accessibility attributes for Modal
 */
export function getModalA11yProps(options: {
  open?: boolean;
  labelledBy?: string;
  describedBy?: string;
  isAlertDialog?: boolean;
}): ModalA11yProps {
  const props: ModalA11yProps = {
    role: options.isAlertDialog ? 'alertdialog' : 'dialog',
    'aria-modal': true,
    tabIndex: -1,
  };

  if (!options.open) {
    props['aria-hidden'] = true;
  }

  if (options.labelledBy) {
    props['aria-labelledby'] = options.labelledBy;
  }

  if (options.describedBy) {
    props['aria-describedby'] = options.describedBy;
  }

  return props;
}

/**
 * Get accessibility attributes for Modal backdrop
 */
export function getBackdropA11yProps(): AriaAttributes {
  return {
    role: 'presentation',
    'aria-hidden': true,
  };
}

/**
 * Focus trap configuration
 */
export interface FocusTrapConfig {
  containerSelector: string;
  initialFocusSelector?: string;
  finalFocusSelector?: string;
  returnFocusOnDeactivate?: boolean;
}

/**
 * Generate focus trap script
 * Returns JavaScript code for managing focus within a container
 */
export function generateFocusTrapScript(config: FocusTrapConfig): string {
  return `
// Focus Trap for ${config.containerSelector}
(function() {
  const container = document.querySelector('${config.containerSelector}');
  if (!container) return;

  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const focusableElements = container.querySelectorAll(focusableSelector);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  ${config.initialFocusSelector ? `
  const initialFocus = container.querySelector('${config.initialFocusSelector}');
  if (initialFocus) initialFocus.focus();
  ` : 'if (firstFocusable) firstFocusable.focus();'}

  container.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
})();
`.trim();
}

/**
 * Screen reader only CSS class
 */
export const srOnlyStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`.trim();

/**
 * Focus visible styles
 */
export const focusVisibleStyles = `
.focus-visible:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.focus-visible:focus:not(:focus-visible) {
  outline: none;
}
`.trim();

/**
 * Skip link styles
 */
export const skipLinkStyles = `
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--accent-primary);
  color: var(--text-primary);
  text-decoration: none;
  z-index: 9999;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
}
`.trim();

/**
 * Generate complete accessibility CSS
 */
export function generateA11yCSS(): string {
  return `
/* ========== Accessibility Utilities ========== */

${srOnlyStyles}

${focusVisibleStyles}

${skipLinkStyles}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`.trim();
}

export default {
  getButtonA11yProps,
  getInputA11yProps,
  getModalA11yProps,
  getBackdropA11yProps,
  generateFocusTrapScript,
  generateA11yCSS,
};
