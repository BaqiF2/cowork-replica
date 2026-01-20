/**
 * Desktop Output Implementation
 *
 * Core Class:
 * - DesktopOutput: Desktop environment implementation of OutputInterface
 *
 * Responsibilities:
 * - Send output messages via IPC to frontend
 * - Use IPCMessageAdapter for communication
 *
 * _Requirements: DesktopUIFactory 实现_
 * _TaskGroup: 7_
 */

import type { OutputInterface, OutputOptions } from '../../contracts/core/OutputInterface';
import { IPCMessageAdapter } from './IPCMessageAdapter';

/**
 * Desktop Output
 *
 * Sends output to the SolidJS frontend via IPC.
 */
export class DesktopOutput implements OutputInterface {
  private ipcAdapter: IPCMessageAdapter;

  constructor(ipcAdapter?: IPCMessageAdapter) {
    this.ipcAdapter = ipcAdapter ?? new IPCMessageAdapter();
  }

  display(message: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_display', {
      message,
      type: 'info',
      ...options,
    }).catch(console.error);
  }

  info(message: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_info', {
      message,
      type: 'info',
      ...options,
    }).catch(console.error);
  }

  warn(message: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_warn', {
      message,
      type: 'warn',
      ...options,
    }).catch(console.error);
  }

  error(message: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_error', {
      message,
      type: 'error',
      ...options,
    }).catch(console.error);
  }

  success(message: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_success', {
      message,
      type: 'success',
      ...options,
    }).catch(console.error);
  }

  section(title: string, options?: OutputOptions): void {
    this.ipcAdapter.emit('output_section', {
      message: title,
      type: 'section',
      ...options,
    }).catch(console.error);
  }

  blankLine(count = 1): void {
    this.ipcAdapter.emit('output_blank', {
      count,
    }).catch(console.error);
  }
}
