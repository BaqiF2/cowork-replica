/**
 * IPC Service for SolidJS Frontend
 *
 * Provides IPC communication between SolidJS frontend and Rust/Node.js backend.
 * Wraps Tauri API calls and provides a unified interface for:
 * - Sending events to backend
 * - Making request/response calls
 * - Listening for events from backend
 *
 * Core methods:
 * - `initialize()`: 启动 Tauri 监听
 * - `emit(event, payload)`: 调用 Tauri invoke 发送事件
 * - `request<T>(event, payload)`: 请求/响应模式
 * - `on(event, handler)`: 注册事件处理器
 * - `off(event, handler)`: 取消监听
 *
 * _Requirements: SolidJS ipcService 实现_
 * _Scenarios: 初始化 IPC 监听, 发送事件到后端, 发送请求并等待响应, 监听来自后端的事件_
 * _TaskGroup: 6_
 */

// Tauri API types
type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
type ListenFn = <T>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>;
type UnlistenFn = () => void;

// Injected Tauri API functions (set via setTauriApi or loaded dynamically)
let tauriInvoke: InvokeFn | null = null;
let tauriListen: ListenFn | null = null;

/**
 * Set Tauri API functions (for testing or runtime initialization)
 */
export function setTauriApi(invoke: InvokeFn, listen: ListenFn): void {
  tauriInvoke = invoke;
  tauriListen = listen;
}

/**
 * Reset Tauri API functions (for testing)
 */
export function resetTauriApi(): void {
  tauriInvoke = null;
  tauriListen = null;
}

/**
 * Load Tauri API dynamically (only in production/Tauri context)
 */
async function loadTauriApi(): Promise<void> {
  if (tauriInvoke && tauriListen) {
    return;
  }

  // In test environment or when API is already set, don't try to import
  // Use globalThis for cross-environment compatibility
  const globalWindow = typeof globalThis !== 'undefined' ? globalThis : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!('__TAURI__' in (globalWindow as any))) {
    throw new Error('Tauri API not available. Use setTauriApi() to inject mock API for testing.');
  }

  try {
    // Dynamic import for Tauri context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tauriGlobal = (globalWindow as any).__TAURI__;
    const core = await tauriGlobal.core;
    const event = await tauriGlobal.event;
    tauriInvoke = core.invoke;
    tauriListen = event.listen;
  } catch {
    throw new Error('Failed to load Tauri API. Are you running in a Tauri context?');
  }
}

/**
 * IPC Message types
 */
export type IPCMessageType = 'event' | 'request' | 'response';

/**
 * IPC Error types for better error handling
 */
export enum IPCErrorType {
  /** Service not initialized */
  NotInitialized = 'NOT_INITIALIZED',
  /** Request timed out */
  Timeout = 'TIMEOUT',
  /** API not available */
  ApiNotAvailable = 'API_NOT_AVAILABLE',
  /** Backend error */
  BackendError = 'BACKEND_ERROR',
  /** Service destroyed */
  Destroyed = 'DESTROYED',
}

/**
 * Custom IPC Error class with error type
 */
export class IPCError extends Error {
  constructor(
    message: string,
    public readonly type: IPCErrorType
  ) {
    super(message);
    this.name = 'IPCError';
  }
}

/**
 * IPC Message structure
 */
export interface IPCMessage {
  /** Optional message ID for request/response correlation */
  id?: string;
  /** Message type */
  msg_type: IPCMessageType;
  /** Event name or command name */
  event: string;
  /** Message payload */
  payload: unknown;
  /** Optional error message */
  error?: string;
}

/**
 * Event handler function type
 */
export type IPCEventHandler<T = unknown> = (payload: T) => void;

/**
 * Request options
 */
export interface RequestOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Pending request tracker
 */
interface PendingRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Default request timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Heartbeat interval in milliseconds
 */
const HEARTBEAT_INTERVAL = 10000;

/**
 * IPC Service class
 */
export class IPCService {
  private initialized = false;
  private unlistenFn: UnlistenFn | null = null;
  private eventHandlers: Map<string, Set<IPCEventHandler>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private requestCounter = 0;

  /**
   * Initialize the IPC service
   *
   * Sets up Tauri event listeners and starts heartbeat detection.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load Tauri API if not already set
    await loadTauriApi();

    if (!tauriListen) {
      throw new Error('Tauri listen API not available');
    }

    // Register Tauri event listener for incoming messages
    this.unlistenFn = await tauriListen<IPCMessage>('ipc_message', (event) => {
      this.handleIncomingMessage(event.payload);
    });

    // Start heartbeat
    this.startHeartbeat();

    this.initialized = true;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if heartbeat is active
   */
  isHeartbeatActive(): boolean {
    return this.heartbeatTimer !== null;
  }

  /**
   * Start heartbeat detection
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      // Send heartbeat to backend (fire and forget)
      this.sendToBackend({
        msg_type: 'event',
        event: 'heartbeat',
        payload: { timestamp: Date.now() },
      }).catch(() => {
        // Ignore heartbeat errors
      });
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat detection
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Emit an event to the backend (fire and forget)
   *
   * @param event - Event name
   * @param payload - Event payload
   */
  async emit(event: string, payload: unknown): Promise<void> {
    if (!this.initialized) {
      throw new IPCError('IPC service not initialized. Call initialize() first.', IPCErrorType.NotInitialized);
    }

    const message: IPCMessage = {
      msg_type: 'event',
      event,
      payload,
    };

    // Send to backend - await to propagate errors
    await this.sendToBackend(message);
  }

  /**
   * Send a request to the backend and wait for response
   *
   * @param event - Request event name
   * @param payload - Request payload
   * @param options - Request options (timeout, etc.)
   * @returns Promise that resolves with the response
   */
  async request<T = unknown>(
    event: string,
    payload: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!this.initialized) {
      throw new IPCError('IPC service not initialized. Call initialize() first.', IPCErrorType.NotInitialized);
    }

    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const id = this.generateRequestId();

    const message: IPCMessage = {
      id,
      msg_type: 'request',
      event,
      payload,
    };

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new IPCError(`Request "${event}" timed out after ${timeout}ms`, IPCErrorType.Timeout));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      // Send request
      this.sendToBackend(message).catch((error) => {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Register an event handler
   *
   * @param event - Event name to listen for
   * @param handler - Handler function
   */
  on<T = unknown>(event: string, handler: IPCEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as IPCEventHandler);
  }

  /**
   * Unregister an event handler
   *
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off<T = unknown>(event: string, handler: IPCEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as IPCEventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Check if event has any handlers registered
   *
   * @param event - Event name
   * @returns true if handlers exist
   */
  hasHandler(event: string): boolean {
    const handlers = this.eventHandlers.get(event);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Handle incoming message from backend
   *
   * Routes messages to appropriate handlers or resolves pending requests.
   *
   * @param message - Incoming IPC message
   */
  handleIncomingMessage(message: IPCMessage): void {
    if (message.msg_type === 'response' && message.id) {
      // Handle response to pending request
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        clearTimeout(pending.timeoutId);

        if (message.error) {
          pending.reject(new IPCError(message.error, IPCErrorType.BackendError));
        } else {
          pending.resolve(message.payload);
        }
      }
    } else if (message.msg_type === 'event') {
      // Handle event message
      const handlers = this.eventHandlers.get(message.event);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error(`Error in event handler for "${message.event}":`, error);
          }
        });
      }
    }
  }

  /**
   * Send message to backend via Tauri invoke
   *
   * @param message - Message to send
   */
  private async sendToBackend(message: IPCMessage): Promise<void> {
    if (!tauriInvoke) {
      throw new Error('Tauri invoke API not available');
    }
    await tauriInvoke('send_to_node', { message });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Reset service state (for testing)
   */
  reset(): void {
    this.stopHeartbeat();
    this.initialized = false;
    this.eventHandlers.clear();
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
    });
    this.pendingRequests.clear();
    this.requestCounter = 0;
    this.unlistenFn = null;
  }

  /**
   * Destroy the service and cleanup resources
   */
  async destroy(): Promise<void> {
    this.stopHeartbeat();

    // Cancel all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new IPCError('IPC service destroyed', IPCErrorType.Destroyed));
    });
    this.pendingRequests.clear();

    // Unregister Tauri listener
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }

    this.eventHandlers.clear();
    this.initialized = false;
  }
}

/**
 * Singleton instance of IPCService
 */
export const ipcService = new IPCService();
