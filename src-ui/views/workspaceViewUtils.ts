import { getEnv, getEnvInt } from '../utils/env';

export interface WorkspaceViewConfig {
  searchPlaceholder: string;
  historySearchPlaceholder: string;
  createLabel: string;
  loadingLabel: string;
  selectionIndex: number;
  pickerTitle: string;
}

const SEARCH_PLACEHOLDER = getEnv('COWORK_WORKSPACE_SEARCH_PLACEHOLDER', 'Search workspaces');
const HISTORY_SEARCH_PLACEHOLDER =
  getEnv('COWORK_WORKSPACE_HISTORY_SEARCH_PLACEHOLDER', 'Search sessions');
const CREATE_LABEL = getEnv('COWORK_WORKSPACE_CREATE_LABEL', 'New workspace');
const LOADING_LABEL = getEnv('COWORK_WORKSPACE_LOADING_LABEL', 'Switching...');
const SELECTION_INDEX = getEnvInt('COWORK_WORKSPACE_SELECTION_INDEX', 0);
const PICKER_TITLE = getEnv('COWORK_WORKSPACE_PICKER_TITLE', 'Select workspace folder');

export const getWorkspaceViewConfig = (): WorkspaceViewConfig => ({
  searchPlaceholder: SEARCH_PLACEHOLDER,
  historySearchPlaceholder: HISTORY_SEARCH_PLACEHOLDER,
  createLabel: CREATE_LABEL,
  loadingLabel: LOADING_LABEL,
  selectionIndex: SELECTION_INDEX,
  pickerTitle: PICKER_TITLE,
});

export const normalizeWorkspaceSelection = (
  selection: string | string[] | null,
  config: WorkspaceViewConfig = getWorkspaceViewConfig()
): string | null => {
  if (!selection) {
    return null;
  }
  if (Array.isArray(selection)) {
    return selection[config.selectionIndex] ?? null;
  }
  return selection;
};
