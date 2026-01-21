import type { SessionSummary } from '../../stores/workspaceStore';
import { getEnv, getEnvInt } from '../../utils/env';

export interface SessionHistoryConfig {
  minSearchLength: number;
  maxSummaryLength: number;
  truncateSuffix: string;
  emptyLabel: string;
  messageLabelSingle: string;
  messageLabelPlural: string;
}

const MIN_SEARCH_LENGTH = getEnvInt('COWORK_SESSION_HISTORY_MIN_SEARCH_LENGTH', 1);
const MAX_SUMMARY_LENGTH = getEnvInt('COWORK_SESSION_HISTORY_MAX_SUMMARY_LENGTH', 64);
const TRUNCATE_SUFFIX = getEnv('COWORK_SESSION_HISTORY_TRUNCATE_SUFFIX', '...');
const EMPTY_LABEL = getEnv('COWORK_SESSION_HISTORY_EMPTY_LABEL', 'No sessions');
const MESSAGE_LABEL_SINGLE = getEnv('COWORK_SESSION_HISTORY_MESSAGE_LABEL_SINGLE', 'message');
const MESSAGE_LABEL_PLURAL = getEnv('COWORK_SESSION_HISTORY_MESSAGE_LABEL_PLURAL', 'messages');
const INDEX_START = getEnvInt('COWORK_SESSION_HISTORY_INDEX_START', 0);
const SINGLE_MESSAGE_COUNT = getEnvInt('COWORK_SESSION_HISTORY_SINGLE_MESSAGE_COUNT', 1);

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export const getSessionHistoryConfig = (): SessionHistoryConfig => ({
  minSearchLength: MIN_SEARCH_LENGTH,
  maxSummaryLength: MAX_SUMMARY_LENGTH,
  truncateSuffix: TRUNCATE_SUFFIX,
  emptyLabel: EMPTY_LABEL,
  messageLabelSingle: MESSAGE_LABEL_SINGLE,
  messageLabelPlural: MESSAGE_LABEL_PLURAL,
});

export const sortSessionHistory = (sessions: SessionSummary[]): SessionSummary[] =>
  [...sessions].sort(
    (left, right) => right.updatedAt.getTime() - left.updatedAt.getTime()
  );

export const formatSessionSummary = (
  session: SessionSummary,
  config: SessionHistoryConfig = getSessionHistoryConfig()
): string => {
  if (session.summary.length <= config.maxSummaryLength) {
    return session.summary;
  }
  return `${session.summary.slice(INDEX_START, config.maxSummaryLength)}${
    config.truncateSuffix
  }`;
};

export const formatMessageCount = (
  count: number,
  config: SessionHistoryConfig = getSessionHistoryConfig()
): string => {
  const label =
    count === SINGLE_MESSAGE_COUNT
      ? config.messageLabelSingle
      : config.messageLabelPlural;
  return `${count} ${label}`;
};

export const formatSessionTimestamp = (date: Date): string => date.toLocaleString();

export const filterSessionHistory = (
  sessions: SessionSummary[],
  query: string,
  config: SessionHistoryConfig = getSessionHistoryConfig()
): SessionSummary[] => {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < config.minSearchLength) {
    return sessions;
  }
  return sessions.filter((session) =>
    session.summary.toLowerCase().includes(normalized)
  );
};
