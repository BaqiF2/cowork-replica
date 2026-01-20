/**
 * Layout Configuration Module
 *
 * Defines the responsive layout framework for the Cowork desktop application.
 * Provides configuration for:
 * - Window constraints (minimum size)
 * - Sidebar layout (fixed width, collapsible)
 * - Main content area (flex-grow adaptive)
 *
 * _Requirements: 基础 UI 布局实现_
 * _Scenarios: 响应式布局框架_
 * _TaskGroup: 10_
 */

/**
 * Window size constraints
 */
export interface WindowConstraints {
  minWidth: number;
  minHeight: number;
}

/**
 * Sidebar configuration
 */
export interface SidebarConfig {
  width: number;
  collapsedWidth: number;
  collapsible: boolean;
  position: 'left' | 'right';
}

/**
 * Main content area configuration
 */
export interface MainContentConfig {
  flexGrow: number;
  minWidth: number;
  padding: string;
}

/**
 * Complete layout configuration
 */
export interface LayoutConfig {
  sidebar: SidebarConfig;
  mainContent: MainContentConfig;
  windowConstraints: WindowConstraints;
}

/**
 * Responsive breakpoints
 */
export interface Breakpoints {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

// ==================== Configuration Constants ====================

/**
 * Default window constraints
 */
const DEFAULT_WINDOW_CONSTRAINTS: WindowConstraints = {
  minWidth: 1200,
  minHeight: 800,
};

/**
 * Default sidebar configuration
 */
const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  width: 240,
  collapsedWidth: 64,
  collapsible: true,
  position: 'left',
};

/**
 * Default main content configuration
 */
const DEFAULT_MAIN_CONTENT_CONFIG: MainContentConfig = {
  flexGrow: 1,
  minWidth: 600,
  padding: 'var(--spacing-lg)',
};

/**
 * Default responsive breakpoints
 */
const DEFAULT_BREAKPOINTS: Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ==================== Configuration Getters ====================

/**
 * Get window constraints configuration
 */
export function getWindowConstraints(): WindowConstraints {
  return { ...DEFAULT_WINDOW_CONSTRAINTS };
}

/**
 * Get sidebar configuration
 */
export function getSidebarConfig(): SidebarConfig {
  return { ...DEFAULT_SIDEBAR_CONFIG };
}

/**
 * Get main content configuration
 */
export function getMainContentConfig(): MainContentConfig {
  return { ...DEFAULT_MAIN_CONTENT_CONFIG };
}

/**
 * Get complete layout configuration
 */
export function getLayoutConfig(): LayoutConfig {
  return {
    sidebar: getSidebarConfig(),
    mainContent: getMainContentConfig(),
    windowConstraints: getWindowConstraints(),
  };
}

/**
 * Get responsive breakpoints
 */
export function getBreakpoints(): Breakpoints {
  return { ...DEFAULT_BREAKPOINTS };
}

// ==================== Utility Functions ====================

/**
 * Check if sidebar is collapsible
 */
export function isSidebarCollapsible(): boolean {
  return DEFAULT_SIDEBAR_CONFIG.collapsible;
}

/**
 * Get collapsed sidebar width
 */
export function getCollapsedSidebarWidth(): number {
  return DEFAULT_SIDEBAR_CONFIG.collapsedWidth;
}

/**
 * Calculate main content width based on window width and sidebar state
 *
 * @param windowWidth - Current window width
 * @param sidebarExpanded - Whether sidebar is expanded
 * @returns Calculated main content width
 */
export function calculateMainContentWidth(
  windowWidth: number,
  sidebarExpanded: boolean
): number {
  const sidebarWidth = sidebarExpanded
    ? DEFAULT_SIDEBAR_CONFIG.width
    : DEFAULT_SIDEBAR_CONFIG.collapsedWidth;

  return windowWidth - sidebarWidth;
}

// ==================== CSS Generation Functions ====================

/**
 * Generate CSS styles for sidebar
 *
 * @param expanded - Whether sidebar is expanded
 * @returns CSS string for sidebar styles
 */
export function generateSidebarStyles(expanded: boolean): string {
  const width = expanded
    ? DEFAULT_SIDEBAR_CONFIG.width
    : DEFAULT_SIDEBAR_CONFIG.collapsedWidth;

  return `
    width: ${width}px;
    min-width: ${width}px;
    max-width: ${width}px;
    height: 100%;
    position: fixed;
    ${DEFAULT_SIDEBAR_CONFIG.position}: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-subtle);
    transition: width var(--transition-normal);
    overflow: hidden;
    z-index: var(--z-index-fixed);
  `.trim();
}

/**
 * Generate CSS styles for main content area
 *
 * @returns CSS string for main content styles
 */
export function generateMainContentStyles(): string {
  return `
    flex-grow: ${DEFAULT_MAIN_CONTENT_CONFIG.flexGrow};
    min-width: ${DEFAULT_MAIN_CONTENT_CONFIG.minWidth}px;
    padding: ${DEFAULT_MAIN_CONTENT_CONFIG.padding};
    margin-left: ${DEFAULT_SIDEBAR_CONFIG.width}px;
    height: 100%;
    overflow-y: auto;
    background-color: var(--bg-primary);
    transition: margin-left var(--transition-normal);
  `.trim();
}

/**
 * Generate CSS styles for layout container
 *
 * @returns CSS string for layout container styles
 */
export function generateLayoutContainerStyles(): string {
  return `
    display: flex;
    flex-direction: row;
    min-width: ${DEFAULT_WINDOW_CONSTRAINTS.minWidth}px;
    min-height: ${DEFAULT_WINDOW_CONSTRAINTS.minHeight}px;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background-color: var(--bg-primary);
  `.trim();
}

/**
 * Generate complete layout CSS
 *
 * @returns Complete CSS string for layout
 */
export function generateLayoutCSS(): string {
  return `
/* Layout Container */
.layout-container {
  ${generateLayoutContainerStyles()}
}

/* Sidebar */
.sidebar {
  ${generateSidebarStyles(true)}
}

.sidebar.collapsed {
  ${generateSidebarStyles(false)}
}

/* Main Content */
.main-content {
  ${generateMainContentStyles()}
}

.main-content.sidebar-collapsed {
  margin-left: ${DEFAULT_SIDEBAR_CONFIG.collapsedWidth}px;
}

/* Responsive adjustments */
@media (max-width: ${DEFAULT_BREAKPOINTS.lg}px) {
  .sidebar {
    position: absolute;
    z-index: var(--z-index-modal);
  }

  .main-content {
    margin-left: 0;
  }
}
`.trim();
}

// ==================== Layout State Management ====================

/**
 * Layout state interface
 */
export interface LayoutState {
  sidebarExpanded: boolean;
  windowWidth: number;
  windowHeight: number;
}

/**
 * Create initial layout state
 */
export function createInitialLayoutState(): LayoutState {
  return {
    sidebarExpanded: true,
    windowWidth: DEFAULT_WINDOW_CONSTRAINTS.minWidth,
    windowHeight: DEFAULT_WINDOW_CONSTRAINTS.minHeight,
  };
}

/**
 * Toggle sidebar expanded state
 */
export function toggleSidebar(state: LayoutState): LayoutState {
  return {
    ...state,
    sidebarExpanded: !state.sidebarExpanded,
  };
}

/**
 * Update window dimensions
 */
export function updateWindowDimensions(
  state: LayoutState,
  width: number,
  height: number
): LayoutState {
  return {
    ...state,
    windowWidth: Math.max(width, DEFAULT_WINDOW_CONSTRAINTS.minWidth),
    windowHeight: Math.max(height, DEFAULT_WINDOW_CONSTRAINTS.minHeight),
  };
}

export default {
  getLayoutConfig,
  getSidebarConfig,
  getMainContentConfig,
  getWindowConstraints,
  getBreakpoints,
  calculateMainContentWidth,
  generateLayoutCSS,
  createInitialLayoutState,
  toggleSidebar,
  updateWindowDimensions,
};
