/**
 * ChatView Tests
 *
 * Tests for chat UI helpers:
 * - Message list virtualization
 * - Input submit shortcut
 * - Tool use display formatting
 * - Thinking indicator visibility
 * - Message search filtering
 *
 * _Requirements: chat UI_
 * _TaskGroup: 2_
 */

import {
  calculateVisibleRange,
  getMessageListConfig,
} from '../../components/chat/messageListUtils';
import {
  getInputBoxConfig,
  isSubmitShortcut,
} from '../../components/chat/inputBoxUtils';
import {
  formatToolUseSummary,
  getToolUseDisplayConfig,
} from '../../components/chat/toolUseDisplayUtils';
import {
  getThinkingIndicatorConfig,
  shouldShowThinking,
} from '../../components/chat/thinkingIndicatorUtils';
import { filterMessages } from '../chatViewUtils';
import type { Message, ToolUse } from '../../stores/chatStore';

const MIN_INDEX = parseInt(process.env.COWORK_TEST_MIN_INDEX || '0', 10);
const SCROLL_ROWS = parseInt(process.env.COWORK_TEST_SCROLL_ROWS || '4', 10);
const VIEWPORT_ROWS = parseInt(process.env.COWORK_TEST_VIEWPORT_ROWS || '6', 10);
const TOTAL_MESSAGES = parseInt(process.env.COWORK_TEST_TOTAL_MESSAGES || '50', 10);
const EXPECTED_SINGLE_RESULT = parseInt(
  process.env.COWORK_TEST_EXPECTED_SINGLE_RESULT || '1',
  10
);

describe('ChatView helpers', () => {
  it('should calculate virtual range within bounds', () => {
    const config = getMessageListConfig();
    const scrollTop = config.itemHeight * SCROLL_ROWS;
    const viewportHeight = config.itemHeight * VIEWPORT_ROWS;

    const range = calculateVisibleRange(
      TOTAL_MESSAGES,
      scrollTop,
      viewportHeight,
      config
    );

    expect(range.start).toBeGreaterThanOrEqual(MIN_INDEX);
    expect(range.end).toBeGreaterThan(range.start);
    expect(range.end).toBeLessThanOrEqual(TOTAL_MESSAGES);
  });

  it('should detect submit shortcut', () => {
    const config = getInputBoxConfig();
    const state = {
      key: config.submitKey,
      metaKey: config.submitOnMeta,
      ctrlKey: !config.submitOnMeta && config.submitOnCtrl,
      shiftKey: false,
      altKey: false,
    };

    expect(isSubmitShortcut(state, config)).toBe(true);
  });

  it('should format tool use summary', () => {
    const config = getToolUseDisplayConfig();
    const toolUse: ToolUse = {
      id: 'tool-1',
      tool: 'Read',
      args: { path: '/tmp/example.txt' },
      timestamp: new Date(),
    };

    const summary = formatToolUseSummary(toolUse, config);
    expect(summary).toContain(toolUse.tool);
  });

  it('should show thinking indicator when computing', () => {
    const config = getThinkingIndicatorConfig();
    const visible = shouldShowThinking(true, null, config);
    expect(visible).toBe(true);
  });

  it('should filter messages by search query', () => {
    const messages: Message[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'alpha beta',
        timestamp: new Date(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'gamma delta',
        timestamp: new Date(),
      },
    ];

    const results = filterMessages(messages, 'alpha');
    expect(results).toHaveLength(EXPECTED_SINGLE_RESULT);
    expect(results[0].id).toBe('msg-1');
  });
});
