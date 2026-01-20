/**
 * Layout Manager
 *
 * Provides functionality for:
 * - Window resize monitoring
 * - Sidebar collapse/expand with animation
 * - Layout state persistence
 * - Responsive behavior handling
 *
 * _Requirements: 基础 UI 布局实现_
 * _TaskGroup: 10_
 */

import {
  LayoutState,
  LayoutConfig,
  getLayoutConfig,
  createInitialLayoutState,
  toggleSidebar,
  updateWindowDimensions,
  getWindowConstraints,
  getSidebarConfig,
} from './Layout';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: string;
}

/**
 * Layout manager options
 */
export interface LayoutManagerOptions {
  animation?: AnimationConfig;
  persistState?: boolean;
  storageKey?: string;
}

/**
 * Window resize event handler
 */
type ResizeHandler = (width: number, height: number) => void;

/**
 * Sidebar state change handler
 */
type SidebarHandler = (expanded: boolean) => void;

/**
 * LayoutManager class
 *
 * Manages layout state with:
 * - Window resize detection
 * - Sidebar collapse/expand animations
 * - State persistence
 * - Event subscription
 */
export class LayoutManager {
  private state: LayoutState;
  private config: LayoutConfig;
  private options: Required<LayoutManagerOptions>;
  private resizeListeners: Set<ResizeHandler> = new Set();
  private sidebarListeners: Set<SidebarHandler> = new Set();
  private resizeObserver: (() => void) | null = null;
  private isAnimating = false;

  constructor(options: LayoutManagerOptions = {}) {
    this.options = {
      animation: options.animation ?? {
        duration: 250,
        easing: 'ease-out',
      },
      persistState: options.persistState ?? true,
      storageKey: options.storageKey ?? 'cowork-layout-state',
    };

    this.config = getLayoutConfig();
    this.state = this.loadState() ?? createInitialLayoutState();
  }

  /**
   * Get current layout state
   */
  getState(): LayoutState {
    return { ...this.state };
  }

  /**
   * Get layout configuration
   */
  getConfig(): LayoutConfig {
    return this.config;
  }

  /**
   * Check if sidebar is expanded
   */
  isSidebarExpanded(): boolean {
    return this.state.sidebarExpanded;
  }

  /**
   * Toggle sidebar with animation
   */
  async toggleSidebar(): Promise<void> {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    const newState = toggleSidebar(this.state);

    // Notify listeners before animation
    this.notifySidebarListeners(newState.sidebarExpanded);

    // Wait for animation
    await this.animateSidebarTransition(newState.sidebarExpanded);

    this.state = newState;
    this.saveState();
    this.isAnimating = false;
  }

  /**
   * Expand sidebar
   */
  async expandSidebar(): Promise<void> {
    if (this.state.sidebarExpanded || this.isAnimating) {
      return;
    }
    await this.toggleSidebar();
  }

  /**
   * Collapse sidebar
   */
  async collapseSidebar(): Promise<void> {
    if (!this.state.sidebarExpanded || this.isAnimating) {
      return;
    }
    await this.toggleSidebar();
  }

  /**
   * Start monitoring window resize
   */
  startResizeMonitoring(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const constraints = getWindowConstraints();
      const effectiveWidth = Math.max(width, constraints.minWidth);
      const effectiveHeight = Math.max(height, constraints.minHeight);

      this.state = updateWindowDimensions(this.state, effectiveWidth, effectiveHeight);
      this.notifyResizeListeners(effectiveWidth, effectiveHeight);
      this.saveState();
    };

    window.addEventListener('resize', handleResize);
    this.resizeObserver = () => {
      window.removeEventListener('resize', handleResize);
    };

    // Initial size update
    handleResize();
  }

  /**
   * Stop monitoring window resize
   */
  stopResizeMonitoring(): void {
    if (this.resizeObserver) {
      this.resizeObserver();
      this.resizeObserver = null;
    }
  }

  /**
   * Subscribe to resize events
   */
  onResize(handler: ResizeHandler): () => void {
    this.resizeListeners.add(handler);
    return () => {
      this.resizeListeners.delete(handler);
    };
  }

  /**
   * Subscribe to sidebar state changes
   */
  onSidebarChange(handler: SidebarHandler): () => void {
    this.sidebarListeners.add(handler);
    return () => {
      this.sidebarListeners.delete(handler);
    };
  }

  /**
   * Get CSS transition string for sidebar animation
   */
  getSidebarTransitionCSS(): string {
    const { duration, easing } = this.options.animation;
    return `width ${duration}ms ${easing}, min-width ${duration}ms ${easing}, max-width ${duration}ms ${easing}`;
  }

  /**
   * Get CSS transition string for main content animation
   */
  getMainContentTransitionCSS(): string {
    const { duration, easing } = this.options.animation;
    return `margin-left ${duration}ms ${easing}`;
  }

  /**
   * Get current sidebar width based on state
   */
  getCurrentSidebarWidth(): number {
    const sidebar = getSidebarConfig();
    return this.state.sidebarExpanded ? sidebar.width : sidebar.collapsedWidth;
  }

  /**
   * Get animation duration
   */
  getAnimationDuration(): number {
    return this.options.animation.duration;
  }

  /**
   * Dispose of the layout manager
   */
  dispose(): void {
    this.stopResizeMonitoring();
    this.resizeListeners.clear();
    this.sidebarListeners.clear();
  }

  // ==================== Private Methods ====================

  private async animateSidebarTransition(expanding: boolean): Promise<void> {
    const { duration } = this.options.animation;

    // In a real SolidJS/React app, this would trigger CSS transitions
    // For now, we just wait for the animation duration
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }

  private notifyResizeListeners(width: number, height: number): void {
    for (const listener of this.resizeListeners) {
      listener(width, height);
    }
  }

  private notifySidebarListeners(expanded: boolean): void {
    for (const listener of this.sidebarListeners) {
      listener(expanded);
    }
  }

  private loadState(): LayoutState | null {
    if (!this.options.persistState || typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        return JSON.parse(stored) as LayoutState;
      }
    } catch {
      // Ignore errors
    }

    return null;
  }

  private saveState(): void {
    if (!this.options.persistState || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.state));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Create layout manager with default options
 */
export function createLayoutManager(options?: LayoutManagerOptions): LayoutManager {
  return new LayoutManager(options);
}

/**
 * Default layout manager instance
 */
let defaultLayoutManager: LayoutManager | null = null;

/**
 * Get or create default layout manager
 */
export function getLayoutManager(): LayoutManager {
  if (!defaultLayoutManager) {
    defaultLayoutManager = new LayoutManager();
  }
  return defaultLayoutManager;
}

/**
 * Reset default layout manager (useful for testing)
 */
export function resetLayoutManager(): void {
  if (defaultLayoutManager) {
    defaultLayoutManager.dispose();
    defaultLayoutManager = null;
  }
}

export default LayoutManager;
