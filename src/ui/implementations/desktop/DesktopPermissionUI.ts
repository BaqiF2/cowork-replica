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
        { timeout: 120000 } // 2 minute timeout for user interaction
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
        { timeout: 300000 } // 5 minute timeout for multiple questions
      );
      return result;
    } catch (error) {
      // Return empty answers on failure
      console.error('Failed to prompt user questions:', error);
      return {};
    }
  }
}
