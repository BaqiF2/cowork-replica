/**
 * Hooks 端到端集成测试
 *
 * 验证完整的 hooks 数据流程:
 * - settings.json → ConfigManager → ProjectConfig.hooks
 * - ProjectConfig.hooks → HookManager.loadHooks()
 * - HookManager → MessageRouter 构造函数
 * - MessageRouter.buildQueryOptions() → hooks 字段
 *
 * 覆盖场景:
 * - Scenario: 从 settings.json 加载 hooks 配置
 * - Scenario: MessageRouter 构造函数接收 HookManager
 * - Scenario: buildQueryOptions 中添加 hooks 字段
 *
 * @module tests/integration/HooksIntegration
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../../src/config/ConfigManager';
import { HookManager, HookConfig, HookEvent } from '../../src/hooks/HookManager';
import { MessageRouter } from '../../src/core/MessageRouter';
import { SessionManager, Session } from '../../src/core/SessionManager';
import { PermissionManager } from '../../src/permissions/PermissionManager';
import { ToolRegistry } from '../../src/tools/ToolRegistry';
import { Logger } from '../../src/logging/Logger';
import { MockPermissionUIFactory } from '../test-helpers/MockPermissionUI';

describe('Hooks 端到端集成测试', () => {
  let testDir: string;
  let claudeDir: string;
  let sessionsDir: string;
  let logger: Logger;
  let sessionManager: SessionManager;

  beforeAll(async () => {
    // Create test directory structure
    testDir = path.join(os.tmpdir(), `hooks-e2e-test-${Date.now()}`);
    claudeDir = path.join(testDir, '.claude');
    sessionsDir = path.join(testDir, 'sessions');

    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(claudeDir, { recursive: true });
    await fs.mkdir(sessionsDir, { recursive: true });

    logger = new Logger();
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    sessionManager = new SessionManager(sessionsDir);

    // Clean up settings.json before each test
    try {
      await fs.rm(path.join(claudeDir, 'settings.json'), { force: true });
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('Scenario: 从 settings.json 加载 hooks 配置', () => {
    it('应该从 settings.json 正确加载 hooks 配置', async () => {
      // Create settings.json with hooks config
      const settingsContent = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "pre-tool-use hook"',
                },
              ],
            },
          ],
          PostToolUse: [
            {
              matcher: '.*',
              hooks: [
                {
                  type: 'prompt',
                  prompt: 'Log tool usage: $TOOL',
                },
              ],
            },
          ],
        },
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      // Load config using ConfigManager
      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      // Verify hooks were loaded correctly
      expect(projectConfig.hooks).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.PreToolUse?.[0].matcher).toBe('Bash');
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks[0].type).toBe('command');

      expect(projectConfig.hooks?.PostToolUse).toBeDefined();
      expect(projectConfig.hooks?.PostToolUse).toHaveLength(1);
      expect(projectConfig.hooks?.PostToolUse?.[0].matcher).toBe('.*');
    });

    it('应该处理所有 12 种事件类型', async () => {
      const allEventTypes: HookEvent[] = [
        'PreToolUse',
        'PostToolUse',
        'PostToolUseFailure',
        'Notification',
        'UserPromptSubmit',
        'SessionStart',
        'SessionEnd',
        'Stop',
        'SubagentStart',
        'SubagentStop',
        'PreCompact',
        'PermissionRequest',
      ];

      // Create hooks config with all event types
      const hooksConfig: Record<string, Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>> = {};
      for (const eventType of allEventTypes) {
        hooksConfig[eventType] = [
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: `echo "${eventType} triggered"`,
              },
            ],
          },
        ];
      }

      const settingsContent = { hooks: hooksConfig };
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      // Verify all event types are loaded
      expect(projectConfig.hooks).toBeDefined();
      for (const eventType of allEventTypes) {
        expect(projectConfig.hooks?.[eventType as keyof typeof projectConfig.hooks]).toBeDefined();
      }
    });

    it('应该处理所有三种回调类型', async () => {
      const settingsContent = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "command type"',
                },
              ],
            },
            {
              matcher: 'Write',
              hooks: [
                {
                  type: 'prompt',
                  prompt: 'Writing file: $FILE',
                },
              ],
            },
            {
              matcher: 'Read',
              hooks: [
                {
                  type: 'script',
                  script: './hooks/pre-read.js',
                },
              ],
            },
          ],
        },
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      expect(projectConfig.hooks?.PreToolUse).toHaveLength(3);
      expect(projectConfig.hooks?.PreToolUse?.[0].hooks[0].type).toBe('command');
      expect(projectConfig.hooks?.PreToolUse?.[1].hooks[0].type).toBe('prompt');
      expect(projectConfig.hooks?.PreToolUse?.[2].hooks[0].type).toBe('script');
    });

    it('应该处理无效的 hooks 配置（返回空）', async () => {
      const settingsContent = {
        hooks: {
          InvalidEvent: [
            {
              matcher: '.*',
              hooks: [{ type: 'command', command: 'echo test' }],
            },
          ],
        },
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      // Invalid events should be filtered out
      expect(projectConfig.hooks).toBeUndefined();
    });

    it('应该处理没有 hooks 配置的情况', async () => {
      const settingsContent = {
        model: 'sonnet',
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      // hooks should be undefined when not configured
      expect(projectConfig.hooks).toBeUndefined();
    });
  });

  describe('Scenario: MessageRouter 构造函数接收 HookManager', () => {
    it('应该正确将 HookManager 传递给 MessageRouter', async () => {
      const hookManager = new HookManager({ workingDir: testDir });
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      // Create MessageRouter with HookManager
      const messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager,
        workingDirectory: testDir,
      });

      expect(messageRouter).toBeDefined();

      // Verify hooks are accessible via getHooksForSDK
      // When no hooks are loaded, should return undefined
      const sdkHooks = messageRouter.getHooksForSDK();
      expect(sdkHooks).toBeUndefined();
    });

    it('应该在 HookManager 加载配置后可通过 getHooksForSDK 获取', async () => {
      const hookConfig: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                matcher: 'Bash',
                type: 'command',
                command: 'echo "test"',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      const messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager,
        workingDirectory: testDir,
      });

      const sdkHooks = messageRouter.getHooksForSDK();
      expect(sdkHooks).toBeDefined();
      expect(sdkHooks?.PreToolUse).toBeDefined();
      expect(sdkHooks?.PreToolUse).toHaveLength(1);
    });

    it('应该在不传递 HookManager 时正常工作', async () => {
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      // Create MessageRouter without HookManager
      const messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        workingDirectory: testDir,
      });

      expect(messageRouter).toBeDefined();

      // getHooksForSDK should return undefined when no HookManager
      const sdkHooks = messageRouter.getHooksForSDK();
      expect(sdkHooks).toBeUndefined();
    });
  });

  describe('Scenario: buildQueryOptions 中添加 hooks 字段', () => {
    let session: Session;
    let hookManager: HookManager;
    let messageRouter: MessageRouter;

    beforeEach(async () => {
      // Create a session
      session = await sessionManager.createSession(testDir);

      // Setup HookManager with config
      hookManager = new HookManager({ workingDir: testDir });
      const hookConfig: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                matcher: 'Bash',
                type: 'command',
                command: 'echo "pre-bash"',
              },
            ],
          },
        ],
        PostToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                matcher: '.*',
                type: 'prompt',
                prompt: 'Tool $TOOL completed',
              },
            ],
          },
        ],
      };
      hookManager.loadHooks(hookConfig);

      // Create MessageRouter with HookManager
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager,
        workingDirectory: testDir,
      });
    });

    it('应该在 buildQueryOptions 返回中包含 hooks 字段', async () => {
      const options = await messageRouter.buildQueryOptions(session);

      expect(options.hooks).toBeDefined();
      expect(options.hooks?.PreToolUse).toBeDefined();
      expect(options.hooks?.PostToolUse).toBeDefined();
    });

    it('hooks 字段应该包含正确的回调函数', async () => {
      const options = await messageRouter.buildQueryOptions(session);

      // PreToolUse hooks
      expect(options.hooks?.PreToolUse).toHaveLength(1);
      expect(options.hooks?.PreToolUse?.[0].matcher).toBe('Bash');
      expect(typeof options.hooks?.PreToolUse?.[0].callback).toBe('function');

      // PostToolUse hooks
      expect(options.hooks?.PostToolUse).toHaveLength(1);
      expect(options.hooks?.PostToolUse?.[0].matcher).toBe('.*');
      expect(typeof options.hooks?.PostToolUse?.[0].callback).toBe('function');
    });

    it('应该在没有 hooks 配置时返回 undefined', async () => {
      // Create MessageRouter without hooks
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      const routerWithoutHooks = new MessageRouter({
        toolRegistry,
        permissionManager,
        workingDirectory: testDir,
      });

      const options = await routerWithoutHooks.buildQueryOptions(session);

      expect(options.hooks).toBeUndefined();
    });

    it('应该在 HookManager 配置为空时返回 undefined', async () => {
      const emptyHookManager = new HookManager({ workingDir: testDir });
      emptyHookManager.loadHooks({});

      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      const routerWithEmptyHooks = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager: emptyHookManager,
        workingDirectory: testDir,
      });

      const options = await routerWithEmptyHooks.buildQueryOptions(session);

      expect(options.hooks).toBeUndefined();
    });
  });

  describe('端到端流程: settings.json → HookManager → SDK 查询选项', () => {
    it('应该完整执行: settings.json → ConfigManager → HookManager → MessageRouter → QueryOptions', async () => {
      // Step 1: Create settings.json with hooks config
      const settingsContent = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "checking bash command"',
                },
              ],
            },
          ],
          SessionStart: [
            {
              matcher: '.*',
              hooks: [
                {
                  type: 'prompt',
                  prompt: 'Session starting with ID: $SESSION_ID',
                },
              ],
            },
          ],
          PostToolUseFailure: [
            {
              matcher: 'Write',
              hooks: [
                {
                  type: 'command',
                  command: 'echo "write failed: $ERROR"',
                },
              ],
            },
          ],
        },
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      // Step 2: Load config via ConfigManager
      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      expect(projectConfig.hooks).toBeDefined();
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect(projectConfig.hooks?.SessionStart).toBeDefined();
      expect(projectConfig.hooks?.PostToolUseFailure).toBeDefined();

      // Step 3: Convert and load hooks into HookManager
      // This simulates what Application.initialize() does
      const hookManager = new HookManager({ workingDir: testDir });

      // Convert SDKConfigLoader format to HookManager format
      const hookManagerConfig: HookConfig = {};
      for (const [event, configs] of Object.entries(projectConfig.hooks || {})) {
        if (!configs || configs.length === 0) continue;

        hookManagerConfig[event as HookEvent] = configs.map(config => ({
          matcher: config.matcher,
          hooks: config.hooks.map(hookDef => ({
            matcher: config.matcher,
            type: hookDef.type,
            command: hookDef.command,
            prompt: hookDef.prompt,
            script: hookDef.script,
          })),
        }));
      }

      hookManager.loadHooks(hookManagerConfig);

      // Verify hooks loaded
      const loadedConfig = hookManager.getConfig();
      expect(loadedConfig.PreToolUse).toBeDefined();
      expect(loadedConfig.SessionStart).toBeDefined();
      expect(loadedConfig.PostToolUseFailure).toBeDefined();

      // Step 4: Create MessageRouter with HookManager
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      const messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager,
        workingDirectory: testDir,
      });

      // Step 5: Build query options and verify hooks field
      const session = await sessionManager.createSession(testDir);
      const queryOptions = await messageRouter.buildQueryOptions(session);

      // Verify hooks are included in query options
      expect(queryOptions.hooks).toBeDefined();
      expect(queryOptions.hooks?.PreToolUse).toHaveLength(1);
      expect(queryOptions.hooks?.SessionStart).toHaveLength(1);
      expect(queryOptions.hooks?.PostToolUseFailure).toHaveLength(1);

      // Verify callbacks are functions
      expect(typeof queryOptions.hooks?.PreToolUse?.[0].callback).toBe('function');
      expect(typeof queryOptions.hooks?.SessionStart?.[0].callback).toBe('function');
      expect(typeof queryOptions.hooks?.PostToolUseFailure?.[0].callback).toBe('function');
    });

    it('应该正确处理空配置的完整流程', async () => {
      // Step 1: Create settings.json without hooks
      const settingsContent = {
        model: 'haiku',
        maxTurns: 10,
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      // Step 2: Load config
      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      expect(projectConfig.hooks).toBeUndefined();

      // Step 3: HookManager with empty config
      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks({});

      // Step 4: Create MessageRouter
      const toolRegistry = new ToolRegistry();
      const permissionManager = new PermissionManager(
        { mode: 'default' },
        new MockPermissionUIFactory(),
        toolRegistry
      );

      const messageRouter = new MessageRouter({
        toolRegistry,
        permissionManager,
        hookManager,
        workingDirectory: testDir,
      });

      // Step 5: Verify query options has no hooks
      const session = await sessionManager.createSession(testDir);
      const queryOptions = await messageRouter.buildQueryOptions(session);

      expect(queryOptions.hooks).toBeUndefined();
    });

    it('应该处理部分有效的 hooks 配置', async () => {
      // Mix of valid and invalid event types
      const settingsContent = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ type: 'command', command: 'echo test' }],
            },
          ],
          // Invalid event type should be filtered
          InvalidEventType: [
            {
              matcher: '.*',
              hooks: [{ type: 'command', command: 'echo invalid' }],
            },
          ],
          PostToolUse: [
            {
              matcher: '.*',
              hooks: [{ type: 'prompt', prompt: 'Done' }],
            },
          ],
        },
      };

      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(settingsContent, null, 2),
        'utf-8'
      );

      const configManager = new ConfigManager(logger);
      const projectConfig = await configManager.loadProjectConfig(testDir);

      // Only valid events should be loaded
      expect(projectConfig.hooks?.PreToolUse).toBeDefined();
      expect(projectConfig.hooks?.PostToolUse).toBeDefined();
      // Invalid event should not exist
      expect((projectConfig.hooks as Record<string, unknown>)?.InvalidEventType).toBeUndefined();
    });
  });

  describe('回调函数执行测试', () => {
    it('应该能执行 command 类型的回调', async () => {
      const hookConfig: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                matcher: 'Bash',
                type: 'command',
                command: 'echo "test executed"',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      // Execute hook directly
      const results = await hookManager.triggerEvent('PreToolUse', {
        tool: 'Bash',
        args: { command: 'ls' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].type).toBe('command');
    });

    it('应该能执行 prompt 类型的回调', async () => {
      const hookConfig: HookConfig = {
        PostToolUse: [
          {
            matcher: '.*',
            hooks: [
              {
                matcher: '.*',
                type: 'prompt',
                prompt: 'Tool $TOOL completed with file $FILE',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      const results = await hookManager.triggerEvent('PostToolUse', {
        tool: 'Write',
        args: { file: '/path/to/file.txt' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].type).toBe('prompt');
      expect(results[0].output).toContain('Write');
      expect(results[0].output).toContain('/path/to/file.txt');
    });

    it('应该支持变量替换', async () => {
      const hookConfig: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                matcher: 'Bash',
                type: 'command',
                command: 'echo "TOOL=$TOOL FILE=$FILE COMMAND=$COMMAND"',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      const results = await hookManager.triggerEvent('PreToolUse', {
        tool: 'Bash',
        args: { command: 'ls -la', file: 'test.txt' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].output).toContain('TOOL=Bash');
      expect(results[0].output).toContain('FILE=test.txt');
      expect(results[0].output).toContain('COMMAND=ls -la');
    });
  });

  describe('SDK 回调格式验证', () => {
    it('hooks 转换为 SDK 格式应该包含 matcher 和 callback', async () => {
      const hookConfig: HookConfig = {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [
              {
                matcher: 'Bash',
                type: 'command',
                command: 'echo test',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      const sdkHooks = hookManager.getHooksForSDK();

      expect(sdkHooks).toBeDefined();
      expect(sdkHooks.PreToolUse).toBeDefined();
      expect(sdkHooks.PreToolUse?.[0]).toHaveProperty('matcher', 'Bash');
      expect(sdkHooks.PreToolUse?.[0]).toHaveProperty('callback');
      expect(typeof sdkHooks.PreToolUse?.[0].callback).toBe('function');
    });

    it('SDK 回调函数应该可以被调用', async () => {
      const hookConfig: HookConfig = {
        SessionStart: [
          {
            matcher: '.*',
            hooks: [
              {
                matcher: '.*',
                type: 'prompt',
                prompt: 'Session started',
              },
            ],
          },
        ],
      };

      const hookManager = new HookManager({ workingDir: testDir });
      hookManager.loadHooks(hookConfig);

      const sdkHooks = hookManager.getHooksForSDK();
      const callback = sdkHooks.SessionStart?.[0].callback;

      expect(callback).toBeDefined();

      // Call the callback (it should not throw)
      await expect(
        callback!({
          event: 'SessionStart',
          sessionId: 'test-session-id',
        })
      ).resolves.not.toThrow();
    });
  });
});
