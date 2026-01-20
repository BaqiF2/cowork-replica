/**
 * Layout Component Tests
 *
 * Tests for responsive layout framework:
 * - Scenario: 响应式布局框架
 *
 * _Requirements: 基础 UI 布局实现_
 * _TaskGroup: 10_
 */

import {
  LayoutConfig,
  SidebarConfig,
  MainContentConfig,
  WindowConstraints,
  getLayoutConfig,
  getSidebarConfig,
  getMainContentConfig,
  getWindowConstraints,
  calculateMainContentWidth,
  isSidebarCollapsible,
  getCollapsedSidebarWidth,
} from '../Layout';

describe('Responsive Layout Framework', () => {
  describe('Scenario: 响应式布局框架', () => {
    describe('Window Constraints', () => {
      it('should define minimum window width of 1200px', () => {
        const constraints = getWindowConstraints();
        expect(constraints.minWidth).toBe(1200);
      });

      it('should define minimum window height of 800px', () => {
        const constraints = getWindowConstraints();
        expect(constraints.minHeight).toBe(800);
      });

      it('should have valid window constraint interface', () => {
        const constraints: WindowConstraints = getWindowConstraints();
        expect(constraints).toHaveProperty('minWidth');
        expect(constraints).toHaveProperty('minHeight');
        expect(typeof constraints.minWidth).toBe('number');
        expect(typeof constraints.minHeight).toBe('number');
      });
    });

    describe('Sidebar Configuration', () => {
      it('should have fixed width of 240px', () => {
        const sidebar = getSidebarConfig();
        expect(sidebar.width).toBe(240);
      });

      it('should be collapsible', () => {
        const sidebar = getSidebarConfig();
        expect(sidebar.collapsible).toBe(true);
      });

      it('should have collapsed width of 64px', () => {
        const collapsedWidth = getCollapsedSidebarWidth();
        expect(collapsedWidth).toBe(64);
      });

      it('should define sidebar position as left', () => {
        const sidebar = getSidebarConfig();
        expect(sidebar.position).toBe('left');
      });

      it('should have valid sidebar config interface', () => {
        const sidebar: SidebarConfig = getSidebarConfig();
        expect(sidebar).toHaveProperty('width');
        expect(sidebar).toHaveProperty('collapsible');
        expect(sidebar).toHaveProperty('position');
        expect(sidebar).toHaveProperty('collapsedWidth');
      });

      it('should check if sidebar is collapsible', () => {
        expect(isSidebarCollapsible()).toBe(true);
      });
    });

    describe('Main Content Configuration', () => {
      it('should use flex-grow for adaptive width', () => {
        const mainContent = getMainContentConfig();
        expect(mainContent.flexGrow).toBe(1);
      });

      it('should have minimum width defined', () => {
        const mainContent = getMainContentConfig();
        expect(mainContent.minWidth).toBeGreaterThan(0);
      });

      it('should have valid main content config interface', () => {
        const mainContent: MainContentConfig = getMainContentConfig();
        expect(mainContent).toHaveProperty('flexGrow');
        expect(mainContent).toHaveProperty('minWidth');
        expect(mainContent).toHaveProperty('padding');
      });

      it('should define content padding', () => {
        const mainContent = getMainContentConfig();
        expect(mainContent.padding).toBeDefined();
        expect(typeof mainContent.padding).toBe('string');
      });
    });

    describe('Layout Calculations', () => {
      it('should calculate main content width with expanded sidebar', () => {
        const windowWidth = 1200;
        const sidebarExpanded = true;
        const mainWidth = calculateMainContentWidth(windowWidth, sidebarExpanded);

        // 1200 - 240 (sidebar) = 960
        expect(mainWidth).toBe(960);
      });

      it('should calculate main content width with collapsed sidebar', () => {
        const windowWidth = 1200;
        const sidebarExpanded = false;
        const mainWidth = calculateMainContentWidth(windowWidth, sidebarExpanded);

        // 1200 - 64 (collapsed sidebar) = 1136
        expect(mainWidth).toBe(1136);
      });

      it('should handle larger window sizes', () => {
        const windowWidth = 1920;
        const sidebarExpanded = true;
        const mainWidth = calculateMainContentWidth(windowWidth, sidebarExpanded);

        // 1920 - 240 = 1680
        expect(mainWidth).toBe(1680);
      });

      it('should respect minimum window width', () => {
        const windowWidth = 800; // Below minimum
        const constraints = getWindowConstraints();
        const effectiveWidth = Math.max(windowWidth, constraints.minWidth);

        expect(effectiveWidth).toBe(1200);
      });
    });

    describe('Complete Layout Configuration', () => {
      it('should return complete layout configuration', () => {
        const layout = getLayoutConfig();

        expect(layout).toHaveProperty('sidebar');
        expect(layout).toHaveProperty('mainContent');
        expect(layout).toHaveProperty('windowConstraints');
      });

      it('should have valid LayoutConfig interface', () => {
        const layout: LayoutConfig = getLayoutConfig();

        expect(layout.sidebar).toBeDefined();
        expect(layout.mainContent).toBeDefined();
        expect(layout.windowConstraints).toBeDefined();
      });

      it('should have consistent values across getters', () => {
        const layout = getLayoutConfig();
        const sidebar = getSidebarConfig();
        const mainContent = getMainContentConfig();
        const constraints = getWindowConstraints();

        expect(layout.sidebar.width).toBe(sidebar.width);
        expect(layout.mainContent.flexGrow).toBe(mainContent.flexGrow);
        expect(layout.windowConstraints.minWidth).toBe(constraints.minWidth);
      });
    });

    describe('CSS Generation', () => {
      it('should generate sidebar CSS styles', () => {
        const { generateSidebarStyles } = require('../Layout');
        const styles = generateSidebarStyles(true);

        expect(styles).toContain('width');
        expect(styles).toContain('240px');
      });

      it('should generate collapsed sidebar CSS styles', () => {
        const { generateSidebarStyles } = require('../Layout');
        const styles = generateSidebarStyles(false);

        expect(styles).toContain('width');
        expect(styles).toContain('64px');
      });

      it('should generate main content CSS styles', () => {
        const { generateMainContentStyles } = require('../Layout');
        const styles = generateMainContentStyles();

        expect(styles).toContain('flex-grow');
        expect(styles).toContain('1');
      });

      it('should generate layout container CSS styles', () => {
        const { generateLayoutContainerStyles } = require('../Layout');
        const styles = generateLayoutContainerStyles();

        expect(styles).toContain('display');
        expect(styles).toContain('flex');
        expect(styles).toContain('min-width');
        expect(styles).toContain('1200px');
        expect(styles).toContain('min-height');
        expect(styles).toContain('800px');
      });
    });

    describe('Responsive Breakpoints', () => {
      it('should define responsive breakpoints', () => {
        const { getBreakpoints } = require('../Layout');
        const breakpoints = getBreakpoints();

        expect(breakpoints).toHaveProperty('sm');
        expect(breakpoints).toHaveProperty('md');
        expect(breakpoints).toHaveProperty('lg');
        expect(breakpoints).toHaveProperty('xl');
      });

      it('should have increasing breakpoint values', () => {
        const { getBreakpoints } = require('../Layout');
        const breakpoints = getBreakpoints();

        expect(breakpoints.md).toBeGreaterThan(breakpoints.sm);
        expect(breakpoints.lg).toBeGreaterThan(breakpoints.md);
        expect(breakpoints.xl).toBeGreaterThan(breakpoints.lg);
      });
    });
  });
});
