import { For, createMemo, type Component } from 'solid-js';
import type { Workspace } from '../../stores/workspaceStore';
import {
  filterWorkspaces,
  formatWorkspaceName,
  getWorkspaceListConfig,
} from './workspaceListUtils';
import { getEnvInt } from '../../utils/env';

export interface WorkspaceListProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string | null;
  searchQuery: string;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  onSwitch: (id: string) => void;
  isSwitching?: boolean;
}

const BORDER_WIDTH = getEnvInt('COWORK_WORKSPACE_LIST_BORDER_WIDTH', 1);
const OPACITY_DIMMED = getEnvInt('COWORK_WORKSPACE_LIST_OPACITY_DIMMED', 6);
const OPACITY_DIVISOR = getEnvInt('COWORK_WORKSPACE_LIST_OPACITY_DIVISOR', 10);
const OPACITY_FULL = getEnvInt('COWORK_WORKSPACE_LIST_OPACITY_FULL', 1);

export const WorkspaceList: Component<WorkspaceListProps> = (props) => {
  const config = getWorkspaceListConfig();
  const filtered = createMemo(() =>
    filterWorkspaces(props.workspaces, props.searchQuery, config)
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
          {(workspace) => (
            <button
              type="button"
              onClick={() => props.onSwitch(workspace.id)}
              style={{
                padding: 'var(--spacing-sm)',
                border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
                'border-radius': 'var(--border-radius-md)',
                'background-color':
                  workspace.id === props.currentWorkspaceId
                    ? 'var(--bg-tertiary)'
                    : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                'text-align': 'left',
              }}
            >
              <div style={{ 'font-weight': 'var(--font-weight-semibold)' }}>
                {formatWorkspaceName(workspace.name, config)}
              </div>
              <div style={{ color: 'var(--text-tertiary)' }}>{workspace.path}</div>
            </button>
          )}
        </For>
      )}
    </div>
  );
};
