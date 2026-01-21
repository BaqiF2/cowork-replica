import { For, createMemo, type Component } from 'solid-js';
import type { SessionSummary } from '../../stores/workspaceStore';
import {
  filterSessionHistory,
  formatMessageCount,
  formatSessionSummary,
  formatSessionTimestamp,
  getSessionHistoryConfig,
  sortSessionHistory,
} from './sessionHistoryUtils';
import { getEnvInt } from '../../utils/env';

export interface SessionHistoryProps {
  sessions: SessionSummary[];
  searchQuery: string;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  isSwitching?: boolean;
}

const BORDER_WIDTH = getEnvInt('COWORK_SESSION_HISTORY_BORDER_WIDTH', 1);
const OPACITY_DIMMED = getEnvInt('COWORK_SESSION_HISTORY_OPACITY_DIMMED', 6);
const OPACITY_DIVISOR = getEnvInt('COWORK_SESSION_HISTORY_OPACITY_DIVISOR', 10);
const OPACITY_FULL = getEnvInt('COWORK_SESSION_HISTORY_OPACITY_FULL', 1);

export const SessionHistory: Component<SessionHistoryProps> = (props) => {
  const config = getSessionHistoryConfig();
  const filtered = createMemo(() =>
    sortSessionHistory(filterSessionHistory(props.sessions, props.searchQuery, config))
  );

  const isDimmed = () => {
    if (!props.isSwitching) {
      return false;
    }
    return true;
  };

  const dimmedOpacity = () => OPACITY_DIMMED / OPACITY_DIVISOR;

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        gap: 'var(--spacing-sm)',
        opacity: isDimmed() ? dimmedOpacity() : OPACITY_FULL,
      }}
    >
      <input
        type="search"
        value={props.searchQuery}
        onInput={(event) => props.onSearch(event.currentTarget.value)}
        placeholder={props.searchPlaceholder ?? config.emptyLabel}
        style={{
          padding: 'var(--spacing-sm)',
          border: `${BORDER_WIDTH}px solid var(--border-default)`,
          'border-radius': 'var(--border-radius-md)',
          'background-color': 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
      />
      {filtered().length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)' }}>{config.emptyLabel}</div>
      ) : (
        <For each={filtered()}>
          {(session) => (
            <button
              type="button"
              onClick={() => props.onSelect(session.id)}
              style={{
                padding: 'var(--spacing-sm)',
                border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color': 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                'text-align': 'left',
              }}
            >
              <div style={{ 'font-weight': 'var(--font-weight-semibold)' }}>
                {formatSessionSummary(session, config)}
              </div>
              <div style={{ color: 'var(--text-tertiary)' }}>
                {formatMessageCount(session.messageCount, config)}
              </div>
              <div style={{ color: 'var(--text-tertiary)' }}>
                {formatSessionTimestamp(session.updatedAt)}
              </div>
            </button>
          )}
        </For>
      )}
    </div>
  );
};
