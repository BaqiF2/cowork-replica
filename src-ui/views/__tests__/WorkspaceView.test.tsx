/**
 * WorkspaceView Tests
 *
 * Tests for workspace UI helpers:
 * - Workspace filtering
 * - Workspace selection normalization
 * - Session history sorting/filtering
 *
 * _Requirements: workspace UI_
 * _TaskGroup: 4_
 */

import type { SessionSummary, Workspace } from '../../stores/workspaceStore';
import {
  normalizeWorkspaceSelection,
  getWorkspaceViewConfig,
} from '../workspaceViewUtils';
import {
  filterWorkspaces,
  formatWorkspaceName,
  getWorkspaceListConfig,
} from '../../components/workspace/workspaceListUtils';
import {
  filterSessionHistory,
  formatSessionSummary,
  getSessionHistoryConfig,
  sortSessionHistory,
} from '../../components/workspace/sessionHistoryUtils';

const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_EXPECTED_ONE || '1', 10);
const EXPECTED_TWO = parseInt(process.env.COWORK_TEST_EXPECTED_TWO || '2', 10);
const INDEX_FIRST = parseInt(process.env.COWORK_TEST_INDEX_FIRST || '0', 10);
const INDEX_SECOND = parseInt(process.env.COWORK_TEST_INDEX_SECOND || '1', 10);
const WORKSPACE_NAME_ALPHA = process.env.COWORK_TEST_WORKSPACE_NAME_ALPHA || 'Alpha Project';
const WORKSPACE_NAME_BETA = process.env.COWORK_TEST_WORKSPACE_NAME_BETA || 'Beta Space';
const WORKSPACE_PATH_ALPHA = process.env.COWORK_TEST_WORKSPACE_PATH_ALPHA || '/tmp/alpha';
const WORKSPACE_PATH_BETA = process.env.COWORK_TEST_WORKSPACE_PATH_BETA || '/tmp/beta';
const SEARCH_QUERY_ALPHA = process.env.COWORK_TEST_SEARCH_QUERY_ALPHA || 'alpha';
const SESSION_ID_OLD = process.env.COWORK_TEST_SESSION_ID_OLD || 'session-old';
const SESSION_ID_NEW = process.env.COWORK_TEST_SESSION_ID_NEW || 'session-new';
const SESSION_SUMMARY_LONG =
  process.env.COWORK_TEST_SESSION_SUMMARY_LONG ||
  'This is a long session summary that should be truncated';
const SUMMARY_REPEAT_COUNT = parseInt(
  process.env.COWORK_TEST_SUMMARY_REPEAT_COUNT || '2',
  10
);
const SESSION_SUMMARY_MATCH = process.env.COWORK_TEST_SESSION_SUMMARY_MATCH || 'match';
const SESSION_SUMMARY_OTHER = process.env.COWORK_TEST_SESSION_SUMMARY_OTHER || 'other';
const SESSION_DATE_OLD =
  process.env.COWORK_TEST_SESSION_DATE_OLD || '2024-01-01T00:00:00.000Z';
const SESSION_DATE_NEW =
  process.env.COWORK_TEST_SESSION_DATE_NEW || '2024-02-01T00:00:00.000Z';

describe('WorkspaceView helpers', () => {
  it('should normalize workspace selection', () => {
    const config = getWorkspaceViewConfig();
    const single = normalizeWorkspaceSelection(WORKSPACE_PATH_ALPHA, config);
    const multiple = normalizeWorkspaceSelection([WORKSPACE_PATH_BETA], config);
    const empty = normalizeWorkspaceSelection(null, config);

    expect(single).toBe(WORKSPACE_PATH_ALPHA);
    expect(multiple).toBe(WORKSPACE_PATH_BETA);
    expect(empty).toBeNull();
  });

  it('should filter workspaces by query', () => {
    const workspaces: Workspace[] = [
      {
        id: 'ws-1',
        name: WORKSPACE_NAME_ALPHA,
        path: WORKSPACE_PATH_ALPHA,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      },
      {
        id: 'ws-2',
        name: WORKSPACE_NAME_BETA,
        path: WORKSPACE_PATH_BETA,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      },
    ];

    const config = getWorkspaceListConfig();
    const results = filterWorkspaces(workspaces, SEARCH_QUERY_ALPHA, config);

    expect(results).toHaveLength(EXPECTED_ONE);
    expect(formatWorkspaceName(results[INDEX_FIRST].name, config)).toContain('Alpha');
  });

  it('should sort session history by updated time', () => {
    const sessions: SessionSummary[] = [
      {
        id: SESSION_ID_OLD,
        summary: SESSION_SUMMARY_OTHER,
        messageCount: EXPECTED_ONE,
        updatedAt: new Date(SESSION_DATE_OLD),
      },
      {
        id: SESSION_ID_NEW,
        summary: SESSION_SUMMARY_MATCH,
        messageCount: EXPECTED_TWO,
        updatedAt: new Date(SESSION_DATE_NEW),
      },
    ];

    const sorted = sortSessionHistory(sessions);
    expect(sorted[INDEX_FIRST].id).toBe(SESSION_ID_NEW);
    expect(sorted[INDEX_SECOND].id).toBe(SESSION_ID_OLD);
  });

  it('should filter and format session history summary', () => {
    const longSummary = SESSION_SUMMARY_LONG.repeat(SUMMARY_REPEAT_COUNT);
    const sessions: SessionSummary[] = [
      {
        id: SESSION_ID_NEW,
        summary: longSummary,
        messageCount: EXPECTED_TWO,
        updatedAt: new Date(SESSION_DATE_NEW),
      },
      {
        id: SESSION_ID_OLD,
        summary: SESSION_SUMMARY_OTHER,
        messageCount: EXPECTED_ONE,
        updatedAt: new Date(SESSION_DATE_OLD),
      },
    ];

    const config = getSessionHistoryConfig();
    const filtered = filterSessionHistory(sessions, SESSION_SUMMARY_LONG, config);
    expect(filtered).toHaveLength(EXPECTED_ONE);
    expect(formatSessionSummary(filtered[INDEX_FIRST], config)).toContain(
      config.truncateSuffix
    );
  });
});
