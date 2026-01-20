/**
 * DesktopInteractiveUI Tests
 *
 * Tests for Desktop Interactive UI implementation:
 * - Scenario: 启动和停止 IPC 监听
 * - Scenario: 显示消息到前端
 * - Scenario: 显示工具调用
 * - Scenario: 请求用户确认
 *
 * _Requirements: DesktopInteractiveUI 实现_
 * _TaskGroup: 8_
 */

import { DesktopInteractiveUI } from '../../../../src/ui/implementations/desktop/DesktopInteractiveUI';
import { IPCMessageAdapter } from '../../../../src/ui/implementations/desktop/IPCMessageAdapter';
import type { InteractiveUICallbacks } from '../../../../src/ui/contracts/interactive/InteractiveUIInterface';

// Mock IPCMessageAdapter
jest.mock('../../../../src/ui/implementations/desktop/IPCMessageAdapter');

describe('DesktopInteractiveUI', () => {
  let ui: DesktopInteractiveUI;
  let mockAdapter: jest.Mocked<IPCMessageAdapter>;
  let callbacks: InteractiveUICallbacks;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock adapter
    mockAdapter = {
      emit: jest.fn().mockResolvedValue(undefined),
      request: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      off: jest.fn(),
      handleResponse: jest.fn(),
      handleIncomingEvent: jest.fn(),
      getListeners: jest.fn(),
      getPendingRequestsCount: jest.fn(),
      getTotalListenerCount: jest.fn(),
    } as unknown as jest.Mocked<IPCMessageAdapter>;

    // Create callbacks
    callbacks = {
      onMessage: jest.fn().mockResolvedValue(undefined),
      onInterrupt: jest.fn(),
      onRewind: jest.fn().mockResolvedValue(undefined),
      onPermissionModeChange: jest.fn(),
    };

    // Create UI instance with mock adapter
    ui = new DesktopInteractiveUI(callbacks, {}, mockAdapter);
  });

  describe('Scenario: 启动和停止 IPC 监听', () => {
    it('should register IPC listeners on start', async () => {
      await ui.start();

      // Should register for user_message, user_interrupt, user_rewind
      expect(mockAdapter.on).toHaveBeenCalledWith('user_message', expect.any(Function));
      expect(mockAdapter.on).toHaveBeenCalledWith('user_interrupt', expect.any(Function));
      expect(mockAdapter.on).toHaveBeenCalledWith('user_rewind', expect.any(Function));
    });

    it('should register permission_mode_change listener if callback provided', async () => {
      await ui.start();

      expect(mockAdapter.on).toHaveBeenCalledWith('permission_mode_change', expect.any(Function));
    });

    it('should emit ui_ready event on start', async () => {
      await ui.start();

      expect(mockAdapter.emit).toHaveBeenCalledWith('ui_ready', expect.objectContaining({
        timestamp: expect.any(Number),
      }));
    });

    it('should not start twice', async () => {
      await ui.start();
      await ui.start();

      // emit should only be called once for ui_ready
      const uiReadyCalls = (mockAdapter.emit as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'ui_ready'
      );
      expect(uiReadyCalls.length).toBe(1);
    });

    it('should emit ui_stopped event on stop', async () => {
      await ui.start();
      ui.stop();

      expect(mockAdapter.emit).toHaveBeenCalledWith('ui_stopped', expect.objectContaining({
        timestamp: expect.any(Number),
      }));
    });

    it('should not stop if not started', () => {
      ui.stop();

      // Should not emit ui_stopped if not running
      const uiStoppedCalls = (mockAdapter.emit as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'ui_stopped'
      );
      expect(uiStoppedCalls.length).toBe(0);
    });

    it('should call onMessage callback when user_message event received', async () => {
      await ui.start();

      // Get the registered handler
      const onCall = (mockAdapter.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user_message'
      );
      const handler = onCall[1];

      // Simulate incoming message
      handler({ message: 'Hello, assistant!' });

      expect(callbacks.onMessage).toHaveBeenCalledWith('Hello, assistant!');
    });

    it('should call onInterrupt callback when user_interrupt event received', async () => {
      await ui.start();

      // Get the registered handler
      const onCall = (mockAdapter.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user_interrupt'
      );
      const handler = onCall[1];

      // Simulate interrupt
      handler();

      expect(callbacks.onInterrupt).toHaveBeenCalled();
    });

    it('should call onRewind callback when user_rewind event received', async () => {
      await ui.start();

      // Get the registered handler
      const onCall = (mockAdapter.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'user_rewind'
      );
      const handler = onCall[1];

      // Simulate rewind
      handler();

      expect(callbacks.onRewind).toHaveBeenCalled();
    });
  });

  describe('Scenario: 显示消息到前端', () => {
    it('should emit display_message event with message and role', () => {
      ui.displayMessage('Hello from assistant', 'assistant');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_message', {
        message: 'Hello from assistant',
        role: 'assistant',
      });
    });

    it('should support user role', () => {
      ui.displayMessage('User input', 'user');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_message', {
        message: 'User input',
        role: 'user',
      });
    });

    it('should support system role', () => {
      ui.displayMessage('System notice', 'system');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_message', {
        message: 'System notice',
        role: 'system',
      });
    });

    it('should emit display_error event', () => {
      ui.displayError('Something went wrong');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_error', {
        message: 'Something went wrong',
      });
    });

    it('should emit display_warning event', () => {
      ui.displayWarning('Warning: low memory');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_warning', {
        message: 'Warning: low memory',
      });
    });

    it('should emit display_success event', () => {
      ui.displaySuccess('Operation completed');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_success', {
        message: 'Operation completed',
      });
    });

    it('should emit display_info event', () => {
      ui.displayInfo('FYI: new update available');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_info', {
        message: 'FYI: new update available',
      });
    });

    it('should emit display_thinking event', () => {
      ui.displayThinking('Processing your request...');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_thinking', {
        content: 'Processing your request...',
      });
    });

    it('should emit display_thinking event without content', () => {
      ui.displayThinking();

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_thinking', {
        content: undefined,
      });
    });

    it('should emit display_computing event', () => {
      ui.displayComputing();

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_computing', {});
    });

    it('should emit stop_computing event', () => {
      ui.stopComputing();

      expect(mockAdapter.emit).toHaveBeenCalledWith('stop_computing', {});
    });

    it('should emit clear_progress event', () => {
      ui.clearProgress();

      expect(mockAdapter.emit).toHaveBeenCalledWith('clear_progress', {});
    });
  });

  describe('Scenario: 显示工具调用', () => {
    it('should emit display_tool_use event with tool name and args', () => {
      const args = { path: '/tmp/test.txt', content: 'Hello' };
      ui.displayToolUse('Write', args);

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_tool_use', {
        tool: 'Write',
        args,
      });
    });

    it('should emit display_tool_use event with empty args', () => {
      ui.displayToolUse('Read', {});

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_tool_use', {
        tool: 'Read',
        args: {},
      });
    });

    it('should emit display_tool_use event with complex args', () => {
      const args = {
        nested: { value: 123 },
        array: [1, 2, 3],
        string: 'test',
      };
      ui.displayToolUse('Bash', args);

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_tool_use', {
        tool: 'Bash',
        args,
      });
    });

    it('should emit display_tool_result event with success result', () => {
      ui.displayToolResult('Write', 'File written successfully');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_tool_result', {
        tool: 'Write',
        result: 'File written successfully',
        isError: false,
      });
    });

    it('should emit display_tool_result event with error result', () => {
      ui.displayToolResult('Write', 'Permission denied', true);

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_tool_result', {
        tool: 'Write',
        result: 'Permission denied',
        isError: true,
      });
    });
  });

  describe('Scenario: 请求用户确认', () => {
    it('should request confirmation via IPC and return true', async () => {
      mockAdapter.request.mockResolvedValue({ confirmed: true });

      const result = await ui.promptConfirmation('Are you sure?');

      expect(mockAdapter.request).toHaveBeenCalledWith(
        'prompt_confirmation',
        { message: 'Are you sure?' },
        { timeout: 60000 }
      );
      expect(result).toBe(true);
    });

    it('should request confirmation via IPC and return false', async () => {
      mockAdapter.request.mockResolvedValue({ confirmed: false });

      const result = await ui.promptConfirmation('Delete file?');

      expect(result).toBe(false);
    });

    it('should return false on timeout or error', async () => {
      mockAdapter.request.mockRejectedValue(new Error('Request timeout'));

      const result = await ui.promptConfirmation('Confirm action?');

      expect(result).toBe(false);
    });

    it('should show confirmation menu and return true', async () => {
      mockAdapter.request.mockResolvedValue({ confirmed: true });

      const options = [
        { key: 'y', label: 'Yes', description: 'Proceed with action' },
        { key: 'n', label: 'No', description: 'Cancel action' },
      ];
      const result = await ui.showConfirmationMenu('Confirm?', options, 'y');

      expect(mockAdapter.request).toHaveBeenCalledWith(
        'show_confirmation_menu',
        { title: 'Confirm?', options, defaultKey: 'y' },
        { timeout: 60000 }
      );
      expect(result).toBe(true);
    });

    it('should show session menu and return selected session', async () => {
      const sessions = [
        { id: '1', name: 'Session 1', createdAt: new Date(), lastUsed: new Date() },
        { id: '2', name: 'Session 2', createdAt: new Date(), lastUsed: new Date() },
      ];
      mockAdapter.request.mockResolvedValue({ session: sessions[0] });

      const result = await ui.showSessionMenu(sessions as any);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        'show_session_menu',
        { sessions },
        { timeout: 120000 }
      );
      expect(result).toEqual(sessions[0]);
    });

    it('should return null when session menu is cancelled', async () => {
      mockAdapter.request.mockResolvedValue({ session: null });

      const result = await ui.showSessionMenu([]);

      expect(result).toBeNull();
    });

    it('should show rewind menu and return selected snapshot', async () => {
      const snapshots = [
        { id: '1', timestamp: new Date(), description: 'Snapshot 1', files: [] },
      ];
      mockAdapter.request.mockResolvedValue({ snapshot: snapshots[0] });

      const result = await ui.showRewindMenu(snapshots);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        'show_rewind_menu',
        { snapshots },
        { timeout: 120000 }
      );
      expect(result).toEqual(snapshots[0]);
    });
  });

  describe('Permission mode handling', () => {
    it('should emit set_initial_permission_mode event', () => {
      ui.setInitialPermissionMode('default');

      expect(mockAdapter.emit).toHaveBeenCalledWith('set_initial_permission_mode', {
        mode: 'default',
      });
    });

    it('should emit set_permission_mode event', () => {
      ui.setPermissionMode('plan');

      expect(mockAdapter.emit).toHaveBeenCalledWith('set_permission_mode', {
        mode: 'plan',
      });
    });

    it('should emit display_permission_status event', () => {
      ui.displayPermissionStatus('acceptEdits');

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_permission_status', {
        mode: 'acceptEdits',
      });
    });
  });

  describe('Processing state handling', () => {
    it('should emit set_processing_state event with true', () => {
      ui.setProcessingState(true);

      expect(mockAdapter.emit).toHaveBeenCalledWith('set_processing_state', {
        processing: true,
      });
    });

    it('should emit set_processing_state event with false', () => {
      ui.setProcessingState(false);

      expect(mockAdapter.emit).toHaveBeenCalledWith('set_processing_state', {
        processing: false,
      });
    });
  });

  describe('Todo list display', () => {
    it('should emit display_todo_list event', () => {
      const todos = [
        { content: 'Task 1', status: 'pending' as const, activeForm: 'Task 1' },
        { content: 'Task 2', status: 'in_progress' as const, activeForm: 'Working on Task 2' },
        { content: 'Task 3', status: 'completed' as const, activeForm: 'Task 3' },
      ];

      ui.displayTodoList(todos);

      expect(mockAdapter.emit).toHaveBeenCalledWith('display_todo_list', { todos });
    });
  });

  describe('Utility methods', () => {
    it('should format relative time - just now', () => {
      const now = new Date();
      const result = ui.formatRelativeTime(now);
      expect(result).toBe('just now');
    });

    it('should format relative time - minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = ui.formatRelativeTime(date);
      expect(result).toBe('5m ago');
    });

    it('should format relative time - hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      const result = ui.formatRelativeTime(date);
      expect(result).toBe('3h ago');
    });

    it('should format relative time - days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const result = ui.formatRelativeTime(date);
      expect(result).toBe('2d ago');
    });

    it('should format absolute time', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = ui.formatAbsoluteTime(date);
      expect(result).toContain('2024'); // At minimum contains the year
    });

    it('should format stats summary with stats', () => {
      const stats = {
        messageCount: 10,
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCacheCreationInputTokens: 0,
        totalCacheReadInputTokens: 0,
        totalCostUsd: 0.05,
        lastMessagePreview: 'Test message',
      };
      const result = ui.formatStatsSummary(stats);
      expect(result).toContain('Messages: 10');
      expect(result).toContain('Tokens: 1500');
    });

    it('should format stats summary without stats', () => {
      const result = ui.formatStatsSummary();
      expect(result).toBe('No stats available');
    });
  });
});
