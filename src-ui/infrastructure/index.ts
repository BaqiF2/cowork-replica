/**
 * Phase 1 Infrastructure Integration Module
 *
 * Provides unified initialization and configuration for all Phase 1 modules:
 * - IPC Service
 * - Theme System
 * - Layout Framework
 * - Component Library
 *
 * Features:
 * - Lazy initialization
 * - CSS caching
 * - Unified startup sequence
 * - Error recovery
 *
 * _Requirements: 验证基础架构_
 * _TaskGroup: 12_
 */

import { ipcService, IPCService, IPCError, IPCErrorType } from '../services/ipcService';
import { generateCSSVariables, themeVariables } from '../styles/theme';
import { generateLayoutCSS, getLayoutConfig } from '../components/Layout';
import { generateComponentCSS } from '../components/common';
import { generateA11yCSS } from '../components/common/a11y';

/**
 * Infrastructure initialization state
 */
export interface InfrastructureState {
  ipcInitialized: boolean;
  cssGenerated: boolean;
  startupTime: number | null;
  errors: Error[];
}

/**
 * Infrastructure configuration
 */
export interface InfrastructureConfig {
  /**
   * Whether to auto-initialize IPC on startup
   * @default true
   */
  autoInitIPC: boolean;

  /**
   * Whether to generate CSS on startup
   * @default true
   */
  autoGenerateCSS: boolean;

  /**
   * CSS injection target selector
   * @default 'head'
   */
  cssTarget: string;

  /**
   * Enable CSS caching
   * @default true
   */
  enableCSSCache: boolean;

  /**
   * IPC initialization timeout in ms
   * @default 5000
   */
  ipcTimeout: number;
}

/**
 * Default infrastructure configuration
 */
const DEFAULT_CONFIG: InfrastructureConfig = {
  autoInitIPC: true,
  autoGenerateCSS: true,
  cssTarget: 'head',
  enableCSSCache: true,
  ipcTimeout: 5000,
};

/**
 * Cached CSS content
 */
let cachedCSS: string | null = null;

/**
 * Cached CSS hash for change detection
 */
let cssHash: string | null = null;

/**
 * Infrastructure state
 */
const state: InfrastructureState = {
  ipcInitialized: false,
  cssGenerated: false,
  startupTime: null,
  errors: [],
};

/**
 * Generate a simple hash for CSS content
 */
function hashCSS(css: string): string {
  let hash = 0;
  for (let i = 0; i < css.length; i++) {
    const char = css.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Generate complete application CSS
 *
 * Combines all CSS modules:
 * - Theme variables
 * - Layout styles
 * - Component styles
 * - Accessibility styles
 *
 * @param useCache - Whether to use cached CSS if available
 * @returns Complete CSS string
 */
export function generateApplicationCSS(useCache = true): string {
  if (useCache && cachedCSS) {
    return cachedCSS;
  }

  const sections: string[] = [
    '/* ========== Cowork Desktop - Phase 1 Infrastructure CSS ========== */',
    '',
    '/* Theme Variables */',
    ':root {',
    generateCSSVariables(),
    '}',
    '',
    '/* Additional Variables */',
    ':root {',
    '  /* Z-index scale */',
    '  --z-index-dropdown: 100;',
    '  --z-index-sticky: 200;',
    '  --z-index-fixed: 300;',
    '  --z-index-modal-backdrop: 400;',
    '  --z-index-modal: 500;',
    '  --z-index-popover: 600;',
    '  --z-index-tooltip: 700;',
    '',
    '  /* Transitions */',
    '  --transition-fast: 150ms ease;',
    '  --transition-normal: 200ms ease;',
    '  --transition-slow: 300ms ease;',
    '}',
    '',
    '/* Base Styles */',
    '*, *::before, *::after {',
    '  box-sizing: border-box;',
    '  margin: 0;',
    '  padding: 0;',
    '}',
    '',
    'html, body {',
    '  font-family: var(--font-family);',
    '  font-size: var(--font-size-base);',
    '  line-height: var(--line-height-normal);',
    '  color: var(--text-primary);',
    '  background-color: var(--bg-primary);',
    '  -webkit-font-smoothing: antialiased;',
    '  -moz-osx-font-smoothing: grayscale;',
    '}',
    '',
    '/* Layout Styles */',
    generateLayoutCSS(),
    '',
    '/* Component Styles */',
    generateComponentCSS(),
    '',
    '/* Accessibility Styles */',
    generateA11yCSS(),
  ];

  const css = sections.join('\n');

  // Cache the CSS
  cachedCSS = css;
  cssHash = hashCSS(css);

  return css;
}

/**
 * Get cached CSS if available
 *
 * @returns Cached CSS or null
 */
export function getCachedCSS(): string | null {
  return cachedCSS;
}

/**
 * Clear CSS cache
 */
export function clearCSSCache(): void {
  cachedCSS = null;
  cssHash = null;
}

/**
 * Check if CSS has changed since last generation
 *
 * @returns true if CSS would be different
 */
export function hasCSSChanged(): boolean {
  if (!cachedCSS || !cssHash) {
    return true;
  }

  const newCSS = generateApplicationCSS(false);
  const newHash = hashCSS(newCSS);

  return newHash !== cssHash;
}

/**
 * Initialize IPC service with timeout
 *
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves when IPC is ready
 */
export async function initializeIPC(timeout = DEFAULT_CONFIG.ipcTimeout): Promise<void> {
  if (state.ipcInitialized) {
    return;
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new IPCError(`IPC initialization timed out after ${timeout}ms`, IPCErrorType.Timeout));
    }, timeout);
  });

  try {
    await Promise.race([
      ipcService.initialize(),
      timeoutPromise,
    ]);
    state.ipcInitialized = true;
  } catch (error) {
    state.errors.push(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Inject CSS into document
 *
 * @param target - CSS selector for injection target
 * @returns The created style element
 */
export function injectCSS(target = 'head'): HTMLStyleElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const targetElement = document.querySelector(target);
  if (!targetElement) {
    console.warn(`CSS injection target "${target}" not found`);
    return null;
  }

  // Check for existing style element
  const existingStyle = document.getElementById('cowork-infrastructure-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  const css = generateApplicationCSS();
  const style = document.createElement('style');
  style.id = 'cowork-infrastructure-css';
  style.textContent = css;
  targetElement.appendChild(style);

  state.cssGenerated = true;

  return style;
}

/**
 * Initialize all Phase 1 infrastructure
 *
 * @param config - Configuration options
 * @returns Promise that resolves when all modules are ready
 */
export async function initializeInfrastructure(
  config: Partial<InfrastructureConfig> = {}
): Promise<InfrastructureState> {
  const startTime = performance.now();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  state.errors = [];

  // Initialize IPC if enabled
  if (fullConfig.autoInitIPC) {
    try {
      await initializeIPC(fullConfig.ipcTimeout);
    } catch (error) {
      // IPC errors are stored in state.errors
      if (!fullConfig.autoGenerateCSS) {
        throw error;
      }
      // Continue with CSS generation even if IPC fails
    }
  }

  // Generate and inject CSS if enabled
  if (fullConfig.autoGenerateCSS) {
    try {
      if (fullConfig.enableCSSCache) {
        generateApplicationCSS(true);
      } else {
        generateApplicationCSS(false);
      }
      state.cssGenerated = true;
    } catch (error) {
      state.errors.push(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  state.startupTime = performance.now() - startTime;

  return { ...state };
}

/**
 * Get current infrastructure state
 *
 * @returns Current state
 */
export function getInfrastructureState(): InfrastructureState {
  return { ...state };
}

/**
 * Reset infrastructure state (for testing)
 */
export function resetInfrastructure(): void {
  state.ipcInitialized = false;
  state.cssGenerated = false;
  state.startupTime = null;
  state.errors = [];
  clearCSSCache();
  ipcService.reset();
}

/**
 * Get startup performance metrics
 *
 * @returns Performance metrics
 */
export function getPerformanceMetrics(): {
  startupTime: number | null;
  cssSize: number;
  cssHash: string | null;
} {
  return {
    startupTime: state.startupTime,
    cssSize: cachedCSS?.length ?? 0,
    cssHash,
  };
}

/**
 * Validate infrastructure configuration
 *
 * @returns List of validation errors
 */
export function validateInfrastructure(): string[] {
  const errors: string[] = [];

  // Validate theme
  if (!themeVariables.colors.bgPrimary) {
    errors.push('Theme: bgPrimary color not defined');
  }
  if (!themeVariables.colors.textPrimary) {
    errors.push('Theme: textPrimary color not defined');
  }
  if (!themeVariables.colors.accentPrimary) {
    errors.push('Theme: accentPrimary color not defined');
  }

  // Validate layout
  const layout = getLayoutConfig();
  if (layout.windowConstraints.minWidth < 800) {
    errors.push('Layout: minWidth is too small (< 800)');
  }
  if (layout.windowConstraints.minHeight < 600) {
    errors.push('Layout: minHeight is too small (< 600)');
  }

  // Validate CSS generation
  try {
    const css = generateApplicationCSS(false);
    if (css.length < 1000) {
      errors.push('CSS: Generated CSS is suspiciously small');
    }
  } catch (error) {
    errors.push(`CSS: Generation failed - ${error}`);
  }

  return errors;
}

export default {
  initializeInfrastructure,
  generateApplicationCSS,
  initializeIPC,
  injectCSS,
  getInfrastructureState,
  resetInfrastructure,
  getPerformanceMetrics,
  validateInfrastructure,
  getCachedCSS,
  clearCSSCache,
  hasCSSChanged,
};
