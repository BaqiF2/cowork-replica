import { getEnv, getEnvInt } from '../../utils/env';

export interface ThinkingIndicatorConfig {
  maxLines: number;
  idleLabel: string;
}

const MAX_LINES = getEnvInt('COWORK_CHAT_THINKING_MAX_LINES', 3);
const IDLE_LABEL = getEnv('COWORK_CHAT_THINKING_IDLE_LABEL', 'Thinking...');

export const getThinkingIndicatorConfig = (): ThinkingIndicatorConfig => ({
  maxLines: MAX_LINES,
  idleLabel: IDLE_LABEL,
});

export const trimLines = (value: string, maxLines: number): string => {
  const lines = value.split('\n');
  if (lines.length <= maxLines) {
    return value;
  }
  return lines.slice(0, maxLines).join('\n');
};

export const shouldShowThinking = (
  isComputing: boolean,
  content: string | null | undefined,
  config: ThinkingIndicatorConfig = getThinkingIndicatorConfig()
): boolean => {
  if (content && content.trim().length > 0) {
    return true;
  }
  return isComputing && config.idleLabel.length > 0;
};
