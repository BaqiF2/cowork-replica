import type { Workspace } from '../../stores/workspaceStore';
import { getEnv, getEnvInt } from '../../utils/env';

export interface WorkspaceListConfig {
  minSearchLength: number;
  maxNameLength: number;
  truncateSuffix: string;
  emptyLabel: string;
}

const MIN_SEARCH_LENGTH = getEnvInt('COWORK_WORKSPACE_LIST_MIN_SEARCH_LENGTH', 1);
const MAX_NAME_LENGTH = getEnvInt('COWORK_WORKSPACE_LIST_MAX_NAME_LENGTH', 32);
const TRUNCATE_SUFFIX = getEnv('COWORK_WORKSPACE_LIST_TRUNCATE_SUFFIX', '...');
const EMPTY_LABEL = getEnv('COWORK_WORKSPACE_LIST_EMPTY_LABEL', 'No workspaces');
const INDEX_START = getEnvInt('COWORK_WORKSPACE_LIST_INDEX_START', 0);

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export const getWorkspaceListConfig = (): WorkspaceListConfig => ({
  minSearchLength: MIN_SEARCH_LENGTH,
  maxNameLength: MAX_NAME_LENGTH,
  truncateSuffix: TRUNCATE_SUFFIX,
  emptyLabel: EMPTY_LABEL,
});

export const formatWorkspaceName = (
  name: string,
  config: WorkspaceListConfig = getWorkspaceListConfig()
): string => {
  if (name.length <= config.maxNameLength) {
    return name;
  }
  return `${name.slice(INDEX_START, config.maxNameLength)}${config.truncateSuffix}`;
};

export const filterWorkspaces = (
  workspaces: Workspace[],
  query: string,
  config: WorkspaceListConfig = getWorkspaceListConfig()
): Workspace[] => {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < config.minSearchLength) {
    return workspaces;
  }
  return workspaces.filter((workspace) => {
    const name = workspace.name.toLowerCase();
    const path = workspace.path.toLowerCase();
    return name.includes(normalized) || path.includes(normalized);
  });
};
