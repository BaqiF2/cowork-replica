/**
 * Desktop UI Factory Implementation
 *
 * Core Class:
 * - DesktopUIFactory: Factory for creating desktop parser and output instances
 *
 * Responsibilities:
 * - Create desktop-specific ParserInterface and OutputInterface implementations
 * - Provide desktop UI components with IPC communication
 * - Support dependency injection for testing
 * - Optional instance caching for singleton components
 *
 * _Requirements: DesktopUIFactory 实现_
 * _Scenarios: 创建 DesktopUIFactory 实例, 创建 InteractiveUI 实例, 创建其他 UI 组件_
 * _TaskGroup: 7_
 */

import { DesktopParser } from '../implementations/desktop/DesktopParser';
import { DesktopOutput } from '../implementations/desktop/DesktopOutput';
import { DesktopPermissionUI } from '../implementations/desktop/DesktopPermissionUI';
import { DesktopInteractiveUI } from '../implementations/desktop/DesktopInteractiveUI';
import { IPCMessageAdapter } from '../implementations/desktop/IPCMessageAdapter';
import type { PermissionUI } from '../../permissions/PermissionUI';
import type { UIFactory } from '../contracts/core/UIFactory';
import type {
  InteractiveUICallbacks,
  InteractiveUIConfig,
} from '../contracts/interactive/InteractiveUIInterface';

/**
 * Factory configuration options
 */
export interface DesktopUIFactoryOptions {
  /** Use shared IPC adapter for all components */
  sharedIpcAdapter?: boolean;
  /** Custom IPC adapter instance (for testing) */
  ipcAdapter?: IPCMessageAdapter;
}

/**
 * Desktop UI Factory
 *
 * Creates desktop-based parser, output, and interactive UI instances.
 * All components communicate with the SolidJS frontend via IPC.
 *
 * Supports dependency injection and instance caching for:
 * - Shared IPCMessageAdapter across components
 * - Custom adapter injection for testing
 */
export class DesktopUIFactory implements UIFactory {
  private options: DesktopUIFactoryOptions;
  private sharedAdapter: IPCMessageAdapter | null = null;

  constructor(options: DesktopUIFactoryOptions = {}) {
    this.options = options;
  }

  /**
   * Get the IPC adapter to use (shared or new)
   */
  private getIpcAdapter(): IPCMessageAdapter {
    // Use injected adapter if provided
    if (this.options.ipcAdapter) {
      return this.options.ipcAdapter;
    }

    // Use shared adapter if enabled
    if (this.options.sharedIpcAdapter) {
      if (!this.sharedAdapter) {
        this.sharedAdapter = new IPCMessageAdapter();
      }
      return this.sharedAdapter;
    }

    // Create new adapter
    return new IPCMessageAdapter();
  }

  createParser(): DesktopParser {
    return new DesktopParser();
  }

  createOutput(): DesktopOutput {
    return new DesktopOutput(this.getIpcAdapter());
  }

  createPermissionUI(
    _output?: NodeJS.WritableStream,
    _input?: NodeJS.ReadableStream
  ): PermissionUI {
    // Desktop uses IPC for permission UI, streams are not used
    return new DesktopPermissionUI(this.getIpcAdapter());
  }

  createInteractiveUI(
    callbacks: InteractiveUICallbacks,
    config?: InteractiveUIConfig
  ): DesktopInteractiveUI {
    return new DesktopInteractiveUI(callbacks, config, this.getIpcAdapter());
  }

  /**
   * Get the shared IPC adapter (if enabled)
   * Useful for testing or manual adapter management
   */
  getSharedIpcAdapter(): IPCMessageAdapter | null {
    return this.sharedAdapter;
  }

  /**
   * Reset the shared adapter (useful for testing)
   */
  resetSharedAdapter(): void {
    this.sharedAdapter = null;
  }
}

