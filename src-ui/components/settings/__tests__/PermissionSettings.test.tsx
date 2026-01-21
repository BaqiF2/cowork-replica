/**
 * PermissionSettings Tests
 *
 * Tests for permission settings helpers:
 * - permission mode switching helpers
 * - permission history filtering
 *
 * _Requirements: permission UI_
 * _TaskGroup: 7_
 */

import type { PermissionMode } from '../../../../src/permissions/PermissionManager';
import {
  buildPermissionModePayload,
  filterPermissionHistory,
  getPermissionModeLabel,
  getPermissionModeOptions,
  getPermissionSettingsConfig,
  isValidPermissionMode,
  sortPermissionHistory,
  type PermissionHistoryEntry,
} from '../permissionSettingsUtils';

const INDEX_FIRST = parseInt(process.env.COWORK_TEST_INDEX_FIRST || '0', 10);
const INDEX_SECOND = parseInt(process.env.COWORK_TEST_INDEX_SECOND || '1', 10);
const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_EXPECTED_ONE || '1', 10);
const EXPECTED_TWO = parseInt(process.env.COWORK_TEST_EXPECTED_TWO || '2', 10);
const HISTORY_TOOL_ALPHA = process.env.COWORK_TEST_HISTORY_TOOL_ALPHA || 'Read';
const HISTORY_TOOL_BETA = process.env.COWORK_TEST_HISTORY_TOOL_BETA || 'Edit';
const HISTORY_QUERY = process.env.COWORK_TEST_HISTORY_QUERY || 'edit';
const DATE_OLD = process.env.COWORK_TEST_DATE_OLD || '2024-01-01T00:00:00.000Z';
const DATE_NEW = process.env.COWORK_TEST_DATE_NEW || '2024-02-01T00:00:00.000Z';

describe('PermissionSettings helpers', () => {
  it('should validate permission modes and build payload', () => {
    const options = getPermissionModeOptions();
    const config = getPermissionSettingsConfig();
    const mode = options[INDEX_FIRST] ?? 'default';
    const invalidMode = 'invalid_mode' as PermissionMode;

    expect(isValidPermissionMode(mode, config)).toBe(true);
    expect(isValidPermissionMode(invalidMode, config)).toBe(false);
    expect(getPermissionModeLabel(mode, config).length).toBeGreaterThan(0);

    const payload = buildPermissionModePayload(mode);
    expect(payload.mode).toBe(mode);
  });

  it('should sort and filter permission history', () => {
    const entries: PermissionHistoryEntry[] = [
      {
        id: 'entry-old',
        toolName: HISTORY_TOOL_ALPHA,
        decision: 'allow',
        timestamp: new Date(DATE_OLD),
      },
      {
        id: 'entry-new',
        toolName: HISTORY_TOOL_BETA,
        decision: 'deny',
        timestamp: new Date(DATE_NEW),
      },
    ];

    const sorted = sortPermissionHistory(entries);
    expect(sorted[INDEX_FIRST].id).toBe('entry-new');
    expect(sorted[INDEX_SECOND].id).toBe('entry-old');

    const filtered = filterPermissionHistory(entries, HISTORY_QUERY, 'deny');
    expect(filtered).toHaveLength(EXPECTED_ONE);
    expect(filtered[INDEX_FIRST].toolName).toBe(HISTORY_TOOL_BETA);
  });

  it('should return all history when filter is empty', () => {
    const entries: PermissionHistoryEntry[] = [
      {
        id: 'entry-one',
        toolName: HISTORY_TOOL_ALPHA,
        decision: 'allow',
        timestamp: new Date(DATE_OLD),
      },
      {
        id: 'entry-two',
        toolName: HISTORY_TOOL_BETA,
        decision: 'deny',
        timestamp: new Date(DATE_NEW),
      },
    ];

    const filtered = filterPermissionHistory(entries, '', 'all');
    expect(filtered).toHaveLength(EXPECTED_TWO);
  });
});
