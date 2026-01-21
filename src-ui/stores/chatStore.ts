import { createSignal, type Signal } from 'solid-js';
import { ipcService } from '../services/ipcService';
import { getMockIpcService, isTauriContext } from '../services/mockIpcService';
import { getEnvInt } from '../utils/env';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ToolUse {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  timestamp: Date;
  messageId?: string;
  status?: 'pending' | 'running' | 'success' | 'error';
  result?: string;
}

export interface ChatIPC {
  on<T = unknown>(event: string, handler: (payload: T) => void): void;
  off<T = unknown>(event: string, handler: (payload: T) => void): void;
  emit(event: string, payload: unknown): Promise<void>;
}

export interface ChatStore {
  messages: Signal<Message[]>;
  toolUses: Signal<ToolUse[]>;
  isComputing: Signal<boolean>;
  currentThinking: Signal<string | null>;
  sendMessage(message: string): Promise<void>;
  interrupt(): Promise<void>;
  getMessagesPage(page: number, pageSize?: number): Message[];
  dispose(): void;
}

const DEFAULT_PAGE_SIZE = getEnvInt('COWORK_CHAT_PAGE_SIZE', 50);
const MAX_MESSAGES = getEnvInt('COWORK_CHAT_MAX_MESSAGES', 500);
const MAX_TOOL_USES = getEnvInt('COWORK_CHAT_MAX_TOOL_USES', 500);

const EVENT_DISPLAY_MESSAGE = 'display_message';
const EVENT_DISPLAY_TOOL_USE = 'display_tool_use';
const EVENT_DISPLAY_COMPUTING = 'display_computing';
const EVENT_STOP_COMPUTING = 'stop_computing';
const EVENT_DISPLAY_THINKING = 'display_thinking';
const EVENT_DISPLAY_TOOL_RESULT = 'display_tool_result';
const EVENT_USER_MESSAGE = 'user_message';
const EVENT_USER_INTERRUPT = 'user_interrupt';

const createMessageId = (): string => {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const appendWithLimit = <T,>(items: T[], item: T, limit: number): T[] => {
  const next = [...items, item];
  if (next.length <= limit) {
    return next;
  }
  return next.slice(next.length - limit);
};

const resolveMessageId = (items: Message[]): string | undefined => {
  if (items.length === 0) {
    return undefined;
  }
  return items[items.length - 1].id;
};

export const createChatStore = (ipc: ChatIPC): ChatStore => {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [toolUses, setToolUses] = createSignal<ToolUse[]>([]);
  const [isComputing, setIsComputing] = createSignal<boolean>(false);
  const [currentThinking, setCurrentThinking] = createSignal<string | null>(null);

  const handleDisplayMessage = (payload: { message: string; role: MessageRole }) => {
    if (!payload?.message || !payload.role) {
      return;
    }
    const entry: Message = {
      id: createMessageId(),
      role: payload.role,
      content: payload.message,
      timestamp: new Date(),
    };
    setMessages((prev) => appendWithLimit(prev, entry, MAX_MESSAGES));
  };

  const handleDisplayToolUse = (payload: { tool: string; args: Record<string, unknown> }) => {
    if (!payload?.tool) {
      return;
    }
    const entry: ToolUse = {
      id: createMessageId(),
      tool: payload.tool,
      args: payload.args ?? {},
      timestamp: new Date(),
      messageId: resolveMessageId(messages()),
      status: 'running',
    };
    setToolUses((prev) => appendWithLimit(prev, entry, MAX_TOOL_USES));
  };

  const handleDisplayComputing = () => {
    setIsComputing(true);
  };

  const handleStopComputing = () => {
    setIsComputing(false);
    setCurrentThinking(null);
  };

  const handleDisplayThinking = (payload: { content?: string }) => {
    setCurrentThinking(payload?.content ?? null);
  };

  const handleDisplayToolResult = (payload: {
    tool: string;
    result: string;
    isError?: boolean;
  }) => {
    if (!payload?.tool) {
      return;
    }
    setToolUses((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].tool === payload.tool) {
          next[i] = {
            ...next[i],
            result: payload.result,
            status: payload.isError ? 'error' : 'success',
          };
          break;
        }
      }
      return next;
    });
  };

  ipc.on(EVENT_DISPLAY_MESSAGE, handleDisplayMessage);
  ipc.on(EVENT_DISPLAY_TOOL_USE, handleDisplayToolUse);
  ipc.on(EVENT_DISPLAY_COMPUTING, handleDisplayComputing);
  ipc.on(EVENT_STOP_COMPUTING, handleStopComputing);
  ipc.on(EVENT_DISPLAY_THINKING, handleDisplayThinking);
  ipc.on(EVENT_DISPLAY_TOOL_RESULT, handleDisplayToolResult);

  const sendMessage = async (message: string): Promise<void> => {
    const entry: Message = {
      id: createMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => appendWithLimit(prev, entry, MAX_MESSAGES));
    setIsComputing(true);
    setCurrentThinking(null);
    try {
      await ipc.emit(EVENT_USER_MESSAGE, { message });
    } catch (error) {
      setIsComputing(false);
      throw error;
    }
  };

  const interrupt = async (): Promise<void> => {
    setIsComputing(false);
    setCurrentThinking(null);
    await ipc.emit(EVENT_USER_INTERRUPT, {});
  };

  const getMessagesPage = (page: number, pageSize = DEFAULT_PAGE_SIZE): Message[] => {
    const safePage = page > 0 ? page : 1;
    const safeSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
    const start = (safePage - 1) * safeSize;
    return messages().slice(start, start + safeSize);
  };

  const dispose = () => {
    ipc.off(EVENT_DISPLAY_MESSAGE, handleDisplayMessage);
    ipc.off(EVENT_DISPLAY_TOOL_USE, handleDisplayToolUse);
    ipc.off(EVENT_DISPLAY_COMPUTING, handleDisplayComputing);
    ipc.off(EVENT_STOP_COMPUTING, handleStopComputing);
    ipc.off(EVENT_DISPLAY_THINKING, handleDisplayThinking);
    ipc.off(EVENT_DISPLAY_TOOL_RESULT, handleDisplayToolResult);
  };

  return {
    messages: [messages, setMessages],
    toolUses: [toolUses, setToolUses],
    isComputing: [isComputing, setIsComputing],
    currentThinking: [currentThinking, setCurrentThinking],
    sendMessage,
    interrupt,
    getMessagesPage,
    dispose,
  };
};

/**
 * Get the appropriate IPC service based on environment
 */
function getDefaultIpc(): ChatIPC {
  if (isTauriContext()) {
    return ipcService;
  }
  console.log('[chatStore] Using mock IPC service for development mode');
  return getMockIpcService();
}

export const chatStore = createChatStore(getDefaultIpc());
