import { createSignal, type Signal } from 'solid-js';
import { ipcService } from '../services/ipcService';
import { getEnv, getEnvInt } from '../utils/env';

export interface Workspace {
  id: string;
  path: string;
  name: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface SessionSummary {
  id: string;
  summary: string;
  messageCount: number;
  updatedAt: Date;
}

export interface WorkspaceIPC {
  on<T = unknown>(event: string, handler: (payload: T) => void): void;
  off<T = unknown>(event: string, handler: (payload: T) => void): void;
  emit(event: string, payload: unknown): Promise<void>;
  request<T = unknown>(event: string, payload: unknown): Promise<T>;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface WorkspaceStore {
  workspaces: Signal<Workspace[]>;
  currentWorkspace: Signal<Workspace | null>;
  sessionHistory: Signal<SessionSummary[]>;
  createWorkspace(path: string): Promise<Workspace>;
  switchWorkspace(id: string): Promise<void>;
  loadSessionHistory(workspaceId?: string): Promise<void>;
  searchWorkspaces(query: string): Workspace[];
  dispose(): void;
}

export const WORKSPACE_EVENTS = {
  switchWorkspace: 'switch_workspace',
  loadSessionHistory: 'load_session_history',
  sessionHistory: 'session_history',
};

interface StoredWorkspace {
  id: string;
  path: string;
  name: string;
  createdAt: string;
  lastAccessedAt: string;
}

interface StoredState {
  workspaces: StoredWorkspace[];
  currentWorkspaceId: string | null;
}

interface SessionHistoryPayload {
  sessions: Array<{
    id: string;
    summary: string;
    messageCount?: number;
    updatedAt?: string | Date;
  }>;
}

const STORAGE_KEY = getEnv('COWORK_WORKSPACE_STORAGE_KEY', 'cowork_workspace_state');
const DEFAULT_MESSAGE_COUNT = getEnvInt('COWORK_WORKSPACE_DEFAULT_MESSAGE_COUNT', 0);
const NAME_SEGMENT_OFFSET = getEnvInt('COWORK_WORKSPACE_NAME_SEGMENT_OFFSET', 1);
const WORKSPACE_SEARCH_MIN_LENGTH = getEnvInt('COWORK_WORKSPACE_SEARCH_MIN_LENGTH', 1);
const SESSION_HISTORY_MIN_ENTRIES = getEnvInt('COWORK_WORKSPACE_SESSION_HISTORY_MIN_ENTRIES', 1);

const createMemoryStorage = (): StorageAdapter => {
  const storage = new Map<string, string>();
  return {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.delete(key);
    },
  };
};

const getDefaultStorage = (): StorageAdapter => {
  const globalWindow = typeof globalThis !== 'undefined' ? globalThis : {};
  const candidate = (globalWindow as { localStorage?: StorageAdapter }).localStorage;
  if (candidate?.getItem) {
    return candidate;
  }
  return createMemoryStorage();
};

const createWorkspaceId = (): string => {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  const idRadix = getEnvInt('COWORK_WORKSPACE_ID_RADIX', 16);
  const sliceStart = getEnvInt('COWORK_WORKSPACE_ID_SLICE_START', 2);
  return `ws_${Date.now()}_${Math.random().toString(idRadix).slice(sliceStart)}`;
};

const resolveWorkspaceName = (path: string): string => {
  const segments = path.split(/[/\\]/).filter(Boolean);
  if (segments.length < NAME_SEGMENT_OFFSET) {
    return path;
  }
  return segments[segments.length - NAME_SEGMENT_OFFSET] ?? path;
};

const serializeWorkspace = (workspace: Workspace): StoredWorkspace => ({
  id: workspace.id,
  path: workspace.path,
  name: workspace.name,
  createdAt: workspace.createdAt.toISOString(),
  lastAccessedAt: workspace.lastAccessedAt.toISOString(),
});

const hydrateWorkspace = (stored: StoredWorkspace): Workspace => ({
  id: stored.id,
  path: stored.path,
  name: stored.name,
  createdAt: new Date(stored.createdAt),
  lastAccessedAt: new Date(stored.lastAccessedAt),
});

const normalizeSessionHistory = (payload: SessionHistoryPayload): SessionSummary[] => {
  const sessions = payload.sessions ?? [];
  const mapped = sessions.map((session) => ({
    id: session.id,
    summary: session.summary,
    messageCount: session.messageCount ?? DEFAULT_MESSAGE_COUNT,
    updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
  }));
  mapped.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return mapped;
};

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export const createWorkspaceStore = (
  ipc: WorkspaceIPC = ipcService,
  storage: StorageAdapter = getDefaultStorage()
): WorkspaceStore => {
  const [workspaces, setWorkspaces] = createSignal<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = createSignal<Workspace | null>(null);
  const [sessionHistory, setSessionHistory] = createSignal<SessionSummary[]>([]);

  const loadStoredState = (): void => {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as StoredState;
      const restored = parsed.workspaces.map(hydrateWorkspace);
      setWorkspaces(restored);
      if (parsed.currentWorkspaceId) {
        const matched = restored.find(
          (workspace) => workspace.id === parsed.currentWorkspaceId
        );
        if (matched) {
          setCurrentWorkspace(matched);
        }
      }
    } catch {
      storage.removeItem(STORAGE_KEY);
    }
  };

  const persistState = (nextWorkspaces: Workspace[], nextCurrent: Workspace | null) => {
    const state: StoredState = {
      workspaces: nextWorkspaces.map(serializeWorkspace),
      currentWorkspaceId: nextCurrent ? nextCurrent.id : null,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const handleSessionHistory = (payload: SessionHistoryPayload) => {
    if (!payload?.sessions) {
      setSessionHistory([]);
      return;
    }
    setSessionHistory(normalizeSessionHistory(payload));
  };

  ipc.on(WORKSPACE_EVENTS.sessionHistory, handleSessionHistory);

  loadStoredState();

  const createWorkspace = async (path: string): Promise<Workspace> => {
    const existing = workspaces().find((workspace) => workspace.path === path);
    if (existing) {
      await switchWorkspace(existing.id);
      return existing;
    }
    const now = new Date();
    const workspace: Workspace = {
      id: createWorkspaceId(),
      path,
      name: resolveWorkspaceName(path),
      createdAt: now,
      lastAccessedAt: now,
    };
    setWorkspaces((prev) => {
      const next = [...prev, workspace];
      persistState(next, workspace);
      return next;
    });
    await switchWorkspace(workspace.id);
    return workspace;
  };

  const switchWorkspace = async (id: string): Promise<void> => {
    const activeWorkspace = currentWorkspace();
    if (
      activeWorkspace?.id === id &&
      sessionHistory().length >= SESSION_HISTORY_MIN_ENTRIES
    ) {
      return;
    }
    const target = workspaces().find((workspace) => workspace.id === id);
    if (!target) {
      return;
    }
    const updated = { ...target, lastAccessedAt: new Date() };
    setWorkspaces((prev) => {
      const next = prev.map((workspace) =>
        workspace.id === id ? updated : workspace
      );
      persistState(next, updated);
      return next;
    });
    setCurrentWorkspace(updated);
    await ipc.emit(WORKSPACE_EVENTS.switchWorkspace, {
      id: updated.id,
      path: updated.path,
    });
    await loadSessionHistory(updated.id);
  };

  const loadSessionHistory = async (workspaceId?: string): Promise<void> => {
    const id = workspaceId ?? currentWorkspace()?.id;
    if (!id) {
      setSessionHistory([]);
      return;
    }
    const payload = await ipc.request<SessionHistoryPayload>(
      WORKSPACE_EVENTS.loadSessionHistory,
      { workspaceId: id }
    );
    setSessionHistory(normalizeSessionHistory(payload));
  };

  const searchWorkspaces = (query: string): Workspace[] => {
    const normalized = normalizeQuery(query);
    if (!normalized || normalized.length < WORKSPACE_SEARCH_MIN_LENGTH) {
      return workspaces();
    }
    return workspaces().filter((workspace) =>
      workspace.name.toLowerCase().includes(normalized)
    );
  };

  const dispose = () => {
    ipc.off(WORKSPACE_EVENTS.sessionHistory, handleSessionHistory);
  };

  return {
    workspaces: [workspaces, setWorkspaces],
    currentWorkspace: [currentWorkspace, setCurrentWorkspace],
    sessionHistory: [sessionHistory, setSessionHistory],
    createWorkspace,
    switchWorkspace,
    loadSessionHistory,
    searchWorkspaces,
    dispose,
  };
};

export const workspaceStore = createWorkspaceStore();
