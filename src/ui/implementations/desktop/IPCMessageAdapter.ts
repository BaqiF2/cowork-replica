/**
 * IPC Message Adapter
 *
 * Provides IPC communication capabilities for desktop applications:
 * - emit(): Send one-way events to backend
 * - request(): Request/response pattern with timeout support
 * - on(): Register event listeners
 * - off(): Unregister event listeners
 *
 * Uses Tauri's invoke and listen APIs for communication.
 */

import { createMessage, type IPCMessage } from './MessageSerializer';

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
      event: {
        listen: (event: string, handler: (event: any) => void) => Promise<() => void>;
      };
    };
  }
}

interface RequestOptions {
  timeout?: number;
}

type EventHandler = (payload: any) => void;

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export class IPCMessageAdapter {
  private listeners: Map<string, EventHandler[]> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timer: NodeJS.Timeout;
  }> = new Map();

  /**
   * Send a one-way event to the backend
   */
  async emit(event: string, payload?: any): Promise<void> {
    const message = createMessage({
      event,
      payload,
      type: 'event',
    });

    await this.sendMessage(message);
  }

  /**
   * Send a request and wait for response
   * Note: Only one pending request per event is supported at a time.
   * If a request with the same event name is already pending, it will be replaced.
   */
  async request<T = any>(event: string, payload?: any, options: RequestOptions = {}): Promise<T> {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    // Warn if there's already a pending request for this event
    if (this.pendingRequests.has(event)) {
      console.warn(`Warning: Replacing existing pending request for event: ${event}`);
      const existing = this.pendingRequests.get(event);
      if (existing) {
        clearTimeout(existing.timer);
      }
    }

    const message = createMessage({
      event,
      payload,
      type: 'request',
    });

    return new Promise<T>((resolve, reject) => {
      // Setup timeout with descriptive error
      const timer = setTimeout(() => {
        this.pendingRequests.delete(event);
        reject(new Error(`Request timeout after ${timeout}ms: ${event}`));
      }, timeout);

      // Store pending request using event as key
      this.pendingRequests.set(event, {
        resolve,
        reject,
        timer,
      });

      // Send message with error handling
      this.sendMessage(message).catch((error) => {
        clearTimeout(timer);
        this.pendingRequests.delete(event);
        reject(new Error(`Failed to send request '${event}': ${error.message}`));
      });
    });
  }

  /**
   * Register an event listener
   */
  on(event: string, handler: EventHandler): void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = [];
      this.listeners.set(event, handlers);
    }
    handlers.push(handler);
  }

  /**
   * Unregister an event listener
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    // Keep the empty array instead of deleting the key
  }

  /**
   * Handle incoming response from backend
   */
  handleResponse(event: string, data: any): void {
    const pending = this.pendingRequests.get(event);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(event);
      pending.resolve(data);
    }
  }

  /**
   * Handle incoming event from backend
   * Calls all registered handlers, catching errors to prevent one handler from breaking others
   */
  handleIncomingEvent(event: string, payload: any): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.length === 0) {
      return;
    }

    // Call all handlers, isolating errors to individual handlers
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  }

  /**
   * Get listeners for an event (primarily for testing)
   * @returns Array of handlers, or undefined if no listeners registered
   */
  getListeners(event: string): EventHandler[] | undefined {
    return this.listeners.get(event);
  }

  /**
   * Get pending requests count (primarily for testing)
   * Useful for debugging and monitoring memory usage
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get total listener count across all events (primarily for testing)
   * Useful for detecting memory leaks
   */
  getTotalListenerCount(): number {
    let count = 0;
    for (const handlers of this.listeners.values()) {
      count += handlers.length;
    }
    return count;
  }

  private async sendMessage(message: IPCMessage): Promise<void> {
    const win = (globalThis as any).window as Window | undefined;
    if (!win?.__TAURI__) {
      throw new Error('Tauri API not available');
    }

    await win.__TAURI__.invoke('ipc_message', message);
  }
}

export default IPCMessageAdapter;
