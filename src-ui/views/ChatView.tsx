/**
 * Chat view container.
 */

import { createMemo, createSignal, type Component } from 'solid-js';
import { chatStore, type ChatStore } from '../stores/chatStore';
import { InputBox } from '../components/chat/InputBox';
import { MessageList } from '../components/chat/MessageList';
import { ThinkingIndicator } from '../components/chat/ThinkingIndicator';
import { getMarkdownRenderer } from '../components/chat/markdown';
import { filterMessages, getChatViewConfig } from './chatViewUtils';

export interface ChatViewProps {
  store?: ChatStore;
}

export const ChatView: Component<ChatViewProps> = (props) => {
  const store = props.store ?? chatStore;
  const [messages] = store.messages;
  const [toolUses] = store.toolUses;
  const [isComputing] = store.isComputing;
  const [currentThinking] = store.currentThinking;
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredMessages = createMemo(() => filterMessages(messages(), searchQuery()));
  const renderer = () => getMarkdownRenderer();

  const handleSend = async (message: string) => {
    await store.sendMessage(message);
  };

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--spacing-md)',
        height: '100%',
      }}
    >
      {getChatViewConfig().searchEnabled && (
        <input
          type="search"
          value={searchQuery()}
          onInput={(event) => setSearchQuery(event.currentTarget.value)}
          placeholder={getChatViewConfig().searchPlaceholder}
          style={{
            padding: 'var(--spacing-sm)',
            border: '1px solid var(--border-default)',
            'border-radius': 'var(--border-radius-md)',
            'background-color': 'var(--bg-secondary)',
            color: 'var(--text-primary)',
          }}
        />
      )}
      <ThinkingIndicator
        isComputing={isComputing()}
        content={currentThinking()}
      />
      <div style={{ flex: '1', overflow: 'hidden' }}>
        <MessageList
          messages={filteredMessages()}
          toolUses={toolUses()}
          renderer={renderer()}
        />
      </div>
      <InputBox onSend={handleSend} disabled={isComputing()} />
    </div>
  );
};
