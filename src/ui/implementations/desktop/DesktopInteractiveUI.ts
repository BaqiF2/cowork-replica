/**
 * Desktop Interactive UI Implementation
 *
 * Core Class:
 * - DesktopInteractiveUI: Desktop environment implementation of InteractiveUIInterface
 *
 * Responsibilities:
 * - Communicate with SolidJS frontend via IPC
 * - Handle all interactive UI operations through IPC messages
 * - Manage IPC event listeners lifecycle
 * - Provide error handling for IPC operations
 *
 * _Requirements: DesktopInteractiveUI 实现_
 * _Scenarios: 启动和停止 IPC 监听, 显示消息到前端, 显示工具调用, 请求用户确认_
 * _TaskGroup: 8_
 */

import type { Session, SessionStats } from '../../../core/SessionManager';
import type {
  InteractiveUIInterface,
  InteractiveUICallbacks,
  InteractiveUIConfig,
  Snapshot,
  TodoItem,
  PermissionMode,
  MessageRole,
} from '../../contracts/interactive/InteractiveUIInterface';
import { IPCMessageAdapter } from './IPCMessageAdapter';

/**
 * Error handler type for IPC operations
 */
type IPCErrorHandler = (error: Error, event: string) => void;

/**
 * Desktop Interactive UI
 *
 * Implements InteractiveUIInterface by sending events to the SolidJS frontend via IPC.
 * Provides lifecycle management for IPC listeners and error handling for IPC operations.
 */
export class DesktopInteractiveUI implements InteractiveUIInterface {
  private ipcAdapter: IPCMessageAdapter;
  private callbacks: InteractiveUICallbacks;
  private isRunning = false;
  private errorHandler: IPCErrorHandler;
  private registeredHandlers: Map<string, (payload: unknown) => void> = new Map();

  constructor(
    callbacks: InteractiveUICallbacks,
    _config?: InteractiveUIConfig,
    ipcAdapter?: IPCMessageAdapter
  ) {
    this.callbacks = callbacks;
    this.ipcAdapter = ipcAdapter ?? new IPCMessageAdapter();
    this.errorHandler = this.defaultErrorHandler.bind(this);
  }

  /**
   * Default error handler - logs errors to console
   */
  private defaultErrorHandler(error: Error, event: string): void {
    console.error(`[DesktopInteractiveUI] Error in event "${event}":`, error);
  }

  /**
   * Set custom error handler for IPC operations
   */
  setErrorHandler(handler: IPCErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * Safely emit an IPC event with error handling
   */
  private safeEmit(event: string, payload: unknown): void {
    this.ipcAdapter.emit(event, payload).catch((error) => {
      this.errorHandler(error instanceof Error ? error : new Error(String(error)), event);
    });
  }

  // ========== REQUIRED Methods ==========

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    // Register IPC event listeners and track them for cleanup
    const userMessageHandler = (payload: { message: string }) => {
      this.callbacks.onMessage(payload.message).catch((error) => {
        this.errorHandler(error instanceof Error ? error : new Error(String(error)), 'user_message');
      });
    };
    this.ipcAdapter.on('user_message', userMessageHandler);
    this.registeredHandlers.set('user_message', userMessageHandler as (payload: unknown) => void);

    const userInterruptHandler = () => {
      this.callbacks.onInterrupt();
    };
    this.ipcAdapter.on('user_interrupt', userInterruptHandler);
    this.registeredHandlers.set('user_interrupt', userInterruptHandler as (payload: unknown) => void);

    const userRewindHandler = () => {
      this.callbacks.onRewind().catch((error) => {
        this.errorHandler(error instanceof Error ? error : new Error(String(error)), 'user_rewind');
      });
    };
    this.ipcAdapter.on('user_rewind', userRewindHandler);
    this.registeredHandlers.set('user_rewind', userRewindHandler as (payload: unknown) => void);

    if (this.callbacks.onPermissionModeChange) {
      const permissionModeHandler = (payload: { mode: PermissionMode }) => {
        this.callbacks.onPermissionModeChange?.(payload.mode);
      };
      this.ipcAdapter.on('permission_mode_change', permissionModeHandler);
      this.registeredHandlers.set('permission_mode_change', permissionModeHandler as (payload: unknown) => void);
    }

    // Notify frontend that UI is ready
    await this.ipcAdapter.emit('ui_ready', { timestamp: Date.now() });

    this.isRunning = true;
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    // Unregister all IPC event listeners
    for (const [event, handler] of this.registeredHandlers) {
      this.ipcAdapter.off(event, handler);
    }
    this.registeredHandlers.clear();

    // Notify frontend that UI is stopping
    this.safeEmit('ui_stopped', { timestamp: Date.now() });

    this.isRunning = false;
  }

  // ========== CORE Methods ==========

  displayMessage(message: string, role: MessageRole): void {
    this.safeEmit('display_message', { message, role });
  }

  displayToolUse(tool: string, args: Record<string, unknown>): void {
    this.safeEmit('display_tool_use', { tool, args });
  }

  displayToolResult(tool: string, result: string, isError = false): void {
    this.safeEmit('display_tool_result', { tool, result, isError });
  }

  displayThinking(content?: string): void {
    this.safeEmit('display_thinking', { content });
  }

  displayComputing(): void {
    this.safeEmit('display_computing', {});
  }

  stopComputing(): void {
    this.safeEmit('stop_computing', {});
  }

  clearProgress(): void {
    this.safeEmit('clear_progress', {});
  }

  displayError(message: string): void {
    this.safeEmit('display_error', { message });
  }

  displayWarning(message: string): void {
    this.safeEmit('display_warning', { message });
  }

  displaySuccess(message: string): void {
    this.safeEmit('display_success', { message });
  }

  displayInfo(message: string): void {
    this.safeEmit('display_info', { message });
  }

  // ========== OPTIONAL Methods ==========

  async promptConfirmation(message: string): Promise<boolean> {
    try {
      const result = await this.ipcAdapter.request<{ confirmed: boolean }>(
        'prompt_confirmation',
        { message },
        { timeout: 60000 }
      );
      return result.confirmed;
    } catch {
      return false;
    }
  }

  async showRewindMenu(snapshots: Snapshot[]): Promise<Snapshot | null> {
    try {
      const result = await this.ipcAdapter.request<{ snapshot: Snapshot | null }>(
        'show_rewind_menu',
        { snapshots },
        { timeout: 120000 }
      );
      return result.snapshot;
    } catch {
      return null;
    }
  }

  async showSessionMenu(sessions: Session[]): Promise<Session | null> {
    try {
      const result = await this.ipcAdapter.request<{ session: Session | null }>(
        'show_session_menu',
        { sessions },
        { timeout: 120000 }
      );
      return result.session;
    } catch {
      return null;
    }
  }

  async showConfirmationMenu(
    title: string,
    options: Array<{ key: string; label: string; description?: string }>,
    defaultKey?: string
  ): Promise<boolean> {
    try {
      const result = await this.ipcAdapter.request<{ confirmed: boolean }>(
        'show_confirmation_menu',
        { title, options, defaultKey },
        { timeout: 60000 }
      );
      return result.confirmed;
    } catch {
      return false;
    }
  }

  setInitialPermissionMode(mode: PermissionMode): void {
    this.safeEmit('set_initial_permission_mode', { mode });
  }

  setPermissionMode(mode: PermissionMode): void {
    this.safeEmit('set_permission_mode', { mode });
  }

  displayPermissionStatus(mode: PermissionMode): void {
    this.safeEmit('display_permission_status', { mode });
  }

  setProcessingState(processing: boolean): void {
    this.safeEmit('set_processing_state', { processing });
  }

  displayTodoList(todos: TodoItem[]): void {
    this.safeEmit('display_todo_list', { todos });
  }

  // ========== UTILITY Methods ==========

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  formatAbsoluteTime(date: Date): string {
    return date.toLocaleString();
  }

  formatStatsSummary(stats?: SessionStats): string {
    if (!stats) return 'No stats available';
    return `Messages: ${stats.messageCount}, Tokens: ${stats.totalInputTokens + stats.totalOutputTokens}`;
  }
}
