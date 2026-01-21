import type { Message } from '../stores/chatStore';
import { getEnv, getEnvInt } from '../utils/env';

export interface ChatViewConfig {
  searchEnabled: boolean;
  searchPlaceholder: string;
  minSearchLength: number;
}

const SEARCH_ENABLED =
  getEnv('COWORK_CHAT_SEARCH_ENABLED', 'true').toLowerCase() === 'true';
const SEARCH_PLACEHOLDER =
  getEnv('COWORK_CHAT_SEARCH_PLACEHOLDER', 'Search messages');
const MIN_SEARCH_LENGTH = getEnvInt('COWORK_CHAT_SEARCH_MIN_LENGTH', 1);

export const getChatViewConfig = (): ChatViewConfig => ({
  searchEnabled: SEARCH_ENABLED,
  searchPlaceholder: SEARCH_PLACEHOLDER,
  minSearchLength: MIN_SEARCH_LENGTH,
});

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export const filterMessages = (messages: Message[], query: string): Message[] => {
  const config = getChatViewConfig();
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < config.minSearchLength) {
    return messages;
  }
  return messages.filter((message) =>
    message.content.toLowerCase().includes(normalized)
  );
};
