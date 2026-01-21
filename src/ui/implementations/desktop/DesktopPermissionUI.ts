/**
 * Desktop Permission UI Implementation
 *
 * Core Class:
 * - DesktopPermissionUI: Desktop environment implementation of PermissionUI
 *
 * Responsibilities:
 * - Request permissions via IPC to frontend UI
 * - Display question menus via frontend
 *
 * _Requirements: DesktopUIFactory 实现_
 * _TaskGroup: 7_
 */

import type { PermissionUI, QuestionInput, QuestionAnswers } from '../../../permissions/PermissionUI';
import type { ToolPermissionRequest, PermissionUIResult } from '../../../permissions/types';
import { IPCMessageAdapter } from './IPCMessageAdapter';

const PERMISSION_REQUEST_TIMEOUT_MS = parseInt(
  process.env.COWORK_PERMISSION_REQUEST_TIMEOUT_MS || '120000',
  10
);
const USER_QUESTIONS_TIMEOUT_MS = parseInt(
  process.env.COWORK_PERMISSION_QUESTIONS_TIMEOUT_MS || '300000',
  10
);

/**
 * Desktop Permission UI
 *
 * Sends permission requests to the SolidJS frontend via IPC.
 */
export class DesktopPermissionUI implements PermissionUI {
  private ipcAdapter: IPCMessageAdapter;

  constructor(ipcAdapter?: IPCMessageAdapter) {
    this.ipcAdapter = ipcAdapter ?? new IPCMessageAdapter();
  }

  /**
   * Request permission from user via frontend UI
   */
  async requestPermission(request: ToolPermissionRequest): Promise<PermissionUIResult> {
    try {
      const result = await this.ipcAdapter.request<PermissionUIResult>(
        'permission_request',
        request,
        { timeout: PERMISSION_REQUEST_TIMEOUT_MS }
      );
      return result;
    } catch (error) {
      // If request fails or times out, deny by default
      return {
        approved: false,
        reason: error instanceof Error ? error.message : 'Permission request failed',
      };
    }
  }

  /**
   * Prompt for tool permission via frontend UI
   */
  async promptToolPermission(request: ToolPermissionRequest): Promise<PermissionUIResult> {
    return this.requestPermission(request);
  }

  /**
   * Display interactive question menu via frontend UI
   */
  async promptUserQuestions(questions: QuestionInput[]): Promise<QuestionAnswers> {
    try {
      const result = await this.ipcAdapter.request<QuestionAnswers>(
        'user_questions',
        { questions },
        { timeout: USER_QUESTIONS_TIMEOUT_MS }
      );
      return result;
    } catch (error) {
      // Return empty answers on failure
      console.error('Failed to prompt user questions:', error);
      return {};
    }
  }
}
