/**
 * Phase 2 Core Features End-to-End Validation Tests
 *
 * Validates the integration of:
 * - Chat flow with tool use display
 * - Workspace management and session history
 * - Permission prompt + settings history flow
 * - Diff preview from checkpoint snapshots
 *
 * _Requirements: 所有 Phase 2 需求_
 * _Scenarios: 聊天, 工作区, 权限, Diff, Checkpoint_
 * _TaskGroup: 11_
 */

import { createChatStore, type ChatIPC } from '../../src-ui/stores/chatStore';
import {
  createWorkspaceStore,
  WORKSPACE_EVENTS,
  type WorkspaceIPC,
} from '../../src-ui/stores/workspaceStore';
import {
  appendHistoryEntry,
  type PermissionHistoryEntry,
} from '../../src-ui/components/settings/permissionSettingsUtils';
import {
  buildPermissionResponse,
  getPermissionModalConfig,
  mapPermissionRequest,
} from '../../src-ui/components/common/permissionModalUtils';
import {
  computeDiffLines,
  getFileDiffConfig,
} from '../../src-ui/components/files/fileDiffUtils';
import {
  buildTimelineMarkers,
  normalizeSnapshots,
  resolveSnapshotFile,
  type RewindSnapshotPayload,
} from '../../src-ui/components/files/rewindMenuUtils';

type Handler = (payload: unknown) => void;

const INDEX_FIRST = parseInt(process.env.COWORK_TEST_INDEX_FIRST || '0', 10);
const INDEX_SECOND = parseInt(process.env.COWORK_TEST_INDEX_SECOND || '1', 10);
const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_EXPECTED_ONE || '1', 10);
const EXPECTED_TWO = parseInt(process.env.COWORK_TEST_EXPECTED_TWO || '2', 10);
const EXPECTED_MIN_PERCENT = parseInt(
  process.env.COWORK_TEST_EXPECTED_MIN_PERCENT || '0',
  10
);
const EXPECTED_MAX_PERCENT = parseInt(
  process.env.COWORK_TEST_EXPECTED_MAX_PERCENT || '100',
  10
);
const EXPECTED_MESSAGE_COUNT = parseInt(
  process.env.COWORK_TEST_EXPECTED_MESSAGE_COUNT || '2',
  10
);
const EXPECTED_TOOL_COUNT = parseInt(
  process.env.COWORK_TEST_EXPECTED_TOOL_COUNT || '1',
  10
);
const HISTORY_COUNT = parseInt(
  process.env.COWORK_TEST_PERMISSION_HISTORY_COUNT || '1',
  10
);
const EXPECTED_TRUE =
  (process.env.COWORK_TEST_EXPECTED_TRUE || 'true').toLowerCase() === 'true';
const EXPECTED_FALSE =
  (process.env.COWORK_TEST_EXPECTED_FALSE || 'false').toLowerCase() === 'true';

const USER_MESSAGE = process.env.COWORK_TEST_USER_MESSAGE || 'hello from user';
const ASSISTANT_MESSAGE =
  process.env.COWORK_TEST_ASSISTANT_MESSAGE || 'assistant reply';
const TOOL_NAME = process.env.COWORK_TEST_TOOL_NAME || 'Read';
const TOOL_RESULT = process.env.COWORK_TEST_TOOL_RESULT || 'done';

const WORKSPACE_PATH = process.env.COWORK_TEST_WORKSPACE_PATH || '/tmp/project-alpha';
const SESSION_ID_NEW = process.env.COWORK_TEST_SESSION_ID_NEW || 'session-new';
const SESSION_ID_OLD = process.env.COWORK_TEST_SESSION_ID_OLD || 'session-old';
const SESSION_SUMMARY_NEW =
  process.env.COWORK_TEST_SESSION_SUMMARY_NEW || 'New summary';
const SESSION_SUMMARY_OLD =
  process.env.COWORK_TEST_SESSION_SUMMARY_OLD || 'Old summary';
const SESSION_DATE_NEW =
  process.env.COWORK_TEST_SESSION_DATE_NEW || '2024-02-01T00:00:00.000Z';
const SESSION_DATE_OLD =
  process.env.COWORK_TEST_SESSION_DATE_OLD || '2024-01-01T00:00:00.000Z';

const PERMISSION_TOOL_NAME =
  process.env.COWORK_TEST_PERMISSION_TOOL_NAME || 'Write';
const PERMISSION_TOOL_USE_ID =
  process.env.COWORK_TEST_PERMISSION_TOOL_USE_ID || 'tool-use-1';
const PERMISSION_TARGET =
  process.env.COWORK_TEST_PERMISSION_TARGET || '/tmp/example.ts';
const PERMISSION_HISTORY_ID =
  process.env.COWORK_TEST_PERMISSION_HISTORY_ID || 'history-1';
const PERMISSION_TIMESTAMP =
  process.env.COWORK_TEST_PERMISSION_TIMESTAMP || '2024-03-01T00:00:00.000Z';

const SNAPSHOT_ID_NEW =
  process.env.COWORK_TEST_SNAPSHOT_ID_NEW || 'snapshot-new';
const SNAPSHOT_ID_OLD =
  process.env.COWORK_TEST_SNAPSHOT_ID_OLD || 'snapshot-old';
const SNAPSHOT_DESC_NEW =
  process.env.COWORK_TEST_SNAPSHOT_DESC_NEW || 'Checkpoint';
const SNAPSHOT_DESC_OLD =
  process.env.COWORK_TEST_SNAPSHOT_DESC_OLD || 'Baseline';
const SNAPSHOT_TIME_NEW =
  process.env.COWORK_TEST_SNAPSHOT_TIME_NEW || '2024-04-01T00:00:00.000Z';
const SNAPSHOT_TIME_OLD =
  process.env.COWORK_TEST_SNAPSHOT_TIME_OLD || '2024-03-01T00:00:00.000Z';
const SNAPSHOT_FILE_PATH =
  process.env.COWORK_TEST_SNAPSHOT_FILE_PATH || '/tmp/example.ts';
const SNAPSHOT_CONTENT_BEFORE =
  process.env.COWORK_TEST_SNAPSHOT_CONTENT_BEFORE || 'const value = 1;';
const SNAPSHOT_CONTENT_AFTER =
  process.env.COWORK_TEST_SNAPSHOT_CONTENT_AFTER || 'const value = 2;';
const EXPECTED_DIFF_TYPE = process.env.COWORK_TEST_EXPECTED_DIFF_TYPE || 'add';

const createMockChatIpc = (): ChatIPC & {
  trigger: (event: string, payload: unknown) => void;
  emit: jest.Mock;
} => {
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

  return { emit, on, off, trigger };
};

const createMockWorkspaceIpc = (): WorkspaceIPC & {
  trigger: (event: string, payload: unknown) => void;
  emit: jest.Mock;
  request: WorkspaceIPC['request'];
} => {
  const handlers = new Map<string, Set<Handler>>();
  const emit = jest.fn<ReturnType<WorkspaceIPC['emit']>, Parameters<WorkspaceIPC['emit']>>(
    () => Promise.resolve()
  );
  const request: WorkspaceIPC['request'] = jest.fn(() =>
    Promise.resolve({
      sessions: [
        {
          id: SESSION_ID_NEW,
          summary: SESSION_SUMMARY_NEW,
          messageCount: EXPECTED_MESSAGE_COUNT,
          updatedAt: SESSION_DATE_NEW,
        },
        {
          id: SESSION_ID_OLD,
          summary: SESSION_SUMMARY_OLD,
          messageCount: EXPECTED_ONE,
          updatedAt: SESSION_DATE_OLD,
        },
      ],
    })
  ) as WorkspaceIPC['request'];

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

  return { emit, request, on, off, trigger };
};

const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
};

describe('Phase 2 end-to-end validation', () => {
  it('covers chat flow, tool use display, and message emit payload', async () => {
    const ipc = createMockChatIpc();
    const store = createChatStore(ipc);
    const [messages] = store.messages;
    const [toolUses] = store.toolUses;

    ipc.trigger('display_message', { message: ASSISTANT_MESSAGE, role: 'assistant' });
    ipc.trigger('display_tool_use', { tool: TOOL_NAME, args: { path: SNAPSHOT_FILE_PATH } });
    ipc.trigger('display_tool_result', { tool: TOOL_NAME, result: TOOL_RESULT });

    expect(messages()).toHaveLength(EXPECTED_ONE);
    expect(messages()[INDEX_FIRST].content).toBe(ASSISTANT_MESSAGE);
    expect(toolUses()).toHaveLength(EXPECTED_TOOL_COUNT);
    expect(toolUses()[INDEX_FIRST].result).toBe(TOOL_RESULT);

    await store.sendMessage(USER_MESSAGE);
    expect(ipc.emit).toHaveBeenCalledWith('user_message', { message: USER_MESSAGE });
  });

  it('covers workspace switching and session history loading', async () => {
    const ipc = createMockWorkspaceIpc();
    const storage = createMemoryStorage();
    const store = createWorkspaceStore(ipc, storage);
    const [sessionHistory] = store.sessionHistory;

    const workspace = await store.createWorkspace(WORKSPACE_PATH);

    expect(ipc.emit).toHaveBeenCalledWith(
      WORKSPACE_EVENTS.switchWorkspace,
      expect.objectContaining({
        id: workspace.id,
        path: WORKSPACE_PATH,
      })
    );
    expect(ipc.request as jest.Mock).toHaveBeenCalledWith(
      WORKSPACE_EVENTS.loadSessionHistory,
      { workspaceId: workspace.id }
    );
    expect(sessionHistory()).toHaveLength(EXPECTED_TWO);
    expect(sessionHistory()[INDEX_FIRST].id).toBe(SESSION_ID_NEW);
    expect(sessionHistory()[INDEX_SECOND].id).toBe(SESSION_ID_OLD);
  });

  it('covers permission prompt response and history update', () => {
    const config = getPermissionModalConfig();
    const mapped = mapPermissionRequest({
      toolName: PERMISSION_TOOL_NAME,
      toolUseID: PERMISSION_TOOL_USE_ID,
      input: { path: PERMISSION_TARGET },
    });
    const response = buildPermissionResponse(PERMISSION_TOOL_USE_ID, 'allow', config);

    expect(response.approved).toBe(EXPECTED_TRUE);
    expect(response.remember).toBe(EXPECTED_FALSE);
    expect(mapped.toolName).toBe(PERMISSION_TOOL_NAME);

    const entry: PermissionHistoryEntry = {
      id: PERMISSION_HISTORY_ID,
      toolName: mapped.toolName,
      decision: 'allow',
      timestamp: new Date(PERMISSION_TIMESTAMP),
    };
    const history = appendHistoryEntry([], entry);
    expect(history).toHaveLength(HISTORY_COUNT);
    expect(history[INDEX_FIRST].toolName).toBe(PERMISSION_TOOL_NAME);
  });

  it('covers checkpoint snapshots with diff preview data', () => {
    const payloads: RewindSnapshotPayload[] = [
      {
        id: SNAPSHOT_ID_OLD,
        timestamp: SNAPSHOT_TIME_OLD,
        description: SNAPSHOT_DESC_OLD,
        files: [
          {
            path: SNAPSHOT_FILE_PATH,
            originalContent: SNAPSHOT_CONTENT_BEFORE,
            modifiedContent: SNAPSHOT_CONTENT_AFTER,
          },
        ],
      },
      {
        id: SNAPSHOT_ID_NEW,
        timestamp: SNAPSHOT_TIME_NEW,
        description: SNAPSHOT_DESC_NEW,
        files: [
          {
            path: SNAPSHOT_FILE_PATH,
            originalContent: SNAPSHOT_CONTENT_BEFORE,
            modifiedContent: SNAPSHOT_CONTENT_AFTER,
          },
        ],
      },
    ];

    const snapshots = normalizeSnapshots(payloads);
    const markers = buildTimelineMarkers(snapshots);
    const selected = snapshots[INDEX_FIRST];
    const file = resolveSnapshotFile(selected, SNAPSHOT_FILE_PATH);

    expect(markers).toHaveLength(EXPECTED_TWO);
    expect(Math.round(markers[INDEX_FIRST].positionPercent)).toBe(EXPECTED_MAX_PERCENT);
    expect(Math.round(markers[INDEX_SECOND].positionPercent)).toBe(EXPECTED_MIN_PERCENT);
    expect(file?.path).toBe(SNAPSHOT_FILE_PATH);

    const config = getFileDiffConfig();
    const diffLines = computeDiffLines(
      file?.originalContent ?? config.fallbackLanguage,
      file?.modifiedContent ?? config.fallbackLanguage
    );
    const hasExpectedDiff = diffLines.some((line) => line.type === EXPECTED_DIFF_TYPE);
    expect(hasExpectedDiff).toBe(EXPECTED_TRUE);
  });
});
