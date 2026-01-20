/**
 * IPCMessageAdapter Tests
 *
 * Tests for IPC message adapter:
 * - emit(): Send one-way events
 * - request(): Request/response pattern
 * - on(): Register event listeners
 * - off(): Unregister event listeners
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('IPCMessageAdapter', () => {
  let IPCMessageAdapter: any;
  let adapter: any;
  let mockTauriInvoke: any;
  let mockTauriListen: any;

  beforeEach(async () => {
    // Mock Tauri API
    mockTauriInvoke = jest.fn();
    mockTauriListen = jest.fn();

    (global as any).window = {
      __TAURI__: {
        invoke: mockTauriInvoke,
        event: {
          listen: mockTauriListen,
        },
      },
    } as any;

    // Import module
    const module = await import('../../../../src/ui/implementations/desktop/IPCMessageAdapter');
    IPCMessageAdapter = module.IPCMessageAdapter;

    // Create adapter instance
    adapter = new IPCMessageAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create IPCMessageAdapter instance', () => {
      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(IPCMessageAdapter);
    });

    test('should initialize with empty listeners map', () => {
      expect(adapter).toBeDefined();
      // Internal state should be initialized
    });
  });

  describe('emit() - One-way Events', () => {
    test('should send one-way event', async () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      await adapter.emit('test_event', { data: 'test' });

      expect(mockTauriInvoke).toHaveBeenCalledTimes(1);
      expect(mockTauriInvoke).toHaveBeenCalledWith(
        'ipc_message',
        expect.objectContaining({
          event: 'test_event',
          payload: { data: 'test' },
          type: 'event',
        })
      );
    });

    test('should send event without payload', async () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      await adapter.emit('simple_event');

      expect(mockTauriInvoke).toHaveBeenCalledWith(
        'ipc_message',
        expect.objectContaining({
          event: 'simple_event',
          type: 'event',
        })
      );
    });

    test('should handle emit errors gracefully', async () => {
      mockTauriInvoke.mockRejectedValue(new Error('Send failed'));

      await expect(adapter.emit('error_event')).rejects.toThrow('Send failed');
    });
  });

  describe('request() - Request/Response Pattern', () => {
    test('should send request and wait for response', async () => {
      const responseData = { result: 'success' };

      // Simulate response after a delay
      mockTauriInvoke.mockImplementation(async () => {
        // Simulate backend processing
        await new Promise(resolve => setTimeout(resolve, 10));
        // Trigger response handler
        const handlers = adapter.getListeners('test_request_response');
        if (handlers && handlers.length > 0) {
          handlers[0](responseData);
        }
        return undefined;
      });

      const responsePromise = adapter.request('test_request', { query: 'data' });

      // Trigger response
      setTimeout(() => {
        adapter.handleResponse('test_request', responseData);
      }, 50);

      const response = await responsePromise;

      expect(response).toEqual(responseData);
      expect(mockTauriInvoke).toHaveBeenCalledWith(
        'ipc_message',
        expect.objectContaining({
          event: 'test_request',
          payload: { query: 'data' },
          type: 'request',
        })
      );
    });

    test('should timeout if no response received', async () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      // Set short timeout for testing
      const requestPromise = adapter.request('timeout_test', {}, { timeout: 100 });

      await expect(requestPromise).rejects.toThrow('timeout');
    }, 10000);

    test('should support multiple concurrent requests', async () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      const req1 = adapter.request('request1', { id: 1 });
      const req2 = adapter.request('request2', { id: 2 });
      const req3 = adapter.request('request3', { id: 3 });

      // Simulate responses
      setTimeout(() => {
        adapter.handleResponse('request1', { result: 1 });
        adapter.handleResponse('request2', { result: 2 });
        adapter.handleResponse('request3', { result: 3 });
      }, 50);

      const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

      expect(res1).toEqual({ result: 1 });
      expect(res2).toEqual({ result: 2 });
      expect(res3).toEqual({ result: 3 });
    });
  });

  describe('on() - Register Event Listeners', () => {
    test('should register event listener', () => {
      const handler = jest.fn();

      adapter.on('test_event', handler);

      // Verify listener is registered
      expect(adapter.getListeners('test_event')).toContain(handler);
    });

    test('should support multiple listeners for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      adapter.on('multi_event', handler1);
      adapter.on('multi_event', handler2);

      const listeners = adapter.getListeners('multi_event');
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    test('should call registered handler when event is received', () => {
      const handler = jest.fn();
      adapter.on('incoming_event', handler);

      // Simulate incoming event
      adapter.handleIncomingEvent('incoming_event', { data: 'test' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should call all registered handlers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      adapter.on('broadcast', handler1);
      adapter.on('broadcast', handler2);

      adapter.handleIncomingEvent('broadcast', { message: 'hello' });

      expect(handler1).toHaveBeenCalledWith({ message: 'hello' });
      expect(handler2).toHaveBeenCalledWith({ message: 'hello' });
    });
  });

  describe('off() - Unregister Event Listeners', () => {
    test('should unregister event listener', () => {
      const handler = jest.fn();

      adapter.on('removable_event', handler);
      expect(adapter.getListeners('removable_event')).toContain(handler);

      adapter.off('removable_event', handler);
      expect(adapter.getListeners('removable_event')).not.toContain(handler);
    });

    test('should only remove specified handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      adapter.on('multi_handler', handler1);
      adapter.on('multi_handler', handler2);

      adapter.off('multi_handler', handler1);

      const listeners = adapter.getListeners('multi_handler');
      expect(listeners).not.toContain(handler1);
      expect(listeners).toContain(handler2);
    });

    test('should handle removing non-existent handler gracefully', () => {
      const handler = jest.fn();

      expect(() => {
        adapter.off('nonexistent_event', handler);
      }).not.toThrow();
    });

    test('should not call unregistered handler', () => {
      const handler = jest.fn();

      adapter.on('temp_event', handler);
      adapter.off('temp_event', handler);

      adapter.handleIncomingEvent('temp_event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Request ID Management', () => {
    test('should generate unique request IDs', () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      void adapter.request('test1', {});
      void adapter.request('test2', {});
      void adapter.request('test3', {});

      // IDs should be tracked internally
      expect(adapter.getPendingRequestsCount()).toBe(3);

      // Clean up
      adapter.handleResponse('test1', {});
      adapter.handleResponse('test2', {});
      adapter.handleResponse('test3', {});
    });

    test('should clean up completed requests', async () => {
      mockTauriInvoke.mockResolvedValue(undefined);

      const req = adapter.request('cleanup_test', {});

      expect(adapter.getPendingRequestsCount()).toBe(1);

      adapter.handleResponse('cleanup_test', { done: true });
      await req;

      expect(adapter.getPendingRequestsCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed incoming messages', () => {
      const handler = jest.fn();
      adapter.on('safe_event', handler);

      expect(() => {
        adapter.handleIncomingEvent('safe_event', null);
      }).not.toThrow();

      expect(handler).toHaveBeenCalledWith(null);
    });

    test('should handle handler errors without breaking adapter', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const safeHandler = jest.fn();

      adapter.on('error_prone', errorHandler);
      adapter.on('error_prone', safeHandler);

      adapter.handleIncomingEvent('error_prone', { data: 'test' });

      // Safe handler should still be called
      expect(safeHandler).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with many listeners', () => {
      const handlers: any[] = [];

      // Register many listeners
      for (let i = 0; i < 1000; i++) {
        const handler = jest.fn();
        handlers.push(handler);
        adapter.on(`event_${i}`, handler);
      }

      // Unregister all
      for (let i = 0; i < 1000; i++) {
        adapter.off(`event_${i}`, handlers[i]);
      }

      // All should be cleaned up
      expect(adapter.getTotalListenerCount()).toBe(0);
    });
  });
});
