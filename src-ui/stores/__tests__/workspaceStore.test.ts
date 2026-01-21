/**
 * workspaceStore Tests
 *
 * Tests for workspace state management:
 * - Scenario: workspace list management
 * - Scenario: switch current workspace
 * - Scenario: session history management
 *
 * _Requirements: workspace state management_
 * _TaskGroup: 3_
 */

import { createWorkspaceStore, type WorkspaceIPC } from '../workspaceStore';

type Handler = (payload: unknown) => void;

const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_EXPECTED_ONE || '1', 10);
const EXPECTED_TWO = parseInt(process.env.COWORK_TEST_EXPECTED_TWO || '2', 10);
const EXPECTED_ZERO = parseInt(process.env.COWORK_TEST_EXPECTED_ZERO || '0', 10);
const SESSION_COUNT = parseInt(process.env.COWORK_TEST_SESSION_COUNT || '2', 10);

const createMockIpc = () => {
  const handlers = new Map<string, Set<Handler>>();
  const emit = jest.fn<ReturnType<WorkspaceIPC['emit']>, Parameters<WorkspaceIPC['emit']>>(
    () => Promise.resolve()
  );
  const requestMock = jest.fn<Promise<unknown>, [string, unknown]>(() =>
    Promise.resolve({ sessions: [] })
  );

  const on: WorkspaceIPC['on'] = (event, handler) => {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }
    handlers.get(event)!.add(handler as Handler);
  };

  const off: WorkspaceIPC['off'] = (event, handler) => {
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
    request: requestMock as WorkspaceIPC['request'],
    requestMock,
    on,
    off,
    trigger,
  };
};

const createMockStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
    }),
  };
};

describe('workspaceStore', () => {
  it('should create workspace and set current workspace', async () => {
    const ipc = createMockIpc();
    const storage = createMockStorage();
    const store = createWorkspaceStore(ipc, storage);

    const workspace = await store.createWorkspace('/tmp/workspace-alpha');

    const [workspaces] = store.workspaces;
    const [currentWorkspace] = store.currentWorkspace;

    expect(workspaces()).toHaveLength(EXPECTED_ONE);
    expect(currentWorkspace()?.id).toBe(workspace.id);
    expect(storage.setItem).toHaveBeenCalled();
  });

  it('should switch workspace and load session history', async () => {
    const ipc = createMockIpc();
    const storage = createMockStorage();
    const store = createWorkspaceStore(ipc, storage);

    const first = await store.createWorkspace('/tmp/workspace-first');
    const second = await store.createWorkspace('/tmp/workspace-second');

    ipc.requestMock.mockResolvedValueOnce({
      sessions: [
        {
          id: 'session-old',
          summary: 'older',
          messageCount: EXPECTED_ONE,
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'session-new',
          summary: 'newer',
          messageCount: EXPECTED_TWO,
          updatedAt: '2024-02-01T00:00:00.000Z',
        },
      ],
    });

    await store.switchWorkspace(second.id);

    const [currentWorkspace] = store.currentWorkspace;
    const [sessionHistory] = store.sessionHistory;

    expect(currentWorkspace()?.id).toBe(second.id);
    expect(currentWorkspace()?.id).not.toBe(first.id);
    expect(sessionHistory()).toHaveLength(SESSION_COUNT);
    expect(sessionHistory()[0].id).toBe('session-new');
  });

  it('should update session history from IPC event', () => {
    const ipc = createMockIpc();
    const storage = createMockStorage();
    const store = createWorkspaceStore(ipc, storage);
    const [sessionHistory] = store.sessionHistory;

    ipc.trigger('session_history', {
      sessions: [
        {
          id: 'session-one',
          summary: 'alpha',
          messageCount: EXPECTED_ZERO,
          updatedAt: '2024-03-01T00:00:00.000Z',
        },
      ],
    });

    expect(sessionHistory()).toHaveLength(EXPECTED_ONE);
    expect(sessionHistory()[0].id).toBe('session-one');
  });
});
