/**
 * PermissionModal Tests
 *
 * Tests for permission modal logic:
 * - Modal visibility on permission requests
 * - User decisions emitted via IPC
 *
 * _Requirements: permission UI_
 * _TaskGroup: 6_
 */

import {
  buildPermissionResponse,
  getPermissionModalConfig,
  mapPermissionRequest,
} from '../permissionModalUtils';

const DEFAULT_TOOL_NAME = process.env.COWORK_TEST_TOOL_NAME || 'Edit';
const DEFAULT_TOOL_USE_ID = process.env.COWORK_TEST_TOOL_USE_ID || 'tool-use-1';
const DEFAULT_TARGET = process.env.COWORK_TEST_TARGET_PATH || '/tmp/example.ts';
const EXPECTED_TRUE = (process.env.COWORK_TEST_EXPECTED_TRUE || 'true') === 'true';

describe('PermissionModal helpers', () => {
  it('should map permission request to modal state', () => {
    const payload = {
      toolName: DEFAULT_TOOL_NAME,
      toolUseID: DEFAULT_TOOL_USE_ID,
      input: { path: DEFAULT_TARGET },
    };

    const mapped = mapPermissionRequest(payload);
    expect(mapped.toolName).toBe(DEFAULT_TOOL_NAME);
    expect(mapped.toolUseID).toBe(DEFAULT_TOOL_USE_ID);
    expect(mapped.targetSummary).toContain(DEFAULT_TARGET);
  });

  it('should build allow responses', () => {
    const config = getPermissionModalConfig();
    const response = buildPermissionResponse(DEFAULT_TOOL_USE_ID, 'allow', config);

    expect(response.approved).toBe(EXPECTED_TRUE);
    expect(response.toolUseID).toBe(DEFAULT_TOOL_USE_ID);
    expect(response.remember).toBe(false);
  });

  it('should build remember responses', () => {
    const config = getPermissionModalConfig();
    const response = buildPermissionResponse(DEFAULT_TOOL_USE_ID, 'allow_always', config);

    expect(response.approved).toBe(EXPECTED_TRUE);
    expect(response.toolUseID).toBe(DEFAULT_TOOL_USE_ID);
    expect(response.remember).toBe(true);
  });

  it('should build deny responses', () => {
    const config = getPermissionModalConfig();
    const response = buildPermissionResponse(DEFAULT_TOOL_USE_ID, 'deny', config);

    expect(response.approved).toBe(false);
    expect(response.reason).toBe(config.deniedReason);
  });
});
