import type { ToolUse } from '../../stores/chatStore';
import { getEnv, getEnvInt } from '../../utils/env';

export type ToolUseStatus = 'pending' | 'running' | 'success' | 'error';

export interface ToolUseDisplayItem extends ToolUse {
  status?: ToolUseStatus;
  result?: string;
}

export interface ToolUseDisplayConfig {
  maxPreviewLength: number;
  indentSize: number;
  expandedByDefault: boolean;
}

const MAX_PREVIEW_LENGTH = getEnvInt('COWORK_CHAT_TOOL_PREVIEW_LENGTH', 200);
const INDENT_SIZE = getEnvInt('COWORK_CHAT_TOOL_ARGS_INDENT', 2);
const EXPANDED_BY_DEFAULT =
  getEnv('COWORK_CHAT_TOOL_EXPANDED_DEFAULT', 'false').toLowerCase() === 'true';

export const getToolUseDisplayConfig = (): ToolUseDisplayConfig => ({
  maxPreviewLength: MAX_PREVIEW_LENGTH,
  indentSize: INDENT_SIZE,
  expandedByDefault: EXPANDED_BY_DEFAULT,
});

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
};

const formatArgs = (args: Record<string, unknown>, indent: number): string =>
  JSON.stringify(args, null, indent);

export const formatToolUseSummary = (
  toolUse: ToolUseDisplayItem,
  config: ToolUseDisplayConfig = getToolUseDisplayConfig()
): string => {
  const argsText = formatArgs(toolUse.args ?? {}, config.indentSize);
  const preview = truncate(argsText, config.maxPreviewLength);
  return `${toolUse.tool}: ${preview}`;
};

export const formatToolUseArgs = (
  toolUse: ToolUseDisplayItem,
  config: ToolUseDisplayConfig = getToolUseDisplayConfig()
): string => formatArgs(toolUse.args ?? {}, config.indentSize);
