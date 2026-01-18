/**
 * HookManager Core Methods Tests
 *
 * Tests for HookManager core functionality:
 * - loadHooks(): Load hooks configuration from config object
 * - executeCommand(): Execute shell command hooks with variable substitution
 * - executeScript(): Execute JavaScript/TypeScript script hooks
 * - executePrompt(): Execute prompt hooks with variable substitution
 * - createSDKCallback(): Create SDK-compatible callback functions
 * - expandVariablesFromSDKInput(): Variable substitution with SDK HookInput
 *
 * Requirements: HookManager core method implementation, three hook callback types support, variable substitution support
 * Scenarios: Complete HookManager method implementation, Variable substitution support, Execute Command type callback, Execute Script type callback, Execute Prompt type callback
 * TaskGroup: 1
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  HookManager,
  HookConfig,
  HookEvent,
  HookInput,
  ALL_HOOK_EVENTS,
} from '../../src/hooks/HookManager';

describe('HookManager', () => {
  let hookManager: HookManager;
  let tempDir: string;

  beforeEach(async () => {
    hookManager = new HookManager({ debug: false });
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hookmanager-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadHooks', () => {
    it('should load hooks configuration from config object', () => {
      const config: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Write|Edit',
            hooks: [
              { matcher: 'Write|Edit', type: 'command', command: 'echo "test"' },
            ],
          },
        ],
      };

      hookManager.loadHooks(config);
      const loadedConfig = hookManager.getConfig();

      expect(loadedConfig).toBeDefined();
      expect(loadedConfig.PreToolUse).toBeDefined();
      expect(loadedConfig.PreToolUse).toHaveLength(1);
      expect(loadedConfig.PreToolUse![0].matcher).toBe('Write|Edit');
    });

    it('should replace existing configuration when loadHooks is called', () => {
      const config1: HookConfig = {
        PreToolUse: [
          { matcher: 'Write', hooks: [{ matcher: 'Write', type: 'command', command: 'echo 1' }] },
        ],
      };

      const config2: HookConfig = {
        PostToolUse: [
          { matcher: 'Read', hooks: [{ matcher: 'Read', type: 'prompt', prompt: 'test' }] },
        ],
      };

      hookManager.loadHooks(config1);
      hookManager.loadHooks(config2);

      const loadedConfig = hookManager.getConfig();

      // Old config should be replaced
      expect(loadedConfig.PreToolUse).toBeUndefined();
      expect(loadedConfig.PostToolUse).toBeDefined();
    });

    it('should handle empty configuration', () => {
      hookManager.loadHooks({});
      const loadedConfig = hookManager.getConfig();

      expect(loadedConfig).toEqual({});
    });

    it('should handle multiple event types', () => {
      const config: HookConfig = {
        PreToolUse: [
          { matcher: 'Write', hooks: [{ matcher: 'Write', type: 'command', command: 'cmd1' }] },
        ],
        PostToolUse: [
          { matcher: 'Read', hooks: [{ matcher: 'Read', type: 'command', command: 'cmd2' }] },
        ],
        UserPromptSubmit: [
          { matcher: '.*', hooks: [{ matcher: '.*', type: 'prompt', prompt: 'remember' }] },
        ],
      };

      hookManager.loadHooks(config);
      const loadedConfig = hookManager.getConfig();

      expect(Object.keys(loadedConfig)).toHaveLength(3);
      expect(loadedConfig.PreToolUse).toBeDefined();
      expect(loadedConfig.PostToolUse).toBeDefined();
      expect(loadedConfig.UserPromptSubmit).toBeDefined();
    });
  });

  describe('executeCommand', () => {
    it('should execute shell command and return success result', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "hello"', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(true);
      expect(result.type).toBe('command');
      expect(result.output).toContain('hello');
    });

    it('should return failure when command exits with non-zero code', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('exit 1', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(false);
      expect(result.type).toBe('command');
      expect(result.error).toBeDefined();
    });

    it('should perform variable substitution in command', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$TOOL"', {
        event: 'PreToolUse',
        tool: 'Write',
        args: { path: '/test/file.txt' },
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Write');
    });

    it('should substitute $FILE variable from args', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$FILE"', {
        event: 'PreToolUse',
        tool: 'Write',
        args: { path: '/test/file.txt' },
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('/test/file.txt');
    });

    it('should substitute $COMMAND variable from args', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executeCommand('echo "$COMMAND"', {
        event: 'PreToolUse',
        tool: 'Bash',
        args: { command: 'npm test' },
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('npm test');
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
    });
  });

  describe('executeScript', () => {
    it('should execute JavaScript script and return result', async () => {
      // Create a test script
      const scriptPath = path.join(tempDir, 'test-hook.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
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

      expect(result).toBeDefined();
      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script file not found', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const mockInput: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const result = await hookManager.executeScript(
        '/nonexistent/script.js',
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result).toBeDefined();
      expect(result.continue).toBe(true);
    });

    it('should return continue:true when script throws error', async () => {
      // Create a script that throws an error
      const scriptPath = path.join(tempDir, 'error-hook.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          throw new Error('Script error');
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

      expect(result).toBeDefined();
      expect(result.continue).toBe(true);
    });

    it('should resolve relative path based on cwd', async () => {
      // Create a script in the tempDir
      const scriptName = 'relative-hook.js';
      const scriptPath = path.join(tempDir, scriptName);
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          return { continue: true, systemMessage: 'loaded from relative path' };
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
        `./${scriptName}`,
        mockInput,
        'test-tool-use-id',
        new AbortController().signal
      );

      expect(result).toBeDefined();
      expect(result.continue).toBe(true);
    });

    it('should pass correct parameters to script function', async () => {
      // Create a script that captures parameters
      const scriptPath = path.join(tempDir, 'param-check.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          return {
            continue: true,
            systemMessage: JSON.stringify({
              hasInput: !!input,
              toolUseID: toolUseID,
              hasSignal: !!options.signal
            })
          };
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
        'expected-tool-use-id',
        new AbortController().signal
      );

      expect(result).toBeDefined();
      expect(result.systemMessage).toBeDefined();

      const parsedMessage = JSON.parse(result.systemMessage!);
      expect(parsedMessage.hasInput).toBe(true);
      expect(parsedMessage.toolUseID).toBe('expected-tool-use-id');
      expect(parsedMessage.hasSignal).toBe(true);
    });

    it('should handle script returning decision:block', async () => {
      // Create a script that blocks
      const scriptPath = path.join(tempDir, 'block-hook.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          return {
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: 'Blocked by hook'
            }
          };
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

      expect(result).toBeDefined();
      expect(result.hookSpecificOutput).toBeDefined();
      expect(result.hookSpecificOutput!.permissionDecision).toBe('deny');
    });
  });

  describe('executePrompt', () => {
    it('should return HookJSONOutput with systemMessage', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Remember to follow coding standards', {
        event: 'UserPromptSubmit',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('prompt');
      expect(result.success).toBe(true);
      expect(result.output).toBe('Remember to follow coding standards');
    });

    it('should perform variable substitution in prompt', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Reviewing tool: $TOOL, file: $FILE', {
        event: 'PreToolUse',
        tool: 'Write',
        args: { path: '/src/index.ts' },
      });

      expect(result).toBeDefined();
      expect(result.output).toContain('Write');
      expect(result.output).toContain('/src/index.ts');
    });

    it('should substitute $EVENT variable', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Event: $EVENT', {
        event: 'PostToolUse',
        tool: 'Read',
      });

      expect(result).toBeDefined();
      expect(result.output).toContain('PostToolUse');
    });

    it('should substitute $SESSION_ID variable', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Session: $SESSION_ID', {
        event: 'SessionStart',
        sessionId: 'session-123',
      });

      expect(result).toBeDefined();
      expect(result.output).toContain('session-123');
    });

    it('should substitute $AGENT variable for subagent events', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Agent: $AGENT', {
        event: 'SubagentStart',
        agentName: 'code-reviewer',
      });

      expect(result).toBeDefined();
      expect(result.output).toContain('code-reviewer');
    });

    it('should handle empty variable values gracefully', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const result = await hookManager.executePrompt('Tool: $TOOL, File: $FILE', {
        event: 'UserPromptSubmit',
        // No tool or args provided
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      // Variables should be replaced with empty strings
      expect(result.output).toBe('Tool: , File: ');
    });
  });

  describe('createSDKCallback', () => {
    it('should create callback function for command type hook', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hook = {
        matcher: 'Write',
        type: 'command' as const,
        command: 'echo "test"',
      };

      const callback = hookManager.createSDKCallback(hook);

      expect(callback).toBeDefined();
      expect(typeof callback).toBe('function');
    });

    it('should create callback function for prompt type hook', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hook = {
        matcher: '.*',
        type: 'prompt' as const,
        prompt: 'Follow coding standards',
      };

      const callback = hookManager.createSDKCallback(hook);

      expect(callback).toBeDefined();
      expect(typeof callback).toBe('function');
    });

    it('should create callback function for script type hook', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hook = {
        matcher: 'Write',
        type: 'script' as const,
        script: './hooks/validate.js',
      };

      const callback = hookManager.createSDKCallback(hook);

      expect(callback).toBeDefined();
      expect(typeof callback).toBe('function');
    });

    it('callback should execute command hook correctly', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hook = {
        matcher: 'Write',
        type: 'command' as const,
        command: 'echo "hook executed"',
      };

      const callback = hookManager.createSDKCallback(hook);

      const context = {
        event: 'PreToolUse' as HookEvent,
        tool: 'Write',
      };

      await callback(context);
      // Should complete without error
      expect(true).toBe(true);
    });

    it('callback should execute prompt hook correctly', async () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const hook = {
        matcher: '.*',
        type: 'prompt' as const,
        prompt: 'Remember: $TOOL',
      };

      const callback = hookManager.createSDKCallback(hook);

      const context = {
        event: 'PreToolUse' as HookEvent,
        tool: 'Write',
      };

      await callback(context);
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('expandVariablesFromSDKInput', () => {
    it('should expand $TOOL variable from SDK input', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: tempDir,
      };

      const expanded = hookManager.expandVariablesFromSDKInput('Tool: $TOOL', input);

      expect(expanded).toBe('Tool: Write');
    });

    it('should expand $FILE variable from tool_input', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        tool_input: { file_path: '/src/index.ts' },
        cwd: tempDir,
      };

      const expanded = hookManager.expandVariablesFromSDKInput('File: $FILE', input);

      expect(expanded).toBe('File: /src/index.ts');
    });

    it('should expand $COMMAND variable from tool_input', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: { command: 'npm test' },
        cwd: tempDir,
      };

      const expanded = hookManager.expandVariablesFromSDKInput('Command: $COMMAND', input);

      expect(expanded).toBe('Command: npm test');
    });

    it('should expand $CWD variable', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        cwd: '/workspace/project',
      };

      const expanded = hookManager.expandVariablesFromSDKInput('CWD: $CWD', input);

      expect(expanded).toBe('CWD: /workspace/project');
    });

    it('should expand multiple variables in one template', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'PreToolUse',
        tool_name: 'Write',
        tool_input: { file_path: '/src/app.ts' },
        cwd: '/workspace',
      };

      const expanded = hookManager.expandVariablesFromSDKInput(
        'Tool=$TOOL File=$FILE CWD=$CWD',
        input
      );

      expect(expanded).toBe('Tool=Write File=/src/app.ts CWD=/workspace');
    });

    it('should handle missing variables gracefully', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'UserPromptSubmit',
        cwd: tempDir,
      };

      const expanded = hookManager.expandVariablesFromSDKInput('Tool: $TOOL', input);

      // Should replace with empty string
      expect(expanded).toBe('Tool: ');
    });

    it('should expand $SESSION_ID variable', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const input: HookInput = {
        hook_event_name: 'SessionStart',
        session_id: 'sess-abc-123',
        cwd: tempDir,
      };

      const expanded = hookManager.expandVariablesFromSDKInput('Session: $SESSION_ID', input);

      expect(expanded).toBe('Session: sess-abc-123');
    });
  });

  describe('convertToSDKFormat', () => {
    it('should convert loaded config to SDK HookCallbackMatcher format', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Write|Edit',
            hooks: [
              { matcher: 'Write|Edit', type: 'command', command: 'echo test' },
            ],
          },
        ],
      };

      hookManager.loadHooks(config);
      const sdkFormat = hookManager.getHooksForSDK();

      expect(sdkFormat).toBeDefined();
      expect(sdkFormat.PreToolUse).toBeDefined();
      expect(sdkFormat.PreToolUse).toHaveLength(1);
      expect(sdkFormat.PreToolUse![0].matcher).toBe('Write|Edit');
      expect(typeof sdkFormat.PreToolUse![0].callback).toBe('function');
    });

    it('should create callback for each matcher', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {
        PreToolUse: [
          { matcher: 'Write', hooks: [{ matcher: 'Write', type: 'command', command: 'cmd1' }] },
          { matcher: 'Edit', hooks: [{ matcher: 'Edit', type: 'command', command: 'cmd2' }] },
        ],
      };

      hookManager.loadHooks(config);
      const sdkFormat = hookManager.getHooksForSDK();

      expect(sdkFormat.PreToolUse).toHaveLength(2);
      expect(sdkFormat.PreToolUse![0].matcher).toBe('Write');
      expect(sdkFormat.PreToolUse![1].matcher).toBe('Edit');
    });

    it('should handle multiple hook types in same matcher', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Write',
            hooks: [
              { matcher: 'Write', type: 'command', command: 'echo 1' },
              { matcher: 'Write', type: 'prompt', prompt: 'Remember' },
            ],
          },
        ],
      };

      hookManager.loadHooks(config);
      const sdkFormat = hookManager.getHooksForSDK();

      expect(sdkFormat.PreToolUse).toHaveLength(1);
      // The callback should execute both hooks
      expect(typeof sdkFormat.PreToolUse![0].callback).toBe('function');
    });

    it('should return empty object for empty config', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      hookManager.loadHooks({});
      const sdkFormat = hookManager.getHooksForSDK();

      expect(sdkFormat).toEqual({});
    });

    it('should handle all event types', () => {
      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {};
      ALL_HOOK_EVENTS.forEach((event) => {
        config[event] = [
          { matcher: '.*', hooks: [{ matcher: '.*', type: 'prompt', prompt: `event: ${event}` }] },
        ];
      });

      hookManager.loadHooks(config);
      const sdkFormat = hookManager.getHooksForSDK();

      ALL_HOOK_EVENTS.forEach((event) => {
        expect(sdkFormat[event]).toBeDefined();
        expect(sdkFormat[event]).toHaveLength(1);
      });
    });
  });

  describe('HookManager constructor options', () => {
    it('should use default values when no options provided', () => {
      const manager = new HookManager();
      expect(manager).toBeDefined();
    });

    it('should accept workingDir option', () => {
      const manager = new HookManager({ workingDir: '/custom/path' });
      expect(manager).toBeDefined();
    });

    it('should accept commandTimeout option', async () => {
      const manager = new HookManager({
        workingDir: tempDir,
        commandTimeout: 50,
      });

      const result = await manager.executeCommand('sleep 1', {
        event: 'PreToolUse',
        tool: 'Write',
      });

      expect(result.success).toBe(false);
    });

    it('should accept debug option', () => {
      const manager = new HookManager({ debug: true });
      expect(manager).toBeDefined();
    });
  });

  describe('Three hook callback types integration', () => {
    it('should support command, prompt, and script types in same config', async () => {
      // Create test script
      const scriptPath = path.join(tempDir, 'mixed-hook.js');
      await fs.writeFile(
        scriptPath,
        `
        module.exports = async function(input, toolUseID, options) {
          return { continue: true };
        };
        `
      );

      hookManager = new HookManager({ workingDir: tempDir, debug: false });

      const config: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Write',
            hooks: [
              { matcher: 'Write', type: 'command', command: 'echo "command hook"' },
              { matcher: 'Write', type: 'prompt', prompt: 'Prompt hook: $TOOL' },
              { matcher: 'Write', type: 'script', script: scriptPath },
            ],
          },
        ],
      };

      hookManager.loadHooks(config);
      const loadedConfig = hookManager.getConfig();

      expect(loadedConfig.PreToolUse).toBeDefined();
      expect(loadedConfig.PreToolUse![0].hooks).toHaveLength(3);
    });
  });
});
