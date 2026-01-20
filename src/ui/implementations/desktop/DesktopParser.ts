/**
 * Desktop Parser Implementation
 *
 * Core Class:
 * - DesktopParser: Desktop environment implementation of ParserInterface
 *
 * Responsibilities:
 * - Parse arguments for desktop application (minimal implementation)
 * - Provide help and version text
 *
 * _Requirements: DesktopUIFactory 实现_
 * _TaskGroup: 7_
 */

import type { ParserInterface } from '../../contracts/core/ParserInterface';
import type { OptionsInterface } from '../../contracts/core/OptionsInterface';

/**
 * Desktop Parser
 *
 * Minimal parser implementation for desktop applications.
 * Desktop apps typically receive configuration through IPC rather than CLI args.
 */
export class DesktopParser implements ParserInterface {
  parseArgs(args: string[]): OptionsInterface {
    // Desktop apps receive configuration via IPC, not CLI
    // Return minimal options with any provided prompt
    return {
      version: false,
      help: false,
      debug: false,
      verbose: false,
      prompt: args.length > 0 ? args.join(' ') : undefined,
    };
  }

  parse(args: string[]): OptionsInterface {
    return this.parseArgs(args);
  }

  getHelpText(): string {
    return 'Cowork Desktop Application\n\nConfiguration is managed through the UI settings.';
  }

  getVersionText(): string {
    return 'Cowork Desktop v0.1.0';
  }
}
