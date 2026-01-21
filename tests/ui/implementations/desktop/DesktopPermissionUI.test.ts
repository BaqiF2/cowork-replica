/**
 * DesktopPermissionUI Tests
 *
 * Tests for desktop permission UI:
 * - Scenario: request tool permission via IPC
 * - Scenario: handle user response and failures
 *
 * _Requirements: permission UI_
 * _TaskGroup: 5_
 */

import type { QuestionInput } from '../../../../src/permissions/PermissionUI';
import type { ToolPermissionRequest, PermissionUIResult } from '../../../../src/permissions/types';
import type { IPCMessageAdapter } from '../../../../src/ui/implementations/desktop/IPCMessageAdapter';

const PERMISSION_TIMEOUT = parseInt(
  process.env.COWORK_TEST_PERMISSION_TIMEOUT || '15000',
  10
);
const QUESTION_TIMEOUT = parseInt(
  process.env.COWORK_TEST_QUESTION_TIMEOUT || '24000',
  10
);
const EXPECTED_ONE = parseInt(process.env.COWORK_TEST_EXPECTED_ONE || '1', 10);

const TOOL_NAME = process.env.COWORK_TEST_TOOL_NAME || 'Edit';
const TOOL_USE_ID = process.env.COWORK_TEST_TOOL_USE_ID || 'tool-use-1';
const TOOL_INPUT_PATH = process.env.COWORK_TEST_TOOL_INPUT_PATH || '/tmp/sample.txt';
const TOOL_TIMESTAMP = process.env.COWORK_TEST_TOOL_TIMESTAMP || '2024-01-01T00:00:00.000Z';
const ERROR_MESSAGE = process.env.COWORK_TEST_ERROR_MESSAGE || 'Permission denied';
const QUESTION_TEXT = process.env.COWORK_TEST_QUESTION_TEXT || 'Continue?';
const QUESTION_HEADER = process.env.COWORK_TEST_QUESTION_HEADER || 'Confirm';
const QUESTION_OPTION_LABEL = process.env.COWORK_TEST_QUESTION_OPTION_LABEL || 'Yes';
const QUESTION_OPTION_DESCRIPTION =
  process.env.COWORK_TEST_QUESTION_OPTION_DESCRIPTION || 'Proceed with action';
const ANSWER_VALUE = process.env.COWORK_TEST_ANSWER_VALUE || 'yes';

const createToolRequest = (): ToolPermissionRequest => ({
  toolName: TOOL_NAME,
  toolUseID: TOOL_USE_ID,
  input: { path: TOOL_INPUT_PATH },
  timestamp: new Date(TOOL_TIMESTAMP),
});

const createQuestions = (): QuestionInput[] => [
  {
    question: QUESTION_TEXT,
    header: QUESTION_HEADER,
    options: [
      {
        label: QUESTION_OPTION_LABEL,
        description: QUESTION_OPTION_DESCRIPTION,
      },
    ],
    multiSelect: false,
  },
];

const loadDesktopPermissionUI = async (requestMock: jest.Mock) => {
  jest.resetModules();
  process.env.COWORK_PERMISSION_REQUEST_TIMEOUT_MS = String(PERMISSION_TIMEOUT);
  process.env.COWORK_PERMISSION_QUESTIONS_TIMEOUT_MS = String(QUESTION_TIMEOUT);
  const module = await import(
    '../../../../src/ui/implementations/desktop/DesktopPermissionUI'
  );
  return new module.DesktopPermissionUI({
    request: requestMock,
  } as unknown as IPCMessageAdapter);
};

describe('DesktopPermissionUI', () => {
  it('should request tool permission via IPC', async () => {
    const requestMock = jest.fn<Promise<PermissionUIResult>, [string, unknown, { timeout: number }]>(
      () => Promise.resolve({ approved: true })
    );
    const ui = await loadDesktopPermissionUI(requestMock);
    const request = createToolRequest();

    const result = await ui.promptToolPermission(request);

    expect(result).toEqual({ approved: true });
    expect(requestMock).toHaveBeenCalledWith('permission_request', request, {
      timeout: PERMISSION_TIMEOUT,
    });
  });

  it('should deny permission when IPC request fails', async () => {
    const requestMock = jest.fn<Promise<PermissionUIResult>, [string, unknown, { timeout: number }]>(
      () => Promise.reject(new Error(ERROR_MESSAGE))
    );
    const ui = await loadDesktopPermissionUI(requestMock);
    const request = createToolRequest();

    const result = await ui.promptToolPermission(request);

    expect(result.approved).toBe(false);
    expect(result.reason).toBe(ERROR_MESSAGE);
  });

  it('should prompt user questions via IPC', async () => {
    const answers = { [QUESTION_TEXT]: ANSWER_VALUE };
    const requestMock = jest.fn<Promise<Record<string, string>>, [string, unknown, { timeout: number }]>(
      () => Promise.resolve(answers)
    );
    const ui = await loadDesktopPermissionUI(requestMock);
    const questions = createQuestions();

    const result = await ui.promptUserQuestions(questions);

    expect(Object.keys(result)).toHaveLength(EXPECTED_ONE);
    expect(result[QUESTION_TEXT]).toBe(ANSWER_VALUE);
    expect(requestMock).toHaveBeenCalledWith('user_questions', { questions }, {
      timeout: QUESTION_TIMEOUT,
    });
  });

  it('should return empty answers when question prompt fails', async () => {
    const requestMock = jest.fn<Promise<Record<string, string>>, [string, unknown, { timeout: number }]>(
      () => Promise.reject(new Error(ERROR_MESSAGE))
    );
    const ui = await loadDesktopPermissionUI(requestMock);
    const questions = createQuestions();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await ui.promptUserQuestions(questions);

    expect(result).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
