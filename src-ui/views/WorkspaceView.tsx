import { createSignal, type Component } from 'solid-js';
import { ipcService } from '../services/ipcService';
import {
  workspaceStore,
  type WorkspaceStore,
} from '../stores/workspaceStore';
import { WorkspaceList } from '../components/workspace/WorkspaceList';
import { SessionHistory } from '../components/workspace/SessionHistory';
import { selectWorkspaceDirectory } from '../components/workspace/workspaceFilePicker';
import { getWorkspaceViewConfig } from './workspaceViewUtils';
import { getEnv, getEnvInt } from '../utils/env';

export interface WorkspaceViewProps {
  store?: WorkspaceStore;
}

const RESUME_SESSION_EVENT =
  getEnv('COWORK_WORKSPACE_RESUME_SESSION_EVENT', 'resume_session');
const BORDER_WIDTH = getEnvInt('COWORK_WORKSPACE_VIEW_BORDER_WIDTH', 1);
const GRID_FRACTION = getEnvInt('COWORK_WORKSPACE_GRID_FRACTION', 1);
const GRID_TEMPLATE = `${GRID_FRACTION}fr ${GRID_FRACTION}fr`;

export const WorkspaceView: Component<WorkspaceViewProps> = (props) => {
  const store = props.store ?? workspaceStore;
  const [workspaces] = store.workspaces;
  const [currentWorkspace] = store.currentWorkspace;
  const [sessionHistory] = store.sessionHistory;
  const [searchQuery, setSearchQuery] = createSignal('');
  const [historyQuery, setHistoryQuery] = createSignal('');
  const [isSwitching, setIsSwitching] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

  const config = getWorkspaceViewConfig();

  const handleCreateWorkspace = async () => {
    setErrorMessage(null);
    const selected = await selectWorkspaceDirectory();
    if (!selected) {
      return;
    }
    setIsSwitching(true);
    try {
      await store.createWorkspace(selected);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSwitchWorkspace = async (id: string) => {
    setErrorMessage(null);
    setIsSwitching(true);
    try {
      await store.switchWorkspace(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    setErrorMessage(null);
    setIsSwitching(true);
    try {
      await ipcService.emit(RESUME_SESSION_EVENT, { sessionId: id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        'grid-template-columns': GRID_TEMPLATE,
        gap: 'var(--spacing-lg)',
        height: '100%',
      }}
    >
      <section
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
          'border-radius': 'var(--border-radius-lg)',
          'background-color': 'var(--bg-secondary)',
        }}
      >
        <header
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
          }}
        >
          <h2 style={{ margin: '0' }}>Workspaces</h2>
          <button
            type="button"
            onClick={handleCreateWorkspace}
            disabled={isSwitching()}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: `${BORDER_WIDTH}px solid var(--border-default)`,
              'border-radius': 'var(--border-radius-md)',
              'background-color': 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              cursor: 'pointer',
            }}
          >
            {config.createLabel}
          </button>
        </header>
        <WorkspaceList
          workspaces={workspaces()}
          currentWorkspaceId={currentWorkspace()?.id}
          searchQuery={searchQuery()}
          searchPlaceholder={config.searchPlaceholder}
          onSearch={setSearchQuery}
          onSwitch={handleSwitchWorkspace}
          isSwitching={isSwitching()}
        />
      </section>
      <section
        style={{
          display: 'flex',
          'flex-direction': 'column',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          border: `${BORDER_WIDTH}px solid var(--border-subtle)`,
          'border-radius': 'var(--border-radius-lg)',
          'background-color': 'var(--bg-secondary)',
        }}
      >
        <header
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
          }}
        >
          <h2 style={{ margin: '0' }}>Session History</h2>
          {isSwitching() && (
            <span style={{ color: 'var(--text-tertiary)' }}>{config.loadingLabel}</span>
          )}
        </header>
        <SessionHistory
          sessions={sessionHistory()}
          searchQuery={historyQuery()}
          searchPlaceholder={config.historySearchPlaceholder}
          onSearch={setHistoryQuery}
          onSelect={handleSelectSession}
          isSwitching={isSwitching()}
        />
        {errorMessage() && (
          <div style={{ color: 'var(--accent-error)' }}>{errorMessage()}</div>
        )}
      </section>
    </div>
  );
};
