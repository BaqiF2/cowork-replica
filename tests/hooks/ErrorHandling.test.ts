/**
 * Error Handling and Edge Cases Tests for HookManager
 *
 * Tests for error handling, recovery, and edge case scenarios:
 * - Invalid hooks configuration handling
 * - Script loading failures and recovery
 * - Command execution timeout handling
 * - Various error paths and edge cases
 *
 * Requirements: Configuration error handling
 * Scenarios: Handle invalid hooks configuration, Handle script loading failures, Handle command execution timeout
 * TaskGroup: 8
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { HookManager, HookConfig, HookInput, Hook, HookContext } from '../../src/hooks/HookManager';

describe('HookManager Error Handling', () => {
  let hookManager: HookManager;
  let tempDir: string;

  beforeEach(async () => {
    hookManager = new HookManager({ debug: false });
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hookmanager-error-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('Invalid hooks configuration handling', () => {
    describe('validateConfig static method', () => {
      it('should return errors for unknown hook event type', () => {
        const config = {
          UnknownEvent: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'command' as const, command: 'echo test' }],
            },
          ],
        } as unknown as HookConfig;

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('Unknown hook event type'));
      });

      it('should return errors when event config is not an array', () => {
        const config = {
          PreToolUse: 'not an array',
        } as unknown as HookConfig;

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('must be an array'));
      });

      it('should return errors when matcher field is missing', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: undefined as unknown as string,
              hooks: [{ matcher: '.*', type: 'command', command: 'echo test' }],
            },
          ],
        };

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("missing 'matcher' field"));
      });

      it('should return errors when hooks is not an array', () => {
        const config = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: 'not an array',
            },
          ],
        } as unknown as HookConfig;

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("'hooks' must be an array"));
      });

      it('should return errors for invalid hook type', () => {
        const config = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'invalid' as 'command', command: 'echo test' }],
            },
          ],
        } as unknown as HookConfig;

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('invalid type'));
      });

      it('should return errors when command hook is missing command field', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'command' }],
            },
          ],
        };

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("missing 'command' field"));
      });

      it('should return errors when prompt hook is missing prompt field', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'prompt' }],
            },
          ],
        };

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("missing 'prompt' field"));
      });

      it('should return errors when script hook is missing script field', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'script' }],
            },
          ],
        };

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining("missing 'script' field"));
      });

      it('should return valid for correct configuration', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: 'Write|Edit',
              hooks: [
                { matcher: 'Write', type: 'command', command: 'echo test' },
                { matcher: 'Edit', type: 'prompt', prompt: 'Review this file' },
              ],
            },
          ],
          PostToolUse: [
            {
              matcher: '.*',
              hooks: [{ matcher: '.*', type: 'script', script: './hooks/validate.js' }],
            },
          ],
        };

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should collect multiple errors from same configuration', () => {
        const config = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [
                { matcher: '.*', type: 'command' }, // missing command
                { matcher: '.*', type: 'prompt' }, // missing prompt
              ],
            },
          ],
          InvalidEvent: [
            {
              // invalid event
              matcher: '.*',
              hooks: [],
            },
          ],
        } as unknown as HookConfig;

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(3);
      });

      it('should validate empty configuration as valid', () => {
        const config: HookConfig = {};

        const result = HookManager.validateConfig(config);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('loadHooks with problematic config', () => {
      it('should handle loading empty configuration', () => {
        hookManager.loadHooks({});

        const config = hookManager.getConfig();
        expect(config).toEqual({});
      });

      it('should handle configuration with empty matchers array', () => {
        const config: HookConfig = {
          PreToolUse: [],
        };

        hookManager.loadHooks(config);

        const loadedConfig = hookManager.getConfig();
        expect(loadedConfig.PreToolUse).toEqual([]);
      });

      it('should handle configuration with empty hooks array', () => {
        const config: HookConfig = {
          PreToolUse: [
            {
              matcher: '.*',
              hooks: [],
            },
          ],
        };

        hookManager.loadHooks(config);

        const loadedConfig = hookManager.getConfig();
        expect(loadedConfig.PreToolUse).toBeDefined();
        expect(loadedConfig.PreToolUse![0].hooks).toEqual([]);
      });
    });
  });

  describe('Script loading failures', () => {
    it('should return continue:true when script file does not exist', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        './nonexistent-script.js',
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script has syntax error', async () => {
      // Create a script with syntax error
      const scriptPath = path.join(tempDir, 'syntax-error.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input {  // missing parameter separator
          return { continue: true };
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script throws runtime error', async () => {
      // Create a script that throws runtime error
      const scriptPath = path.join(tempDir, 'runtime-error.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          throw new Error('Unexpected runtime error');
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script does not export a function', async () => {
      // Create a script that exports wrong type
      const scriptPath = path.join(tempDir, 'not-a-function.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = "I am a string, not a function";
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script returns undefined', async () => {
      // Create a script that returns undefined
      const scriptPath = path.join(tempDir, 'returns-undefined.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          // No return statement
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script returns null', async () => {
      // Create a script that returns null
      const scriptPath = path.join(tempDir, 'returns-null.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          return null;
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });

    it('should return continue:true with reason when script path fails whitelist validation', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        '/outside/whitelist/script.js',
        mockInput,
        'test-tool-use-id',
        new AbortController().signal,
        ['./.claude/hooks', './hooks'] // whitelist
      );

      expect(result.continue).toBe(true);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('not in allowed paths');
    });

    it('should return continue:true when script path is empty', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        '',
        mockInput,
        'test-tool-use-id',
        new AbortController().signal,
        ['./.claude/hooks']
      );

      expect(result.continue).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('should handle script that throws async error', async () => {
      // Create a script that throws async error
      const scriptPath = path.join(tempDir, 'async-error.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          await Promise.reject(new Error('Async operation failed'));
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        scriptPath,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result.continue).toBe(true);
    });
  });

  describe('Command execution failures', () => {
    it('should return failure result when command does not exist', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('nonexistent_command_12345', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return failure result when command exits with non-zero code', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('exit 1', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle command timeout', async () => {
      hookManager = new HookManager({
        workingDir: tempDir,
        commandTimeout: 100, // 100ms timeout
        debug: false,
      });

      const result = await hookManager.executeCommand('sleep 10', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Command should fail due to timeout - error message format varies by OS/Node version
      expect(result.error).toBeTruthy();
    });

    it('should handle command with stderr output', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "error message" >&2', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('error message');
    });

    it('should handle command that produces no output', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('true', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(true);
    });

    it('should handle command with special characters in variables', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$TOOL"', {
        event: 'PreToolUse',
        tool: 'Write & Delete "quoted"',
        args: { path: '/path with spaces/file.txt' },
      });

      // Should not throw, but may or may not successfully escape special chars
      expect(result).toBeDefined();
    });
  });

  describe('Prompt execution edge cases', () => {
    it('should handle empty prompt', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('', {
        event: 'UserPromptSubmit',
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe('');
    });

    it('should handle prompt with only variable placeholders that have no values', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('$TOOL $FILE $COMMAND', {
        event: 'UserPromptSubmit',
        // No tool, args, or other context provided
      });

      expect(result.success).toBe(true);
      expect(result.output).toBe('  '); // Three empty strings with spaces
    });

    it('should handle prompt with unknown variable placeholders', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('$UNKNOWN_VAR test', {
        event: 'UserPromptSubmit',
      });

      expect(result.success).toBe(true);
      // Unknown variable should remain unchanged
      expect(result.output).toBe('$UNKNOWN_VAR test');
    });

    it('should handle promptHandler that throws error', async () => {
      hookManager = new HookManager({
        workingDir: tempDir,
        debug: false,
        promptHandler: async () => {
          throw new Error('Prompt handler error');
        },
      });

      const result = await hookManager.executePrompt('test prompt', {
        event: 'UserPromptSubmit',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Prompt handler error');
    });
  });

  describe('executeHooks error recovery', () => {
    it('should continue executing remaining hooks when one fails', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hooks: Hook[] = [
        { matcher: '.*', type: 'command', command: 'exit 1' }, // Will fail
        { matcher: '.*', type: 'command', command: 'echo success' }, // Should still run
      ];

      const context: HookContext = {
        event: 'PreToolUse',
        tool: 'Write',
      };

      const results = await hookManager.executeHooks(hooks, context);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
      expect(results[1].output).toContain('success');
    });

    it('should handle hooks array with mixed success and failures', async () => {
      // Create test script that succeeds
      const successScript = path.join(tempDir, 'success.js');
      await fs.writeFile(
        successScript,
        `
        module.exports = async function() {
          return { continue: true };
        };
        `
      );

      // Create test script that fails
      const failScript = path.join(tempDir, 'fail.js');
      await fs.writeFile(
        failScript,
        `
        module.exports = async function() {
          throw new Error('Script failed');
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hooks: Hook[] = [
        { matcher: '.*', type: 'command', command: 'echo first' },
        { matcher: '.*', type: 'script', script: failScript },
        { matcher: '.*', type: 'prompt', prompt: 'third' },
        { matcher: '.*', type: 'script', script: successScript },
      ];

      const context: HookContext = {
        event: 'PreToolUse',
        tool: 'Write',
      };

      const results = await hookManager.executeHooks(hooks, context);

      expect(results).toHaveLength(4);
      expect(results[0].success).toBe(true); // command
      expect(results[1].success).toBe(false); // failed script
      expect(results[2].success).toBe(true); // prompt
      expect(results[3].success).toBe(true); // success script
    });

    it('should record error message for failed hooks', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hooks: Hook[] = [{ matcher: '.*', type: 'command', command: 'exit 42' }];

      const context: HookContext = {
        event: 'PreToolUse',
        tool: 'Write',
      };

      const results = await hookManager.executeHooks(hooks, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it('should handle empty hooks array', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hooks: Hook[] = [];

      const context: HookContext = {
        event: 'PreToolUse',
        tool: 'Write',
      };

      const results = await hookManager.executeHooks(hooks, context);

      expect(results).toHaveLength(0);
    });
  });

  describe('triggerEvent error handling', () => {
    it('should return empty array when no hooks configured for event', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });
      hookManager.loadHooks({});

      const results = await hookManager.triggerEvent('PreToolUse', {
        tool: 'Write',
      });

      expect(results).toHaveLength(0);
    });

    it('should handle hooks with non-matching matchers', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Read', // Does not match 'Write'
            hooks: [{ matcher: 'Read', type: 'command', command: 'echo should not run' }],
          },
        ],
      };

      hookManager.loadHooks(config);

      const results = await hookManager.triggerEvent('PreToolUse', {
        tool: 'Write', // Does not match 'Read'
      });

      // Hook should be skipped due to matcher not matching
      expect(results).toHaveLength(0);
    });
  });

  describe('loadFromFile error handling', () => {
    it('should handle non-existent file gracefully', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      await hookManager.loadFromFile('/nonexistent/path/hooks.json');

      const config = hookManager.getConfig();
      expect(config).toEqual({});
    });

    it('should handle malformed JSON file', async () => {
      const malformedPath = path.join(tempDir, 'malformed.json');
      await fs.writeFile(malformedPath, '{ invalid json }');

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      await hookManager.loadFromFile(malformedPath);

      const config = hookManager.getConfig();
      expect(config).toEqual({});
    });

    it('should handle JSON file with array instead of object', async () => {
      const arrayPath = path.join(tempDir, 'array.json');
      await fs.writeFile(arrayPath, '[1, 2, 3]');

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      await hookManager.loadFromFile(arrayPath);

      const config = hookManager.getConfig();
      expect(config).toEqual({});
    });

    it('should handle JSON file with null', async () => {
      const nullPath = path.join(tempDir, 'null.json');
      await fs.writeFile(nullPath, 'null');

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      await hookManager.loadFromFile(nullPath);

      const config = hookManager.getConfig();
      expect(config).toEqual({});
    });
  });

  describe('getHooksForSDK with error scenarios', () => {
    it('should handle config with undefined matchers', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      // Load a valid config first
      hookManager.loadHooks({
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [{ matcher: '.*', type: 'command', command: 'echo test' }],
          },
        ],
      });

      // Get SDK format should work without errors
      const sdkFormat = hookManager.getHooksForSDK();

      expect(sdkFormat.PreToolUse).toBeDefined();
      expect(sdkFormat.PreToolUse).toHaveLength(1);
    });

    it('should handle callbacks that throw during execution', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      hookManager.loadHooks({
        PreToolUse: [
          {
            matcher: '.*',
            hooks: [{ matcher: '.*', type: 'command', command: 'nonexistent_cmd' }],
          },
        ],
      });

      const sdkFormat = hookManager.getHooksForSDK();

      // Execute callback - should not throw, just return error result
      const context: HookContext = {
        event: 'PreToolUse',
        tool: 'Write',
      };

      // This should not throw
      await expect(sdkFormat.PreToolUse![0].callback(context)).resolves.not.toThrow();
    });
  });

  describe('addHook error handling', () => {
    it('should throw error for unknown event type', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      expect(() => {
        hookManager.addHook('UnknownEvent' as any, '.*', {
          matcher: '.*',
          type: 'command',
          command: 'echo test',
        });
      }).toThrow('Unknown hook event type');
    });
  });

  describe('Edge cases for variable expansion', () => {
    it('should handle circular or deeply nested args', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const nestedArgs: Record<string, unknown> = {
        path: {
          nested: {
            value: '/deep/path',
          },
        },
      };

      const result = await hookManager.executeCommand('echo "$FILE"', {
        event: 'PreToolUse',
        tool: 'Write',
        args: nestedArgs,
      });

      // Should handle nested object without crashing
      expect(result).toBeDefined();
    });

    it('should handle args with undefined values', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$FILE"', {
        event: 'PreToolUse',
        tool: 'Write',
        args: { path: undefined },
      });

      expect(result.success).toBe(true);
    });

    it('should handle args with null values', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$FILE"', {
        event: 'PreToolUse',
        tool: 'Write',
        args: { path: null as unknown as string },
      });

      expect(result.success).toBe(true);
    });
  });
});