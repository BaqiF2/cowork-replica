/**
 * chatStore Tests
 *
 * Tests for SolidJS chat store:
 * - Scenario: message state management
 * - Scenario: tool use state management
 * - Scenario: computing state management
 * - Scenario: send message
 *
 * _Requirements: chat state management_
 * _TaskGroup: 1_
 */

import { createChatStore, type ChatIPC } from '../chatStore';

type Handler = (payload: unknown) => void;

const createMockIpc = (): ChatIPC & { trigger: (event: string, payload: unknown) => void } => {
  const handlers = new Map<string, Set<Handler>>();
  const emit = jest.fn<ReturnType<ChatIPC['emit']>, Parameters<ChatIPC['emit']>>(
    () => Promise.resolve()
  );

  const on: ChatIPC['on'] = (event, handler) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler as Handler);
  };

  const off: ChatIPC['off'] = (event, handler) => {
    const set = handlers.get(event);
    if (set) {
      set.delete(handler as Handler);
    }
  };

  const trigger = (event: string, payload: unknown) => {
    const set = handlers.get(event);
    if (!set) {
      return;
    }
    for (const handler of set) {
      handler(payload);
    }
  };

  return {
    emit,
    on,
    off,
    trigger,
  };
};

describe('chatStore', () => {
  it('should append messages on display_message', () => {
    const ipc = createMockIpc();
    const store = createChatStore(ipc);
    const [messages] = store.messages;

    ipc.trigger('display_message', { message: 'Hello', role: 'assistant' });
    ipc.trigger('display_message', { message: 'World', role: 'assistant' });

    const list = messages();
    expect(list).toHaveLength(2);
    expect(list[0].content).toBe('Hello');
    expect(list[1].content).toBe('World');
  });

  it('should associate tool uses with the latest message', () => {
    const ipc = createMockIpc();
    const store = createChatStore(ipc);
    const [messages] = store.messages;
    const [toolUses] = store.toolUses;

    ipc.trigger('display_message', { message: 'Read file', role: 'assistant' });
    const latestMessageId = messages()[0].id;

    ipc.trigger('display_tool_use', { tool: 'Read', args: { path: '/tmp/a.txt' } });

    const tools = toolUses();
    expect(tools).toHaveLength(1);
    expect(tools[0].tool).toBe('Read');
    expect(tools[0].messageId).toBe(latestMessageId);
  });

  it('should toggle computing state on IPC events', () => {
    const ipc = createMockIpc();
    const store = createChatStore(ipc);
    const [isComputing] = store.isComputing;

    ipc.trigger('display_computing', {});
    expect(isComputing()).toBe(true);

    ipc.trigger('stop_computing', {});
    expect(isComputing()).toBe(false);
  });

  it('should send message via IPC and optimistically update', async () => {
    const ipc = createMockIpc();
    const store = createChatStore(ipc);
    const [messages] = store.messages;
    const [isComputing] = store.isComputing;

    await store.sendMessage('Hi there');

    expect(ipc.emit).toHaveBeenCalledWith('user_message', { message: 'Hi there' });
    expect(messages()).toHaveLength(1);
    expect(messages()[0].content).toBe('Hi there');
    expect(messages()[0].role).toBe('user');
    expect(isComputing()).toBe(true);
  });
});
