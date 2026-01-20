/**
 * ipcService Tests
 *
 * Tests for SolidJS IPC communication service:
 * - Scenario: 初始化 IPC 监听
 * - Scenario: 发送事件到后端
 * - Scenario: 发送请求并等待响应
 * - Scenario: 监听来自后端的事件
 *
 * _Requirements: SolidJS ipcService 实现_
 * _TaskGroup: 6_
 */

import {
  ipcService,
  IPCService,
  IPCMessage,
  setTauriApi,
} from './ipcService';

// Mock Tauri API functions
const mockInvoke = jest.fn();
const mockListen = jest.fn();
const mockUnlisten = jest.fn();

describe('ipcService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state before each test
    ipcService.reset();

    // Set up mock Tauri API
    mockListen.mockResolvedValue(mockUnlisten);
    mockInvoke.mockResolvedValue({ success: true });

    // Inject mock Tauri API
    setTauriApi(mockInvoke, mockListen);
  });

  afterEach(() => {
    // Ensure service is properly reset after each test (stops heartbeat, clears pending requests)
    ipcService.reset();
  });

  describe('Scenario: 初始化 IPC 监听', () => {
    it('should initialize and register Tauri listeners', async () => {
      await ipcService.initialize();

      expect(mockListen).toHaveBeenCalled();
      expect(ipcService.isInitialized()).toBe(true);
    });

    it('should register message router for ipc_message events', async () => {
      await ipcService.initialize();

      // Should have called listen with 'ipc_message' event
      expect(mockListen).toHaveBeenCalledWith(
        'ipc_message',
        expect.any(Function)
      );
    });

    it('should start heartbeat detection', async () => {
      jest.useFakeTimers();
      await ipcService.initialize();

      // Heartbeat should be started
      expect(ipcService.isHeartbeatActive()).toBe(true);

      jest.useRealTimers();
    });

    it('should not initialize twice', async () => {
      await ipcService.initialize();
      await ipcService.initialize();

      // listen should only be called once
      expect(mockListen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scenario: 发送事件到后端', () => {
    beforeEach(async () => {
      await ipcService.initialize();
    });

    it('should emit event using Tauri invoke', async () => {
      await ipcService.emit('user_message', { text: 'Hello' });

      expect(mockInvoke).toHaveBeenCalledWith('send_to_node', {
        message: expect.objectContaining({
          msg_type: 'event',
          event: 'user_message',
          payload: { text: 'Hello' },
        }),
      });
    });

    it('should complete emit once invoke resolves', async () => {
      let resolveInvoke: () => void;
      mockInvoke.mockImplementation(
        () => new Promise((resolve) => { resolveInvoke = resolve as () => void; })
      );

      const emitPromise = ipcService.emit('test_event', { data: 'test' });

      // Emit should be pending until invoke completes
      expect(mockInvoke).toHaveBeenCalled();

      // Resolve the mock
      resolveInvoke!();

      // Now emit should complete
      await expect(emitPromise).resolves.toBeUndefined();
    });

    it('should serialize message payload correctly', async () => {
      const complexPayload = {
        nested: { value: 123 },
        array: [1, 2, 3],
        date: '2024-01-15T10:30:00.000Z',
      };

      await ipcService.emit('complex_event', complexPayload);

      expect(mockInvoke).toHaveBeenCalledWith('send_to_node', {
        message: expect.objectContaining({
          payload: complexPayload,
        }),
      });
    });
  });

  describe('Scenario: 发送请求并等待响应', () => {
    beforeEach(async () => {
      await ipcService.initialize();
    });

    it('should generate unique request ID', async () => {
      // Setup mock to capture the request
      let capturedMessage1: IPCMessage | undefined;
      let capturedMessage2: IPCMessage | undefined;

      mockInvoke.mockImplementation((_cmd: string, args: { message: IPCMessage }) => {
        if (!capturedMessage1) {
          capturedMessage1 = args.message;
        } else {
          capturedMessage2 = args.message;
        }
        return Promise.resolve();
      });

      // Make two requests
      ipcService.request('get_data', {});
      ipcService.request('get_data', {});

      expect(capturedMessage1?.id).toBeDefined();
      expect(capturedMessage2?.id).toBeDefined();
      expect(capturedMessage1?.id).not.toBe(capturedMessage2?.id);
    });

    it('should send request using Tauri invoke', async () => {
      const requestPromise = ipcService.request('get_tasks', { filter: 'all' });

      expect(mockInvoke).toHaveBeenCalledWith('send_to_node', {
        message: expect.objectContaining({
          msg_type: 'request',
          event: 'get_tasks',
          payload: { filter: 'all' },
          id: expect.any(String),
        }),
      });

      // Simulate response
      ipcService.handleIncomingMessage({
        id: (mockInvoke.mock.calls[0][1] as { message: IPCMessage }).message.id,
        msg_type: 'response',
        event: 'get_tasks',
        payload: { tasks: [] },
      });

      const result = await requestPromise;
      expect(result).toEqual({ tasks: [] });
    });

    it('should return Promise and resolve on matching response', async () => {
      const requestPromise = ipcService.request<{ result: number }>('calculate', { x: 5 });

      // Get the request ID from the captured call
      const requestId = (mockInvoke.mock.calls[0][1] as { message: IPCMessage }).message.id;

      // Simulate response with matching ID
      ipcService.handleIncomingMessage({
        id: requestId,
        msg_type: 'response',
        event: 'calculate',
        payload: { result: 25 },
      });

      const result = await requestPromise;
      expect(result).toEqual({ result: 25 });
    });

    it('should reject on timeout', async () => {
      // Use real timers with short timeout
      try {
        await ipcService.request('slow_request', {}, { timeout: 50 });
        // Should not reach here
        expect(true).toBe(false);
      } catch (err) {
        expect((err as Error).message).toMatch(/timed out/i);
      }
    });

    it('should reject on error response', async () => {
      const requestPromise = ipcService.request('failing_request', {});

      const requestId = (mockInvoke.mock.calls[0][1] as { message: IPCMessage }).message.id;

      // Simulate error response
      ipcService.handleIncomingMessage({
        id: requestId,
        msg_type: 'response',
        event: 'failing_request',
        payload: null,
        error: 'Something went wrong',
      });

      await expect(requestPromise).rejects.toThrow('Something went wrong');
    });
  });

  describe('Scenario: 监听来自后端的事件', () => {
    beforeEach(async () => {
      await ipcService.initialize();
    });

    it('should register event handler with on()', () => {
      const handler = jest.fn();
      ipcService.on('display_message', handler);

      expect(ipcService.hasHandler('display_message')).toBe(true);
    });

    it('should call handler when matching event is received', () => {
      const handler = jest.fn();
      ipcService.on('display_message', handler);

      // Simulate incoming event
      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'display_message',
        payload: { text: 'Hello from backend', role: 'assistant' },
      });

      expect(handler).toHaveBeenCalledWith({
        text: 'Hello from backend',
        role: 'assistant',
      });
    });

    it('should pass event payload to handler', () => {
      const handler = jest.fn();
      ipcService.on('task_update', handler);

      const payload = {
        taskId: '123',
        status: 'completed',
        progress: 100,
      };

      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'task_update',
        payload,
      });

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      ipcService.on('multi_event', handler1);
      ipcService.on('multi_event', handler2);

      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'multi_event',
        payload: { data: 'test' },
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should unregister handler with off()', () => {
      const handler = jest.fn();
      ipcService.on('removable_event', handler);
      ipcService.off('removable_event', handler);

      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'removable_event',
        payload: {},
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not call unregistered handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      ipcService.on('partial_event', handler1);
      ipcService.on('partial_event', handler2);
      ipcService.off('partial_event', handler1);

      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'partial_event',
        payload: {},
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('IPCService class', () => {
    it('should create new instance', () => {
      const service = new IPCService();
      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(false);
    });

    it('should cleanup on destroy', async () => {
      const service = new IPCService();
      setTauriApi(mockInvoke, mockListen);
      await service.initialize();

      await service.destroy();

      expect(service.isInitialized()).toBe(false);
      expect(mockUnlisten).toHaveBeenCalled();
    });
  });

  describe('Message Types', () => {
    it('should handle event messages', () => {
      const handler = jest.fn();
      ipcService.on('test', handler);

      ipcService.handleIncomingMessage({
        msg_type: 'event',
        event: 'test',
        payload: { data: 'value' },
      });

      expect(handler).toHaveBeenCalledWith({ data: 'value' });
    });

    it('should handle response messages', async () => {
      await ipcService.initialize();

      const requestPromise = ipcService.request('test', {});
      const requestId = (mockInvoke.mock.calls[0][1] as { message: IPCMessage }).message.id;

      ipcService.handleIncomingMessage({
        id: requestId,
        msg_type: 'response',
        event: 'test',
        payload: { result: 'success' },
      });

      await expect(requestPromise).resolves.toEqual({ result: 'success' });
    });
  });

  describe('Error handling', () => {
    it('should throw if emit called before initialization', async () => {
      // Don't initialize
      await expect(ipcService.emit('test', {})).rejects.toThrow(/not initialized/i);
    });

    it('should throw if request called before initialization', async () => {
      // Don't initialize
      await expect(ipcService.request('test', {})).rejects.toThrow(/not initialized/i);
    });

    it('should handle invoke errors and propagate them', async () => {
      await ipcService.initialize();
      mockInvoke.mockRejectedValue(new Error('Network error'));

      await expect(ipcService.emit('test', {})).rejects.toThrow('Network error');
    });
  });
});
