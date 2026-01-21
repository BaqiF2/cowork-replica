import type { PermissionMode } from '../../../src/permissions/PermissionManager';
import { getEnv, getEnvInt } from '../../utils/env';

export type PermissionDecision = 'allow' | 'deny';
export type PermissionDecisionFilter = PermissionDecision | 'all';

export interface PermissionHistoryEntry {
  id: string;
  toolName: string;
  decision: PermissionDecision;
  timestamp: Date;
  mode?: PermissionMode;
}

export interface PermissionSettingsConfig {
  modeOptions: PermissionMode[];
  modeLabels: Record<PermissionMode, string>;
  historySearchMinLength: number;
  historyMaxEntries: number;
  historyEmptyLabel: string;
  ruleMinLength: number;
  ruleMaxLength: number;
  ruleEmptyLabel: string;
  toolNameFallback: string;
}

const MODE_DEFAULT_LABEL = getEnv('COWORK_PERMISSION_MODE_DEFAULT_LABEL', 'Default');
const MODE_ACCEPT_EDITS_LABEL = getEnv('COWORK_PERMISSION_MODE_ACCEPT_EDITS_LABEL', 'Accept edits');
const MODE_BYPASS_LABEL = getEnv('COWORK_PERMISSION_MODE_BYPASS_LABEL', 'Bypass permissions');
const MODE_PLAN_LABEL = getEnv('COWORK_PERMISSION_MODE_PLAN_LABEL', 'Plan');

const HISTORY_SEARCH_MIN_LENGTH = getEnvInt('COWORK_PERMISSION_HISTORY_SEARCH_MIN_LENGTH', 1);
const HISTORY_MAX_ENTRIES = getEnvInt('COWORK_PERMISSION_HISTORY_MAX_ENTRIES', 200);
const HISTORY_EMPTY_LABEL = getEnv('COWORK_PERMISSION_HISTORY_EMPTY_LABEL', 'No permission history');

const RULE_MIN_LENGTH = getEnvInt('COWORK_PERMISSION_RULE_MIN_LENGTH', 2);
const RULE_MAX_LENGTH = getEnvInt('COWORK_PERMISSION_RULE_MAX_LENGTH', 128);
const RULE_EMPTY_LABEL = getEnv('COWORK_PERMISSION_RULE_EMPTY_LABEL', 'No rules configured');
const TOOL_NAME_FALLBACK = getEnv('COWORK_PERMISSION_TOOL_NAME_FALLBACK', 'Unknown tool');

const INDEX_START = getEnvInt('COWORK_PERMISSION_INDEX_START', 0);

const MODE_OPTIONS: PermissionMode[] = [
  'default',
  'acceptEdits',
  'bypassPermissions',
  'plan',
];

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export const getPermissionModeOptions = (): PermissionMode[] => [...MODE_OPTIONS];

export const getPermissionSettingsConfig = (): PermissionSettingsConfig => ({
  modeOptions: getPermissionModeOptions(),
  modeLabels: {
    default: MODE_DEFAULT_LABEL,
    acceptEdits: MODE_ACCEPT_EDITS_LABEL,
    bypassPermissions: MODE_BYPASS_LABEL,
    plan: MODE_PLAN_LABEL,
  },
  historySearchMinLength: HISTORY_SEARCH_MIN_LENGTH,
  historyMaxEntries: HISTORY_MAX_ENTRIES,
  historyEmptyLabel: HISTORY_EMPTY_LABEL,
  ruleMinLength: RULE_MIN_LENGTH,
  ruleMaxLength: RULE_MAX_LENGTH,
  ruleEmptyLabel: RULE_EMPTY_LABEL,
  toolNameFallback: TOOL_NAME_FALLBACK,
});

export const getPermissionModeLabel = (
  mode: PermissionMode,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): string => config.modeLabels[mode] ?? mode;

export const isValidPermissionMode = (
  mode: PermissionMode,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): boolean => config.modeOptions.includes(mode);

export const buildPermissionModePayload = (mode: PermissionMode): { mode: PermissionMode } => ({
  mode,
});

export const sortPermissionHistory = (
  entries: PermissionHistoryEntry[]
): PermissionHistoryEntry[] =>
  [...entries].sort(
    (left, right) => right.timestamp.getTime() - left.timestamp.getTime()
  );

export const filterPermissionHistory = (
  entries: PermissionHistoryEntry[],
  query: string,
  decisionFilter: PermissionDecisionFilter,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): PermissionHistoryEntry[] => {
  const normalized = normalizeQuery(query);
  const byDecision =
    decisionFilter === 'all'
      ? entries
      : entries.filter((entry) => entry.decision === decisionFilter);
  if (!normalized || normalized.length < config.historySearchMinLength) {
    return byDecision;
  }
  return byDecision.filter((entry) =>
    entry.toolName.toLowerCase().includes(normalized)
  );
};

export const appendHistoryEntry = (
  entries: PermissionHistoryEntry[],
  entry: PermissionHistoryEntry,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): PermissionHistoryEntry[] => {
  const combined = sortPermissionHistory([...entries, entry]);
  return combined.slice(INDEX_START, config.historyMaxEntries);
};

export const normalizeRuleInput = (
  value: string,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): string | null => {
  const trimmed = value.trim();
  if (trimmed.length < config.ruleMinLength) {
    return null;
  }
  if (trimmed.length > config.ruleMaxLength) {
    return trimmed.slice(INDEX_START, config.ruleMaxLength);
  }
  return trimmed;
};

export const addToolRule = (
  rules: string[],
  value: string,
  config: PermissionSettingsConfig = getPermissionSettingsConfig()
): string[] => {
  const normalized = normalizeRuleInput(value, config);
  if (!normalized) {
    return rules;
  }
  if (rules.includes(normalized)) {
    return rules;
  }
  return [...rules, normalized];
};

export const removeToolRule = (rules: string[], value: string): string[] =>
  rules.filter((rule) => rule !== value);
