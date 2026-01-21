import type { PermissionUIResult } from '../../../src/permissions/types';
import { getEnv } from '../../utils/env';

export type PermissionDecision = 'allow' | 'allow_always' | 'deny';

export interface PermissionModalConfig {
  allowOnceLabel: string;
  allowAlwaysLabel: string;
  denyLabel: string;
  deniedReason: string;
  targetFallback: string;
}

export interface PermissionRequestPayload {
  toolName: string;
  toolUseID?: string;
  input?: Record<string, unknown>;
}

export interface PermissionModalState {
  toolName: string;
  toolUseID: string | null;
  targetSummary: string;
}

const ALLOW_ONCE_LABEL = getEnv('COWORK_PERMISSION_ALLOW_ONCE_LABEL', 'Allow once');
const ALLOW_ALWAYS_LABEL = getEnv('COWORK_PERMISSION_ALLOW_ALWAYS_LABEL', 'Always allow');
const DENY_LABEL = getEnv('COWORK_PERMISSION_DENY_LABEL', 'Deny');
const DENIED_REASON = getEnv('COWORK_PERMISSION_DENIED_REASON', 'Permission denied by user');
const TARGET_FALLBACK = getEnv('COWORK_PERMISSION_TARGET_FALLBACK', 'No target provided');

export const getPermissionModalConfig = (): PermissionModalConfig => ({
  allowOnceLabel: ALLOW_ONCE_LABEL,
  allowAlwaysLabel: ALLOW_ALWAYS_LABEL,
  denyLabel: DENY_LABEL,
  deniedReason: DENIED_REASON,
  targetFallback: TARGET_FALLBACK,
});

const formatTargetSummary = (input?: Record<string, unknown>): string => {
  if (!input) {
    return getPermissionModalConfig().targetFallback;
  }
  const target = input.path ?? input.file ?? input.target ?? input.uri;
  if (typeof target === 'string' && target.length > 0) {
    return target;
  }
  return getPermissionModalConfig().targetFallback;
};

export const mapPermissionRequest = (
  payload: PermissionRequestPayload
): PermissionModalState => ({
  toolName: payload.toolName,
  toolUseID: payload.toolUseID ?? null,
  targetSummary: formatTargetSummary(payload.input),
});

export const buildPermissionResponse = (
  toolUseID: string | null,
  decision: PermissionDecision,
  config: PermissionModalConfig = getPermissionModalConfig()
): PermissionUIResult & { toolUseID?: string; remember?: boolean } => {
  if (decision === 'deny') {
    return {
      approved: false,
      reason: config.deniedReason,
      toolUseID: toolUseID ?? undefined,
    };
  }
  return {
    approved: true,
    toolUseID: toolUseID ?? undefined,
    remember: decision === 'allow_always',
  };
};
