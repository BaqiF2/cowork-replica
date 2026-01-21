/**
 * Message list component with basic virtualization support.
 */

import { For, createMemo, createSignal, onMount, type Component } from 'solid-js';
import type { Message, ToolUse } from '../../stores/chatStore';
import { getMarkdownRenderer, type MarkdownRenderer } from './markdown';
import { ToolUseDisplay } from './ToolUseDisplay';
import {
  calculateVisibleRange,
  getMessageListConfig,
  groupToolUsesByMessageId,
} from './messageListUtils';

export interface MessageListProps {
  messages: Message[];
  toolUses: ToolUse[];
  containerHeight?: number;
  renderer?: MarkdownRenderer;
}

export const MessageList: Component<MessageListProps> = (props) => {
  const config = getMessageListConfig();
  const renderer = () => props.renderer ?? getMarkdownRenderer();
  const [scrollTop, setScrollTop] = createSignal(0);
  const [containerHeight, setContainerHeight] = createSignal(
    props.containerHeight ?? config.containerHeight
  );

  let containerRef: HTMLDivElement | undefined;

  const toolUsesByMessage = createMemo(() => groupToolUsesByMessageId(props.toolUses));
  const range = createMemo(() =>
    calculateVisibleRange(
      props.messages.length,
      scrollTop(),
      containerHeight(),
      config
    )
  );
  const visibleMessages = createMemo(() => {
    const { start, end } = range();
    return props.messages.slice(start, end);
  });

  const handleScroll = (event: Event) => {
    const target = event.currentTarget as HTMLDivElement;
    setScrollTop(target.scrollTop);
  };

  onMount(() => {
    if (!containerRef) {
      return;
    }
    const height = containerRef.clientHeight || config.containerHeight;
    setContainerHeight(height);
  });

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        overflow: 'auto',
        height: '100%',
        'padding-right': 'var(--spacing-sm)',
      }}
    >
      <div style={{ height: `${range().paddingTop}px` }} />
      <For each={visibleMessages()}>
        {(message) => (
          <div
            style={{
              padding: 'var(--spacing-sm) 0',
              'border-bottom': '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                'font-size': 'var(--font-size-sm)',
                color: 'var(--text-tertiary)',
                'margin-bottom': 'var(--spacing-xs)',
              }}
            >
              {message.role.toUpperCase()}
            </div>
            <div innerHTML={renderer()(message.content)} />
            <For each={toolUsesByMessage()[message.id] || []}>
              {(toolUse) => <ToolUseDisplay toolUse={toolUse} />}
            </For>
          </div>
        )}
      </For>
      <div style={{ height: `${range().paddingBottom}px` }} />
    </div>
  );
};
