/**
 * Modal Component Configuration
 *
 * Defines modal styles with:
 * - Background backdrop with dark overlay
 * - Fade-in animation
 * - 4 sizes: sm, md, lg, full
 * - Elevated background from theme
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 通用组件库_
 * _TaskGroup: 11_
 */

/**
 * Modal size types
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

/**
 * Modal animation configuration
 */
export interface ModalAnimation {
  duration: number;
  easing: string;
  properties: string[];
}

/**
 * Modal configuration interface
 */
export interface ModalConfig {
  sizes: Record<ModalSize, string>;
  animation: ModalAnimation;
  baseStyles: string;
  backdropStyles: string;
}

/**
 * Size styles
 */
const sizeStyles: Record<ModalSize, string> = {
  sm: `
    max-width: 400px;
    width: 90%;
  `.trim(),

  md: `
    max-width: 600px;
    width: 90%;
  `.trim(),

  lg: `
    max-width: 800px;
    width: 90%;
  `.trim(),

  full: `
    width: calc(100vw - var(--spacing-lg) * 2);
    max-width: none;
    max-height: calc(100vh - var(--spacing-lg) * 2);
  `.trim(),
};

/**
 * Animation configuration
 */
const animationConfig: ModalAnimation = {
  duration: 200,
  easing: 'ease-out',
  properties: ['opacity', 'transform'],
};

/**
 * Base modal styles
 */
const baseStyles = `
  position: relative;
  background-color: var(--bg-elevated);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-lg);
  max-height: calc(100vh - var(--spacing-xl) * 2);
  overflow: auto;
`.trim();

/**
 * Backdrop styles
 */
const backdropStyles = `
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal-backdrop);
  padding: var(--spacing-lg);
`.trim();

/**
 * Get modal configuration
 */
export function getModalConfig(): ModalConfig {
  return {
    sizes: { ...sizeStyles },
    animation: { ...animationConfig },
    baseStyles,
    backdropStyles,
  };
}

/**
 * Generate modal styles for a specific size
 */
export function getModalStyles(size: ModalSize): string {
  return `
    ${baseStyles}
    ${sizeStyles[size]}
  `.trim();
}

/**
 * Generate backdrop styles
 */
export function getBackdropStyles(): string {
  return backdropStyles;
}

/**
 * Generate complete modal CSS
 */
export function generateModalCSS(): string {
  const lines: string[] = [];

  // Backdrop
  lines.push(`.modal-backdrop {
  ${backdropStyles}
  opacity: 0;
  transition: opacity ${animationConfig.duration}ms ${animationConfig.easing};
}`);

  lines.push(`.modal-backdrop.open {
  opacity: 1;
}`);

  // Base modal
  lines.push(`.modal {
  ${baseStyles}
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
  transition: opacity ${animationConfig.duration}ms ${animationConfig.easing},
              transform ${animationConfig.duration}ms ${animationConfig.easing};
}`);

  lines.push(`.modal-backdrop.open .modal {
  opacity: 1;
  transform: translateY(0) scale(1);
}`);

  // Size classes
  for (const size of ['sm', 'md', 'lg', 'full'] as ModalSize[]) {
    lines.push(`.modal-${size} {
  ${sizeStyles[size]}
}`);
  }

  // Header
  lines.push(`.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
}`);

  // Title
  lines.push(`.modal-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}`);

  // Close button
  lines.push(`.modal-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast), background-color var(--transition-fast);
}`);

  lines.push(`.modal-close:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}`);

  // Body
  lines.push(`.modal-body {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}`);

  // Footer
  lines.push(`.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
}`);

  return lines.join('\n\n');
}

export default {
  getModalConfig,
  getModalStyles,
  getBackdropStyles,
  generateModalCSS,
};
