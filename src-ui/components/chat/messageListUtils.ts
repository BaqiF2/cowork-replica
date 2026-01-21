import type { ToolUse } from '../../stores/chatStore';
import { getEnvInt } from '../../utils/env';

export interface MessageListConfig {
  containerHeight: number;
  itemHeight: number;
  overscan: number;
  overscanMultiplier: number;
}

export interface VirtualRange {
  start: number;
  end: number;
  paddingTop: number;
  paddingBottom: number;
}

const DEFAULT_CONTAINER_HEIGHT = getEnvInt('COWORK_CHAT_CONTAINER_HEIGHT', 480);
const DEFAULT_ITEM_HEIGHT = getEnvInt('COWORK_CHAT_ITEM_HEIGHT', 28);
const DEFAULT_OVERSCAN = getEnvInt('COWORK_CHAT_OVERSCAN', 6);
const DEFAULT_OVERSCAN_MULTIPLIER = getEnvInt('COWORK_CHAT_OVERSCAN_MULTIPLIER', 2);

export const getMessageListConfig = (): MessageListConfig => ({
  containerHeight: DEFAULT_CONTAINER_HEIGHT,
  itemHeight: DEFAULT_ITEM_HEIGHT,
  overscan: DEFAULT_OVERSCAN,
  overscanMultiplier: DEFAULT_OVERSCAN_MULTIPLIER,
});

export const calculateVisibleRange = (
  total: number,
  scrollTop: number,
  viewportHeight: number,
  config: MessageListConfig = getMessageListConfig()
): VirtualRange => {
  const itemHeight = config.itemHeight;
  const itemsPerViewport = Math.ceil(viewportHeight / itemHeight);
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / itemHeight) - config.overscan
  );
  const visibleCount = itemsPerViewport + config.overscan * config.overscanMultiplier;
  const endIndex = Math.min(total, startIndex + visibleCount);

  return {
    start: startIndex,
    end: endIndex,
    paddingTop: startIndex * itemHeight,
    paddingBottom: Math.max(0, (total - endIndex) * itemHeight),
  };
};

export const groupToolUsesByMessageId = (
  toolUses: ToolUse[]
): Record<string, ToolUse[]> => {
  const grouped: Record<string, ToolUse[]> = {};
  for (const toolUse of toolUses) {
    if (!toolUse.messageId) {
      continue;
    }
    if (!grouped[toolUse.messageId]) {
      grouped[toolUse.messageId] = [];
    }
    grouped[toolUse.messageId].push(toolUse);
  }
  return grouped;
};
