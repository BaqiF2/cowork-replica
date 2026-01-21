import { For, Show, createMemo, createSignal, onCleanup, type Component } from 'solid-js';
import { ipcService } from '../../services/ipcService';
import type { PermissionMode } from '../../../src/permissions/PermissionManager';
import {
  addToolRule,
  appendHistoryEntry,
  buildPermissionModePayload,
  filterPermissionHistory,
  getPermissionModeLabel,
  getPermissionModeOptions,
  getPermissionSettingsConfig,
  removeToolRule,
  sortPermissionHistory,
  type PermissionDecision,
  type PermissionDecisionFilter,
  type PermissionHistoryEntry,
  type PermissionSettingsConfig,
} from './permissionSettingsUtils';
import { getEnv, getEnvInt } from '../../utils/env';

export interface PermissionSettingsProps {
  initialMode?: PermissionMode;
}

interface PermissionRequestPayload {
  toolName: string;
  toolUseID?: string;
  input?: Record<string, unknown>;
}

interface PermissionResponsePayload {
  approved: boolean;
  toolUseID?: string;
}

interface StoredHistoryEntry {
  id: string;
  toolName: string;
  decision: PermissionDecision;
  timestamp: string;
  mode?: PermissionMode;
}

interface StoredSettings {
  mode: PermissionMode;
  history: StoredHistoryEntry[];
  allowList: string[];
  denyList: string[];
}

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = getEnv('COWORK_PERMISSION_SETTINGS_STORAGE_KEY', 'cowork_permission_settings');
const HISTORY_STORAGE_ENABLED =
  getEnv('COWORK_PERMISSION_HISTORY_STORAGE_ENABLED', 'true').toLowerCase() === 'true';
const RULES_STORAGE_ENABLED =
  getEnv('COWORK_PERMISSION_RULES_STORAGE_ENABLED', 'true').toLowerCase() === 'true';
const MODE_STORAGE_ENABLED =
  getEnv('COWORK_PERMISSION_MODE_STORAGE_ENABLED', 'true').toLowerCase() === 'true';

const PERMISSION_MODE_CHANGE_EVENT = getEnv('COWORK_PERMISSION_MODE_CHANGE_EVENT', 'permission_mode_change');
const PERMISSION_MODE_INITIAL_EVENT = getEnv('COWORK_PERMISSION_MODE_INITIAL_EVENT', 'set_initial_permission_mode');
const PERMISSION_MODE_SET_EVENT = getEnv('COWORK_PERMISSION_MODE_SET_EVENT', 'set_permission_mode');
const PERMISSION_REQUEST_EVENT = getEnv('COWORK_PERMISSION_REQUEST_EVENT', 'permission_request');
const PERMISSION_RESPONSE_EVENT = getEnv('COWORK_PERMISSION_RESPONSE_EVENT', 'permission_response');
const PERMISSION_RULES_UPDATE_EVENT = getEnv('COWORK_PERMISSION_RULES_UPDATE_EVENT', 'permission_rules_update');

const GRID_FRACTION = getEnvInt('COWORK_PERMISSION_SETTINGS_GRID_FRACTION', 1);
const GRID_TEMPLATE = `${GRID_FRACTION}fr ${GRID_FRACTION}fr`;
const BORDER_WIDTH = getEnvInt('COWORK_PERMISSION_SETTINGS_BORDER_WIDTH', 1);
const INPUT_MIN_ROWS = getEnvInt('COWORK_PERMISSION_SETTINGS_INPUT_MIN_ROWS', 1);

const HISTORY_ID_RADIX = getEnvInt('COWORK_PERMISSION_HISTORY_ID_RADIX', 16);
const HISTORY_ID_SLICE_START = getEnvInt('COWORK_PERMISSION_HISTORY_ID_SLICE_START', 2);

const FILTER_ALL: PermissionDecisionFilter = 'all';

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

const createHistoryId = (): string => {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `perm_${Date.now()}_${Math.random()
    .toString(HISTORY_ID_RADIX)
    .slice(HISTORY_ID_SLICE_START)}`;
};

const serializeHistory = (entries: PermissionHistoryEntry[]): StoredHistoryEntry[] =>
  entries.map((entry) => ({
    id: entry.id,
    toolName: entry.toolName,
    decision: entry.decision,
    timestamp: entry.timestamp.toISOString(),
    mode: entry.mode,
  }));

const hydrateHistory = (entries: StoredHistoryEntry[]): PermissionHistoryEntry[] =>
  entries.map((entry) => ({
    id: entry.id,
    toolName: entry.toolName,
    decision: entry.decision,
    timestamp: new Date(entry.timestamp),
    mode: entry.mode,
  }));

const formatHistoryLabel = (entry: PermissionHistoryEntry): string =>
  `${entry.toolName} · ${entry.decision}`;

const getInitialState = (
  config: PermissionSettingsConfig,
  storage: StorageAdapter,
  initialMode?: PermissionMode
): StoredSettings => {
  const baseMode = initialMode ?? config.modeOptions[0];
  if (!MODE_STORAGE_ENABLED && !HISTORY_STORAGE_ENABLED && !RULES_STORAGE_ENABLED) {
    return {
      mode: baseMode,
      history: [],
      allowList: [],
      denyList: [],
    };
  }
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      mode: baseMode,
      history: [],
      allowList: [],
      denyList: [],
    };
  }
  try {
    const parsed = JSON.parse(raw) as StoredSettings;
    return {
      mode: parsed.mode ?? baseMode,
      history: parsed.history ?? [],
      allowList: parsed.allowList ?? [],
      denyList: parsed.denyList ?? [],
    };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return {
      mode: baseMode,
      history: [],
      allowList: [],
      denyList: [],
    };
  }
};

export const PermissionSettings: Component<PermissionSettingsProps> = (props) => {
  const storage = getDefaultStorage();
  const config = getPermissionSettingsConfig();
  const initialState = getInitialState(config, storage, props.initialMode);

  const [mode, setMode] = createSignal<PermissionMode>(initialState.mode);
  const [history, setHistory] = createSignal<PermissionHistoryEntry[]>(
    hydrateHistory(initialState.history)
  );
  const [historyQuery, setHistoryQuery] = createSignal('');
  const [historyFilter, setHistoryFilter] =
    createSignal<PermissionDecisionFilter>(FILTER_ALL);
  const [allowList, setAllowList] = createSignal<string[]>(initialState.allowList);
  const [denyList, setDenyList] = createSignal<string[]>(initialState.denyList);
  const [allowInput, setAllowInput] = createSignal('');
  const [denyInput, setDenyInput] = createSignal('');

  const pendingRequests = new Map<string, PermissionRequestPayload>();

  const persistState = (next: {
    mode?: PermissionMode;
    history?: PermissionHistoryEntry[];
    allowList?: string[];
    denyList?: string[];
  }) => {
    const current: StoredSettings = {
      mode: mode(),
      history: serializeHistory(history()),
      allowList: allowList(),
      denyList: denyList(),
    };
    const updated: StoredSettings = {
      mode: next.mode ?? current.mode,
      history: next.history ? serializeHistory(next.history) : current.history,
      allowList: next.allowList ?? current.allowList,
      denyList: next.denyList ?? current.denyList,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const updateMode = async (nextMode: PermissionMode) => {
    setMode(nextMode);
    if (MODE_STORAGE_ENABLED) {
      persistState({ mode: nextMode });
    }
    await ipcService.emit(PERMISSION_MODE_CHANGE_EVENT, buildPermissionModePayload(nextMode));
  };

  const handlePermissionRequest = (payload: PermissionRequestPayload) => {
    if (!payload?.toolName) {
      return;
    }
    if (payload.toolUseID) {
      pendingRequests.set(payload.toolUseID, payload);
    }
  };

  const handlePermissionResponse = (payload: PermissionResponsePayload) => {
    const decision: PermissionDecision = payload.approved ? 'allow' : 'deny';
    const request = payload.toolUseID ? pendingRequests.get(payload.toolUseID) : undefined;
    const toolName = request?.toolName ?? config.toolNameFallback;
    const entry: PermissionHistoryEntry = {
      id: createHistoryId(),
      toolName,
      decision,
      timestamp: new Date(),
      mode: mode(),
    };
    setHistory((prev) => {
      const next = appendHistoryEntry(prev, entry, config);
      if (HISTORY_STORAGE_ENABLED) {
        persistState({ history: next });
      }
      return next;
    });
  };

  const handleAddAllowRule = () => {
    const next = addToolRule(allowList(), allowInput(), config);
    setAllowList(next);
    setAllowInput('');
    if (RULES_STORAGE_ENABLED) {
      persistState({ allowList: next });
    }
    void ipcService.emit(PERMISSION_RULES_UPDATE_EVENT, {
      allowList: next,
      denyList: denyList(),
    });
  };

  const handleAddDenyRule = () => {
    const next = addToolRule(denyList(), denyInput(), config);
    setDenyList(next);
    setDenyInput('');
    if (RULES_STORAGE_ENABLED) {
      persistState({ denyList: next });
    }
    void ipcService.emit(PERMISSION_RULES_UPDATE_EVENT, {
      allowList: allowList(),
      denyList: next,
    });
  };

  const handleRemoveAllowRule = (value: string) => {
    const next = removeToolRule(allowList(), value);
    setAllowList(next);
    if (RULES_STORAGE_ENABLED) {
      persistState({ allowList: next });
    }
    void ipcService.emit(PERMISSION_RULES_UPDATE_EVENT, {
      allowList: next,
      denyList: denyList(),
    });
  };

  const handleRemoveDenyRule = (value: string) => {
    const next = removeToolRule(denyList(), value);
    setDenyList(next);
    if (RULES_STORAGE_ENABLED) {
      persistState({ denyList: next });
    }
    void ipcService.emit(PERMISSION_RULES_UPDATE_EVENT, {
      allowList: allowList(),
      denyList: next,
    });
  };

  const filteredHistory = createMemo(() => {
    const filtered = filterPermissionHistory(
      history(),
      historyQuery(),
      historyFilter(),
      config
    );
    return sortPermissionHistory(filtered);
  });

  const handleModeEvent = (payload: { mode: PermissionMode }) => {
    if (!payload?.mode) {
      return;
    }
    setMode(payload.mode);
    if (MODE_STORAGE_ENABLED) {
      persistState({ mode: payload.mode });
    }
  };

  ipcService.on(PERMISSION_MODE_INITIAL_EVENT, handleModeEvent);
  ipcService.on(PERMISSION_MODE_SET_EVENT, handleModeEvent);
  ipcService.on(PERMISSION_REQUEST_EVENT, handlePermissionRequest);
  ipcService.on(PERMISSION_RESPONSE_EVENT, handlePermissionResponse);

  onCleanup(() => {
    ipcService.off(PERMISSION_MODE_INITIAL_EVENT, handleModeEvent);
    ipcService.off(PERMISSION_MODE_SET_EVENT, handleModeEvent);
    ipcService.off(PERMISSION_REQUEST_EVENT, handlePermissionRequest);
    ipcService.off(PERMISSION_RESPONSE_EVENT, handlePermissionResponse);
  });

  return (
    <div
      style={{
        display: 'grid',
        'grid-template-columns': GRID_TEMPLATE,
        gap: 'var(--spacing-lg)',
      }}
    >
      <section
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
          'border-radius': 'var(--border-radius-lg)',
          'background-color': 'var(--bg-secondary)',
        }}
      >
        <header style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <h3 style={{ margin: '0' }}>Permission Mode</h3>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {getPermissionModeLabel(mode(), config)}
          </span>
        </header>
        <select
          value={mode()}
          onChange={(event) => void updateMode(event.currentTarget.value as PermissionMode)}
          style={{
            padding: 'var(--spacing-sm)',
            border: `${BORDER_WIDTH}px solid var(--border-default)`,
            'border-radius': 'var(--border-radius-md)',
            'background-color': 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
          }}
        >
          <For each={getPermissionModeOptions()}>
            {(option) => (
              <option value={option}>{getPermissionModeLabel(option, config)}</option>
            )}
          </For>
        </select>
        <div style={{ color: 'var(--text-tertiary)' }}>
          Current mode: {getPermissionModeLabel(mode(), config)}
        </div>
      </section>

      <section
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
          'border-radius': 'var(--border-radius-lg)',
          'background-color': 'var(--bg-secondary)',
        }}
      >
        <header style={{ display: 'flex', 'justify-content': 'space-between' }}>
          <h3 style={{ margin: '0' }}>Permission History</h3>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {filteredHistory().length}
          </span>
        </header>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <input
            type="search"
            value={historyQuery()}
            onInput={(event) => setHistoryQuery(event.currentTarget.value)}
            placeholder={config.historyEmptyLabel}
            style={{
              flex: '1',
              padding: 'var(--spacing-sm)',
              border: `${BORDER_WIDTH}px solid var(--border-default)`,
              'border-radius': 'var(--border-radius-md)',
              'background-color': 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={historyFilter()}
            onChange={(event) =>
              setHistoryFilter(event.currentTarget.value as PermissionDecisionFilter)
            }
            style={{
              padding: 'var(--spacing-sm)',
              border: `${BORDER_WIDTH}px solid var(--border-default)`,
              'border-radius': 'var(--border-radius-md)',
              'background-color': 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All</option>
            <option value="allow">Allowed</option>
            <option value="deny">Denied</option>
          </select>
        </div>
        <Show when={filteredHistory().length > 0} fallback={
          <div style={{ color: 'var(--text-tertiary)' }}>{config.historyEmptyLabel}</div>
        }>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-sm)' }}>
            <For each={filteredHistory()}>
              {(entry) => (
                <div
                  style={{
                    padding: 'var(--spacing-sm)',
                    border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                    'border-radius': 'var(--border-radius-md)',
                    'background-color': 'var(--bg-tertiary)',
                  }}
                >
                  <div style={{ 'font-weight': 'var(--font-weight-semibold)' }}>
                    {formatHistoryLabel(entry)}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    {entry.timestamp.toLocaleString()}
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </section>

      <section
        style={{
          display: 'grid',
          'grid-template-columns': GRID_TEMPLATE,
          gap: 'var(--spacing-lg)',
          padding: 'var(--spacing-md)',
          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
          'border-radius': 'var(--border-radius-lg)',
          'background-color': 'var(--bg-secondary)',
          'grid-column': '1 / -1',
        }}
      >
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ margin: '0' }}>Allow List</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              value={allowInput()}
              onInput={(event) => setAllowInput(event.currentTarget.value)}
              placeholder={config.ruleEmptyLabel}
              rows={INPUT_MIN_ROWS}
              style={{
                flex: '1',
                padding: 'var(--spacing-sm)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleAddAllowRule}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--accent-primary)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
          <Show when={allowList().length > 0} fallback={
            <div style={{ color: 'var(--text-tertiary)' }}>{config.ruleEmptyLabel}</div>
          }>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-xs)' }}>
              <For each={allowList()}>
                {(rule) => (
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                      'border-radius': 'var(--border-radius-md)',
                    }}
                  >
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllowRule(rule)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-error)',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ margin: '0' }}>Deny List</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              value={denyInput()}
              onInput={(event) => setDenyInput(event.currentTarget.value)}
              placeholder={config.ruleEmptyLabel}
              rows={INPUT_MIN_ROWS}
              style={{
                flex: '1',
                padding: 'var(--spacing-sm)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleAddDenyRule}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                border: `${BORDER_WIDTH}px solid var(--border-default)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--accent-error)',
                color: 'var(--text-inverse)',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>
          <Show when={denyList().length > 0} fallback={
            <div style={{ color: 'var(--text-tertiary)' }}>{config.ruleEmptyLabel}</div>
          }>
            <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--spacing-xs)' }}>
              <For each={denyList()}>
                {(rule) => (
                  <div
                    style={{
                      display: 'flex',
                      'justify-content': 'space-between',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                      'border-radius': 'var(--border-radius-md)',
                    }}
                  >
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDenyRule(rule)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-error)',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </section>
    </div>
  );
};
